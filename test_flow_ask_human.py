#!/usr/bin/env python3
"""
测试 run_flow 的 ask_human 逻辑修复效果

用法:
python test_flow_ask_human.py
"""

import asyncio
import json
import time
from datetime import datetime

import aiohttp


class FlowAskHumanTester:
    def __init__(self, base_url="http://localhost:5172"):
        self.base_url = base_url
        self.session = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def create_flow(self, prompt):
        """创建一个新的 flow"""
        url = f"{self.base_url}/flows"
        data = {"prompt": prompt, "session_id": f"test_session_{int(time.time())}"}

        async with self.session.post(url, json=data) as response:
            if response.status != 200:
                raise Exception(f"Failed to create flow: {response.status}")
            result = await response.json()
            return result["task_id"]

    async def send_interaction_response(self, flow_id, response):
        """发送交互响应"""
        url = f"{self.base_url}/flows/{flow_id}/interact"
        data = {"response": response}

        async with self.session.post(url, json=data) as resp:
            if resp.status != 200:
                raise Exception(f"Failed to send interaction: {resp.status}")
            return await resp.json()

    async def listen_to_flow_events(self, flow_id, timeout=30):
        """监听 flow 事件流"""
        url = f"{self.base_url}/flows/{flow_id}/events"
        events = []
        interaction_detected = False

        print(f"🎧 开始监听流程事件: {flow_id}")

        try:
            async with self.session.get(url) as response:
                if response.status != 200:
                    raise Exception(f"Failed to connect to events: {response.status}")

                start_time = time.time()
                async for line in response.content:
                    if time.time() - start_time > timeout:
                        print(f"⏰ 超时 ({timeout}s)，停止监听")
                        break

                    line = line.decode("utf-8").strip()
                    if not line:
                        continue

                    if line.startswith("event: "):
                        event_type = line[7:]
                    elif line.startswith("data: "):
                        try:
                            data = json.loads(line[5:])
                            events.append(
                                {
                                    "type": event_type,
                                    "data": data,
                                    "timestamp": datetime.now().isoformat(),
                                }
                            )

                            # 检测 ask_human 交互
                            result = data.get("result", "")
                            if isinstance(result, str) and (
                                "INTERACTION_REQUIRED:" in result
                                or "ask_human" in result.lower()
                            ):
                                interaction_detected = True
                                print(f"🎯 检测到交互需求: {result}")

                                # 提取询问内容
                                if "INTERACTION_REQUIRED:" in result:
                                    inquire = result.split("INTERACTION_REQUIRED:")[
                                        -1
                                    ].strip()
                                    print(f"📝 询问内容: {inquire}")

                                    # 自动发送响应
                                    response_text = "这是测试响应，请继续执行任务。"
                                    print(f"🤖 自动发送响应: {response_text}")
                                    await self.send_interaction_response(
                                        flow_id, response_text
                                    )

                            # 打印事件信息
                            if event_type in [
                                "interaction",
                                "log",
                                "complete",
                                "error",
                            ]:
                                print(f"📨 [{event_type.upper()}] {data}")

                            # 如果任务完成或失败，停止监听
                            if event_type in ["complete", "error"]:
                                print(f"🏁 流程结束: {event_type}")
                                break

                        except json.JSONDecodeError:
                            continue
                        except Exception as e:
                            print(f"❌ 处理事件时出错: {e}")
                            continue

        except Exception as e:
            print(f"❌ 监听事件流时出错: {e}")

        return events, interaction_detected

    async def test_flow_ask_human(self):
        """测试 flow 的 ask_human 功能"""
        print("🚀 开始测试 Flow Ask Human 功能")

        # 创建一个会触发 ask_human 的 prompt
        prompt = "请创建一个计划来完成任务：你好。在创建计划之前，请使用 ask_human 工具询问我需要什么样的计划格式。"

        try:
            # 1. 创建 flow
            print(f"📝 创建 Flow，提示: {prompt}")
            flow_id = await self.create_flow(prompt)
            print(f"✅ Flow 创建成功，ID: {flow_id}")

            # 2. 监听事件并处理交互
            events, interaction_detected = await self.listen_to_flow_events(flow_id)

            # 3. 分析结果
            print("\n📊 测试结果分析:")
            print(f"- 总事件数: {len(events)}")
            print(f"- 检测到交互: {'✅ 是' if interaction_detected else '❌ 否'}")

            # 检查关键事件
            interaction_events = [e for e in events if e["type"] == "interaction"]
            error_events = [e for e in events if e["type"] == "error"]
            complete_events = [e for e in events if e["type"] == "complete"]

            print(f"- 交互事件数: {len(interaction_events)}")
            print(f"- 错误事件数: {len(error_events)}")
            print(f"- 完成事件数: {len(complete_events)}")

            # 判断测试结果
            if interaction_detected and len(error_events) == 0:
                print("🎉 测试通过！Flow Ask Human 功能正常工作")
                return True
            elif len(error_events) > 0:
                print("❌ 测试失败：发生错误")
                for event in error_events:
                    print(f"   错误详情: {event['data']}")
                return False
            else:
                print("⚠️  测试结果不确定：未检测到交互或未完成")
                return False

        except Exception as e:
            print(f"❌ 测试过程中发生异常: {e}")
            return False

    async def test_api_endpoints(self):
        """测试 API 端点是否正常工作"""
        print("🔍 测试 API 端点...")

        try:
            # 测试创建 flow
            flow_id = await self.create_flow("测试提示")
            print(f"✅ /flows 端点正常，Flow ID: {flow_id}")

            # 测试交互端点
            try:
                result = await self.send_interaction_response(flow_id, "测试响应")
                print(f"✅ /flows/{flow_id}/interact 端点正常")
            except Exception as e:
                print(f"❌ /flows/{flow_id}/interact 端点异常: {e}")
                return False

            return True

        except Exception as e:
            print(f"❌ API 端点测试失败: {e}")
            return False


async def main():
    """主测试函数"""
    print("=" * 60)
    print("🧪 Flow Ask Human 功能测试")
    print("=" * 60)

    async with FlowAskHumanTester() as tester:
        # 1. 测试 API 端点
        api_ok = await tester.test_api_endpoints()
        if not api_ok:
            print("❌ API 端点测试失败，请检查服务是否正常运行")
            return

        print("\n" + "=" * 60)

        # 2. 测试 ask_human 功能
        test_ok = await tester.test_flow_ask_human()

        print("\n" + "=" * 60)
        print("📋 测试总结:")
        print(f"- API 端点: {'✅ 正常' if api_ok else '❌ 异常'}")
        print(f"- Ask Human 功能: {'✅ 正常' if test_ok else '❌ 异常'}")

        if api_ok and test_ok:
            print("🎉 所有测试通过！Flow Ask Human 功能修复成功！")
        else:
            print("⚠️  部分测试失败，请检查修复是否完整")

        print("=" * 60)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 测试被用户中断")
    except Exception as e:
        print(f"❌ 测试运行时发生异常: {e}")
