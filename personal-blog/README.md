# 个人博客系统

一个功能完整的现代化个人博客系统，采用前后端分离架构，支持文章发布、评论互动、分类标签、搜索功能等核心功能。

## 🚀 项目特色

### 技术栈
- **前端**: React 18 + Next.js 15 + TypeScript + shadcn/ui
- **后端**: Python + FastAPI + Celery
- **数据库**: PostgreSQL + Redis
- **部署**: Docker + Docker Compose + Nginx

### 核心功能
- ✅ **文章管理**: 富文本编辑器、草稿发布、分类标签
- ✅ **用户系统**: JWT认证、权限管理、用户注册登录
- ✅ **评论系统**: 嵌套回复、评论审核、垃圾评论过滤
- ✅ **搜索功能**: 全文搜索、多维度筛选、实时搜索
- ✅ **管理后台**: 数据统计、内容管理、系统监控
- ✅ **响应式设计**: 完美适配桌面、平板、手机设备

### 设计特色
- 🎨 **现代化UI**: 基于shadcn/ui的简洁美观界面
- 🌙 **主题切换**: 支持明暗主题自由切换
- 📱 **响应式布局**: 完美适配各种屏幕尺寸
- ⚡ **性能优化**: 代码分割、懒加载、缓存策略

## 📁 项目结构

```
personal-blog/
├── frontend/                 # 前端应用
│   ├── src/
│   │   ├── app/             # Next.js页面
│   │   ├── components/      # React组件
│   │   └── lib/            # 工具库和API
│   ├── Dockerfile          # 生产环境镜像
│   └── Dockerfile.dev      # 开发环境镜像
├── backend/                 # 后端应用
│   ├── app/
│   │   ├── api/            # API路由
│   │   ├── core/           # 核心配置
│   │   ├── models/         # 数据模型
│   │   └── services/       # 业务逻辑
│   ├── Dockerfile          # 生产环境镜像
│   └── Dockerfile.dev      # 开发环境镜像
├── configs/                 # 配置文件
│   ├── nginx/              # Nginx配置
│   ├── postgres/           # PostgreSQL配置
│   └── redis/              # Redis配置
├── scripts/                 # 部署脚本
│   ├── docker-start.sh     # 启动脚本
│   ├── docker-stop.sh      # 停止脚本
│   ├── deploy-prod.sh      # 生产部署脚本
│   ├── setup-ssl.sh        # SSL配置脚本
│   └── monitor.sh          # 系统监控脚本
├── docs/                    # 项目文档
├── database/                # 数据库初始化
├── docker-compose.yml       # 生产环境编排
├── docker-compose.dev.yml   # 开发环境编排
└── docker-compose.prod.yml  # 生产优化编排
```

## 🛠️ 快速开始

### 环境要求
- Docker 20.0+
- Docker Compose 2.0+
- Node.js 18+ (本地开发)
- Python 3.10+ (本地开发)

### 1. 克隆项目
```bash
git clone <repository-url>
cd personal-blog
```

### 2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，修改数据库密码、JWT密钥等配置
```

### 3. 启动开发环境
```bash
# 使用开发环境配置（支持热重载）
docker-compose -f docker-compose.dev.yml up -d

# 或使用快速启动脚本
./scripts/docker-start.sh
```

### 4. 访问应用
- 前端应用: http://localhost:3000
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/docs

## 🚀 生产部署

### 自动化部署
```bash
# 一键部署到生产环境
./scripts/deploy-prod.sh
```

### 手动部署步骤

1. **配置环境变量**
   ```bash
   cp .env.example .env
   # 修改生产环境配置
   ```

2. **构建并启动服务**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **配置SSL证书**
   ```bash
   ./scripts/setup-ssl.sh yourdomain.com
   ```

4. **验证部署**
   ```bash
   ./scripts/monitor.sh
   ```

## 📊 系统监控

### 监控脚本使用
```bash
# 完整系统检查
./scripts/monitor.sh

