#!/usr/bin/env python3
"""
调试 LLM 400 错误的脚本
"""

import asyncio
import json

from app.llm import LLM
from app.schema import Message, Role, ToolChoice


async def debug_llm_400():
    """调试LLM 400错误"""
    print("🧪 开始调试 LLM 400 错误...")

    # 创建LLM实例
    llm = LLM()

    # 模拟消息
    messages = [Message.user_message("帮我制定一份周末计划，不清楚的问我")]

    # 模拟工具
    tools = [
        {
            "type": "function",
            "function": {
                "name": "ask_human",
                "description": "向用户询问信息",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "inquire": {"type": "string", "description": "要询问用户的问题"}
                    },
                    "required": ["inquire"],
                },
            },
        }
    ]

    print("📝 消息内容:")
    for msg in messages:
        print(f"  - {msg.to_dict()}")

    print("\n🛠️ 工具定义:")
    for tool in tools:
        print(f"  - {json.dumps(tool, indent=2, ensure_ascii=False)}")

    try:
        print("\n🚀 调用 ask_tool...")
        response = await llm.ask_tool(
            messages=messages, tools=tools, tool_choice=ToolChoice.AUTO
        )
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

        # 检查工具格式
        print("\n🔍 检查工具格式...")
        try:
            for tool in tools:
                if not isinstance(tool, dict) or "type" not in tool:
                    print(f"❌ 工具格式无效: {tool}")
                else:
                    print(f"✅ 工具格式有效: {tool['type']}")
        except Exception as tool_error:
            print(f"❌ 工具格式检查失败: {tool_error}")


def test_message_creation():
    """测试消息创建"""
    print("\n🧪 测试消息创建...")

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
        except Exception as e:
            print(f"❌ {name}: {e}")


def test_tool_call_creation():
    """测试工具调用创建"""
    print("\n🧪 测试工具调用创建...")

    try:
        # 模拟LLM响应中的工具调用
        tool_calls = [
            {
                "id": "call_123",
                "function": {
                    "name": "ask_human",
                    "arguments": '{"inquire": "您希望这份周末计划侧重于哪方面?"}',
                },
                "type": "function",
            }
        ]

        # 创建包含工具调用的消息
        msg = Message.from_tool_calls(
            tool_calls=tool_calls, content="我需要询问用户一些信息"
        )

        msg_dict = msg.to_dict()
        print(f"✅ 工具调用消息: {json.dumps(msg_dict, indent=2, ensure_ascii=False)}")

    except Exception as e:
        print(f"❌ 工具调用创建失败: {e}")


async def main():
    """主函数"""
    print("🔍 LLM 400 错误调试工具")
    print("=" * 50)

    # 测试消息创建
    test_message_creation()

    # 测试工具调用创建
    test_tool_call_creation()

    # 调试LLM调用
    await debug_llm_400()

    print("\n🎉 调试完成！")


if __name__ == "__main__":
    asyncio.run(main())
