#!/usr/bin/env python3
"""
直接测试 ask_human 工具的功能
"""

import asyncio
import os
import sys

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.tool.ask_human import AskHuman


async def test_ask_human():
    """测试 ask_human 工具"""
    print("🧪 开始测试 ask_human 工具...")

    # 创建工具实例
    tool = AskHuman()
    print(f"✅ 工具创建成功: {tool}")

    # 模拟用户响应
    async def simulate_user_response():
        """模拟用户响应"""
        await asyncio.sleep(2)  # 等待2秒
        print("👤 模拟用户输入响应...")
        await tool.set_user_response("这是一个测试响应")
        print("✅ 用户响应已设置")

    # 启动模拟用户响应任务
    response_task = asyncio.create_task(simulate_user_response())

    # 执行工具
    print("🔧 开始执行 ask_human 工具...")
    try:
        result = await tool.execute("请告诉我你的名字")
        print(f"✅ 工具执行完成，结果: {result}")
    except Exception as e:
        print(f"❌ 工具执行失败: {e}")

    # 等待响应任务完成
    await response_task

    print("🎉 测试完成！")


if __name__ == "__main__":
    asyncio.run(test_ask_human())
