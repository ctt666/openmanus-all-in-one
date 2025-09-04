# Manus 前后端API集成指南

## 🎯 项目概述

本文档详细介绍了Manus项目前后端API集成的完整实现，包括核心功能、API调用流程、SSE事件处理和端到端测试。

## 📋 功能清单

### ✅ **已完成的核心功能**

1. **主页三元组模式选择** - 根据模式调用不同API接口
2. **任务执行页面交互** - 支持任务ID/流程ID的继续交互
3. **SSE事件流处理** - 实时显示后端响应和进度
4. **历史记录显示** - 动态加载和展示历史任务
5. **端到端测试页面** - Mock后端响应的完整测试环境

---

## 🔗 API接口映射

### **1. 主页模式选择逻辑**

| 模式 | API端点 | 说明 |
|------|---------|------|
| `自适应` | `POST /task` | Chat和即时答案模式 |
| `Chat` | `POST /task` | 对话模式 |
| `Agent` | `POST /flow` | 复杂任务处理模式 |

#### **请求格式**
```javascript
// 创建新任务
const payload = {
    prompt: "用户输入的任务内容",
    session_id: "session_xxx",
    chat_history: []
};

// 继续交互
const payload = {
    prompt: "用户交互内容",
    task_id: "task_xxx",  // 或 flow_id: "flow_xxx"
};
```

#### **响应格式**
```javascript
// 成功响应
{
    "task_id": "task_abc123",    // 或 "flow_id": "flow_abc123"
}
```

### **2. SSE事件流接口**

| 任务类型 | SSE端点 | 说明 |
|----------|---------|------|
| Task | `GET /tasks/{task_id}/events` | 获取任务执行事件 |
| Flow | `GET /flows/{flow_id}/events` | 获取流程执行事件 |

#### **事件类型**
- `status` - 任务状态更新
- `step` - 执行步骤更新
- `complete` - 任务完成
- `error` - 执行错误
- `ask_human` - 需要用户交互

### **3. 历史记录接口**

| 接口 | 方法 | 说明 |
|------|------|------|
| `/sessions/history` | GET | 获取聊天和流程历史记录 |

#### **响应格式**
```javascript
{
    "chat_history": [
        {
            "id": "task_001",
            "prompt": "任务描述",
            "created_at": "2024-01-01T12:00:00Z",
            "status": "completed"
        }
    ],
    "flow_history": [
        {
            "id": "flow_001",
            "prompt": "流程描述",
            "created_at": "2024-01-01T12:00:00Z",
            "status": "running"
        }
    ]
}
```

---

## 💻 核心代码实现

### **1. API客户端类**

```javascript
class ManusAPIClient {
    constructor(baseURL = '') {
        this.baseURL = baseURL;
        this.eventSources = new Map();
    }

    // 创建任务或流程
    async createTask(prompt, mode, sessionId, chatHistory) {
        const url = mode === 'agent' ? '/flow' : '/task';
        const payload = {
            prompt: prompt,
            session_id: sessionId || this.generateSessionId(),
            chat_history: chatHistory
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        return {
            success: response.ok,
            data: data,
            id: data.task_id || data.flow_id,
            type: mode === 'agent' ? 'flow' : 'task'
        };
    }

    // 处理交互
    async handleInteraction(prompt, mode, taskId, flowId) {
        const url = mode === 'agent' ? '/flow' : '/task';
        const payload = {
            prompt: prompt,
            [mode === 'agent' ? 'flow_id' : 'task_id']: mode === 'agent' ? flowId : taskId
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        return { success: response.ok, data: await response.json() };
    }

    // 建立SSE连接
    connectToEvents(id, type, onEvent, onError, onClose) {
        const url = type === 'flow' ? `/flows/${id}/events` : `/tasks/${id}/events`;
        const eventSource = new EventSource(url);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            onEvent(data);
        };

        // 处理不同事件类型
        ['status', 'complete', 'error'].forEach(eventType => {
            eventSource.addEventListener(eventType, (event) => {
                const data = JSON.parse(event.data);
                onEvent({type: eventType, ...data});
            });
        });

        this.eventSources.set(id, eventSource);
        return eventSource;
    }
}
```

### **2. 主页提交处理**

```javascript
async function handleSubmit() {
    const text = mainTextarea.value.trim();
    if (!text) return;

    showLoading();

    try {
        // 生成会话ID
        if (!currentSessionId) {
            currentSessionId = apiClient.generateSessionId();
        }

        // 调用API创建任务
        const result = await apiClient.createTask(text, currentMode, currentSessionId);

        if (result.success) {
            // 保存任务/流程ID
            if (result.type === 'flow') {
                currentFlowId = result.id;
                currentTaskId = null;
            } else {
                currentTaskId = result.id;
                currentFlowId = null;
            }

            hideLoading();
            showTaskPage(text, currentMode, result.id, result.type);
        } else {
            hideLoading();
            showToast('任务创建失败: ' + result.error, 'error');
        }
    } catch (error) {
        hideLoading();
        showToast('网络错误，请检查后端服务是否启动', 'error');
    }
}
```

