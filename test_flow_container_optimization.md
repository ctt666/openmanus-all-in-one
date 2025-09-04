# Flow容器优化测试说明

## 优化概述

本次优化主要针对Flow模式下的容器管理，实现了保持历史容器并创建新容器的功能，让用户可以看到完整的执行过程，同时区分不同的执行阶段。

## 主要优化内容

### 1. 多容器管理支持
- **之前**：每次交互后都会清理之前的flow-display-container
- **现在**：保持历史容器，创建新的执行阶段容器
- **效果**：用户可以看到完整的执行历史，包括交互前后的所有步骤

### 2. 执行阶段区分
- **新增**：每个容器都有执行阶段标题（执行阶段 1、执行阶段 2等）
- **样式**：已完成的阶段使用绿色边框和透明度，新阶段使用蓝色边框
- **作用**：清晰区分不同的执行阶段，便于理解流程连续性

### 3. 智能容器管理
- **新流程**：创建新的FlowDisplayManager和第一个容器
- **继续流程**：创建新的执行阶段容器，保持历史容器
- **自动识别**：根据flow_id自动判断是新流程还是继续流程

## 技术实现

### 1. FlowDisplayManager增强
```javascript
class FlowDisplayManager {
    constructor() {
        this.containers = [];           // 存储所有容器
        this.currentContainer = null;   // 当前活跃容器
        this.executionPhase = 0;       // 执行阶段计数
    }

    // 创建新的执行阶段容器
    createNewExecutionPhase() { ... }

    // 只重置数据，不删除容器
    resetDataOnly() { ... }
}
```

### 2. 智能容器管理逻辑
```javascript
// 智能容器管理：新流程创建新管理器，继续流程创建新执行阶段
if (globalProcessedTaskId !== flowId) {
    // 全新流程：重置数据并创建第一个容器
    window.flowDisplayManager.resetDataOnly();
    const displayContainer = window.flowDisplayManager.initContainer();
    chatMessages.appendChild(displayContainer);
} else {
    // 继续现有流程：创建新的执行阶段容器
    const newContainer = window.flowDisplayManager.createNewExecutionPhase();
    // 重置数据，准备新的执行阶段
    window.flowDisplayManager.resetDataOnly();
    // 插入到聊天消息区域
    chatMessages.appendChild(newContainer);
}
```

### 3. CSS样式支持
```css
/* 已完成的执行阶段 */
.execution-completed {
    opacity: 0.8;
    border-left: 4px solid #28a745;  /* 绿色边框表示完成 */
}

/* 新的执行阶段 */
.execution-phase-new {
    border-left: 4px solid #007bff;  /* 蓝色边框表示新阶段 */
    border-top: 2px solid #e9ecef;
}
```

## 测试步骤

### 1. 启动应用
```bash
python main.py
```

### 2. 创建Flow任务
- 选择"Flow"模式
- 输入需要ask_human的任务，例如：
  ```
  创建一个详细的旅行计划，包含具体的时间安排和活动细节
  ```

### 3. 观察容器显示
- 第一个容器应该显示"执行阶段 1"
- 当遇到ask_human时，应该显示交互提示

### 4. 用户交互后
- 应该创建新的容器，显示"执行阶段 2 (继续)"
- 第一个容器应该被标记为已完成（绿色边框，透明度）
- 新容器应该显示蓝色边框和顶部分隔线

### 5. 验证功能
- 历史容器应该保持显示，不消失
- 新容器应该正确显示后续的执行内容
- 执行阶段应该清晰区分

## 预期效果

### 执行阶段1（交互前）
```
┌─────────────────────────────────────┐
│ 🎯 执行阶段 1                       │
├─────────────────────────────────────┤
│ 📋 执行计划                         │
│ 🔄 执行步骤                         │
│   ├── Step 1: [✓] 分析需求         │
│   └── Step 2: [→] 查询信息         │
└─────────────────────────────────────┘
```

### 执行阶段2（交互后）
```
┌─────────────────────────────────────┐
│ 🎯 执行阶段 2 (继续)                │
├─────────────────────────────────────┤
│ 📋 执行计划 (继续)                  │
│ 🔄 执行步骤 (继续)                  │
│   ├── Step 2: [✓] 查询信息         │
│   └── Step 3: [→] 制定方案         │
└─────────────────────────────────────┘
```

## 注意事项

1. **不影响Chat模式**：所有修改都只针对Flow模式，Chat模式完全不受影响
2. **保持向后兼容**：现有的Flow功能正常工作，只是增强了容器管理
3. **性能优化**：容器数量会随着执行阶段增加，但每个容器都是轻量级的

## 测试验证点

- [ ] 新流程创建第一个容器
- [ ] 交互后创建新执行阶段容器
- [ ] 历史容器保持显示且样式正确
- [ ] 执行阶段标题正确显示
- [ ] 容器样式区分清晰
- [ ] Chat模式不受影响
