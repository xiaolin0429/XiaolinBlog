#!/bin/bash

# 个人博客系统生产环境部署脚本
# 用于自动化部署到生产服务器

set -e  # 遇到错误立即退出

echo "🚀 开始部署个人博客系统到生产环境..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必要的工具
check_requirements() {
    log_info "检查部署环境..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker未运行，请先启动Docker服务"
        exit 1
    fi
    
    log_success "环境检查通过"
}

# 进入项目目录
cd "$(dirname "$0")/.."

# 检查环境变量文件
check_env_file() {
    log_info "检查环境变量配置..."
    
    if [ ! -f .env ]; then
        log_warning ".env文件不存在，从模板创建..."
        cp .env.example .env
        log_warning "请编辑.env文件，设置生产环境配置"
        read -p "是否现在编辑.env文件？(y/n): " edit_env
        if [ "$edit_env" = "y" ]; then
            ${EDITOR:-nano} .env
        fi
    fi
    
    # 检查关键配置
    if grep -q "your-secret-key-change-in-production" .env; then
        log_error "请修改.env文件中的SECRET_KEY为安全的密钥"
        exit 1
    fi
    
    if grep -q "blog_password" .env; then
        log_warning "建议修改数据库密码为更安全的密码"
    fi
    
    log_success "环境变量检查完成"
}

# 备份数据
backup_data() {
    log_info "备份现有数据..."
    
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # 备份数据库
    if docker ps | grep -q blog_postgres; then
        log_info "备份PostgreSQL数据库..."
        docker exec blog_postgres pg_dump -U blog_user blog_db > "$BACKUP_DIR/database.sql"
        log_success "数据库备份完成: $BACKUP_DIR/database.sql"
    fi
    
    # 备份Redis数据
    if docker ps | grep -q blog_redis; then
        log_info "备份Redis数据..."
        docker exec blog_redis redis-cli BGSAVE
        docker cp blog_redis:/data/dump.rdb "$BACKUP_DIR/redis_dump.rdb"
        log_success "Redis备份完成: $BACKUP_DIR/redis_dump.rdb"
    fi
}

# 构建镜像
build_images() {
    log_info "构建Docker镜像..."
    
    # 构建前端镜像
    log_info "构建前端镜像..."
    docker-compose -f docker-compose.prod.yml build frontend
    
    # 构建后端镜像
    log_info "构建后端镜像..."
    docker-compose -f docker-compose.prod.yml build backend
    
    log_success "镜像构建完成"
}

# 停止旧服务
stop_old_services() {
    log_info "停止旧服务..."
    
    if docker-compose ps | grep -q "Up"; then
        docker-compose down
        log_success "旧服务已停止"
    else
        log_info "没有运行中的服务"
    fi
}

# 启动生产服务
start_production() {
    log_info "启动生产环境服务..."
    
    # 启动数据库和Redis
    docker-compose -f docker-compose.prod.yml up -d postgres redis
    
    # 等待数据库启动
    log_info "等待数据库启动..."
    sleep 10
    
    # 运行数据库迁移
    log_info "运行数据库迁移..."
    docker-compose -f docker-compose.prod.yml run --rm backend alembic upgrade head
    
    # 启动所有服务
    docker-compose -f docker-compose.prod.yml up -d
    
    log_success "生产环境服务启动完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 等待服务启动
    sleep 30
    
    # 检查前端服务
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_success "前端服务正常"
    else
        log_error "前端服务异常"
        return 1
    fi
    
    # 检查后端服务
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        log_success "后端服务正常"
    else
        log_error "后端服务异常"
        return 1
    fi
    
    # 检查数据库连接
    if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U blog_user > /dev/null 2>&1; then
        log_success "数据库连接正常"
    else
        log_error "数据库连接异常"
        return 1
    fi
    
    # 检查Redis连接
    if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping | grep -q PONG; then
        log_success "Redis连接正常"
    else
        log_error "Redis连接异常"
        return 1
    fi
    
    log_success "所有服务健康检查通过"
}

# 显示部署信息
show_deployment_info() {
    echo ""
    log_success "🎉 部署完成！"
    echo ""
    echo "📱 访问地址："
    echo "  前端应用: http://localhost:3000"
    echo "  后端API: http://localhost:8000"
    echo "  API文档: http://localhost:8000/docs"
    echo ""
    echo "🔧 管理命令："
    echo "  查看服务状态: docker-compose -f docker-compose.prod.yml ps"
    echo "  查看日志: docker-compose -f docker-compose.prod.yml logs -f [service_name]"
    echo "  停止服务: docker-compose -f docker-compose.prod.yml down"
    echo "  重启服务: docker-compose -f docker-compose.prod.yml restart [service_name]"
    echo ""
    echo "📊 监控命令："
    echo "  系统资源: docker stats"
    echo "  容器状态: docker ps"
    echo "  磁盘使用: df -h"
    echo ""
}

# 清理函数
cleanup() {
    if [ $? -ne 0 ]; then
        log_error "部署失败，正在清理..."
        docker-compose -f docker-compose.prod.yml down
    fi
}

# 设置清理陷阱
trap cleanup EXIT

# 主部署流程
main() {
    log_info "开始生产环境部署流程..."
    
    check_requirements
    check_env_file
    
    # 询问是否备份
    read -p "是否备份现有数据？(y/n): " backup_confirm
    if [ "$backup_confirm" = "y" ]; then
        backup_data
    fi
    
    build_images
    stop_old_services
    start_production
    
    if health_check; then
        show_deployment_info
        log_success "部署成功完成！"
    else
        log_error "健康检查失败，请检查服务状态"
        exit 1
    fi
}

# 执行主函数
main "$@"