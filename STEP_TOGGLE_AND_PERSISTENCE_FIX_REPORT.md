# 步骤折叠/展开和持久化修复报告

## 📋 问题概述

用户反馈了两个关键问题：

1. **步骤折叠/展开按钮点击无反应** - 无法查看步骤层级下的step事件内容
2. **刷新页面后步骤列表消失** - 在聊天信息中看不到原来的步骤列表

## 🔍 问题分析

### 问题1：步骤折叠/展开按钮点击无反应

**根本原因**：
- 在`createStepElement`函数中，HTML结构没有正确绑定点击事件
- `onclick`属性没有添加到步骤头部元素上

**原始代码问题**：
```javascript
stepDiv.innerHTML = `
    <div class="text-sm w-full clickable flex gap-2 justify-between group/header truncate text-[var(--text-primary)]" data-event-id="${step.id}">
        <!-- 没有onclick属性 -->
    </div>
`;
```

### 问题2：刷新页面后步骤列表消失

**根本原因**：
- 步骤数据没有持久化存储
- 页面刷新时`agentSteps`数组被重置为空
- 没有从localStorage恢复步骤数据

## ✅ 修复方案

### 1. 修复步骤折叠/展开按钮

**修复内容**：
```javascript
stepDiv.innerHTML = `
    <div class="text-sm w-full clickable flex gap-2 justify-between group/header truncate text-[var(--text-primary)]" data-event-id="${step.id}" onclick="${hasSubEvents ? `toggleStep(${step.id})` : ''}">
        <div class="flex flex-row gap-2 justify-center items-center truncate">
            <div class="w-4 h-4 flex-shrink-0 flex items-center justify-center border-[var(--border-dark)] rounded-[15px] bg-[var(--text-disable)] dark:bg-[var(--fill-tsp-white-dark)] border-0">
                ${statusIcon}
            </div>
            <div class="truncate font-medium" title="${stepContent}" aria-description="${stepContent}">${stepContent}</div>
            ${toggleButton}
        </div>
        <div class="float-right transition text-[12px] text-[var(--text-tertiary)] invisible group-hover/header:visible">星期一</div>
    </div>
    <div class="flex" id="subEvents_${step.id}" style="display: none;">
        <div class="w-[24px] relative">
            <div class="border-l border-dashed border-[var(--border-dark)] absolute start-[8px] top-0 bottom-0" style="height: calc(100% + 14px);"></div>
        </div>
        <div class="flex flex-col gap-3 flex-1 min-w-0 overflow-hidden pt-2 transition-[max-height,opacity] duration-150 ease-in-out max-h-0 opacity-0 step-sub-content">
            ${createSubEventsHTML(step.subEvents)}
        </div>
    </div>
`;
```

**关键改进**：
- 添加了`onclick="${hasSubEvents ? `toggleStep(${step.id})` : ''}"`属性
- 只有当步骤有子事件时才绑定点击事件

### 2. 增强toggleStep函数调试

**添加调试日志**：
```javascript
function toggleStep(stepId) {
    console.log('🔄 切换步骤展开/折叠:', stepId);

    const subEvents = document.getElementById(`subEvents_${stepId}`);
    const chevron = document.querySelector(`[data-step-id="${stepId}"] .step-chevron`);
    const subContent = document.querySelector(`[data-step-id="${stepId}"] .step-sub-content`);

    console.log('🔄 找到的元素:', { subEvents, chevron, subContent });

    if (subEvents && subContent) {
        const isCurrentlyHidden = subEvents.style.display === 'none';
        console.log('🔄 当前状态:', isCurrentlyHidden ? '折叠' : '展开');

        if (isCurrentlyHidden) {
            // 展开逻辑
            subEvents.style.display = 'flex';
            subContent.style.maxHeight = '1000px';
            subContent.style.opacity = '1';
            if (chevron) {
                chevron.style.transform = 'rotate(180deg)';
            }
            console.log('🔄 已展开步骤');
        } else {
            // 折叠逻辑
            subEvents.style.display = 'none';
            subContent.style.maxHeight = '0';
            subContent.style.opacity = '0';
            if (chevron) {
                chevron.style.transform = 'rotate(0deg)';
            }
            console.log('🔄 已折叠步骤');
        }
    } else {
        console.log('⚠️ 找不到必要的元素:', { subEvents, subContent });
    }
}
```

### 3. 实现步骤数据持久化

