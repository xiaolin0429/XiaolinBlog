"""
认证相关API端点
"""
from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session

from app.core import security
from app.core.auth import create_access_token
from app.core.config import settings
from app.core.config.database import get_db
from app.core.logging.utils import get_security_logger
from app.core.auth.session_auth import session_manager
from app.core.auth import revoke_token
from app.schemas.user import User, UserLogin, UserCreate
from app.services import user_service
from app.services.user_service import authenticate, update_last_login, get_by_username, get_by_email, create_user as create
from app.api.v1.endpoints.deps import get_current_user

router = APIRouter()


def _get_client_ip(request: Request) -> str:
    """
    获取客户端真实IP地址
    """
    # 检查代理头
    forwarded_for = request.headers.get('X-Forwarded-For')
    if forwarded_for:
        return forwarded_for.split(',')[0].strip()
    
    real_ip = request.headers.get('X-Real-IP')
    if real_ip:
        return real_ip
    
    # 返回直接连接的IP
    return request.client.host if request.client else "unknown"


@router.post("/login", response_model=dict)
def login_for_access_token(
    request: Request,
    response: Response,
    login_data: UserLogin,
    db: Session = Depends(get_db)
) -> Any:
    """
    用户登录获取访问令牌
    支持使用用户名或邮箱登录，实现三重验证机制（JWT + Session + Cookie）
    """
    # 获取客户端信息
    client_ip = _get_client_ip(request)
    user_agent = request.headers.get('User-Agent', '')
    
    user = authenticate(
        db, email=login_data.username, password=login_data.password
    )
    
    if not user:
        # 记录登录失败
        security_logger = get_security_logger()
        security_logger.log_login_attempt(
            username=login_data.username,
            ip_address=client_ip,
            user_agent=user_agent,
            success=False
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif not user.is_active:
        # 记录账户被禁用的登录尝试
        security_logger = get_security_logger()
        security_logger.log_login_attempt(
            username=login_data.username,
            ip_address=client_ip,
            user_agent=user_agent,
            success=False
        )
        security_logger.log_suspicious_activity(
            description=f"尝试使用被禁用账户登录: {user.username}",
            ip_address=client_ip,
            user_id=user.id
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户账户已被禁用"
        )
    
    # 清理该用户的旧会话（可选：强制单点登录）
    # session_manager.cleanup_user_sessions(user.id)
    
    # 更新最后登录时间并获取更新后的用户信息
    updated_user = update_last_login(db=db, user_id=user.id)
    
    # 创建服务端会话
    session_id = session_manager.create_session(
        user_id=updated_user.id,
        user_agent=user_agent,
        ip_address=client_ip,
        expires_in=settings.SESSION_EXPIRE_SECONDS
    )
    
    # 创建包含session_id的JWT访问令牌
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=updated_user.id, 
        session_id=session_id,  # 添加session_id到JWT token中
        expires_delta=access_token_expires
    )
    
    # 记录登录成功
    security_logger = get_security_logger()
    security_logger.log_login_attempt(
        username=updated_user.username,
        ip_address=client_ip,
        user_agent=user_agent,
        success=True
    )
    
    # 设置会话Cookie（包含session_id）
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=session_id,
        max_age=settings.COOKIE_MAX_AGE,
        domain=settings.COOKIE_DOMAIN,
        secure=settings.COOKIE_SECURE,
        httponly=settings.COOKIE_HTTPONLY,
        samesite=settings.COOKIE_SAMESITE,
        path="/"
    )
    
    # 设置访问令牌Cookie（包含access_token）
    response.set_cookie(
        key="blog_auth_token",
        value=access_token,
        max_age=settings.COOKIE_MAX_AGE,
        domain=settings.COOKIE_DOMAIN,
        secure=settings.COOKIE_SECURE,
        httponly=settings.COOKIE_HTTPONLY,
        samesite=settings.COOKIE_SAMESITE,
        path="/"
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "session_id": session_id,
        "user": {
            "id": updated_user.id,
            "username": updated_user.username,
            "email": updated_user.email,
            "full_name": updated_user.full_name,
            "avatar": updated_user.avatar,
            "bio": updated_user.bio,
            "is_active": updated_user.is_active,
            "is_superuser": updated_user.is_superuser,
            "last_login": updated_user.last_login.isoformat() if updated_user.last_login else None,
            "created_at": updated_user.created_at.isoformat(),
            "updated_at": updated_user.updated_at.isoformat()
        }
    }


