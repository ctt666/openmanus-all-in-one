# LLM测试项目结构

```
openmanus-test/
├── app/
│   ├── llm.py                    # 要测试的LLM模块
│   ├── schema.py                 # 消息模式定义
│   └── ...
├── config/
│   └── config.toml              # LLM配置文件
├── test_llm_ask.py              # 完整测试套件
├── test_llm_ask_simple.py       # 简化测试程序
├── run_tests.py                  # Python测试运行器
├── run_tests.bat                 # Windows批处理文件
├── run_tests.sh                  # Linux/Mac shell脚本
├── README_LLM_Test.md            # 详细使用说明
└── TEST_STRUCTURE.md             # 本文件
```

## 文件功能说明

### 核心测试文件
- **`test_llm_ask.py`**: 完整的测试套件，包含8个测试场景
- **`test_llm_ask_simple.py`**: 快速测试程序，包含3个基本测试

### 运行脚本
- **`run_tests.py`**: 跨平台Python测试运行器（推荐）
- **`run_tests.bat`**: Windows专用批处理文件
- **`run_tests.sh`**: Linux/Mac专用shell脚本

### 文档
- **`README_LLM_Test.md`**: 详细的使用说明和故障排除指南
- **`TEST_STRUCTURE.md`**: 项目结构说明（本文件）

## 快速开始

### 方法1: 使用Python运行器（推荐）
```bash
python run_tests.py
```

### 方法2: 直接运行测试
```bash
# 完整测试套件
python test_llm_ask.py

# 简化测试
python test_llm_ask_simple.py
```

### 方法3: 使用批处理文件（Windows）
```cmd
run_tests.bat
```

### 方法4: 使用shell脚本（Linux/Mac）
```bash
./run_tests.sh
```

## 测试覆盖范围

### 完整测试套件 (`test_llm_ask.py`)
1. ✅ 基本ask方法测试
2. ✅ 带系统消息的ask方法测试
3. ✅ 带对话历史的ask方法测试
4. ✅ 流式ask方法测试
5. ✅ 字典格式消息测试
6. ✅ 不同温度设置测试
7. ✅ Token计数功能测试
8. ✅ 错误处理测试

### 简化测试 (`test_llm_ask_simple.py`)
1. ✅ LLM实例初始化测试
2. ✅ 基本对话测试
3. ✅ 带系统消息的对话测试
4. ✅ 流式响应测试

## 配置要求

确保 `config/config.toml` 包含正确的LLM配置：

```toml
[llm]
model = "your-model-name"
base_url = "your-api-endpoint"
api_key = "your-api-key"
max_tokens = 8192
temperature = 0.6
```

## 依赖要求

- Python 3.7+
- 项目依赖包（见 `requirements.txt`）
- 可用的LLM服务

## 注意事项

- 所有测试都是异步的
- 需要网络连接访问LLM服务
- 测试会消耗API配额
- 建议在测试环境中运行


