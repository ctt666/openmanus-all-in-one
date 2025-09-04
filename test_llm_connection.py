#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LLM连接测试程序
"""

import asyncio
import os
import sys

import aiohttp

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import config


async def test_llm_connection():
    """测试LLM服务连接"""
    print("🔍 开始测试LLM服务连接...")

    try:
        # 获取配置 - config.llm返回字典，需要访问default配置
        llm_config = config.llm["default"]
        base_url = llm_config.base_url
        api_key = llm_config.api_key

        print(f"📡 API端点: {base_url}")
        print(f"🔑 API密钥: {api_key[:10]}..." if api_key else "❌ 未设置API密钥")

        # 测试HTTP连接
        print(f"\n🌐 测试HTTP连接到 {base_url}...")

        # 为每个请求创建新的会话
        async with aiohttp.ClientSession() as session:
            try:
                # 设置超时
                timeout = aiohttp.ClientTimeout(total=10)

                async with session.get(base_url, timeout=timeout) as response:
                    print(f"✅ HTTP连接成功，状态码: {response.status}")
                    print(f"响应头: {dict(response.headers)}")

                    # 尝试读取响应内容
                    try:
                        content = await response.text()
                        print(f"响应内容预览: {content[:200]}...")
                    except Exception as e:
                        print(f"读取响应内容失败: {e}")

            except asyncio.TimeoutError:
                print("❌ 连接超时（10秒）")
                return False
            except aiohttp.ClientError as e:
                print(f"❌ HTTP连接失败: {e}")
                return False
            except Exception as e:
                print(f"❌ 连接测试异常: {e}")
                return False

        # 测试OpenAI API兼容性
        print(f"\n🤖 测试OpenAI API兼容性...")

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        test_data = {
            "model": llm_config.model,
            "messages": [{"role": "user", "content": "test"}],
            "max_tokens": 10,
        }

        # 为API测试创建新的会话
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    f"{base_url}/chat/completions",
                    headers=headers,
                    json=test_data,
                    timeout=timeout,
                ) as response:
                    print(f"✅ API调用成功，状态码: {response.status}")

                    if response.status == 200:
                        try:
                            result = await response.json()
                            print(f"✅ 收到有效响应: {result}")
                            return True
                        except Exception as e:
                            print(f"⚠️ 响应不是有效JSON: {e}")
                            return True  # 连接成功，只是响应格式问题
                    else:
                        print(f"⚠️ API调用返回非200状态码: {response.status}")
                        try:
                            error_content = await response.text()
                            print(f"错误响应: {error_content}")
                        except:
                            pass
                        return False

            except asyncio.TimeoutError:
                print("❌ API调用超时（10秒）")
                return False
            except aiohttp.ClientError as e:
                print(f"❌ API调用失败: {e}")
                return False
            except Exception as e:
                print(f"❌ API测试异常: {e}")
                return False

    except Exception as e:
        print(f"❌ 测试过程中发生错误: {e}")
        return False


async def main():
    """主函数"""
    print("=" * 50)
    print("LLM连接测试程序")
    print("=" * 50)

    try:
        success = await test_llm_connection()

        if success:
            print("\n🎉 连接测试成功！LLM服务可用。")
            return 0
        else:
            print("\n❌ 连接测试失败！LLM服务不可用。")
            print("\n💡 建议检查:")
            print("1. 确保LLM服务正在运行")
            print("2. 检查配置文件中的API端点和密钥")
            print("3. 检查网络连接和防火墙设置")
            print("4. 验证API密钥是否有效")
            return 1

    except Exception as e:
        print(f"\n❌ 测试执行失败: {e}")
        return 1


if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n程序被用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"程序执行失败: {e}")
        sys.exit(1)
