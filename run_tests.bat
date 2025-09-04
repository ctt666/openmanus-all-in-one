@echo off
chcp 65001 >nul
echo ========================================
echo LLM Ask方法测试程序
echo ========================================
echo.

echo 选择测试模式:
echo 1. 运行完整测试套件
echo 2. 运行简化测试
echo 3. 退出
echo.

set /p choice="请输入选择 (1-3): "

if "%choice%"=="1" (
    echo.
    echo 🚀 运行完整测试套件...
    python test_llm_ask.py
    pause
) else if "%choice%"=="2" (
    echo.
    echo 🚀 运行简化测试...
    python test_llm_ask_simple.py
    pause
) else if "%choice%"=="3" (
    echo 退出测试程序
    exit /b 0
) else (
    echo 无效选择，请重新运行程序
    pause
    exit /b 1
)


