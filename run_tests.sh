#!/bin/bash

echo "========================================"
echo "LLM Ask方法测试程序"
echo "========================================"
echo

echo "选择测试模式:"
echo "1. 运行完整测试套件"
echo "2. 运行简化测试"
echo "3. 退出"
echo

read -p "请输入选择 (1-3): " choice

case $choice in
    1)
        echo
        echo "🚀 运行完整测试套件..."
        python3 test_llm_ask.py
        ;;
    2)
        echo
        echo "🚀 运行简化测试..."
        python3 test_llm_ask_simple.py
        ;;
    3)
        echo "退出测试程序"
        exit 0
        ;;
    *)
        echo "无效选择，请重新运行程序"
        exit 1
        ;;
esac

echo
read -p "按回车键继续..."


