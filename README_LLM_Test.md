# LLM Ask方法测试程序

本目录包含了用于测试 `app/llm.py` 中 `ask` 方法的Python程序。

## 文件说明

### 1. `test_llm_ask.py` - 完整测试套件
这是一个全面的测试程序，包含以下测试场景：

- **基本ask方法测试**: 测试简单的用户消息
- **带系统消息的ask方法**: 测试系统消息和用户消息的组合
- **带对话历史的ask方法**: 测试多轮对话
- **流式ask方法**: 测试流式响应功能
- **字典格式消息**: 测试使用字典格式的消息
- **不同温度设置**: 测试不同temperature参数的效果
- **Token计数功能**: 测试token统计功能
- **错误处理**: 测试各种异常情况的处理

### 2. `test_llm_ask_simple.py` - 简化测试程序
这是一个快速测试程序，包含基本的测试场景：

- LLM实例初始化
- 基本对话测试
- 带系统消息的对话测试
- 流式响应测试

## 使用方法

### 前置条件
1. 确保已安装项目依赖：`pip install -r requirements.txt`
2. 确保配置文件 `config/config.toml` 已正确设置
3. 确保LLM服务可用（本地或远程）

### 运行完整测试套件
```bash
python test_llm_ask.py
```

### 运行简化测试
```bash
python test_llm_ask_simple.py
```

## 配置要求

在 `config/config.toml` 中需要配置LLM相关参数：

```toml
[llm]
model = "your-model-name"
base_url = "your-api-endpoint"
api_key = "your-api-key"
max_tokens = 8192
temperature = 0.6
```

## 测试输出示例

### 成功运行示例
```
🚀 开始测试LLM ask方法...
✅ LLM初始化成功
   模型: Qwen3-Coder-30B-A3B-Instruct
   API类型: openai
   最大token数: 8192

📝 测试基本对话...
✅ 收到响应: 你好！我是一个AI助手，很高兴为您服务。

🔧 测试带系统消息的对话...
✅ 收到响应: Python装饰器是一种设计模式，它允许我们在不修改原函数的情况下...

🌊 测试流式响应...
✅ 流式响应完成: def hello_world():
    print("Hello, World!")

🎉 所有测试完成！
```

### 错误处理示例
```
❌ 测试失败: Authentication failed. Check API key.
```

## 注意事项

1. **API密钥安全**: 不要在代码中硬编码API密钥，使用配置文件
2. **网络连接**: 确保能够访问配置的LLM服务
3. **Token限制**: 注意模型的token限制，避免超出限制
4. **异步执行**: 所有测试都是异步的，使用 `asyncio.run()` 运行

## 故障排除

### 常见问题

1. **导入错误**: 确保项目路径正确添加到Python路径
2. **配置错误**: 检查 `config.toml` 文件格式和内容
3. **网络错误**: 检查API端点是否可访问
4. **认证错误**: 验证API密钥是否正确

### 调试建议

1. 设置更详细的日志级别
2. 检查网络连接和防火墙设置
3. 验证LLM服务的状态
4. 查看错误日志获取更多信息

## 扩展测试

可以根据需要添加更多测试场景：

- 测试不同的模型配置
- 测试token限制边界情况
- 测试并发请求处理
- 测试长时间对话的稳定性
- 测试多模态输入（如果支持）

## 贡献

欢迎提交测试用例的改进和扩展！


