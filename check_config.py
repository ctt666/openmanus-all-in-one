#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
配置文件检查程序
"""

import os
import sys

import toml


def check_config():
    """检查配置文件"""
    print("🔍 开始检查配置文件...")

    # 检查配置文件是否存在
    config_path = "config/config.toml"
    if not os.path.exists(config_path):
        print(f"❌ 配置文件不存在: {config_path}")
        return False

    print(f"✅ 配置文件存在: {config_path}")

    try:
        # 读取配置文件
        with open(config_path, "r", encoding="utf-8") as f:
            config_data = toml.load(f)

        print("✅ 配置文件格式正确（TOML格式）")

        # 检查LLM配置
        if "llm" not in config_data:
            print("❌ 缺少 [llm] 配置节")
            return False

        llm_config = config_data["llm"]
        print("✅ 找到 [llm] 配置节")

        # 检查必需字段
        required_fields = ["model", "base_url", "api_key", "max_tokens", "temperature"]
        missing_fields = []

        for field in required_fields:
            if field not in llm_config:
                missing_fields.append(field)
            else:
                value = llm_config[field]
                if field == "api_key":
                    # 隐藏API密钥的敏感信息
                    display_value = f"{str(value)[:10]}..." if value else "未设置"
                else:
                    display_value = value
                print(f"  {field}: {display_value}")

        if missing_fields:
            print(f"❌ 缺少必需字段: {missing_fields}")
            return False

        # 检查配置值
        print("\n🔧 配置值检查:")

        # 检查API端点
        base_url = llm_config["base_url"]
        if base_url.startswith("http://127.0.0.1") or base_url.startswith(
            "http://localhost"
        ):
            print(f"⚠️  API端点是本地地址: {base_url}")
            print("   请确保本地LLM服务正在运行")
        elif base_url.startswith("https://"):
            print(f"✅ API端点是HTTPS地址: {base_url}")
        else:
            print(f"⚠️  API端点格式: {base_url}")

        # 检查API密钥
        api_key = llm_config["api_key"]
        if not api_key or api_key == "YOUR_API_KEY":
            print("❌ API密钥未设置或使用默认值")
            return False
        else:
            print("✅ API密钥已设置")

        # 检查模型名称
        model = llm_config["model"]
        print(f"✅ 模型名称: {model}")

        # 检查其他配置
        max_tokens = llm_config["max_tokens"]
        if max_tokens <= 0:
            print(f"❌ max_tokens值无效: {max_tokens}")
            return False
        else:
            print(f"✅ max_tokens: {max_tokens}")

        temperature = llm_config["temperature"]
        if not (0 <= temperature <= 2):
            print(f"⚠️  temperature值可能无效: {temperature} (建议范围: 0-2)")
        else:
            print(f"✅ temperature: {temperature}")

        # 检查可选配置
        print("\n🔍 可选配置检查:")

        if "llm.vision" in config_data:
            print("✅ 找到 [llm.vision] 配置节")
        else:
            print("ℹ️  未找到 [llm.vision] 配置节（可选）")

        if "llm.coder" in config_data:
            print("✅ 找到 [llm.coder] 配置节")
        else:
            print("ℹ️  未找到 [llm.coder] 配置节（可选）")

        return True

    except toml.TomlDecodeError as e:
        print(f"❌ TOML格式错误: {e}")
        return False
    except Exception as e:
        print(f"❌ 读取配置文件失败: {e}")
        return False


def check_dependencies():
    """检查依赖"""
    print("\n📦 检查依赖...")

    required_modules = ["openai", "tiktoken", "tenacity", "aiohttp"]

    missing_modules = []

    for module in required_modules:
        try:
            __import__(module)
            print(f"✅ {module}")
        except ImportError:
            print(f"❌ {module}")
            missing_modules.append(module)

    if missing_modules:
        print(f"\n⚠️  缺少模块: {missing_modules}")
        print("请运行: pip install " + " ".join(missing_modules))
        return False

    print("✅ 所有必需模块都已安装")
    return True


def main():
    """主函数"""
    print("=" * 50)
    print("配置文件检查程序")
    print("=" * 50)

    try:
        # 检查配置文件
        config_ok = check_config()

        # 检查依赖
        deps_ok = check_dependencies()

        print("\n" + "=" * 50)
        print("检查结果摘要")
        print("=" * 50)

        if config_ok and deps_ok:
            print("🎉 所有检查都通过！")
            print("\n💡 下一步:")
            print("1. 确保LLM服务正在运行")
            print("2. 运行连接测试: python test_llm_connection.py")
            print("3. 运行调试测试: python test_llm_ask_debug.py")
            return 0
        else:
            print("❌ 部分检查失败！")
            if not config_ok:
                print("- 配置文件有问题，请修复")
            if not deps_ok:
                print("- 缺少依赖模块，请安装")
            return 1

    except Exception as e:
        print(f"\n❌ 检查过程中发生错误: {e}")
        return 1


if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n程序被用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"程序执行失败: {e}")
        sys.exit(1)


