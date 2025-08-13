"""
业务服务基类
统一的Service基类，提供标准的业务逻辑处理规范
"""
from typing import Any, Dict, Generic, List, Optional, TypeVar
import logging
from abc import ABC, abstractmethod

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.core.exceptions import ApplicationError, BusinessError

# 类型变量
ModelType = TypeVar("ModelType")
CRUDType = TypeVar("CRUDType") 
CreateSchemaType = TypeVar("CreateSchemaType")
UpdateSchemaType = TypeVar("UpdateSchemaType")

logger = logging.getLogger(__name__)


class BaseService(ABC, Generic[ModelType, CRUDType]):
    """业务服务基类"""
    
    def __init__(self, crud: CRUDType):
        """
        初始化服务
        
        Args:
            crud: CRUD操作实例
        """
        self.crud = crud
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def execute_with_error_handling(
        self, 
        func, 
        *args, 
        error_message: str = "操作失败",
        **kwargs
    ) -> Any:
        """
        带错误处理的方法执行
        
        Args:
            func: 要执行的函数
            error_message: 错误消息
            *args: 位置参数
            **kwargs: 关键字参数
            
        Returns:
            Any: 函数执行结果
            
        Raises:
            BusinessError: 业务逻辑错误
        """
        try:
            return func(*args, **kwargs)
        except SQLAlchemyError as e:
            self.logger.error(f"数据库操作失败: {str(e)}")
            raise BusinessError(f"{error_message}: 数据库操作失败")
        except ApplicationError:
            # 重新抛出应用程序异常
            raise
        except Exception as e:
            self.logger.error(f"未知错误: {str(e)}", exc_info=True)
            raise BusinessError(f"{error_message}: 未知错误")
    
    def validate_business_rules(self, data: Any, rules: List[str] = None) -> bool:
        """
        业务规则验证
        
        Args:
            data: 要验证的数据
            rules: 验证规则列表
            
        Returns:
            bool: 验证是否通过
        """
        # 子类可以重写此方法实现具体的业务规则验证
        return True
    
    def log_operation(self, operation: str, details: Dict[str, Any] = None):
        """
        记录操作日志
        
        Args:
            operation: 操作名称
            details: 操作详情
        """
        self.logger.info(f"执行操作: {operation}", extra={"details": details or {}})
    
    @abstractmethod
    def get_service_name(self) -> str:
        """
        获取服务名称
        
        Returns:
            str: 服务名称
        """
        pass


class CRUDServiceMixin:
    """CRUD服务混入类，提供标准的CRUD操作"""
    
    def get_by_id(self, db: Session, *, id: Any) -> Optional[ModelType]:
        """根据ID获取对象"""
        return self.execute_with_error_handling(
            self.crud.get, db, id=id, 
            error_message="获取对象失败"
        )
    
    def get_multi(
        self, 
        db: Session, 
        *, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[ModelType]:
        """获取多个对象"""
        return self.execute_with_error_handling(
            self.crud.get_multi, db, skip=skip, limit=limit,
            error_message="获取对象列表失败"
        )
    
    def create_object(
        self, 
        db: Session, 
        *, 
        obj_in: CreateSchemaType
    ) -> ModelType:
        """创建对象"""
        return self.execute_with_error_handling(
            self.crud.create, db, obj_in=obj_in,
            error_message="创建对象失败"
        )
    
    def update_object(
        self, 
        db: Session, 
        *, 
        db_obj: ModelType, 
        obj_in: UpdateSchemaType
    ) -> ModelType:
        """更新对象"""
        return self.execute_with_error_handling(
            self.crud.update, db, db_obj=db_obj, obj_in=obj_in,
            error_message="更新对象失败"
        )
    
    def delete_object(self, db: Session, *, id: Any) -> ModelType:
        """删除对象"""
        return self.execute_with_error_handling(
            self.crud.remove, db, id=id,
            error_message="删除对象失败"
        )


class TransactionalService:
    """事务服务混入类，提供事务管理功能"""
    
    def execute_in_transaction(
        self, 
        db: Session, 
        func, 
        *args, 
        **kwargs
    ) -> Any:
        """
        在事务中执行操作
        
        Args:
            db: 数据库会话
            func: 要执行的函数
            *args: 位置参数
            **kwargs: 关键字参数
            
        Returns:
            Any: 函数执行结果
        """
        try:
            result = func(db, *args, **kwargs)
            db.commit()
            return result
        except Exception as e:
            db.rollback()
            self.logger.error(f"事务执行失败，已回滚: {str(e)}")
            raise


class CacheableService:
    """缓存服务混入类，提供缓存功能"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._cache = {}  # 简单的内存缓存，生产环境应使用Redis等
    
    def get_from_cache(self, key: str) -> Any:
        """从缓存获取数据"""
        return self._cache.get(key)
    
    def set_to_cache(self, key: str, value: Any, expire_seconds: int = 300):
        """设置缓存数据"""
        # 简化实现，生产环境应考虑过期时间
        self._cache[key] = value
    
    def clear_cache(self, pattern: str = None):
        """清理缓存"""
        if pattern:
            # 简化实现，根据模式清理
            keys_to_remove = [k for k in self._cache.keys() if pattern in k]
            for key in keys_to_remove:
                del self._cache[key]
        else:
            self._cache.clear()


# 组合服务基类，包含所有常用功能
class StandardService(
    BaseService, 
    CRUDServiceMixin, 
    TransactionalService, 
    CacheableService
):
    """标准服务基类，包含CRUD、事务管理、缓存等功能"""
    
    def get_service_name(self) -> str:
        """获取服务名称"""
        return self.__class__.__name__