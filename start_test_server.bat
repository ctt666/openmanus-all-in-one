@echo off
echo 🚀 启动OpenManus测试服务器...
echo.
echo 请等待服务器启动完成，然后访问以下URL：
echo.
echo 🏠 主页面: http://localhost:8000/
echo 🧪 静态文件测试: http://localhost:8000/test-static-files
echo 🖼️ Logo测试: http://localhost:8000/test-task-logo
echo 🔍 健康检查: http://localhost:8000/health
echo.
echo ⚠️  请不要直接打开HTML文件，必须通过HTTP服务器访问！
echo.
echo 按 Ctrl+C 停止服务器
echo.

python server.py

pause
