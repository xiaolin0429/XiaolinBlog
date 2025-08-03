#!/usr/bin/env python3
"""
调试JWT token结构
"""
import requests
import json
from jose import jwt
from app.core.config import settings

def debug_jwt_token():
    """调试JWT token的结构和内容"""
    print("=== JWT Token 调试 ===")
    
    # 1. 登录获取token
    login_data = {
        "username": "admin@newblog.com",
        "password": "admin123"
    }
    
    response = requests.post("http://localhost:8000/api/v1/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"登录失败: {response.text}")
        return
    
    result = response.json()
    access_token = result.get("access_token")
    session_id = result.get("session_id")
    
    print(f"登录返回的session_id: {session_id}")
    print(f"Access Token: {access_token}")
    
    # 2. 解析JWT token
    try:
        # 不验证签名，只查看payload
        payload = jwt.get_unverified_claims(access_token)
        print(f"\nJWT Payload (未验证): {json.dumps(payload, indent=2, ensure_ascii=False)}")
        
        # 验证签名并解析
        verified_payload = jwt.decode(
            access_token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        print(f"\nJWT Payload (已验证): {json.dumps(verified_payload, indent=2, ensure_ascii=False)}")
        
        # 检查session_id字段
        jwt_session_id = verified_payload.get("session_id")
        print(f"\nJWT中的session_id: {jwt_session_id}")
        print(f"登录返回的session_id: {session_id}")
        print(f"两者是否一致: {jwt_session_id == session_id}")
        
    except Exception as e:
        print(f"JWT解析失败: {e}")
    
    # 3. 测试手动构造Authorization header
    print(f"\n=== 测试手动构造请求 ===")
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # 模拟心跳端点中的JWT解析逻辑
    try:
        from jose import jwt as jose_jwt, JWTError
        
        authorization = f"Bearer {access_token}"
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            print(f"提取的token: {token[:50]}...")
            
            try:
                payload = jose_jwt.decode(
                    token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
                )
                extracted_session_id = payload.get("session_id")
                print(f"从Authorization header提取的session_id: {extracted_session_id}")
            except JWTError as e:
                print(f"JWT解析错误: {e}")
            except Exception as e:
                print(f"其他错误: {e}")
    
    except Exception as e:
        print(f"手动测试失败: {e}")

if __name__ == "__main__":
    debug_jwt_token()