# LLM测试程序调试指南

## 🚨 问题诊断

如果您的 `test_llm_ask.py` 程序阻塞或无法正常运行，请按照以下步骤进行调试：

## 🔍 第一步：检查配置文件

运行配置文件检查程序：

```bash
python check_config.py
```

这个程序会检查：
- 配置文件是否存在
- 配置格式是否正确
- 必需字段是否完整
- 配置值是否合理

## 🌐 第二步：测试网络连接

运行连接测试程序：

```bash
python test_llm_connection.py
```

这个程序会测试：
- HTTP连接到API端点
- OpenAI API兼容性
- 网络超时情况

## 🐛 第三步：运行调试测试

如果前两步都通过，运行调试版测试：

```bash
python test_llm_ask_debug.py
```

这个程序包含：
- 详细的日志输出
- 超时设置
- 错误堆栈跟踪
- 分步测试

## ❌ 常见问题及解决方案

### 1. 程序阻塞/无响应

**可能原因：**
- LLM服务未运行
- 网络连接超时
- API密钥无效
- 配置错误

**解决方案：**
```bash
# 检查配置文件
python check_config.py

# 测试连接
python test_llm_connection.py

# 检查本地服务状态
netstat -an | findstr :8080  # Windows
netstat -an | grep :8080     # Linux/Mac
```

### 2. 导入模块失败

**错误信息：**
```
ModuleNotFoundError: No module named 'app.llm'
```

**解决方案：**
```bash
# 确保在项目根目录运行
cd /path/to/openmanus-test

# 检查Python路径
python -c "import sys; print(sys.path)"

# 安装依赖
pip install -r requirements.txt
```

### 3. 配置文件错误

**错误信息：**
```
TOMLDecodeError: Invalid TOML
```

**解决方案：**
- 检查 `config/config.toml` 文件格式
- 确保使用正确的TOML语法
- 验证所有必需字段

### 4. 网络连接失败

**错误信息：**
```
ConnectionError: Cannot connect to host
```

**解决方案：**
- 检查API端点是否正确
- 验证网络连接
- 检查防火墙设置
- 确认LLM服务正在运行

### 5. 认证失败

**错误信息：**
```
AuthenticationError: Invalid API key
```

**解决方案：**
- 检查API密钥是否正确
- 验证API密钥是否有效
- 确认API密钥有足够权限

## 🔧 调试技巧

### 1. 启用详细日志

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### 2. 设置超时

```python
import asyncio

# 设置超时
response = await asyncio.wait_for(
    llm.ask(messages),
    timeout=30.0
)
```

### 3. 分步测试

```python
# 先测试连接
await test_connection()

# 再测试简单请求
await test_simple_request()

# 最后测试复杂功能
await test_complex_features()
```

### 4. 检查网络状态

```bash
# 测试端口是否开放
telnet 127.0.0.1 8080

# 检查HTTP响应
curl -v http://127.0.0.1:8080/v1
```

## 📋 调试检查清单

- [ ] 配置文件存在且格式正确
- [ ] 所有必需字段已设置
- [ ] API密钥有效
- [ ] 网络连接正常
- [ ] LLM服务正在运行
- [ ] 依赖模块已安装
- [ ] 在正确的目录中运行
- [ ] Python版本兼容（3.7+）

## 🚀 快速修复

如果问题仍然存在，尝试以下快速修复：

### 1. 使用远程API

修改 `config/config.toml`：
```toml
[llm]
base_url = "https://api.openai.com/v1"  # 使用OpenAI官方API
# 或者
base_url = "https://dashscope.aliyuncs.com/compatible-mode/v1"  # 使用阿里云
```

### 2. 简化测试

先运行最简单的测试：
```bash
python test_llm_ask_simple.py
```

### 3. 检查服务状态

如果使用本地服务：
```bash
# 启动本地LLM服务
# 具体命令取决于您使用的服务
```

## 📞 获取帮助

如果以上步骤都无法解决问题：

1. 检查项目日志文件
2. 查看错误堆栈跟踪
3. 确认LLM服务文档
4. 检查网络和系统配置

## 🔄 测试流程建议

1. **配置文件检查** → `python check_config.py`
2. **网络连接测试** → `python test_llm_connection.py`
3. **简单功能测试** → `python test_llm_ask_simple.py`
4. **完整功能测试** → `python test_llm_ask_debug.py`
5. **原始测试程序** → `python test_llm_ask.py`

按照这个顺序逐步测试，可以快速定位问题所在。


