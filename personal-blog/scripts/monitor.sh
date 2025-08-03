#!/bin/bash

# 个人博客系统监控脚本
# 用于监控系统运行状态和性能指标

set -e

echo "📊 个人博客系统监控面板"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

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

log_header() {
    echo -e "${PURPLE}=== $1 ===${NC}"
}

# 检查服务状态
check_services() {
    log_header "服务状态检查"
    
    services=("blog_frontend" "blog_backend" "blog_postgres" "blog_redis" "blog_celery")
    
    for service in "${services[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "$service"; then
            status=$(docker inspect --format='{{.State.Status}}' "$service" 2>/dev/null || echo "not found")
            if [ "$status" = "running" ]; then
                echo -e "  ${GREEN}✓${NC} $service: 运行中"
            else
                echo -e "  ${RED}✗${NC} $service: $status"
            fi
        else
            echo -e "  ${RED}✗${NC} $service: 未找到"
        fi
    done
    echo ""
}

# 检查端口状态
check_ports() {
    log_header "端口状态检查"
    
    ports=("3000:前端" "8000:后端API" "5432:PostgreSQL" "6379:Redis")
    
    for port_info in "${ports[@]}"; do
        port=$(echo $port_info | cut -d: -f1)
        name=$(echo $port_info | cut -d: -f2)
        
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            echo -e "  ${GREEN}✓${NC} $name (端口 $port): 监听中"
        else
            echo -e "  ${RED}✗${NC} $name (端口 $port): 未监听"
        fi
    done
    echo ""
}

# 检查系统资源
check_system_resources() {
    log_header "系统资源使用情况"
    
    # CPU使用率
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    echo -e "  ${CYAN}CPU使用率:${NC} ${cpu_usage}%"
    
    # 内存使用情况
    memory_info=$(free -h | grep "Mem:")
    total_mem=$(echo $memory_info | awk '{print $2}')
    used_mem=$(echo $memory_info | awk '{print $3}')
    free_mem=$(echo $memory_info | awk '{print $4}')
    echo -e "  ${CYAN}内存使用:${NC} $used_mem / $total_mem (剩余: $free_mem)"
    
    # 磁盘使用情况
    disk_usage=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
    disk_info=$(df -h / | tail -1)
    echo -e "  ${CYAN}磁盘使用:${NC} $disk_info"
    
    if [ "$disk_usage" -gt 80 ]; then
        log_warning "磁盘使用率超过80%，请及时清理"
    fi
    echo ""
}

# 检查Docker容器资源
check_container_resources() {
    log_header "容器资源使用情况"
    
    if command -v docker &> /dev/null; then
        echo "容器名称                CPU使用率    内存使用      网络I/O       磁盘I/O"
        echo "----------------------------------------------------------------"
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" | tail -n +2
    else
        log_error "Docker未安装或未运行"
    fi
    echo ""
}

# 检查数据库状态
check_database() {
    log_header "数据库状态检查"
    
    # PostgreSQL连接测试
    if docker exec blog_postgres pg_isready -U blog_user > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} PostgreSQL: 连接正常"
        
        # 获取数据库大小
        db_size=$(docker exec blog_postgres psql -U blog_user -d blog_db -t -c "SELECT pg_size_pretty(pg_database_size('blog_db'));" 2>/dev/null | xargs)
        echo -e "  ${CYAN}数据库大小:${NC} $db_size"
        
        # 获取连接数
        connections=$(docker exec blog_postgres psql -U blog_user -d blog_db -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | xargs)
        echo -e "  ${CYAN}当前连接数:${NC} $connections"
    else
        echo -e "  ${RED}✗${NC} PostgreSQL: 连接失败"
    fi
    
    # Redis连接测试
    if docker exec blog_redis redis-cli ping 2>/dev/null | grep -q PONG; then
        echo -e "  ${GREEN}✓${NC} Redis: 连接正常"
        
        # 获取Redis信息
        redis_memory=$(docker exec blog_redis redis-cli info memory | grep "used_memory_human" | cut -d: -f2 | tr -d '\r')
        redis_keys=$(docker exec blog_redis redis-cli dbsize 2>/dev/null)
        echo -e "  ${CYAN}Redis内存使用:${NC} $redis_memory"
        echo -e "  ${CYAN}Redis键数量:${NC} $redis_keys"
    else
        echo -e "  ${RED}✗${NC} Redis: 连接失败"
    fi
    echo ""
}

