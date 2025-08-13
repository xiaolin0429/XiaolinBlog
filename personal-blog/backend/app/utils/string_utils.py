"""
字符串处理工具
"""
import re
import unicodedata
from typing import Optional, List, Dict
from urllib.parse import quote, unquote


def slugify(text: str, max_length: int = 50) -> str:
    """
    将文本转换为URL友好的slug
    """
    # 转换为小写并标准化Unicode
    text = unicodedata.normalize('NFKD', text.lower())
    
    # 移除非ASCII字符（保留中文等Unicode字符的处理）
    # 这里简化处理，实际应用中可能需要更复杂的逻辑
    text = re.sub(r'[^\w\s-]', '', text.strip())
    
    # 将空格和多个连字符替换为单个连字符
    text = re.sub(r'[-\s]+', '-', text)
    
    # 移除首尾的连字符
    text = text.strip('-')
    
    # 截断到指定长度
    if len(text) > max_length:
        text = text[:max_length].rstrip('-')
    
    return text or 'untitled'


def truncate_string(text: str, max_length: int = 100, suffix: str = '...') -> str:
    """截断字符串"""
    if len(text) <= max_length:
        return text
    
    truncated = text[:max_length - len(suffix)]
    
    # 尝试在单词边界截断
    if ' ' in truncated:
        words = truncated.split(' ')
        truncated = ' '.join(words[:-1])
    
    return truncated + suffix


def extract_keywords(text: str, min_length: int = 3) -> List[str]:
    """从文本中提取关键词"""
    # 简单的关键词提取
    words = re.findall(r'\b\w+\b', text.lower())
    
    # 过滤短词和停用词
    stop_words = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
    }
    
    keywords = []
    for word in words:
        if len(word) >= min_length and word not in stop_words:
            keywords.append(word)
    
    # 去重并返回
    return list(set(keywords))


def camel_to_snake(text: str) -> str:
    """驼峰转蛇形命名"""
    # 在大写字母前插入下划线
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', text)
    # 在小写字母和大写字母之间插入下划线
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()


def snake_to_camel(text: str, capitalize_first: bool = False) -> str:
    """蛇形转驼峰命名"""
    components = text.split('_')
    if capitalize_first:
        return ''.join(word.capitalize() for word in components)
    else:
        return components[0] + ''.join(word.capitalize() for word in components[1:])


def escape_html(text: str) -> str:
    """转义HTML特殊字符"""
    import html
    return html.escape(text, quote=True)


def strip_html_tags(text: str) -> str:
    """移除HTML标签"""
    clean = re.compile('<.*?>')
    return re.sub(clean, '', text)


def normalize_whitespace(text: str) -> str:
    """标准化空白字符"""
    # 将所有连续空白字符替换为单个空格
    text = re.sub(r'\s+', ' ', text.strip())
    return text


def count_words(text: str) -> int:
    """统计单词数量"""
    words = re.findall(r'\b\w+\b', text)
    return len(words)


def generate_excerpt(text: str, max_length: int = 200) -> str:
    """生成摘要"""
    # 移除HTML标签
    text = strip_html_tags(text)
    
    # 标准化空白
    text = normalize_whitespace(text)
    
    # 截断文本
    if len(text) <= max_length:
        return text
    
    # 在句号处截断
    sentences = text.split('。')
    excerpt = ''
    
    for sentence in sentences:
        if len(excerpt + sentence + '。') <= max_length:
            excerpt += sentence + '。'
        else:
            break
    
    # 如果没有找到合适的句号，就简单截断
    if not excerpt:
        excerpt = truncate_string(text, max_length)
    
    return excerpt.strip()


def mask_string(text: str, start: int = 2, end: int = 2, mask_char: str = '*') -> str:
    """掩码字符串"""
    if len(text) <= start + end:
        return mask_char * len(text)
    
    return text[:start] + mask_char * (len(text) - start - end) + text[-end:]


def validate_string_length(text: str, min_length: int = 0, max_length: int = None) -> bool:
    """验证字符串长度"""
    length = len(text)
    
    if length < min_length:
        return False
    
    if max_length is not None and length > max_length:
        return False
    
    return True


def clean_text(text: str) -> str:
    """清理文本"""
    if not text:
        return ""
    
    # 移除控制字符
    text = ''.join(char for char in text if unicodedata.category(char)[0] != 'C' or char in '\n\r\t')
    
    # 标准化空白
    text = normalize_whitespace(text)
    
    return text


def url_encode(text: str) -> str:
    """URL编码"""
    return quote(text, safe='')


def url_decode(text: str) -> str:
    """URL解码"""
    return unquote(text)


def format_template(template: str, **kwargs) -> str:
    """格式化模板字符串"""
    try:
        return template.format(**kwargs)
    except KeyError as e:
        raise ValueError(f"模板变量未找到: {e}")


def parse_query_string(query: str) -> Dict[str, str]:
    """解析查询字符串"""
    from urllib.parse import parse_qs
    
    parsed = parse_qs(query)
    
    # 将列表值转换为字符串
    result = {}
    for key, value_list in parsed.items():
        if value_list:
            result[key] = value_list[0]
    
    return result