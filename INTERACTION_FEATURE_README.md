# Ask Human 交互功能说明

## 概述

本项目已经成功改造了前端展示交互，实现了后端 `ask_human` 工具的交互提示词展示，并更新了 "send to manus" 逻辑，在任务为完成时能够发送内容作为交互回答。

## 主要功能

### 1. 前端交互提示区域

- **位置**: 聊天消息区域下方，固定定位
- **样式**: 现代化的卡片设计，支持深色/浅色主题
- **响应式**: 支持移动端和桌面端显示

### 2. Ask Human 工具检测

前端能够自动检测以下情况并显示交互提示：

- `ask_human` 工具的执行
- `INTERACTION_REQUIRED:` 标记
- `waiting` 状态中的用户交互请求

### 3. 用户交互流程

1. **检测到交互需求**: 前端自动显示交互提示区域
2. **用户输入回答**: 在文本框中输入回答内容
3. **提交回答**: 点击提交按钮或使用 Ctrl+Enter 快捷键
4. **发送到后端**: 自动发送到 `/tasks/{task_id}/interact` 端点
5. **继续任务**: 后端接收回答后继续执行任务

### 4. 后端支持

- **新的API端点**: `POST /tasks/{task_id}/interact`
- **任务管理器增强**: 支持交互状态管理
- **Ask Human工具改造**: 返回特殊标记而不是阻塞式输入

## 技术实现

### 前端 (JavaScript)

```javascript
// 检测ask_human工具使用
if (type === 'tool' && data.result && data.result.includes('ask_human')) {
    const inquireMatch = data.result.match(/inquire["\s]*:["\s]*([^,\n}]+)/);
    if (inquireMatch) {
        const inquire = inquireMatch[1].replace(/["']/g, '').trim();
        showInteractionPrompt(inquire, taskId);
        return;
    }
}

// 检测INTERACTION_REQUIRED标记
if (type === 'act' && data.result && data.result.includes('INTERACTION_REQUIRED:')) {
    const inquire = data.result.replace('INTERACTION_REQUIRED:', '').trim();
    showInteractionPrompt(inquire, taskId);
    return;
}
```

### 后端 (Python)

```python
# Ask Human 工具
async def execute(self, inquire: str) -> str:
    return f"INTERACTION_REQUIRED: {inquire}"

# 交互处理端点
@app.post("/tasks/{task_id}/interact")
async def handle_task_interaction(task_id: str, request_data: dict = Body(...)):
    user_response = request_data.get("response", "")
    success = await task_manager.handle_interaction(task_id, user_response)
    return {"status": "success", "message": "Interaction response received"}
```

## 使用方法

### 1. 启动应用

```bash
python app_demo.py
```

### 2. 使用Ask Human工具

在聊天中输入需要使用 `ask_human` 工具的问题，例如：

```
"请帮我分析这个数据，如果遇到不清楚的地方请询问我"
```

### 3. 交互提示

当系统需要使用 `ask_human` 工具时，前端会自动显示交互提示区域，包含：

- 问题内容
- 输入框
- 提交按钮

### 4. 提交回答

用户输入回答后，点击提交按钮或使用 Ctrl+Enter 快捷键提交。

## 样式特性

### CSS 样式

- **动画效果**: 滑入动画 (`slideUp`)
- **主题支持**: 自动适应深色/浅色主题
- **响应式设计**: 移动端友好的布局
- **现代化UI**: Bootstrap 5 风格的设计

### 响应式断点

- **桌面端**: 最大宽度 600px
- **移动端**: 宽度 95%，底部间距调整

## 注意事项

1. **交互状态**: 每个任务只能有一个活跃的交互提示
2. **任务完成**: 如果任务完成时仍有待处理的交互，系统会记录日志
3. **错误处理**: 网络错误或提交失败时会显示相应的错误提示
4. **会话管理**: 交互状态与会话ID关联，支持多会话

## 未来改进

1. **超时处理**: 添加交互超时机制
2. **多轮对话**: 支持连续的多轮交互
3. **富文本输入**: 支持更丰富的输入格式
4. **历史记录**: 保存交互历史供后续参考

## 总结

通过这次改造，Open Manus 现在具备了完整的用户交互能力，能够：

- 在需要用户输入时自动暂停并显示提示
- 提供友好的用户界面进行交互
- 无缝集成到现有的任务执行流程中
- 支持多会话和状态管理

这大大提升了系统的可用性和用户体验，使其能够处理需要人类判断和输入的复杂任务。
