# 后端终止取消机制实现详解

## 概述

后端的终止取消机制基于Python的`asyncio`协程系统实现，通过任务注册、取消传播和异常处理三个层面来确保agent执行过程能够被正确终止。

## 核心架构

### 1. 任务注册机制

```python
class TaskManager:
    def __init__(self):
        self.running_tasks = {}  # 存储正在运行的任务协程

    def register_running_task(self, task_id: str, task):
        """注册正在运行的任务协程"""
        self.running_tasks[task_id] = task

    async def terminate_task(self, task_id: str):
        """终止指定的任务"""
        if task_id in self.running_tasks:
            task = self.running_tasks[task_id]
            task.cancel()  # 取消协程
            del self.running_tasks[task_id]
```

**关键点：**
- 每个任务启动时，将协程对象注册到`TaskManager`
- 通过`task.cancel()`方法取消协程
- 取消后立即清理注册信息

### 2. 任务执行流程

```python
async def run_task(task_id: str, prompt: str, ...):
    try:
        # 注册当前任务协程
        task = asyncio.current_task()
        task_manager.register_running_task(task_id, task)

        # 执行agent
        result = await agent.run(full_prompt)

    except asyncio.CancelledError:
        # 处理取消异常
        await task_manager.update_task_step(task_id, 0, "Task was terminated by user", "terminated")
        await task_manager.fail_task(task_id, "Task terminated by user")
    finally:
        # 清理任务注册
        if task_id in task_manager.running_tasks:
            del task_manager.running_tasks[task_id]
```

**关键点：**
- 使用`asyncio.current_task()`获取当前协程对象
- 在`except asyncio.CancelledError`中处理取消事件
- 在`finally`块中确保清理工作

### 3. Agent层面的取消检查

```python
async def run(self, request: Optional[str] = None) -> str:
    while step < self.max_steps and self.state != AgentState.FINISHED:
        try:
            # 检查是否被取消
            try:
                asyncio.current_task().get_name()
            except asyncio.CancelledError:
                logger.info("Agent execution was cancelled")
                raise

            # 思考阶段
            should_continue, content = await self.think()

            # 行动阶段
            if self.tool_calls:
                result = await self.act()

        except asyncio.CancelledError:
            raise
```

**关键点：**
- 在每次循环开始时检查取消状态
- 在思考阶段和行动阶段之间检查取消状态
- 将取消异常向上传播

### 4. 工具执行层面的取消处理

```python
async def act(self) -> str:
    for command in self.tool_calls:
        try:
            result = await self.execute_tool(command)
        except asyncio.CancelledError:
            logger.info("Tool execution was cancelled")
            raise
```

**关键点：**
- 在每个工具执行时捕获取消异常
- 立即停止工具执行并向上传播取消异常

## 终止流程详解

### 1. 前端触发终止

```javascript
async function terminateCurrentTask() {
    if (currentEventSource) {
        const taskId = extractTaskIdFromEventSource(currentEventSource.url);
        await fetch(`/tasks/${taskId}/terminate`, { method: 'POST' });
        currentEventSource.close();
    }
}
```

### 2. 后端API处理

```python
@app.post("/tasks/{task_id}/terminate")
async def terminate_task(task_id: str):
    success = await task_manager.terminate_task(task_id)
    return {"status": "success", "message": "Task terminated successfully"}
```

### 3. TaskManager执行终止

```python
async def terminate_task(self, task_id: str):
    # 1. 取消协程
    if task_id in self.running_tasks:
        task = self.running_tasks[task_id]
        task.cancel()  # 触发CancelledError
        del self.running_tasks[task_id]

    # 2. 更新任务状态
    if task_id in self.tasks:
        task = self.tasks[task_id]
        task.status = "terminated"
        await self.queues[task_id].put({"type": "terminated", "message": "Task terminated by user"})

    # 3. 清理资源
    if task_id in self.interactions:
        del self.interactions[task_id]
    if task_id in self.ask_human_tools:
        del self.ask_human_tools[task_id]
```

### 4. 异常传播链

```
task.cancel()
    ↓
CancelledError 在 run_task() 中被捕获
    ↓
CancelledError 在 agent.run() 中被捕获
    ↓
CancelledError 在 toolcall.act() 中被捕获
    ↓
任务完全停止，状态更新为 "terminated"
```

## 特殊场景处理

### 1. ask_human交互期间的终止

```python
async def wait_for_response():
    while True:
        # 检查任务是否被取消
        if task_id not in task_manager.running_tasks:
            response_event.set()
            break
        if task_manager.interactions[task_id].get("responded"):
            response_event.set()
            break
        await asyncio.sleep(0.1)
```

**关键点：**
- 在等待用户响应时持续检查任务是否被取消
- 如果任务被取消，立即退出等待循环

### 2. 资源清理

```python
finally:
    # 清理任务注册
    if task_id in task_manager.running_tasks:
        del task_manager.running_tasks[task_id]

    # 清理日志处理器
    logger.remove(hwnd)

    # 清理agent资源
    await agent.cleanup()
```

**关键点：**
- 确保所有资源都被正确清理
- 防止内存泄漏和资源占用

## 技术优势

### 1. 响应速度快
- 基于协程取消机制，响应时间在毫秒级
- 不需要等待长时间操作完成

### 2. 资源安全
- 自动清理所有相关资源
- 防止内存泄漏和文件句柄占用

### 3. 状态一致性
- 确保任务状态正确更新
- 前端能够及时收到终止通知

### 4. 异常安全
- 多层异常处理确保系统稳定性
- 即使终止过程中出现异常也能正确处理

## 总结

后端的终止取消机制通过以下四个层面实现：

1. **任务管理层**：注册和取消协程任务
2. **执行流程层**：在关键节点检查取消状态
3. **Agent层**：在思考和执行循环中响应取消
4. **工具层**：在工具执行时处理取消异常

这种多层级的取消机制确保了无论agent执行到哪个阶段，都能够被及时、安全地终止，同时保证系统资源的正确清理和状态的一致性。
