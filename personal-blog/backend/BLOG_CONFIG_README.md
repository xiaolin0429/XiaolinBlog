# 博客配置模块使用指南

## 概述

新的博客配置模块提供了完整的配置管理功能，支持分组管理、类型验证、版本控制、缓存机制等高级特性。

## 功能特性

### 🎯 核心功能
- **分类管理**: 支持站点基础、外观主题、SEO、社交媒体、评论系统、邮件通知等分类
- **分组管理**: 每个分类下可创建多个配置分组，便于组织管理
- **类型验证**: 支持字符串、数字、布尔值、JSON、URL、邮箱等多种数据类型
- **版本控制**: 自动记录配置变更历史，支持版本追踪
- **缓存机制**: 配置缓存提升性能，自动失效更新
- **批量操作**: 支持批量更新配置，提高效率

### 🔧 技术特性
- 基于 SQLAlchemy ORM 的数据模型
- Pydantic 模型验证
- FastAPI RESTful 接口
- 完整的 CRUD 操作封装
- 自动化测试脚本

## 快速开始

### 1. 运行数据库迁移

首先需要创建数据库表结构：

```bash
cd personal-blog/backend
alembic upgrade head
```

### 2. 初始化默认配置

运行初始化脚本创建默认配置：

```bash
python init_blog_config.py
```

### 3. 测试配置功能

启动服务后，可以运行测试脚本验证功能：

```bash
# 先启动服务
uvicorn app.main:app --reload

# 在另一个终端运行测试
python test_blog_config.py
```

## API 接口说明

### 配置管理接口

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | /api/v1/blog-config/ | 获取配置列表 | 管理员 |
| GET | /api/v1/blog-config/public | 获取公开配置 | 公开 |
| GET | /api/v1/blog-config/{config_id} | 获取单个配置 | 管理员 |
| GET | /api/v1/blog-config/key/{config_key} | 根据键名获取配置 | 管理员 |
| POST | /api/v1/blog-config/ | 创建配置 | 管理员 |
| PUT | /api/v1/blog-config/{config_id} | 更新配置 | 管理员 |
| PUT | /api/v1/blog-config/key/{config_key} | 根据键名更新配置 | 管理员 |
| POST | /api/v1/blog-config/batch-update | 批量更新配置 | 管理员 |
| DELETE | /api/v1/blog-config/{config_id} | 删除配置 | 管理员 |

### 分组管理接口

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | /api/v1/blog-config/groups/ | 获取分组列表 | 管理员 |
| GET | /api/v1/blog-config/groups/{group_id} | 获取单个分组 | 管理员 |
| POST | /api/v1/blog-config/groups/ | 创建分组 | 管理员 |
| PUT | /api/v1/blog-config/groups/{group_id} | 更新分组 | 管理员 |
| DELETE | /api/v1/blog-config/groups/{group_id} | 删除分组 | 管理员 |

### 其他接口

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| POST | /api/v1/blog-config/init-defaults | 初始化默认配置 | 管理员 |
| GET | /api/v1/blog-config/stats | 获取配置统计信息 | 管理员 |
| GET | /api/v1/blog-config/history/{config_key} | 获取配置历史 | 管理员 |
| POST | /api/v1/blog-config/cache/clear | 清除配置缓存 | 管理员 |

## 数据模型

### BlogConfig

博客配置主表，存储所有配置项。

| 字段 | 类型 | 描述 |
|------|------|------|
| id | Integer | 主键 |
| config_key | String | 配置键名（唯一） |
| config_value | Text | 配置值 |
| default_value | Text | 默认值 |
| category | Enum | 配置分类 |
| group_key | String | 所属分组键名 |
| data_type | Enum | 数据类型 |
| display_name | String | 显示名称 |
| description | Text | 配置描述 |
| placeholder | String | 输入提示文本 |
| help_text | Text | 帮助说明 |
| validation_rules | JSON | 验证规则 |
| options | JSON | 选择项配置 |
| is_required | Boolean | 是否必填 |
| is_public | Boolean | 是否公开显示 |
| is_enabled | Boolean | 是否启用 |
| sort_order | Integer | 排序顺序 |
| version | Integer | 配置版本 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

### ConfigGroup

配置分组表，用于组织配置项。

| 字段 | 类型 | 描述 |
|------|------|------|
| id | Integer | 主键 |
| group_key | String | 分组键名（唯一） |
| group_name | String | 分组显示名称 |
| category | Enum | 所属配置分类 |
| icon_name | String | 分组图标名称 |
| color_scheme | String | 分组颜色方案 |
| description | Text | 分组描述 |
| display_order | Integer | 显示顺序 |
| is_active | Boolean | 是否激活 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

### ConfigHistory

配置变更历史表，记录配置的所有变更。

| 字段 | 类型 | 描述 |
|------|------|------|
| id | Integer | 主键 |
| config_key | String | 配置键名 |
| old_value | Text | 旧值 |
| new_value | Text | 新值 |
| change_reason | String | 变更原因 |
| changed_by | Integer | 变更用户ID |
| changed_at | DateTime | 变更时间 |

### ConfigCache

配置缓存表，用于提升性能。

| 字段 | 类型 | 描述 |
|------|------|------|
| id | Integer | 主键 |
| cache_key | String | 缓存键名（唯一） |
| cache_data | JSON | 缓存数据 |
| category | Enum | 配置分类 |
| expires_at | DateTime | 过期时间 |
| created_at | DateTime | 创建时间 |
| updated_at | DateTime | 更新时间 |

## 前端集成

前端可以通过以下方式获取公开配置：

```typescript
// 获取所有公开配置
const fetchPublicConfigs = async () => {
  const response = await fetch('/api/v1/blog-config/public');
  if (!response.ok) {
    throw new Error('Failed to fetch configs');
  }
  return await response.json();
};

// 使用示例
const configs = await fetchPublicConfigs();
const siteTitle = configs.find(c => c.config_key === 'site_title')?.config_value || '默认标题';
```

## 后续开发计划

1. 实现前端配置管理界面
2. 添加更多配置类型支持
3. 实现配置导入/导出功能
4. 添加配置模板系统
5. 实现配置依赖关系管理

## 常见问题

### Q: 如何添加新的配置项？

A: 可以通过 API 接口创建，也可以在 `blog_config.py` 的 `_get_default_config_data` 方法中添加默认配置。

### Q: 如何重置所有配置？

A: 运行 `python init_blog_config.py reset` 命令。

### Q: 配置缓存多久失效？

A: 默认缓存时间为 1 小时，可以在 CRUD 层的 `cache_configs` 方法中修改 `cache_ttl` 参数。