**扩展agentStepsManager**：
```javascript
let agentStepsManager = {
    // 添加新步骤
    addStep: function (stepContent, stepType = 'step') {
        const step = {
            id: Date.now() + Math.random(),
            content: stepContent,
            type: stepType,
            status: 'pending',
            subEvents: [],
            timestamp: Date.now()
        };
        agentSteps.push(step);
        this.saveSteps(); // 保存到localStorage
        return step;
    },

    // 更新步骤状态
    updateStepStatus: function (stepId, status) {
        const step = agentSteps.find(s => s.id === stepId);
        if (step) {
            step.status = status;
            this.saveSteps(); // 保存到localStorage
        }
    },

    // 添加子事件到当前步骤
    addSubEvent: function (stepId, eventType, content) {
        const step = agentSteps.find(s => s.id === stepId);
        if (step) {
            step.subEvents.push({
                type: eventType,
                content: content,
                timestamp: Date.now()
            });
            this.saveSteps(); // 保存到localStorage
        }
    },

    // 设置当前步骤
    setCurrentStep: function (index) {
        currentStepIndex = index;
        this.saveSteps(); // 保存到localStorage
    },

    // 清空步骤
    clearSteps: function () {
        agentSteps = [];
        currentStepIndex = -1;
        this.saveSteps(); // 保存到localStorage
    },

    // 保存步骤到localStorage
    saveSteps: function () {
        try {
            const key = `manusAgentSteps_${currentTaskId || 'default'}`;
            const stepsData = {
                steps: agentSteps,
                currentStepIndex: currentStepIndex,
                timestamp: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(stepsData));
            console.log('步骤数据已保存:', key);
        } catch (error) {
            console.error('保存步骤数据失败:', error);
        }
    },

    // 从localStorage加载步骤
    loadSteps: function (taskId) {
        try {
            const key = `manusAgentSteps_${taskId || 'default'}`;
            const stepsStr = localStorage.getItem(key);
            if (!stepsStr) return false;

            const stepsData = JSON.parse(stepsStr);

            // 检查数据是否过期（7天）
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
            if (Date.now() - stepsData.timestamp > maxAge) {
                localStorage.removeItem(key);
                return false;
            }

            agentSteps = stepsData.steps || [];
            currentStepIndex = stepsData.currentStepIndex || -1;
            console.log('步骤数据已加载:', key, agentSteps.length, '个步骤');
            return true;
        } catch (error) {
            console.error('加载步骤数据失败:', error);
            return false;
        }
    }
};
```

### 4. 在任务页面初始化时加载步骤数据

**修改initializeTaskPage函数**：
```javascript
// 如果有任务ID，加载聊天历史并连接到事件流
if (taskId && taskType) {
    loadChatHistoryForTask(taskId);
    connectToTaskEvents(taskId, taskType);

    // 加载步骤数据
    const stepsLoaded = agentStepsManager.loadSteps(taskId);
    if (stepsLoaded && agentSteps.length > 0) {
        console.log('步骤数据已加载，更新UI');
        updateAgentStepsUI();
    }
}
```

### 5. 在页面恢复时加载步骤数据

**修改checkAndRestoreTaskPage函数**：
```javascript
// 设置恢复标记，避免重复保存初始用户消息
sessionStorage.setItem('restoringFromHistory', 'true');
showTaskPage(restoreTaskText, restoreMode, restoreTaskId, restoreTaskType);
sessionStorage.removeItem('restoringFromHistory');

// 加载步骤数据
const stepsLoaded = agentStepsManager.loadSteps(restoreTaskId);
if (stepsLoaded && agentSteps.length > 0) {
    console.log('恢复任务时步骤数据已加载，更新UI');
    updateAgentStepsUI();
}
```

## 📊 修复效果

### 修复前的问题
1. **折叠/展开按钮无响应**：点击步骤头部没有反应，无法查看子事件
2. **步骤数据丢失**：刷新页面后步骤列表消失，需要重新执行任务才能看到步骤

### 修复后的改进
1. **折叠/展开功能正常**：
   - 点击步骤头部可以展开/折叠子事件
   - chevron图标正确旋转
   - 子事件内容正确显示/隐藏

2. **步骤数据持久化**：
   - 步骤数据自动保存到localStorage
   - 页面刷新后步骤列表自动恢复
   - 支持7天数据过期机制

3. **调试信息完善**：
   - 添加了详细的调试日志
   - 可以追踪折叠/展开操作
   - 可以监控步骤数据的保存和加载

## 🧪 测试验证

### 1. 折叠/展开功能测试
1. 创建包含子事件的步骤
2. 点击步骤头部
3. 验证子事件是否正确展开/折叠
4. 检查控制台调试日志

### 2. 持久化功能测试
1. 创建包含步骤的任务
2. 刷新页面
3. 验证步骤列表是否正确恢复
4. 检查localStorage中的数据

### 3. 数据过期测试
1. 修改localStorage中的时间戳为7天前
2. 刷新页面
3. 验证过期数据是否被清除

## 🔧 技术实现细节

### 1. 事件绑定机制
- 使用`onclick`属性绑定点击事件
- 只有当步骤有子事件时才绑定事件
- 传递正确的步骤ID参数

### 2. 数据持久化机制
- 使用localStorage存储步骤数据
- 每个任务使用独立的存储键
- 包含时间戳和数据过期检查

### 3. 数据恢复机制
- 在任务页面初始化时加载数据
- 在页面恢复时加载数据
- 自动更新UI显示

## 📁 文件修改清单

### 1. JavaScript文件
- **static/manus-main.js**
  - 修复了`createStepElement`函数的点击事件绑定
  - 增强了`toggleStep`函数的调试功能
  - 扩展了`agentStepsManager`的持久化功能
  - 修改了`initializeTaskPage`函数加载步骤数据
  - 修改了`checkAndRestoreTaskPage`函数恢复步骤数据

## ✅ 修复完成

通过以上修复，两个关键问题已经得到解决：

1. **步骤折叠/展开功能正常**：用户可以点击步骤头部查看子事件内容
2. **步骤数据持久化**：刷新页面后步骤列表会自动恢复，不会丢失

现在用户可以正常使用步骤的折叠/展开功能，并且刷新页面后步骤列表会保持显示状态！🎉