@router.get("/me", response_model=User)
def get_current_user_info(current_user: User = Depends(get_current_user)) -> Any:
    """
    获取当前用户信息
    """
    return current_user


@router.post("/test-token", response_model=User)
def test_token(current_user: User = Depends(get_current_user)) -> Any:
    """
    测试访问令牌
    """
    return current_user


@router.post("/force-auth-check", response_model=dict)
def force_auth_check(
    request: Request,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    强制认证检查 - 验证三重认证机制的完整性
    检查JWT token、服务端会话、Cookie的一致性
    """
    # 获取客户端信息
    client_ip = _get_client_ip(request)
    user_agent = request.headers.get('User-Agent', '')
    
    # 获取认证组件
    auth_header = request.headers.get("Authorization")
    session_id = request.cookies.get(settings.COOKIE_NAME)
    
    # 验证结果
    validation_results = {
        "jwt_token": {
            "present": bool(auth_header and auth_header.startswith("Bearer ")),
            "valid": False,
            "user_id": None
        },
        "server_session": {
            "present": bool(session_id),
            "valid": False,
            "user_id": None,
            "session_id": session_id
        },
        "cookie": {
            "present": bool(session_id),
            "valid": False,
            "value": session_id
        },
        "consistency_check": {
            "all_present": False,
            "user_id_match": False,
            "authentication_valid": False
        }
    }
    
    try:
        # 1. JWT Token验证（已通过get_current_user验证）
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            validation_results["jwt_token"]["valid"] = True
            validation_results["jwt_token"]["user_id"] = current_user.id
            
            # 检查token是否已撤销 - 临时注释，需要实现撤销检查
            # if revoke_token.is_revoked(token):
            #     validation_results["jwt_token"]["valid"] = False
            #     validation_results["jwt_token"]["revoked"] = True
        
        # 2. 服务端会话验证
        if session_id:
            session_valid = session_manager.validate_session(session_id, current_user.id)
            validation_results["server_session"]["valid"] = session_valid
            if session_valid:
                session_data = session_manager.get_session(session_id)
                if session_data:
                    validation_results["server_session"]["user_id"] = session_data.get("user_id")
        
        # 3. Cookie验证（基于session_id的存在性）
        validation_results["cookie"]["valid"] = bool(session_id)
        
        # 4. 一致性检查
        all_present = (
            validation_results["jwt_token"]["present"] and
            validation_results["server_session"]["present"] and
            validation_results["cookie"]["present"]
        )
        
        user_id_match = (
            validation_results["jwt_token"]["user_id"] == current_user.id and
            validation_results["server_session"]["user_id"] == current_user.id
        )
        
        authentication_valid = (
            validation_results["jwt_token"]["valid"] and
            validation_results["server_session"]["valid"] and
            validation_results["cookie"]["valid"] and
            user_id_match
        )
        
        validation_results["consistency_check"] = {
            "all_present": all_present,
            "user_id_match": user_id_match,
            "authentication_valid": authentication_valid
        }
        
        # 记录强制检查结果
        security_logger = get_security_logger()
        security_logger.log_suspicious_activity(
            description=f"强制认证检查: {current_user.username}, 结果: {'通过' if authentication_valid else '失败'}",
            ip_address=client_ip,
            user_id=current_user.id
        )
        
        return {
            "user": {
                "id": current_user.id,
                "username": current_user.username,
                "is_superuser": current_user.is_superuser
            },
            "check_time": security.get_current_timestamp(),
            "client_info": {
                "ip_address": client_ip,
                "user_agent": user_agent
            },
            "validation_results": validation_results,
            "recommendation": "认证状态正常" if authentication_valid else "建议重新登录"
        }
        
    except Exception as e:
        # 记录检查过程中的错误
        security_logger = get_security_logger()
        security_logger.log_suspicious_activity(
            description=f"强制认证检查失败: {str(e)}",
            ip_address=client_ip,
            user_id=current_user.id
        )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="认证检查失败"
        )


@router.post("/refresh-token", response_model=dict)
def refresh_token(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    刷新访问令牌，同时更新三重验证机制的所有组件
    包括：新JWT token、会话延期、Cookie更新
    """
    # 获取客户端信息
    client_ip = _get_client_ip(request)
    user_agent = request.headers.get('User-Agent', '')
    
    try:
        # 1. 撤销旧token
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            old_token = auth_header.split(" ")[1]
            revoke_token(old_token)
        
        # 2. 创建新的JWT访问令牌
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        new_access_token = security.create_access_token(
            subject=current_user.id, expires_delta=access_token_expires
        )
        
        # 3. 获取并延期服务端会话
        session_id = request.cookies.get(settings.COOKIE_NAME)
        if session_id:
            # 验证会话有效性
            session_data = session_manager.get_session(session_id)
            if session_data and session_data.get("user_id") == current_user.id:
                # 延期会话
                session_manager.update_session_activity(session_id)
            else:
                # 会话无效，创建新会话
                session_id = session_manager.create_session(
                    user_id=current_user.id,
                    user_agent=user_agent,
                    ip_address=client_ip,
                    expires_in=settings.SESSION_EXPIRE_SECONDS
                )
        else:
            # 没有会话Cookie，创建新会话
            session_id = session_manager.create_session(
                user_id=current_user.id,
                user_agent=user_agent,
                ip_address=client_ip,
                expires_in=settings.SESSION_EXPIRE_SECONDS
            )
        
        # 4. 更新Cookie
        response.set_cookie(
            key=settings.COOKIE_NAME,
            value=session_id,
            max_age=settings.COOKIE_MAX_AGE,
            domain=settings.COOKIE_DOMAIN,
            secure=settings.COOKIE_SECURE,
            httponly=settings.COOKIE_HTTPONLY,
            samesite=settings.COOKIE_SAMESITE,
            path="/"
        )
        
        # 记录令牌刷新成功
        security_logger = get_security_logger()
        security_logger.log_suspicious_activity(
            description=f"令牌刷新成功: {current_user.username}",
            ip_address=client_ip,
            user_id=current_user.id
        )
        
        return {
            "access_token": new_access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "session_id": session_id,
            "refresh_time": security.get_current_timestamp(),
            "user": {
                "id": current_user.id,
                "username": current_user.username,
                "is_superuser": current_user.is_superuser
            }
        }
        
    except Exception as e:
        # 记录刷新失败
        security_logger = get_security_logger()
        security_logger.log_suspicious_activity(
            description=f"令牌刷新失败: {str(e)}",
            ip_address=client_ip,
            user_id=current_user.id
        )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="令牌刷新失败"
        )


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
def register_user(
    request: Request,
    response: Response,
    user_data: UserCreate,
    db: Session = Depends(get_db)
) -> Any:
    """
    用户注册
    """
    # 获取客户端信息
    client_ip = _get_client_ip(request)
    user_agent = request.headers.get('User-Agent', '')
    
    # 检查用户名是否已存在
    existing_user = get_by_username(db, username=user_data.username)
    if existing_user:
        # 记录注册失败
        security_logger = get_security_logger()
        security_logger.log_suspicious_activity(
            description=f"尝试注册已存在的用户名: {user_data.username}",
            ip_address=client_ip
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在"
        )
    
    # 检查邮箱是否已存在
    existing_user = get_by_email(db, email=user_data.email)
    if existing_user:
        # 记录注册失败
        security_logger = get_security_logger()
        security_logger.log_suspicious_activity(
            description=f"尝试注册已存在的邮箱: {user_data.email}",
            ip_address=client_ip
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱已被注册"
        )
    
    try:
        # 创建用户
        user = create(db=db, obj_in=user_data)
        
        # 记录注册成功
        security_logger = get_security_logger()
        security_logger.log_login_attempt(
            username=user.username,
            ip_address=client_ip,
            user_agent=user_agent,
            success=True
        )
        
        # 自动登录新注册的用户
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = security.create_access_token(
            subject=user.id, expires_delta=access_token_expires
        )
        
        # 设置Cookie
        response.set_cookie(
            key=settings.COOKIE_NAME,
            value=access_token,
            max_age=settings.COOKIE_MAX_AGE,
            domain=None,  # 开发环境不设置domain
            secure=False,  # 开发环境使用HTTP
            httponly=True,
            samesite="lax",
            path="/"
        )
        
        return {
            "message": "注册成功",
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "avatar": user.avatar,
                "bio": user.bio,
                "is_active": user.is_active,
                "is_superuser": user.is_superuser,
                "last_login": user.last_login.isoformat() if user.last_login else None,
                "created_at": user.created_at.isoformat(),
                "updated_at": user.updated_at.isoformat()
            }
        }
        
    except Exception as e:
        # 记录注册失败
        security_logger = get_security_logger()
        security_logger.log_suspicious_activity(
            description=f"注册失败: {str(e)}",
            ip_address=client_ip
        )
        
        # 处理数据库约束违反等异常
        if "duplicate key value violates unique constraint" in str(e):
            if "username" in str(e):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail="用户名已存在"
                )
            elif "email" in str(e):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail="邮箱已被注册"
                )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="注册失败，请稍后重试"
        )


