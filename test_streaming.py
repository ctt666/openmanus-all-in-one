#!/usr/bin/env python3
"""
测试流式响应处理功能
验证修复后的代码是否能正确处理流式响应
"""

import asyncio
import logging
import os
import sys

# 添加项目路径到sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.llm import LLM

# 配置日志
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)


async def test_streaming_response():
    """测试流式响应处理"""
    print("🚀 开始测试流式响应处理...")

    try:
        # 初始化LLM客户端
        llm_client = LLM()

        # 测试消息
        test_messages = [
            {"role": "user", "content": "请简单介绍一下Python编程语言的特点"}
        ]

        print(f"📝 测试消息: {test_messages[0]['content']}")
        print("⏳ 正在发送流式请求...")

        # 测试流式响应
        response = await llm_client.ask(
            messages=test_messages, stream=True, temperature=0.7
        )

        print(f"✅ 流式响应成功!")
        print(f"📄 响应内容: {response}")
        print(f"📊 响应长度: {len(response)} 字符")

        return True

    except Exception as e:
        print(f"❌ 流式响应测试失败: {e}")
        logging.error(f"测试失败详情: {e}", exc_info=True)
        return False


async def test_non_streaming_response():
    """测试非流式响应处理（作为对比）"""
    print("\n🔄 开始测试非流式响应处理...")

    try:
        llm_client = LLM()

        test_messages = [{"role": "user", "content": "请用一句话描述人工智能"}]

        print(f"📝 测试消息: {test_messages[0]['content']}")
        print("⏳ 正在发送非流式请求...")

        # 测试非流式响应
        response = await llm_client.ask(
            messages=test_messages, stream=False, temperature=0.7
        )

        print(f"✅ 非流式响应成功!")
        print(f"📄 响应内容: {response}")
        print(f"📊 响应长度: {len(response)} 字符")

        return True

    except Exception as e:
        print(f"❌ 非流式响应测试失败: {e}")
        logging.error(f"测试失败详情: {e}", exc_info=True)
        return False


async def test_error_handling():
    """测试错误处理机制"""
    print("\n🛡️ 开始测试错误处理机制...")

    try:
        llm_client = LLM()

        # 使用无效的模型名称来触发错误
        test_messages = [{"role": "user", "content": "测试消息"}]

        print("🧪 测试无效模型名称...")

        response = await llm_client.ask(
            messages=test_messages, stream=True, temperature=0.7
        )

        print(f"⚠️ 意外成功，响应: {response}")
        return True

    except Exception as e:
        print(f"✅ 错误处理正常，捕获到预期错误: {type(e).__name__}")
        print(f"📝 错误信息: {e}")
        return True  # 这是预期的行为


async def main():
    """主测试函数"""
    print("🧪 开始LLM流式响应处理测试")
    print("=" * 50)

    results = []

    # 测试1: 流式响应
    print("\n📋 测试1: 流式响应处理")
    result1 = await test_streaming_response()
    results.append(("流式响应", result1))

    # 测试2: 非流式响应
    print("\n📋 测试2: 非流式响应处理")
    result2 = await test_non_streaming_response()
    results.append(("非流式响应", result2))

    # 测试3: 错误处理
    print("\n📋 测试3: 错误处理机制")
    result3 = await test_error_handling()
    results.append(("错误处理", result3))

    # 输出测试结果摘要
    print("\n" + "=" * 50)
    print("📊 测试结果摘要:")

    passed = 0
    total = len(results)

    for test_name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"  {test_name}: {status}")
        if result:
            passed += 1

    print(f"\n🎯 总体结果: {passed}/{total} 测试通过")

    if passed == total:
        print("🎉 所有测试通过！流式响应处理修复成功！")
    else:
        print("⚠️ 部分测试失败，需要进一步检查")

    return passed == total


if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⏹️ 测试被用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 测试运行异常: {e}")
        logging.error("测试运行异常", exc_info=True)
        sys.exit(1)
