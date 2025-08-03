#!/bin/bash

# 个人博客系统 Docker 停止脚本
# 用于停止整个博客系统

echo "🛑 停止个人博客系统..."

# 进入项目目录
cd "$(dirname "$0")/.."

# 停止所有服务
echo "⏹️ 停止所有服务..."
docker-compose down

# 显示停止状态
echo "📊 当前容器状态："
docker-compose ps

echo ""
echo "✅ 博客系统已停止！"
echo ""
echo "🔧 其他管理命令："
echo "  重新启动: ./scripts/docker-start.sh"
echo "  查看日志: docker-compose logs [service_name]"
echo "  清理数据: docker-compose down -v (⚠️ 会删除数据库数据)"
echo ""