# 检查应用健康状态
check_application_health() {
    log_header "应用健康状态检查"
    
    # 前端健康检查
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} 前端应用: 正常访问"
    else
        echo -e "  ${RED}✗${NC} 前端应用: 无法访问"
    fi
    
    # 后端API健康检查
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} 后端API: 正常访问"
    else
        echo -e "  ${RED}✗${NC} 后端API: 无法访问"
    fi
    
    # API响应时间测试
    api_response_time=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:8000/health 2>/dev/null || echo "N/A")
    echo -e "  ${CYAN}API响应时间:${NC} ${api_response_time}s"
    echo ""
}

# 检查日志错误
check_logs() {
    log_header "最近日志错误检查"
    
    services=("blog_frontend" "blog_backend" "blog_postgres" "blog_redis")
    
    for service in "${services[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "$service"; then
            error_count=$(docker logs --since="1h" "$service" 2>&1 | grep -i error | wc -l)
            if [ "$error_count" -gt 0 ]; then
                echo -e "  ${YELLOW}⚠${NC} $service: 发现 $error_count 个错误"
            else
                echo -e "  ${GREEN}✓${NC} $service: 无错误日志"
            fi
        fi
    done
    echo ""
}

# 检查SSL证书状态
check_ssl_certificate() {
    log_header "SSL证书状态检查"
    
    if [ -f "configs/nginx/ssl/fullchain.pem" ]; then
        # 检查证书有效期
        cert_expiry=$(openssl x509 -in configs/nginx/ssl/fullchain.pem -noout -enddate 2>/dev/null | cut -d= -f2)
        if [ $? -eq 0 ]; then
            echo -e "  ${GREEN}✓${NC} SSL证书: 存在"
            echo -e "  ${CYAN}证书到期时间:${NC} $cert_expiry"
            
            # 检查是否即将过期（30天内）
            expiry_timestamp=$(date -d "$cert_expiry" +%s 2>/dev/null)
            current_timestamp=$(date +%s)
            days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
            
            if [ "$days_until_expiry" -lt 30 ]; then
                log_warning "SSL证书将在 $days_until_expiry 天后过期，请及时续期"
            else
                echo -e "  ${CYAN}剩余有效期:${NC} $days_until_expiry 天"
            fi
        else
            echo -e "  ${YELLOW}⚠${NC} SSL证书: 无法读取证书信息"
        fi
    else
        echo -e "  ${RED}✗${NC} SSL证书: 未找到"
    fi
    echo ""
}

# 生成监控报告
generate_report() {
    log_header "监控报告生成"
    
    report_file="logs/monitor_report_$(date +%Y%m%d_%H%M%S).txt"
    mkdir -p logs
    
    {
        echo "个人博客系统监控报告"
        echo "生成时间: $(date)"
        echo "================================"
        echo ""
        
        # 重新运行所有检查并输出到文件
        check_services
        check_ports
        check_system_resources
        check_database
        check_application_health
        check_logs
        check_ssl_certificate
        
    } > "$report_file"
    
    echo -e "  ${GREEN}✓${NC} 监控报告已生成: $report_file"
    echo ""
}

# 显示帮助信息
show_help() {
    echo "个人博客系统监控脚本"
    echo ""
    echo "使用方法:"
    echo "  $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示帮助信息"
    echo "  -r, --report   生成监控报告"
    echo "  -w, --watch    持续监控模式"
    echo "  -q, --quick    快速检查"
    echo ""
}

# 快速检查
quick_check() {
    log_header "快速健康检查"
    check_services
    check_application_health
}

# 持续监控模式
watch_mode() {
    log_info "进入持续监控模式 (按 Ctrl+C 退出)"
    
    while true; do
        clear
        echo "📊 个人博客系统实时监控 - $(date)"
        echo "================================"
        
        check_services
        check_system_resources
        check_application_health
        
        echo "下次更新: $(date -d '+30 seconds')"
        sleep 30
    done
}

# 主函数
main() {
    case "${1:-}" in
        -h|--help)
            show_help
            ;;
        -r|--report)
            generate_report
            ;;
        -w|--watch)
            watch_mode
            ;;
        -q|--quick)
            quick_check
            ;;
        *)
            check_services
            check_ports
            check_system_resources
            check_container_resources
            check_database
            check_application_health
            check_logs
            check_ssl_certificate
            
            echo -e "${GREEN}监控检查完成！${NC}"
            echo "使用 '$0 --help' 查看更多选项"
            ;;
    esac
}

# 执行主函数
main "$@"