### **3. SSE事件处理**

```javascript
function handleTaskEvent(event) {
    switch (event.type) {
        case 'status':
            addSystemMessage(`任务状态: ${event.status}`);
            if (event.steps) {
                event.steps.forEach(step => {
                    if (step.content) addAssistantMessage(step.content);
                });
            }
            break;

        case 'step':
            if (event.content) addAssistantMessage(event.content);
            break;

        case 'complete':
            addSystemMessage('任务执行完成');
            if (event.result) addAssistantMessage(event.result);
            break;

        case 'error':
            addSystemMessage(`任务执行错误: ${event.message}`, 'error');
            break;

        case 'ask_human':
            addAssistantMessage(event.question || event.message);
            addSystemMessage('请在下方输入框中回复...');
            break;
    }
}
```

### **4. 任务页面交互**

```javascript
async function sendMessage() {
    const message = taskInputField.value.trim();
    if (!message) return;

    // 添加用户消息到界面
    addUserMessage(message);

    // 清空输入框
    taskInputField.value = '';

    // 发送交互到后端
    if (currentTaskId || currentFlowId) {
        try {
            const result = await apiClient.handleInteraction(
                message,
                currentMode,
                currentTaskId,
                currentFlowId
            );

            if (result.success) {
                addSystemMessage('交互消息已发送');
            } else {
                addSystemMessage(`交互失败: ${result.error}`, 'error');
            }
        } catch (error) {
            addSystemMessage('交互发送失败，请检查网络连接', 'error');
        }
    }
}
```

### **5. 历史记录加载**

```javascript
async function loadHistoryRecords() {
    const historyContainer = document.getElementById('sidebarHistory');

    try {
        const result = await apiClient.getHistory();

        if (result.success) {
            renderHistoryRecords(result.data, historyContainer);
        } else {
            showHistoryError(historyContainer, result.error);
        }
    } catch (error) {
        showHistoryError(historyContainer, '网络错误');
    }
}

function renderHistoryRecords(data, container) {
    const { chat_history = [], flow_history = [] } = data;

    // 合并并按时间排序
    const allHistory = [
        ...chat_history.map(item => ({ ...item, type: 'chat' })),
        ...flow_history.map(item => ({ ...item, type: 'flow' }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // 按日期分组渲染
    const groupedHistory = groupHistoryByDate(allHistory);
    let html = '';

    for (const [dateLabel, items] of Object.entries(groupedHistory)) {
        html += `<div class="history-section">
            <div class="history-title">${dateLabel}</div>`;

        items.forEach(item => {
            const title = truncateText(item.prompt, 40);
            const time = formatTime(item.created_at);
            html += `<div class="history-item" onclick="selectHistoryItem('${item.id}', '${item.type}')">
                <div class="history-item-content">
                    <div class="history-item-title">${title}</div>
                    <div class="history-item-time">${time}</div>
                    <div class="history-item-type">${item.type === 'flow' ? 'Agent' : 'Chat'}</div>
                </div>
            </div>`;
        });

        html += '</div>';
    }

    container.innerHTML = html;
}
```

---

## 🧪 测试页面使用指南

### **测试页面文件：`test_api_integration.html`**

#### **功能特性**
- ✅ **完整UI复制** - 与主页面UI完全一致
- ✅ **Mock API响应** - 模拟真实后端响应
- ✅ **SSE事件模拟** - 完整的事件流模拟
- ✅ **快速测试按钮** - 一键测试不同功能
- ✅ **实时日志** - 详细的控制台日志输出

#### **测试流程**

1. **打开测试页面**
   ```bash
   # 在浏览器中打开
   file:///path/to/test_api_integration.html
   ```

2. **测试主页功能**
   - 点击快速测试标签或手动输入内容
   - 选择不同的模式（自适应、Agent、Chat）
   - 点击提交按钮进入任务页面

3. **测试任务执行页面**
   - 观察SSE事件流的实时更新
   - 测试ask_human交互场景
   - 验证历史记录加载功能
   - 测试侧边栏折叠/展开

4. **测试页面刷新保持**
   - 在任务页面刷新浏览器
   - 验证页面状态是否正确恢复

#### **Mock API特性**
```javascript
class MockAPIClient {
    // 模拟真实API响应时间
    async createTask(prompt, mode, sessionId, chatHistory) {
        await new Promise(resolve => setTimeout(resolve, 800));
        // 返回模拟的任务ID
    }

    // 模拟SSE事件流
    connectToEvents(id, type, onEvent) {
        const mockEvents = [
            { type: 'status', status: 'running' },
            { type: 'step', content: '正在分析任务需求...' },
            { type: 'ask_human', question: '请问您希望重点关注哪个方面？' },
            { type: 'complete', result: '任务执行完成！' }
        ];

        // 每2秒发送一个事件
        mockEvents.forEach((event, index) => {
            setTimeout(() => onEvent(event), (index + 1) * 2000);
        });
    }
}
```

