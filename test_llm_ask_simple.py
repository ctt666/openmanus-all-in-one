#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简化版LLM ask方法测试程序
"""

import asyncio
import os
import sys

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.llm import LLM
from app.schema import Message


async def test_simple_ask():
    """简单的ask方法测试"""
    print("🚀 开始测试LLM ask方法...")

    try:
        # 创建LLM实例
        llm = LLM()
        print(f"✅ LLM初始化成功")
        print(f"   模型: {llm.model}")
        print(f"   API类型: {llm.api_type}")
        print(f"   最大token数: {llm.max_tokens}")

        # 测试基本对话
        print("\n📝 测试基本对话...")
        messages = [Message.user_message("你好，请用一句话介绍你自己。")]

        response = await llm.ask(messages, stream=False)
        print(f"✅ 收到响应: {response}")

        # 测试带系统消息的对话
        print("\n🔧 测试带系统消息的对话...")
        system_msgs = [Message.system_message("你是一个专业的Python编程助手。")]
        messages = [Message.user_message("什么是Python装饰器？")]

        response = await llm.ask(messages, system_msgs=system_msgs, stream=False)
        print(f"✅ 收到响应: {response}")

        # 测试流式响应
        print("\n🌊 测试流式响应...")
        messages = [Message.user_message("请写一个简单的Python函数。")]

        response = await llm.ask(messages, stream=True)
        print(f"✅ 流式响应完成: {response}")

        print("\n🎉 所有测试完成！")
        return True

    except Exception as e:
        print(f"❌ 测试失败: {e}")
        return False


async def main():
    """主函数"""
    success = await test_simple_ask()
    return 0 if success else 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)


