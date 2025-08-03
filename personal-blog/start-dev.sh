#!/bin/bash

# 个人博客系统开发环境启动脚本

echo "🚀 启动个人博客系统开发环境..."

# 检查是否安装了必要的依赖
check_dependencies() {
    echo "📋 检查依赖..."
    
    # 检查Python
    if ! command -v python3 &> /dev/null; then
        echo "❌ Python3 未安装，请先安装Python3"
        exit 1
    fi
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js 未安装，请先安装Node.js"
        exit 1
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        echo "❌ npm 未安装，请先安装npm"
        exit 1
    fi
    
    echo "✅ 依赖检查完成"
}

# 启动后端服务
start_backend() {
    echo "🔧 启动后端服务..."
    cd backend
    
    # 检查虚拟环境
    if [ ! -d "venv" ]; then
        echo "📦 创建Python虚拟环境..."
        python3 -m venv venv
    fi
    
    # 激活虚拟环境
    source venv/bin/activate
    
    # 安装依赖
    if [ ! -f ".deps_installed" ]; then
        echo "📦 安装Python依赖..."
        pip install -r requirements.txt
        touch .deps_installed
    fi
    
    # 启动FastAPI服务
    echo "🚀 启动FastAPI服务 (http://localhost:8000)..."
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    
    cd ..
}

# 启动前端服务
start_frontend() {
    echo "🎨 启动前端服务..."
    cd frontend
    
    # 安装依赖
    if [ ! -d "node_modules" ]; then
        echo "📦 安装Node.js依赖..."
        npm install
    fi
    
    # 启动Next.js服务
    echo "🚀 启动Next.js服务 (http://localhost:3000)..."
    npm run dev &
    FRONTEND_PID=$!
    
    cd ..
}

# 清理函数
cleanup() {
    echo ""
    echo "🛑 正在停止服务..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "✅ 后端服务已停止"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ 前端服务已停止"
    fi
    
    echo "👋 开发环境已关闭"
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 主函数
main() {
    check_dependencies
    start_backend
    sleep 3
    start_frontend
    
    echo ""
    echo "🎉 开发环境启动完成！"
    echo ""
    echo "📍 服务地址："
    echo "   前端: http://localhost:3000"
    echo "   后端: http://localhost:8000"
    echo "   API文档: http://localhost:8000/docs"
    echo ""
    echo "💡 按 Ctrl+C 停止所有服务"
    echo ""
    
    # 等待用户中断
    wait
}

# 运行主函数
main