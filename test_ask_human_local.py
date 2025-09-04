#!/usr/bin/env python3
"""
本地测试 ask_human 重复问题修复效果
"""

import asyncio
import json
import time
from datetime import datetime


# 模拟前端事件处理逻辑
class MockFrontend:
    def __init__(self):
        # 模拟全局状态管理
        self.global_ask_human_processed = False
        self.global_processed_inquire = None
        self.global_processed_task_id = None
        self.current_interaction_task_id = None
        self.chat_state = "none"
        self.messages = []

    def add_message(self, text, sender):
        """模拟添加消息，包含去重逻辑"""
        # 去重逻辑：检查最后一条AI消息是否与当前消息相同
        if sender == "ai":
            if (
                self.messages
                and self.messages[-1]["sender"] == "ai"
                and self.messages[-1]["content"] == text
            ):
                print(f"⚠️  重复的AI消息检测到，已跳过: {text[:50]}...")
                return

        message = {
            "sender": sender,
            "content": text,
            "timestamp": datetime.now().isoformat(),
        }
        self.messages.append(message)
        print(f"💬 [{sender.upper()}] {text}")

    def process_ask_human(self, inquire, task_id):
        """处理ask_human交互逻辑"""
        # 检查是否已经处理过相同的询问内容
        if (
            self.global_ask_human_processed
            and self.global_processed_inquire == inquire
            and self.global_processed_task_id == task_id
        ):
            print(f"⚠️  重复的ask_human检测到，已跳过: {inquire}")
            return False

        print(f"🎯 处理ask_human交互: {inquire}")
        self.add_message(inquire, "ai")
        self.current_interaction_task_id = task_id
        self.chat_state = "none"
        self.global_ask_human_processed = True
        self.global_processed_inquire = inquire
        self.global_processed_task_id = task_id
        return True

    def detect_ask_human(self, data, event_type):
        """检测并处理ask_human交互 - 使用优先级顺序，避免重复处理"""
        if not data or not isinstance(data, str) or self.global_ask_human_processed:
            return False

        inquire = None
        detected = False

        # 优先级1：检测ask_human工具执行完成的情况（最高优先级）
        if "Tool 'ask_human' completed its mission!" in data:
            print("✅ 检测到ask_human工具完成")
            import re

            match = re.search(r"INTERACTION_REQUIRED:\s*(.+)", data)
            if match:
                inquire = match.group(1).strip()
                detected = True

        # 优先级2：检测直接的INTERACTION_REQUIRED标记
        elif "INTERACTION_REQUIRED:" in data:
            print("✅ 检测到INTERACTION_REQUIRED标记")
            inquire = data.split("INTERACTION_REQUIRED:")[-1].strip()
            detected = True

        # 优先级3：检测ask_human工具的使用（仅在tool类型事件中）
        elif event_type == "tool" and "ask_human" in data:
            print("✅ 检测到ask_human工具使用")

            # 从JSON格式的tool arguments中提取
            import re

            tool_args_match = re.search(r"Tool arguments: ({[^}]+})", data)
            if tool_args_match:
                try:
                    tool_args = json.loads(tool_args_match.group(1))
                    if tool_args.get("inquire"):
                        inquire = tool_args["inquire"]
                        detected = True
                except json.JSONDecodeError:
                    print("❌ 解析工具参数JSON失败")

            # 如果JSON解析失败，尝试其他提取方法
            if not inquire:
                inquire_match = re.search(r'inquire["\s]*:["\s]*([^,\n}]+)', data)
                if inquire_match:
                    inquire = inquire_match.group(1).strip().strip("\"'")
                    detected = True

        # 如果检测到ask_human，处理它
        if detected and inquire:
            return self.process_ask_human(inquire, "test-task-123")

        return False

    def reset_state(self):
        """重置ask_human状态，允许后续的ask_human交互"""
        self.global_ask_human_processed = False
        self.global_processed_inquire = None
        print("🔄 Ask_human状态已重置，准备下一次交互")

    def debug_state(self):
        """显示当前状态"""
        print("\n=== Ask Human 状态调试 ===")
        print(f"Global Ask Human Processed: {self.global_ask_human_processed}")
        print(f"Global Processed Inquire: {self.global_processed_inquire}")
        print(f"Global Processed Task ID: {self.global_processed_task_id}")
        print(f"Current Interaction Task ID: {self.current_interaction_task_id}")
        print(f"Chat State: {self.chat_state}")
        print(f"消息数量: {len(self.messages)}")
        print("============================\n")