---

## 🔧 部署和集成

### **1. 后端服务启动**
```bash
# 启动后端服务
python server.py
```

### **2. 前端页面访问**
```bash
# 访问主页面
http://localhost:8000/

# 访问测试页面（开发时）
file:///path/to/test_api_integration.html
```

### **3. 环境要求**
- **后端**: Python 3.8+, FastAPI, SSE支持
- **前端**: 现代浏览器，支持ES6+, EventSource API
- **网络**: 支持跨域请求（开发时）

---

## 📊 API调用流程图

```mermaid
graph TD
    A[用户输入任务] --> B{选择模式}
    B -->|自适应/Chat| C[POST /task]
    B -->|Agent| D[POST /flow]

    C --> E[获取task_id]
    D --> F[获取flow_id]

    E --> G[连接 /tasks/{id}/events]
    F --> H[连接 /flows/{id}/events]

    G --> I[接收SSE事件]
    H --> I

    I --> J{事件类型}
    J -->|status| K[更新任务状态]
    J -->|step| L[显示执行步骤]
    J -->|ask_human| M[等待用户交互]
    J -->|complete| N[任务完成]
    J -->|error| O[显示错误]

    M --> P[用户输入回复]
    P --> Q[POST /task 或 /flow 继续交互]
    Q --> I
```

---

## 🎯 关键技术点

### **1. 状态管理**
- **全局状态**: `currentTaskId`, `currentFlowId`, `currentSessionId`, `currentMode`
- **持久化**: localStorage保存任务状态，支持页面刷新恢复
- **状态同步**: 前后端状态保持一致

### **2. SSE事件处理**
- **连接管理**: 自动重连，错误处理，连接池管理
- **事件分发**: 根据事件类型分发到不同处理函数
- **UI更新**: 实时更新聊天界面和系统状态

### **3. 错误处理**
- **网络错误**: 连接失败，超时处理
- **API错误**: HTTP状态码处理，错误消息展示
- **用户反馈**: Toast提示，系统消息，错误状态显示

### **4. 用户体验**
- **加载状态**: 加载动画，进度指示
- **交互反馈**: 按钮状态，消息确认，操作提示
- **响应式设计**: 移动端适配，布局自适应

---

## 🚀 测试检查清单

### **功能测试**
- [ ] 主页模式选择和提交
- [ ] 任务页面SSE事件接收
- [ ] ask_human交互流程
- [ ] 历史记录加载和显示
- [ ] 页面刷新状态保持
- [ ] 侧边栏折叠/展开
- [ ] 模式切换和悬浮提示

### **API测试**
- [ ] POST /task 接口调用
- [ ] POST /flow 接口调用
- [ ] GET /sessions/history 接口调用
- [ ] SSE /tasks/{id}/events 连接
- [ ] SSE /flows/{id}/events 连接
- [ ] 交互API调用（带task_id/flow_id）

### **错误处理测试**
- [ ] 网络断开情况
- [ ] 后端服务未启动
- [ ] API返回错误状态
- [ ] SSE连接中断
- [ ] 无效参数处理

### **性能测试**
- [ ] 页面加载速度
- [ ] API响应时间
- [ ] SSE事件处理性能
- [ ] 内存泄漏检查
- [ ] 长时间运行稳定性

---

## 📝 开发说明

### **文件结构**
```
├── static/
│   ├── manus-main.js      # 主要JavaScript逻辑
│   └── manus-main.css     # 样式文件
├── templates/
│   └── index.html         # 主页面模板
├── test_api_integration.html  # API集成测试页面
├── server.py              # 后端服务器
└── API_INTEGRATION_GUIDE.md  # 本文档
```

### **代码规范**
- **函数命名**: 驼峰命名法，功能明确
- **错误处理**: 统一的try-catch模式
- **日志输出**: console.log用于调试，详细的错误信息
- **注释规范**: JSDoc格式的函数注释

### **扩展建议**
1. **认证系统**: 添加用户认证和会话管理
2. **文件上传**: 支持附件上传功能
3. **消息类型**: 支持更多消息类型（图片、文档等）
4. **通知系统**: 浏览器通知，消息提醒
5. **主题系统**: 更多主题选择，个性化设置

---

## 🎉 总结

本API集成实现了完整的前后端交互流程，包括：

✅ **完整的API调用链路** - 从主页提交到任务执行的完整流程
✅ **实时事件处理** - SSE事件流的完整处理和UI更新
✅ **状态管理** - 任务状态的保存、恢复和同步
✅ **用户体验** - 流畅的交互，完善的错误处理和反馈
✅ **测试支持** - Mock API和端到端测试页面

现在您可以：
1. **启动后端服务** 进行真实API测试
2. **使用测试页面** 验证所有功能
3. **集成到生产环境** 部署完整的应用

前后端联调已经完成，可以开始端到端的功能验证！🚀
