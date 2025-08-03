#!/bin/bash

# 个人博客系统 Docker 启动脚本
# 用于快速启动整个博客系统

echo "🚀 启动个人博客系统..."

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker未运行，请先启动Docker"
    exit 1
fi

# 进入项目目录
cd "$(dirname "$0")/.."

# 创建环境变量文件（如果不存在）
if [ ! -f .env ]; then
    echo "📝 创建环境变量文件..."
    cp .env.example .env
    echo "✅ 已创建 .env 文件，请根据需要修改配置"
fi

# 构建并启动所有服务
echo "🔨 构建Docker镜像..."
docker-compose build

echo "🚀 启动所有服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose ps

# 显示访问信息
echo ""
echo "🎉 博客系统启动完成！"
echo ""
echo "📱 访问地址："
echo "  前端应用: http://localhost:3000"
echo "  后端API: http://localhost:8000"
echo "  API文档: http://localhost:8000/docs"
echo ""
echo "🗄️ 数据库连接："
echo "  PostgreSQL: localhost:5432"
echo "  Redis: localhost:6379"
echo ""
echo "🔧 管理命令："
echo "  查看日志: docker-compose logs -f [service_name]"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart [service_name]"
echo ""