@router.post("/logout", response_model=dict)
def logout(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    用户登出，清除三重验证机制的所有认证信息
    包括：JWT token黑名单、服务端会话清理、Cookie清除
    """
    # 获取客户端信息
    client_ip = _get_client_ip(request)
    user_agent = request.headers.get('User-Agent', '')
    
    try:
        # 1. 获取当前JWT token并撤销
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            # 撤销token，防止继续使用
            revoke_token(token)
        
        # 2. 获取session_id并清除服务端会话
        session_id = request.cookies.get(settings.COOKIE_NAME)
        if session_id:
            # 清除服务端会话
            session_manager.delete_session(session_id)
            
            # 记录会话清除
            security_logger = get_security_logger()
            security_logger.log_suspicious_activity(
                description=f"用户主动登出，会话已清除: {session_id[:8]}...",
                ip_address=client_ip,
                user_id=current_user.id
            )
        
        # 3. 清除Cookie
        response.delete_cookie(
            key=settings.COOKIE_NAME,
            domain=settings.COOKIE_DOMAIN,
            secure=settings.COOKIE_SECURE,
            httponly=settings.COOKIE_HTTPONLY,
            samesite=settings.COOKIE_SAMESITE,
            path="/"
        )
        
        # 清除访问令牌Cookie
        response.delete_cookie(
            key="blog_auth_token",
            domain=settings.COOKIE_DOMAIN,
            secure=settings.COOKIE_SECURE,
            httponly=settings.COOKIE_HTTPONLY,
            samesite=settings.COOKIE_SAMESITE,
            path="/"
        )
        
        # 记录登出成功
        security_logger = get_security_logger()
        security_logger.log_login_attempt(
            username=current_user.username,
            ip_address=client_ip,
            user_agent=user_agent,
            success=True,
            action="logout"
        )
        
        return {
            "message": "登出成功",
            "user_id": current_user.id,
            "username": current_user.username,
            "logout_time": security.get_current_timestamp(),
            "cleared_components": ["jwt_token", "server_session", "cookie"]
        }
        
    except Exception as e:
        # 即使出现错误，也要尝试清除Cookie
        response.delete_cookie(
            key=settings.COOKIE_NAME,
            domain=settings.COOKIE_DOMAIN,
            secure=settings.COOKIE_SECURE,
            httponly=settings.COOKIE_HTTPONLY,
            samesite=settings.COOKIE_SAMESITE,
            path="/"
        )
        
        # 清除访问令牌Cookie
        response.delete_cookie(
            key="blog_auth_token",
            domain=settings.COOKIE_DOMAIN,
            secure=settings.COOKIE_SECURE,
            httponly=settings.COOKIE_HTTPONLY,
            samesite=settings.COOKIE_SAMESITE,
            path="/"
        )
        
        # 记录登出过程中的错误
        security_logger = get_security_logger()
        security_logger.log_suspicious_activity(
            description=f"登出过程中发生错误: {str(e)}",
            ip_address=client_ip,
            user_id=current_user.id if current_user else None
        )
        
        return {
            "message": "登出成功（部分清理可能失败）",
            "error": str(e),
            "logout_time": security.get_current_timestamp()
        }
