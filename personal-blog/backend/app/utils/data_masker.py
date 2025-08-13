"""
敏感数据掩码处理器
"""
import json
import re
from typing import Any, Dict, List, Set, Union
from copy import deepcopy


class DataMasker:
    """
    敏感数据掩码处理器
    """
    
    # 敏感字段名称（不区分大小写）
    SENSITIVE_FIELD_NAMES = {
        # 密码相关
        'password', 'passwd', 'pwd', 'secret', 'token', 'key', 'api_key',
        'access_token', 'refresh_token', 'auth_token', 'bearer_token',
        
        # 个人信息
        'phone', 'mobile', 'telephone', 'tel', 'cellphone', 'id_card',
        'identity_card', 'passport', 'social_security', 'ssn', 'credit_card',
        'bank_account', 'account_number', 'card_number',
        
        # 认证信息
        'authorization', 'auth', 'signature', 'sign', 'hash', 'salt',
        'private_key', 'public_key', 'certificate', 'cert',
        
        # 其他敏感信息
        'session_id', 'csrf_token', 'nonce', 'otp', 'verification_code',
        'captcha', 'security_code', 'pin', 'cvv', 'cvc'
    }
    
    # 敏感字段模式（正则表达式）
    SENSITIVE_FIELD_PATTERNS = [
        r'.*password.*',
        r'.*token.*',
        r'.*secret.*',
        r'.*key.*',
        r'.*auth.*',
        r'.*phone.*',
        r'.*mobile.*',
        r'.*card.*',
        r'.*account.*',
        r'.*sign.*'
    ]
    
    # 敏感值模式（正则表达式）
    SENSITIVE_VALUE_PATTERNS = [
        # 手机号
        (r'1[3-9]\d{9}', '手机号'),
        # 身份证号
        (r'\d{17}[\dXx]', '身份证号'),
        # 邮箱
        (r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', '邮箱'),
        # 银行卡号
        (r'\d{16,19}', '银行卡号'),
        # IP地址
        (r'\b(?:\d{1,3}\.){3}\d{1,3}\b', 'IP地址'),
        # JWT Token
        (r'eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*', 'JWT Token'),
    ]
    
    def __init__(self, 
                 mask_char: str = '*',
                 preserve_length: bool = True,
                 max_data_size: int = 10240,  # 10KB
                 custom_sensitive_fields: Set[str] = None):
        """
        初始化数据掩码处理器
        
        Args:
            mask_char: 掩码字符
            preserve_length: 是否保持原始长度
            max_data_size: 最大数据大小（字节）
            custom_sensitive_fields: 自定义敏感字段
        """
        self.mask_char = mask_char
        self.preserve_length = preserve_length
        self.max_data_size = max_data_size
        
        # 合并敏感字段
        self.sensitive_fields = self.SENSITIVE_FIELD_NAMES.copy()
        if custom_sensitive_fields:
            self.sensitive_fields.update(custom_sensitive_fields)
        
        # 编译正则表达式
        self.field_patterns = [re.compile(pattern, re.IGNORECASE) 
                              for pattern in self.SENSITIVE_FIELD_PATTERNS]
        self.value_patterns = [(re.compile(pattern), desc) 
                              for pattern, desc in self.SENSITIVE_VALUE_PATTERNS]
    
    def mask_data(self, data: Any, max_depth: int = 10) -> Any:
        """
        掩码敏感数据
        
        Args:
            data: 要处理的数据
            max_depth: 最大递归深度
            
        Returns:
            处理后的数据
        """
        if max_depth <= 0:
            return "[数据层级过深]"
        
        # 检查数据大小
        try:
            data_str = json.dumps(data, ensure_ascii=False, default=str)
            if len(data_str.encode('utf-8')) > self.max_data_size:
                return "[数据过大，已省略]"
        except (TypeError, ValueError):
            pass
        
        return self._mask_recursive(data, max_depth)
    
    def _mask_recursive(self, data: Any, depth: int) -> Any:
        """
        递归掩码数据
        """
        if depth <= 0:
            return "[递归深度限制]"
        
        if isinstance(data, dict):
            return self._mask_dict(data, depth - 1)
        elif isinstance(data, (list, tuple)):
            return self._mask_list(data, depth - 1)
        elif isinstance(data, str):
            return self._mask_string_value(data)
        else:
            return data
    
    def _mask_dict(self, data: Dict[str, Any], depth: int) -> Dict[str, Any]:
        """
        掩码字典数据
        """
        masked_data = {}
        
        for key, value in data.items():
            if self._is_sensitive_field(key):
                masked_data[key] = self._mask_sensitive_value(value)
            else:
                masked_data[key] = self._mask_recursive(value, depth)
        
        return masked_data
    
    def _mask_list(self, data: Union[List, tuple], depth: int) -> List[Any]:
        """
        掩码列表数据
        """
        masked_data = []
        
        # 限制列表长度，避免过大的数组
        max_items = 100
        items_to_process = data[:max_items] if len(data) > max_items else data
        
        for item in items_to_process:
            masked_data.append(self._mask_recursive(item, depth))
        
        if len(data) > max_items:
            masked_data.append(f"[还有{len(data) - max_items}个项目被省略]")
        
        return masked_data
    
    def _is_sensitive_field(self, field_name: str) -> bool:
        """
        判断字段是否为敏感字段
        """
        field_lower = field_name.lower()
        
        # 检查精确匹配
        if field_lower in self.sensitive_fields:
            return True
        
        # 检查模式匹配
        for pattern in self.field_patterns:
            if pattern.match(field_lower):
                return True
        
        return False
    
    def _mask_sensitive_value(self, value: Any) -> str:
        """
        掩码敏感值
        """
        if value is None:
            return None
        
        value_str = str(value)
        
        if not value_str:
            return value_str
        
        if self.preserve_length:
            if len(value_str) <= 2:
                return self.mask_char * len(value_str)
            elif len(value_str) <= 6:
                return value_str[0] + self.mask_char * (len(value_str) - 2) + value_str[-1]
            else:
                return value_str[:2] + self.mask_char * (len(value_str) - 4) + value_str[-2:]
        else:
            return self.mask_char * 8
    
    def _mask_string_value(self, value: str) -> str:
        """
        掩码字符串值中的敏感信息
        """
        if not value or not isinstance(value, str):
            return value
        
        masked_value = value
        
        # 检查敏感值模式
        for pattern, desc in self.value_patterns:
            def replace_match(match):
                matched_text = match.group(0)
                if self.preserve_length:
                    if len(matched_text) <= 4:
                        return self.mask_char * len(matched_text)
                    else:
                        return matched_text[:2] + self.mask_char * (len(matched_text) - 4) + matched_text[-2:]
                else:
                    return f"[{desc}]"
            
            masked_value = pattern.sub(replace_match, masked_value)
        
        return masked_value
    
    def mask_request_data(self, 
                         method: str,
                         path: str, 
                         query_params: Dict[str, Any] = None,
                         request_body: Any = None,
                         headers: Dict[str, str] = None) -> Dict[str, Any]:
        """
        掩码请求数据
        
        Args:
            method: HTTP方法
            path: 请求路径
            query_params: 查询参数
            request_body: 请求体
            headers: 请求头
            
        Returns:
            掩码后的请求数据
        """
        masked_data = {
            'method': method,
            'path': path
        }
        
        # 掩码查询参数
        if query_params:
            masked_data['query_params'] = self.mask_data(query_params)
        
        # 掩码请求体
        if request_body is not None:
            masked_data['request_body'] = self.mask_data(request_body)
        
        # 掩码请求头（只保留非敏感的头）
        if headers:
            safe_headers = {}
            for key, value in headers.items():
                if not self._is_sensitive_field(key):
                    safe_headers[key] = value
                else:
                    safe_headers[key] = self._mask_sensitive_value(value)
            masked_data['headers'] = safe_headers
        
        return masked_data
    
    def mask_response_data(self, response_data: Any, status_code: int) -> Dict[str, Any]:
        """
        掩码响应数据
        
        Args:
            response_data: 响应数据
            status_code: 状态码
            
        Returns:
            掩码后的响应数据
        """
        masked_data = {
            'status_code': status_code
        }
        
        # 对于成功的响应，掩码响应体
        if 200 <= status_code < 300 and response_data is not None:
            masked_data['response_body'] = self.mask_data(response_data)
        elif response_data is not None:
            # 对于错误响应，也进行掩码处理
            masked_data['response_body'] = self.mask_data(response_data)
        
        return masked_data


# 全局数据掩码器实例
default_masker = DataMasker()


def mask_sensitive_data(data: Any) -> Any:
    """
    使用默认掩码器掩码敏感数据
    """
    return default_masker.mask_data(data)


def mask_request_data(method: str, 
                     path: str,
                     query_params: Dict[str, Any] = None,
                     request_body: Any = None,
                     headers: Dict[str, str] = None) -> Dict[str, Any]:
    """
    使用默认掩码器掩码请求数据
    """
    return default_masker.mask_request_data(method, path, query_params, request_body, headers)


def mask_response_data(response_data: Any, status_code: int) -> Dict[str, Any]:
    """
    使用默认掩码器掩码响应数据
    """
    return default_masker.mask_response_data(response_data, status_code)