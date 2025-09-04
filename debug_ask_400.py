#!/usr/bin/env python3
"""
调试 ask 方法 400 错误的脚本
"""

import asyncio
import json

from app.llm import LLM
from app.schema import Message, Role


async def debug_ask_400():
    """调试ask方法400错误"""
    print("🧪 开始调试 ask 方法 400 错误...")

    # 创建LLM实例
    llm = LLM()

    # 模拟消息 - 使用与错误日志中相同的内容
    messages = [Message.user_message("帮我制定一份周末计划，不清楚的问我")]

    print("📝 消息内容:")
    for msg in messages:
        print(f"  - {msg.to_dict()}")

    try:
        print("\n🚀 调用 ask 方法...")
        response = await llm.ask(messages=messages, stream=False)
        print(f"✅ 成功获得响应: {response}")

    except Exception as e:
        print(f"❌ 发生错误: {type(e).__name__}: {e}")

        # 检查是否是验证错误
        if hasattr(e, "__cause__") and e.__cause__:
            print(f"   原因: {type(e.__cause__).__name__}: {e.__cause__}")

        # 检查消息格式
        print("\n🔍 检查消息格式...")
        try:
            formatted_messages = llm.format_messages(messages, supports_images=False)
            print("✅ 消息格式验证通过")
            for msg in formatted_messages:
                print(f"  - {json.dumps(msg, indent=2, ensure_ascii=False)}")
        except Exception as format_error:
            print(f"❌ 消息格式验证失败: {format_error}")

        # 检查Token限制
        print("\n🔍 检查Token限制...")
        try:
            input_tokens = llm.count_message_tokens(messages)
            print(f"输入Token数量: {input_tokens}")
            if llm.check_token_limit(input_tokens):
                print("✅ Token数量在限制范围内")
            else:
                print("❌ Token数量超出限制")
                error_message = llm.get_limit_error_message(input_tokens)
                print(f"错误信息: {error_message}")
        except Exception as token_error:
            print(f"❌ Token检查失败: {token_error}")


def test_message_validation():
    """测试消息验证"""
    print("\n🧪 测试消息验证...")

    # 测试不同类型的消息
    test_cases = [
        ("用户消息", Message.user_message("测试内容")),
        ("系统消息", Message.system_message("系统提示")),
        ("助手消息", Message.assistant_message("助手回复")),
    ]

    for name, msg in test_cases:
        try:
            msg_dict = msg.to_dict()
            print(f"✅ {name}: {msg_dict}")

            # 检查角色是否有效
            if msg_dict["role"] in ["system", "user", "assistant", "tool"]:
                print(f"  ✅ 角色 '{msg_dict['role']}' 有效")
            else:
                print(f"  ❌ 角色 '{msg_dict['role']}' 无效")

        except Exception as e:
            print(f"❌ {name}: {e}")


def test_llm_config():
    """测试LLM配置"""
    print("\n🧪 测试LLM配置...")

    try:
        llm = LLM()
        print(f"✅ 模型: {llm.model}")
        print(f"✅ 最大Token: {llm.max_tokens}")
        print(f"✅ 温度: {llm.temperature}")
        print(f"✅ 客户端: {type(llm.client).__name__}")

        # 检查模型是否支持图像
        from app.llm import MULTIMODAL_MODELS

        if llm.model in MULTIMODAL_MODELS:
            print(f"✅ 模型支持图像")
        else:
            print(f"ℹ️ 模型不支持图像")

    except Exception as e:
        print(f"❌ LLM配置检查失败: {e}")


async def test_simple_ask():
    """测试简单的ask调用"""
    print("\n🧪 测试简单ask调用...")

    try:
        llm = LLM()

        # 最简单的消息
        simple_messages = [{"role": "user", "content": "Hello"}]

        print("📝 简单消息:")
        for msg in simple_messages:
            print(f"  - {msg}")

        response = await llm.ask(messages=simple_messages, stream=False)
        print(f"✅ 简单ask调用成功: {response}")

    except Exception as e:
        print(f"❌ 简单ask调用失败: {e}")

        # 检查是否是API配置问题
        if "authentication" in str(e).lower() or "api key" in str(e).lower():
            print("🔑 可能是API密钥配置问题")
        elif "rate limit" in str(e).lower():
            print("⏱️ 可能是速率限制问题")
        elif "model" in str(e).lower():
            print("🤖 可能是模型配置问题")
        else:
            print("❓ 未知错误类型")


async def main():
    """主函数"""
    print("🔍 Ask 方法 400 错误调试工具")
    print("=" * 50)

    # 测试LLM配置
    test_llm_config()

    # 测试消息验证
    test_message_validation()

    # 测试简单ask调用
    await test_simple_ask()

    # 调试原始问题
    await debug_ask_400()

    print("\n🎉 调试完成！")


if __name__ == "__main__":
    asyncio.run(main())
