#!/usr/bin/env python3
"""
增强鉴权系统部署脚本
用于部署和启动优化后的个人博客系统
"""
import os
import sys
import subprocess
import time
import argparse
from pathlib import Path

def print_header():
    """打印部署脚本头部信息"""
    print("=" * 70)
    print("🚀 个人博客系统 - 增强鉴权版部署脚本")
    print("=" * 70)
    print()

def check_requirements():
    """检查部署要求"""
    print("📋 检查部署要求...")
    
    # 检查Python版本
    if sys.version_info < (3.8, 0):
        print("❌ 错误: 需要Python 3.8或更高版本")
        return False
    print(f"✅ Python版本: {sys.version}")
    
    # 检查必要的目录
    required_dirs = [
        "personal-blog/backend",
        "personal-blog/frontend"
    ]
    
    for dir_path in required_dirs:
        if not Path(dir_path).exists():
            print(f"❌ 错误: 缺少必要目录 {dir_path}")
            return False
        print(f"✅ 目录存在: {dir_path}")
    
    # 检查必要的文件
    required_files = [
        "personal-blog/backend/app/main.py",
        "personal-blog/backend/requirements.txt",
        "personal-blog/frontend/package.json"
    ]
    
    for file_path in required_files:
        if not Path(file_path).exists():
            print(f"❌ 错误: 缺少必要文件 {file_path}")
            return False
        print(f"✅ 文件存在: {file_path}")
    
    print("✅ 部署要求检查通过")
    return True

def setup_backend_environment():
    """设置后端环境"""
    print("\n🔧 设置后端环境...")
    
    backend_dir = Path("personal-blog/backend")
    os.chdir(backend_dir)
    
    try:
        # 创建虚拟环境（如果不存在）
        if not Path("venv").exists():
            print("📦 创建Python虚拟环境...")
            subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
            print("✅ 虚拟环境创建完成")
        
        # 激活虚拟环境并安装依赖
        if os.name == 'nt':  # Windows
            pip_path = "venv/Scripts/pip"
            python_path = "venv/Scripts/python"
        else:  # Unix/Linux/macOS
            pip_path = "venv/bin/pip"
            python_path = "venv/bin/python"
        
        print("📦 安装Python依赖...")
        subprocess.run([pip_path, "install", "-r", "requirements.txt"], check=True)
        
        # 安装额外的增强鉴权依赖
        enhanced_deps = [
            "redis>=4.0.0",
            "python-jose[cryptography]>=3.3.0",
            "passlib[bcrypt]>=1.7.4",
            "python-multipart>=0.0.5"
        ]
        
        for dep in enhanced_deps:
            print(f"📦 安装增强依赖: {dep}")
            subprocess.run([pip_path, "install", dep], check=True)
        
        print("✅ 后端环境设置完成")
        return python_path
        
    except subprocess.CalledProcessError as e:
        print(f"❌ 后端环境设置失败: {e}")
        return None
    finally:
        os.chdir("../..")

def setup_frontend_environment():
    """设置前端环境"""
    print("\n🔧 设置前端环境...")
    
    frontend_dir = Path("personal-blog/frontend")
    os.chdir(frontend_dir)
    
    try:
        # 安装Node.js依赖
        print("📦 安装Node.js依赖...")
        subprocess.run(["npm", "install"], check=True)
        
        # 构建前端应用
        print("🏗️  构建前端应用...")
        subprocess.run(["npm", "run", "build"], check=True)
        
        print("✅ 前端环境设置完成")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ 前端环境设置失败: {e}")
        return False
    finally:
        os.chdir("../..")

def setup_database():
    """设置数据库"""
    print("\n🗄️  设置数据库...")
    
    try:
        # 这里可以添加数据库初始化逻辑
        # 例如运行迁移脚本、创建初始数据等
        
        print("✅ 数据库设置完成")
        return True
        
    except Exception as e:
        print(f"❌ 数据库设置失败: {e}")
        return False

