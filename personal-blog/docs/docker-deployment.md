# Docker 部署指南

## 概述

本项目提供了完整的Docker容器化解决方案，支持生产环境和开发环境的部署。

## 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│  (PostgreSQL)   │
│   Port: 3000    │    │   Port: 8000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │     Celery      │    │     Redis       │
                       │  (异步任务)      │◄──►│   (缓存/队列)    │
                       │                 │    │   Port: 6379    │
                       └─────────────────┘    └─────────────────┘
```

## 快速开始

### 生产环境部署

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd personal-blog
   ```

2. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，修改数据库密码、JWT密钥等配置
   ```

3. **启动所有服务**
   ```bash
   ./scripts/docker-start.sh
   ```

4. **访问应用**
   - 前端应用: http://localhost:3000
   - 后端API: http://localhost:8000
   - API文档: http://localhost:8000/docs

### 开发环境部署

1. **启动开发环境**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **查看服务状态**
   ```bash
   docker-compose -f docker-compose.dev.yml ps
   ```

## 服务说明

### 前端服务 (Frontend)
- **技术栈**: Next.js 15 + React + TypeScript + shadcn/ui
- **端口**: 3000
- **功能**: 博客前台展示、管理后台界面

### 后端服务 (Backend)
- **技术栈**: Python + FastAPI + SQLAlchemy
- **端口**: 8000
- **功能**: RESTful API、用户认证、数据处理

### 数据库服务 (PostgreSQL)
- **版本**: PostgreSQL 15
- **端口**: 5432
- **功能**: 主数据存储

### 缓存服务 (Redis)
- **版本**: Redis 7
- **端口**: 6379
- **功能**: 缓存、会话存储、Celery消息队列

### 异步任务服务 (Celery)
- **功能**: 处理异步任务（邮件发送、数据处理等）

## 管理命令

### 基本操作

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f [service_name]

# 重启特定服务
docker-compose restart [service_name]
```

### 开发环境操作

```bash
# 启动开发环境
docker-compose -f docker-compose.dev.yml up -d

# 停止开发环境
docker-compose -f docker-compose.dev.yml down

# 进入容器
docker-compose exec backend bash
docker-compose exec frontend sh
```

### 数据库操作

```bash
# 连接数据库
docker-compose exec postgres psql -U blog_user -d blog_db

# 备份数据库
docker-compose exec postgres pg_dump -U blog_user blog_db > backup.sql

# 恢复数据库
docker-compose exec -T postgres psql -U blog_user blog_db < backup.sql
```

## 环境变量配置

### 数据库配置
```env
POSTGRES_SERVER=postgres
POSTGRES_USER=blog_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=blog_db
POSTGRES_PORT=5432
```

### Redis配置
```env
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0
```

### JWT配置
```env
SECRET_KEY=your-very-secure-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 前端配置
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 生产环境优化

### 1. 安全配置
- 修改默认密码
- 使用强密钥
- 配置防火墙
- 启用HTTPS

### 2. 性能优化
- 配置Redis持久化
- 优化PostgreSQL配置
- 启用Nginx反向代理
- 配置CDN

### 3. 监控和日志
- 配置日志收集
- 设置监控告警
- 定期备份数据

## 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   lsof -i :3000
   lsof -i :8000
   lsof -i :5432
   ```

2. **数据库连接失败**
   ```bash
   # 检查数据库服务状态
   docker-compose logs postgres
   
   # 重启数据库服务
   docker-compose restart postgres
   ```

3. **前端构建失败**
   ```bash
   # 清理缓存重新构建
   docker-compose build --no-cache frontend
   ```

4. **后端API无响应**
   ```bash
   # 查看后端日志
   docker-compose logs backend
   
   # 重启后端服务
   docker-compose restart backend
   ```

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs frontend
docker-compose logs backend
docker-compose logs postgres
docker-compose logs redis
docker-compose logs celery

# 实时查看日志
docker-compose logs -f backend
```

## 开发指南

### 本地开发

1. **前端开发**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. **后端开发**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

### 代码热重载

开发环境配置了代码热重载功能：
- 前端：修改代码后自动刷新页面
- 后端：修改代码后自动重启服务

### 数据库迁移

```bash
# 进入后端容器
docker-compose exec backend bash

# 运行数据库迁移
alembic upgrade head

# 创建新的迁移文件
alembic revision --autogenerate -m "描述"
```

## 部署清单

### 部署前检查
- [ ] 环境变量配置完成
- [ ] 数据库密码已修改
- [ ] JWT密钥已设置
- [ ] 防火墙规则已配置
- [ ] SSL证书已准备（生产环境）

### 部署后验证
- [ ] 所有服务正常启动
- [ ] 前端页面可以访问
- [ ] 后端API响应正常
- [ ] 数据库连接成功
- [ ] Redis缓存工作正常
- [ ] Celery任务处理正常

## 技术支持

如果遇到问题，请检查：
1. Docker和Docker Compose版本
2. 系统资源使用情况
3. 网络连接状态
4. 服务日志信息

更多技术细节请参考项目文档或联系开发团队。