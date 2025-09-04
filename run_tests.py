#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LLM测试程序运行器
"""

import asyncio
import os
import subprocess
import sys


def run_test(test_file):
    """运行指定的测试文件"""
    try:
        # 检查文件是否存在
        if not os.path.exists(test_file):
            print(f"❌ 测试文件 {test_file} 不存在")
            return False

        print(f"🚀 开始运行 {test_file}...")
        print("=" * 50)

        # 运行测试
        result = subprocess.run(
            [sys.executable, test_file], capture_output=False, text=True
        )

        print("=" * 50)
        if result.returncode == 0:
            print(f"✅ {test_file} 运行完成")
            return True
        else:
            print(f"❌ {test_file} 运行失败，退出码: {result.returncode}")
            return False

    except Exception as e:
        print(f"❌ 运行 {test_file} 时发生错误: {e}")
        return False


def main():
    """主函数"""
    print("=" * 50)
    print("LLM Ask方法测试程序")
    print("=" * 50)
    print()

    while True:
        print("选择测试模式:")
        print("1. 运行完整测试套件")
        print("2. 运行简化测试")
        print("3. 退出")
        print()

        try:
            choice = input("请输入选择 (1-3): ").strip()

            if choice == "1":
                print()
                success = run_test("test_llm_ask.py")
                if success:
                    print("\n🎉 完整测试套件运行完成！")
                else:
                    print("\n⚠️ 完整测试套件运行失败！")

            elif choice == "2":
                print()
                success = run_test("test_llm_ask_simple.py")
                if success:
                    print("\n🎉 简化测试运行完成！")
                else:
                    print("\n⚠️ 简化测试运行失败！")

            elif choice == "3":
                print("退出测试程序")
                break

            else:
                print("❌ 无效选择，请输入 1、2 或 3")
                continue

        except KeyboardInterrupt:
            print("\n\n程序被用户中断")
            break
        except EOFError:
            print("\n\n程序结束")
            break
        except Exception as e:
            print(f"\n❌ 发生错误: {e}")
            continue

        print()
        input("按回车键继续...")


if __name__ == "__main__":
    main()


