#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
调试版LLM ask方法测试程序
"""

import asyncio
import logging
import os
import sys
import traceback
from typing import List

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 设置详细的日志
logging.basicConfig(
    level=logging.DEBUG, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

try:
    from app.llm import LLM
    from app.schema import Message, Role

    logger.info("✅ 成功导入所需模块")
except ImportError as e:
    logger.error(f"❌ 导入模块失败: {e}")
    logger.error(f"当前工作目录: {os.getcwd()}")
    logger.error(f"Python路径: {sys.path}")
    sys.exit(1)


class LLMAskTesterDebug:
    """LLM ask方法调试测试器"""

    def __init__(self, config_name: str = "default"):
        """初始化测试器"""
        try:
            logger.info("🔧 开始初始化LLM测试器...")
            logger.info(f"配置名称: {config_name}")

            # 检查配置文件
            config_path = "config/config.toml"
            if os.path.exists(config_path):
                logger.info(f"✅ 配置文件存在: {config_path}")
            else:
                logger.error(f"❌ 配置文件不存在: {config_path}")
                raise FileNotFoundError(f"配置文件不存在: {config_path}")

            # 尝试创建LLM实例
            logger.info("🔄 创建LLM实例...")
            self.llm = LLM(config_name=config_name)

            logger.info("✅ LLM实例创建成功")
            logger.info(f"   模型: {self.llm.model}")
            logger.info(f"   API类型: {self.llm.api_type}")
            logger.info(f"   最大token数: {self.llm.max_tokens}")
            logger.info(f"   温度: {self.llm.temperature}")
            logger.info(f"   API端点: {self.llm.base_url}")

        except Exception as e:
            logger.error(f"❌ LLM初始化失败: {e}")
            logger.error(f"错误详情: {traceback.format_exc()}")
            raise

    async def test_connection(self):
        """测试连接"""
        logger.info("=" * 50)
        logger.info("连接测试")
        logger.info("=" * 50)

        try:
            # 创建一个简单的测试消息
            messages = [Message.user_message("测试")]

            logger.info("🔄 尝试发送测试请求...")
            logger.info(f"请求消息: {messages}")

            # 设置超时
            response = await asyncio.wait_for(
                self.llm.ask(messages, stream=False), timeout=30.0
            )

            logger.info(f"✅ 连接测试成功，收到响应: {response}")
            return True

        except asyncio.TimeoutError:
            logger.error("❌ 连接测试超时（30秒）")
            return False
        except Exception as e:
            logger.error(f"❌ 连接测试失败: {e}")
            logger.error(f"错误详情: {traceback.format_exc()}")
            return False

    async def test_basic_ask(self):
        """测试基本的ask方法"""
        logger.info("=" * 50)
        logger.info("测试1: 基本ask方法")
        logger.info("=" * 50)

        try:
            messages = [Message.user_message("你好，请介绍一下你自己。")]

            logger.info(f"发送消息: {messages[0].content}")
            logger.info("🔄 等待响应...")

            # 设置超时
            response = await asyncio.wait_for(
                self.llm.ask(messages, stream=False), timeout=60.0
            )

            logger.info(f"✅ 收到响应: {response}")
            return True

        except asyncio.TimeoutError:
            logger.error("❌ 基本ask测试超时（60秒）")
            return False
        except Exception as e:
            logger.error(f"❌ 基本ask测试失败: {e}")
            logger.error(f"错误详情: {traceback.format_exc()}")
            return False

    async def test_ask_with_system_message(self):
        """测试带系统消息的ask方法"""
        logger.info("=" * 50)
        logger.info("测试2: 带系统消息的ask方法")
        logger.info("=" * 50)

        try:
            system_msgs = [
                Message.system_message("你是一个专业的Python编程助手，请用中文回答。")
            ]

            messages = [Message.user_message("请解释一下Python中的装饰器是什么？")]

            logger.info(f"系统消息: {system_msgs[0].content}")
            logger.info(f"用户消息: {messages[0].content}")

            response = await asyncio.wait_for(
                self.llm.ask(messages, system_msgs=system_msgs, stream=False),
                timeout=60.0,
            )

            logger.info(f"✅ 收到响应: {response}")
            return True

        except asyncio.TimeoutError:
            logger.error("❌ 带系统消息的ask测试超时（60秒）")
            return False
        except Exception as e:
            logger.error(f"❌ 带系统消息的ask测试失败: {e}")
            logger.error(f"错误详情: {traceback.format_exc()}")
            return False

    async def test_ask_streaming(self):
        """测试流式ask方法"""
        logger.info("=" * 50)
        logger.info("测试3: 流式ask方法")
        logger.info("=" * 50)

        try:
            messages = [Message.user_message("请写一首关于春天的短诗。")]

            logger.info(f"发送消息: {messages[0].content}")
            logger.info("开始流式响应:")

            response = await asyncio.wait_for(
                self.llm.ask(messages, stream=True), timeout=60.0
            )

            logger.info(f"✅ 流式响应完成: {response}")
            return True

        except asyncio.TimeoutError:
            logger.error("❌ 流式ask测试超时（60秒）")
            return False
        except Exception as e:
            logger.error(f"❌ 流式ask测试失败: {e}")
            logger.error(f"错误详情: {traceback.format_exc()}")
            return False

    async def run_all_tests(self):
        """运行所有测试"""
        logger.info("开始运行LLM ask方法调试测试套件")
        logger.info("=" * 80)

        test_methods = [
            self.test_connection,
            self.test_basic_ask,
            self.test_ask_with_system_message,
            self.test_ask_streaming,
        ]

        results = []
        for test_method in test_methods:
            try:
                logger.info(f"\n🔄 开始执行测试: {test_method.__name__}")
                result = await test_method()
                results.append((test_method.__name__, result))
                logger.info(
                    f"测试 {test_method.__name__} 完成，结果: {'通过' if result else '失败'}"
                )
            except Exception as e:
                logger.error(f"❌ 测试 {test_method.__name__} 执行异常: {e}")
                logger.error(f"错误详情: {traceback.format_exc()}")
                results.append((test_method.__name__, False))

        # 输出测试结果摘要
        logger.info("\n" + "=" * 80)
        logger.info("测试结果摘要")
        logger.info("=" * 80)

        passed = 0
        total = len(results)

        for test_name, result in results:
            status = "通过" if result else "失败"
            logger.info(f"{test_name}: {status}")
            if result:
                passed += 1

        logger.info(f"\n总计: {passed}/{total} 个测试通过")

        if passed == total:
            logger.info("🎉 所有测试都通过了！")
        else:
            logger.warning(f"⚠️  有 {total - passed} 个测试失败")

        return passed == total


async def main():
    """主函数"""
    try:
        logger.info("🚀 启动LLM ask方法调试测试程序")

        # 创建测试器实例
        tester = LLMAskTesterDebug()

        # 运行所有测试
        success = await tester.run_all_tests()

        if success:
            print("\n✅ 所有测试完成！")
            return 0
        else:
            print("\n❌ 部分测试失败！")
            return 1

    except Exception as e:
        logger.error(f"❌ 测试执行过程中发生错误: {e}")
        logger.error(f"错误详情: {traceback.format_exc()}")
        return 1


if __name__ == "__main__":
    try:
        # 运行测试
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        logger.info("程序被用户中断")
        sys.exit(1)
    except Exception as e:
        logger.error(f"程序执行失败: {e}")
        logger.error(f"错误详情: {traceback.format_exc()}")
        sys.exit(1)
