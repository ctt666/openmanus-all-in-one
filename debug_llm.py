#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LLM一键调试脚本
"""

import os
import subprocess
import sys
import time


def run_command(command, description):
    """运行命令并显示结果"""
    print(f"\n{'='*60}")
    print(f"🔄 {description}")
    print(f"命令: {command}")
    print(f"{'='*60}")

    try:
        result = subprocess.run(command, shell=True, capture_output=False, text=True)

        if result.returncode == 0:
            print(f"✅ {description} 完成")
        else:
            print(f"❌ {description} 失败，退出码: {result.returncode}")

        return result.returncode == 0

    except Exception as e:
        print(f"❌ 执行命令时发生错误: {e}")
        return False


def main():
    """主函数"""
    print("🚀 LLM一键调试脚本")
    print("这个脚本将按顺序运行所有调试程序")
    print("=" * 60)

    # 检查当前目录
    if not os.path.exists("app/llm.py"):
        print("❌ 错误：请在项目根目录运行此脚本")
        print("当前目录:", os.getcwd())
        print("请切换到包含 app/ 目录的项目根目录")
        return 1

    print("✅ 当前目录正确")

    # 步骤1：检查配置文件
    print("\n📋 步骤1: 检查配置文件")
    if not run_command("python check_config.py", "配置文件检查"):
        print("\n⚠️  配置文件检查失败，请修复配置问题后重试")
        return 1

    # 步骤2：测试网络连接
    print("\n📋 步骤2: 测试网络连接")
    if not run_command("python test_llm_connection.py", "网络连接测试"):
        print("\n⚠️  网络连接测试失败")
        print("可能的原因：")
        print("1. LLM服务未运行")
        print("2. 网络连接问题")
        print("3. API端点不可访问")
        print("4. 防火墙阻止连接")

        # 询问是否继续
        try:
            choice = input("\n是否继续运行下一步测试？(y/N): ").strip().lower()
            if choice != "y":
                print("调试终止")
                return 1
        except KeyboardInterrupt:
            print("\n调试被用户中断")
            return 1

    # 步骤3：运行调试测试
    print("\n📋 步骤3: 运行调试测试")
    if not run_command("python test_llm_ask_debug.py", "调试测试"):
        print("\n⚠️  调试测试失败")
        print("请查看上面的错误信息进行问题诊断")
        return 1

    # 步骤4：运行原始测试（可选）
    print("\n📋 步骤4: 运行原始测试（可选）")
    try:
        choice = input("是否运行完整的原始测试程序？(y/N): ").strip().lower()
        if choice == "y":
            if not run_command("python test_llm_ask.py", "完整测试套件"):
                print("\n⚠️  完整测试套件失败")
                print("但基本的调试测试已通过，问题可能在于特定功能")
            else:
                print("\n🎉 所有测试都通过了！")
        else:
            print("跳过完整测试套件")
    except KeyboardInterrupt:
        print("\n跳过完整测试套件")

    # 总结
    print("\n" + "=" * 60)
    print("🎯 调试完成！")
    print("=" * 60)

    print("\n💡 如果仍有问题，请检查：")
    print("1. 查看上面的错误信息")
    print("2. 检查 DEBUG_GUIDE.md 文档")
    print("3. 确认LLM服务状态")
    print("4. 验证网络连接")

    print("\n📚 可用的调试工具：")
    print("- check_config.py      - 配置文件检查")
    print("- test_llm_connection.py - 网络连接测试")
    print("- test_llm_ask_debug.py  - 调试测试")
    print("- test_llm_ask_simple.py - 简化测试")
    print("- test_llm_ask.py       - 完整测试套件")

    return 0


if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\n程序被用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n程序执行失败: {e}")
        sys.exit(1)