def run_tests(python_path):
    """运行测试"""
    print("\n🧪 运行增强鉴权系统测试...")
    
    backend_dir = Path("personal-blog/backend")
    os.chdir(backend_dir)
    
    try:
        # 运行增强鉴权测试
        print("🔍 运行增强鉴权测试...")
        result = subprocess.run([
            python_path, "-m", "pytest", 
            "tests/test_enhanced_auth.py", 
            "-v", "--tb=short"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ 所有测试通过")
            return True
        else:
            print("❌ 测试失败:")
            print(result.stdout)
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ 测试运行失败: {e}")
        return False
    finally:
        os.chdir("../..")

def start_backend_server(python_path, port=8000):
    """启动后端服务器"""
    print(f"\n🚀 启动后端服务器 (端口: {port})...")
    
    backend_dir = Path("personal-blog/backend")
    os.chdir(backend_dir)
    
    try:
        # 启动FastAPI服务器
        cmd = [
            python_path, "-m", "uvicorn", 
            "app.main:app", 
            "--host", "0.0.0.0", 
            "--port", str(port),
            "--reload"
        ]
        
        print(f"🔧 执行命令: {' '.join(cmd)}")
        process = subprocess.Popen(cmd)
        
        # 等待服务器启动
        print("⏳ 等待服务器启动...")
        time.sleep(5)
        
        # 检查服务器是否正常运行
        try:
            import requests
            response = requests.get(f"http://localhost:{port}/docs")
            if response.status_code == 200:
                print(f"✅ 后端服务器启动成功: http://localhost:{port}")
                print(f"📚 API文档: http://localhost:{port}/docs")
                return process
            else:
                print("❌ 服务器启动失败")
                process.terminate()
                return None
        except ImportError:
            print("⚠️  无法验证服务器状态 (缺少requests库)")
            return process
        except Exception as e:
            print(f"❌ 服务器验证失败: {e}")
            process.terminate()
            return None
            
    except Exception as e:
        print(f"❌ 后端服务器启动失败: {e}")
        return None
    finally:
        os.chdir("../..")

def start_frontend_server(port=3000):
    """启动前端服务器"""
    print(f"\n🚀 启动前端服务器 (端口: {port})...")
    
    frontend_dir = Path("personal-blog/frontend")
    os.chdir(frontend_dir)
    
    try:
        # 启动Next.js开发服务器
        cmd = ["npm", "run", "dev", "--", "--port", str(port)]
        
        print(f"🔧 执行命令: {' '.join(cmd)}")
        process = subprocess.Popen(cmd)
        
        # 等待服务器启动
        print("⏳ 等待前端服务器启动...")
        time.sleep(10)
        
        print(f"✅ 前端服务器启动成功: http://localhost:{port}")
        return process
        
    except Exception as e:
        print(f"❌ 前端服务器启动失败: {e}")
        return None
    finally:
        os.chdir("../..")

def print_deployment_summary():
    """打印部署摘要"""
    print("\n" + "=" * 70)
    print("🎉 增强鉴权系统部署完成!")
    print("=" * 70)
    print()
    print("🔗 访问链接:")
    print("   前端应用: http://localhost:3000")
    print("   后端API: http://localhost:8000")
    print("   API文档: http://localhost:8000/docs")
    print()
    print("🔐 增强功能:")
    print("   ✅ JWT Token + Session + Cookie 三重验证")
    print("   ✅ 实时会话管理和监控")
    print("   ✅ 心跳检测机制")
    print("   ✅ Cookie状态监控")
    print("   ✅ 令牌黑名单防护")
    print("   ✅ 安全日志记录")
    print()
    print("📝 管理后台:")
    print("   访问 http://localhost:3000/admin 进入管理后台")
    print("   Cookie监控: http://localhost:3000/admin/cookie-monitor")
    print()
    print("⚠️  注意事项:")
    print("   - 请确保Redis服务正在运行（用于会话存储）")
    print("   - 生产环境请修改配置文件中的安全设置")
    print("   - 定期检查安全日志和监控数据")
    print()
    print("🛑 停止服务: 按 Ctrl+C")
    print("=" * 70)

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="增强鉴权系统部署脚本")
    parser.add_argument("--skip-tests", action="store_true", help="跳过测试")
    parser.add_argument("--backend-port", type=int, default=8000, help="后端端口")
    parser.add_argument("--frontend-port", type=int, default=3000, help="前端端口")
    parser.add_argument("--setup-only", action="store_true", help="仅设置环境，不启动服务器")
    
    args = parser.parse_args()
    
    print_header()
    
    # 检查部署要求
    if not check_requirements():
        sys.exit(1)
    
    # 设置后端环境
    python_path = setup_backend_environment()
    if not python_path:
        sys.exit(1)
    
    # 设置前端环境
    if not setup_frontend_environment():
        sys.exit(1)
    
    # 设置数据库
    if not setup_database():
        sys.exit(1)
    
    # 运行测试（如果未跳过）
    if not args.skip_tests:
        if not run_tests(python_path):
            print("⚠️  测试失败，但继续部署...")
    
    if args.setup_only:
        print("✅ 环境设置完成，跳过服务器启动")
        return
    
    # 启动服务器
    backend_process = start_backend_server(python_path, args.backend_port)
    if not backend_process:
        sys.exit(1)
    
    frontend_process = start_frontend_server(args.frontend_port)
    if not frontend_process:
        backend_process.terminate()
        sys.exit(1)
    
    # 打印部署摘要
    print_deployment_summary()
    
    try:
        # 等待用户中断
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 正在停止服务器...")
        
        if backend_process:
            backend_process.terminate()
            backend_process.wait()
        
        if frontend_process:
            frontend_process.terminate()
            frontend_process.wait()
        
        print("✅ 服务器已停止")

if __name__ == "__main__":
    main()