def simulate_events(frontend):
    """模拟后端发送的多个事件"""
    print("🚀 开始模拟 ask_human 事件...")

    # 模拟事件1：工具选择
    event1 = {
        "type": "tool",
        "data": 'Manus selected 1 tools to use\nTools being prepared: [\'ask_human\']\nTool arguments: {"inquire":"您希望这份周末计划侧重于哪方面?"}',
    }

    # 模拟事件2：工具执行
    event2 = {
        "type": "act",
        "data": "Tool 'ask_human' completed its mission! Result: INTERACTION_REQUIRED: 您希望这份周末计划侧重于哪方面?",
    }

    # 模拟事件3：交互需求
    event3 = {
        "type": "interaction",
        "data": "Human interaction required: 您希望这份周末计划侧重于哪方面?",
    }

    # 模拟事件4：重复的交互需求（测试去重）
    event4 = {
        "type": "interaction",
        "data": "Human interaction required: 您希望这份周末计划侧重于哪方面?",
    }

    events = [event1, event2, event3, event4]

    for i, event in enumerate(events, 1):
        print(f"\n📡 处理事件 {i}: {event['type']}")
        print(f"📄 事件内容: {event['data'][:100]}...")

        # 检测并处理ask_human
        processed = frontend.detect_ask_human(event["data"], event["type"])

        if processed:
            print(f"✅ 事件 {i} 已处理")
        else:
            print(f"ℹ️  事件 {i} 未处理（可能已处理过或不需要处理）")

        # 显示当前状态
        frontend.debug_state()
        time.sleep(1)  # 模拟处理时间

    print("\n🎯 事件模拟完成！")
    print(
        f"📊 总共处理了 {len([m for m in frontend.messages if m['sender'] == 'ai'])} 条AI消息"
    )


def test_user_response(frontend):
    """测试用户回答后的状态重置"""
    print("\n👤 模拟用户回答...")

    # 模拟用户回答
    user_response = "我希望计划侧重于休闲放松和家庭聚会"
    frontend.add_message(user_response, "user")

    # 重置状态，允许后续的ask_human交互
    frontend.reset_state()

    # 显示重置后的状态
    frontend.debug_state()

    # 测试是否可以再次处理ask_human
    print("\n🧪 测试状态重置后的ask_human处理...")
    test_event = {
        "type": "act",
        "data": "Tool 'ask_human' completed its mission! Result: INTERACTION_REQUIRED: 您希望计划包含哪些具体活动?",
    }

    processed = frontend.detect_ask_human(test_event["data"], test_event["type"])
    if processed:
        print("✅ 状态重置成功，可以处理新的ask_human交互")
    else:
        print("❌ 状态重置失败，无法处理新的ask_human交互")


def main():
    """主测试函数"""
    print("🧪 Ask Human 重复问题修复测试")
    print("=" * 50)

    # 创建前端模拟器
    frontend = MockFrontend()

    # 显示初始状态
    print("\n📊 初始状态:")
    frontend.debug_state()

    # 模拟事件处理
    simulate_events(frontend)

    # 测试用户回答和状态重置
    test_user_response(frontend)

    # 显示最终状态
    print("\n📊 最终状态:")
    frontend.debug_state()

    # 总结
    print("\n📋 测试总结:")
    ai_messages = [m for m in frontend.messages if m["sender"] == "ai"]
    user_messages = [m for m in frontend.messages if m["sender"] == "user"]

    print(f"AI消息数量: {len(ai_messages)}")
    print(f"用户消息数量: {len(user_messages)}")
    print(f"总消息数量: {len(frontend.messages)}")

    # 检查是否有重复的AI消息
    ai_contents = [m["content"] for m in ai_messages]
    if len(ai_contents) == len(set(ai_contents)):
        print("✅ 没有重复的AI消息，去重机制工作正常")
    else:
        print("❌ 检测到重复的AI消息，去重机制可能有问题")

    print("\n🎉 测试完成！")


if __name__ == "__main__":
    main()
