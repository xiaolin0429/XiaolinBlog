#!/bin/bash

# SSL证书配置脚本
# 使用Let's Encrypt自动获取和配置SSL证书

set -e

echo "🔒 开始配置SSL证书..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 检查域名配置
check_domain() {
    if [ -z "$1" ]; then
        log_error "请提供域名参数"
        echo "使用方法: $0 yourdomain.com"
        exit 1
    fi
    
    DOMAIN=$1
    log_info "配置域名: $DOMAIN"
}

# 安装Certbot
install_certbot() {
    log_info "检查Certbot安装状态..."
    
    if ! command -v certbot &> /dev/null; then
        log_info "安装Certbot..."
        
        # Ubuntu/Debian
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y certbot python3-certbot-nginx
        # CentOS/RHEL
        elif command -v yum &> /dev/null; then
            sudo yum install -y certbot python3-certbot-nginx
        # macOS
        elif command -v brew &> /dev/null; then
            brew install certbot
        else
            log_error "无法自动安装Certbot，请手动安装"
            exit 1
        fi
        
        log_success "Certbot安装完成"
    else
        log_success "Certbot已安装"
    fi
}

# 创建SSL目录
create_ssl_dirs() {
    log_info "创建SSL证书目录..."
    
    mkdir -p configs/nginx/ssl
    mkdir -p /tmp/certbot-webroot
    
    log_success "SSL目录创建完成"
}

# 获取SSL证书
obtain_certificate() {
    log_info "获取SSL证书..."
    
    # 停止nginx容器（如果运行中）
    if docker ps | grep -q blog_nginx; then
        log_info "停止Nginx容器..."
        docker stop blog_nginx
    fi
    
    # 使用standalone模式获取证书
    sudo certbot certonly \
        --standalone \
        --preferred-challenges http \
        --email admin@${DOMAIN} \
        --agree-tos \
        --no-eff-email \
        -d ${DOMAIN} \
        -d www.${DOMAIN}
    
    if [ $? -eq 0 ]; then
        log_success "SSL证书获取成功"
    else
        log_error "SSL证书获取失败"
        exit 1
    fi
}

# 复制证书文件
copy_certificates() {
    log_info "复制证书文件..."
    
    sudo cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem configs/nginx/ssl/
    sudo cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem configs/nginx/ssl/
    
    # 设置权限
    sudo chown $(whoami):$(whoami) configs/nginx/ssl/*.pem
    sudo chmod 644 configs/nginx/ssl/fullchain.pem
    sudo chmod 600 configs/nginx/ssl/privkey.pem
    
    log_success "证书文件复制完成"
}

# 更新Nginx配置
update_nginx_config() {
    log_info "更新Nginx配置..."
    
    # 替换域名占位符
    sed -i "s/yourdomain.com/${DOMAIN}/g" configs/nginx/nginx.conf
    
    log_success "Nginx配置更新完成"
}

# 设置自动续期
setup_auto_renewal() {
    log_info "设置证书自动续期..."
    
    # 创建续期脚本
    cat > scripts/renew-ssl.sh << EOF
#!/bin/bash
# SSL证书自动续期脚本

echo "检查SSL证书续期..."

# 续期证书
sudo certbot renew --quiet

# 如果证书更新了，重新复制文件并重启nginx
if [ \$? -eq 0 ]; then
    echo "证书检查完成"
    
    # 复制新证书
    sudo cp /etc/letsencrypt/live/${DOMAIN}/fullchain.pem configs/nginx/ssl/
    sudo cp /etc/letsencrypt/live/${DOMAIN}/privkey.pem configs/nginx/ssl/
    
    # 重启nginx容器
    docker-compose -f docker-compose.prod.yml restart nginx
    
    echo "证书续期完成"
fi
EOF
    
    chmod +x scripts/renew-ssl.sh
    
    # 添加到crontab（每月1号凌晨2点检查）
    (crontab -l 2>/dev/null; echo "0 2 1 * * $(pwd)/scripts/renew-ssl.sh") | crontab -
    
    log_success "自动续期设置完成"
}

# 测试SSL配置
test_ssl() {
    log_info "测试SSL配置..."
    
    # 启动nginx容器
    docker-compose -f docker-compose.prod.yml up -d nginx
    
    # 等待启动
    sleep 10
    
    # 测试HTTPS连接
    if curl -k https://localhost > /dev/null 2>&1; then
        log_success "SSL配置测试通过"
    else
        log_warning "SSL配置测试失败，请检查配置"
    fi
}

# 显示完成信息
show_completion_info() {
    echo ""
    log_success "🎉 SSL证书配置完成！"
    echo ""
    echo "📋 配置信息："
    echo "  域名: ${DOMAIN}"
    echo "  证书路径: configs/nginx/ssl/"
    echo "  自动续期: 已设置（每月1号检查）"
    echo ""
    echo "🔧 管理命令："
    echo "  手动续期: sudo certbot renew"
    echo "  检查证书: sudo certbot certificates"
    echo "  测试续期: sudo certbot renew --dry-run"
    echo ""
    echo "⚠️  注意事项："
    echo "  1. 确保域名DNS已正确解析到服务器IP"
    echo "  2. 确保防火墙开放80和443端口"
    echo "  3. 证书有效期为90天，已设置自动续期"
    echo ""
}

# 主函数
main() {
    check_domain "$1"
    install_certbot
    create_ssl_dirs
    obtain_certificate
    copy_certificates
    update_nginx_config
    setup_auto_renewal
    test_ssl
    show_completion_info
}

# 执行主函数
main "$@"