# 快速健康检查
./scripts/monitor.sh --quick

# 持续监控模式
./scripts/monitor.sh --watch

# 生成监控报告
./scripts/monitor.sh --report
```

### 监控指标
- 🔍 **服务状态**: 容器运行状态、端口监听
- 💻 **系统资源**: CPU、内存、磁盘使用情况
- 🗄️ **数据库状态**: 连接数、数据库大小、性能指标
- 🌐 **应用健康**: API响应时间、错误日志统计
- 🔒 **SSL证书**: 证书有效期、自动续期状态

## 🔧 管理命令

### Docker管理
```bash
# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f [service_name]

# 重启服务
docker-compose restart [service_name]

# 停止所有服务
docker-compose down

# 清理数据（⚠️ 会删除所有数据）
docker-compose down -v
```

### 数据库管理
```bash
# 连接数据库
docker-compose exec postgres psql -U blog_user -d blog_db

# 备份数据库
docker-compose exec postgres pg_dump -U blog_user blog_db > backup.sql

# 恢复数据库
docker-compose exec -T postgres psql -U blog_user blog_db < backup.sql

# 运行数据库迁移
docker-compose exec backend alembic upgrade head
```

### 应用管理
```bash
# 查看前端构建日志
docker-compose logs frontend

# 查看后端API日志
docker-compose logs backend

# 查看Celery任务日志
docker-compose logs celery

# 重新构建镜像
docker-compose build --no-cache [service_name]
```

## 🔒 安全配置

### 生产环境安全清单
- [ ] 修改默认数据库密码
- [ ] 设置强JWT密钥
- [ ] 配置SSL证书
- [ ] 启用防火墙规则
- [ ] 设置Nginx安全头
- [ ] 配置访问频率限制
- [ ] 定期备份数据
- [ ] 监控系统日志

### SSL证书配置
```bash
# 自动配置Let's Encrypt证书
./scripts/setup-ssl.sh yourdomain.com

# 手动续期证书
sudo certbot renew

# 测试证书配置
curl -I https://yourdomain.com
```

## 📈 性能优化

### 前端优化
- ✅ 代码分割和懒加载
- ✅ 静态资源缓存
- ✅ 图片优化和压缩
- ✅ CDN加速配置

### 后端优化
- ✅ 数据库连接池
- ✅ Redis缓存策略
- ✅ API响应压缩
- ✅ 异步任务处理

### 数据库优化
- ✅ 索引优化配置
- ✅ 查询性能监控
- ✅ 连接数限制
- ✅ 定期数据清理

## 🐛 故障排除

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
   # 检查数据库状态
   docker-compose logs postgres
   docker-compose restart postgres
   ```

3. **前端构建失败**
   ```bash
   # 清理缓存重新构建
   docker-compose build --no-cache frontend
   ```

4. **SSL证书问题**
   ```bash
   # 检查证书状态
   ./scripts/monitor.sh
   # 重新配置证书
   ./scripts/setup-ssl.sh yourdomain.com
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

# 实时查看日志
docker-compose logs -f backend
```

## 📚 开发指南

### 本地开发环境
```bash
# 前端开发
cd frontend
npm install
npm run dev

# 后端开发
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 代码规范
- 前端使用ESLint + Prettier
- 后端使用Black + isort
- 提交前运行代码检查

### 数据库迁移
```bash
# 创建新迁移
docker-compose exec backend alembic revision --autogenerate -m "描述"

# 应用迁移
docker-compose exec backend alembic upgrade head

# 回滚迁移
docker-compose exec backend alembic downgrade -1
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 技术支持

如果遇到问题，请：
1. 查看本文档的故障排除部分
2. 检查 [Issues](../../issues) 中是否有类似问题
3. 运行 `./scripts/monitor.sh` 检查系统状态
4. 提交新的 Issue 描述问题

---

**个人博客系统** - 让写作更简单，让分享更美好 ✨