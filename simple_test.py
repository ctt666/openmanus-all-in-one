#!/usr/bin/env python3
"""
简单的 ask_human 重复问题修复测试
"""


def test_ask_human_detection():
    """测试ask_human检测逻辑"""
    print("🧪 测试 ask_human 检测逻辑...")

    # 模拟全局状态
    global_ask_human_processed = False
    global_processed_inquire = None
    global_processed_task_id = None

    def process_ask_human(inquire, task_id):
        """处理ask_human交互逻辑"""
        nonlocal global_ask_human_processed, global_processed_inquire, global_processed_task_id

        # 检查是否已经处理过相同的询问内容
        if (
            global_ask_human_processed
            and global_processed_inquire == inquire
            and global_processed_task_id == task_id
        ):
            print(f"⚠️  重复的ask_human检测到，已跳过: {inquire}")
            return False

        print(f"🎯 处理ask_human交互: {inquire}")
        global_ask_human_processed = True
        global_processed_inquire = inquire
        global_processed_task_id = task_id
        return True

    def detect_ask_human(data, event_type):
        """检测并处理ask_human交互 - 使用优先级顺序，避免重复处理"""
        if not data or not isinstance(data, str) or global_ask_human_processed:
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
                    import json

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
            return process_ask_human(inquire, "test-task-123")

        return False

    # 测试数据
    test_events = [
        {
            "type": "tool",
            "data": 'Manus selected 1 tools to use\nTools being prepared: [\'ask_human\']\nTool arguments: {"inquire":"您希望这份周末计划侧重于哪方面?"}',
        },
        {
            "type": "act",
            "data": "Tool 'ask_human' completed its mission! Result: INTERACTION_REQUIRED: 您希望这份周末计划侧重于哪方面?",
        },
        {
            "type": "interaction",
            "data": "Human interaction required: 您希望这份周末计划侧重于哪方面?",
        },
        {
            "type": "interaction",
            "data": "Human interaction required: 您希望这份周末计划侧重于哪方面?",
        },
    ]

    print(f"\n📊 开始处理 {len(test_events)} 个事件...")

    processed_count = 0
    for i, event in enumerate(test_events, 1):
        print(f"\n📡 处理事件 {i}: {event['type']}")
        print(f"📄 事件内容: {event['data'][:80]}...")

        # 检测并处理ask_human
        processed = detect_ask_human(event["data"], event["type"])

        if processed:
            processed_count += 1
            print(f"✅ 事件 {i} 已处理")
        else:
            print(f"ℹ️  事件 {i} 未处理（可能已处理过或不需要处理）")

        # 显示当前状态
        print(
            f"   状态: processed={global_ask_human_processed}, inquire='{global_processed_inquire}'"
        )

    print(f"\n🎯 测试完成！")
    print(f"📊 总共处理了 {processed_count} 个事件")

    if processed_count == 1:
        print("✅ 修复成功！只处理了一次ask_human，避免了重复")
    else:
        print("❌ 修复失败！处理了多次ask_human")


def test_message_deduplication():
    """测试消息去重机制"""
    print("\n🧪 测试消息去重机制...")

    messages = []

    def add_message(text, sender):
        """模拟添加消息，包含去重逻辑"""
        # 去重逻辑：检查所有已存在的AI消息是否与当前消息相同
        if sender == "ai":
            existing_ai_messages = [
                m["content"] for m in messages if m["sender"] == "ai"
            ]
            if text in existing_ai_messages:
                print(f"⚠️  重复的AI消息检测到，已跳过: {text[:50]}...")
                return

        message = {"sender": sender, "content": text}
        messages.append(message)
        print(f"💬 [{sender.upper()}] {text}")

    # 测试重复消息
    test_messages = [
        ("您希望这份周末计划侧重于哪方面?", "ai"),
        ("您希望这份周末计划侧重于哪方面?", "ai"),  # 重复消息
        ("我希望计划侧重于休闲放松", "user"),
        ("您希望这份周末计划侧重于哪方面?", "ai"),  # 再次重复
        ("您希望计划包含哪些具体活动?", "ai"),  # 不同消息
    ]

    for text, sender in test_messages:
        add_message(text, sender)

    print(f"\n📊 消息统计:")
    print(f"AI消息数量: {len([m for m in messages if m['sender'] == 'ai'])}")
    print(f"用户消息数量: {len([m for m in messages if m['sender'] == 'user'])}")
    print(f"总消息数量: {len(messages)}")

    # 检查是否有重复的AI消息
    ai_contents = [m["content"] for m in messages if m["sender"] == "ai"]
    unique_ai_contents = list(set(ai_contents))

    print(f"AI消息内容: {ai_contents}")
    print(f"唯一AI消息内容: {unique_ai_contents}")

    if len(ai_contents) == len(unique_ai_contents):
        print("✅ 没有重复的AI消息，去重机制工作正常")
    else:
        print("❌ 检测到重复的AI消息，去重机制可能有问题")
        print(f"重复的消息: {[x for x in ai_contents if ai_contents.count(x) > 1]}")


def main():
    """主测试函数"""
    print("🧪 Ask Human 重复问题修复测试")
    print("=" * 50)

    # 测试1：ask_human检测逻辑
    test_ask_human_detection()

    # 测试2：消息去重机制
    test_message_deduplication()

    print("\n🎉 所有测试完成！")


if __name__ == "__main__":
    main()
