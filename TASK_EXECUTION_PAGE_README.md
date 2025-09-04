# 任务执行页面重新设计

## 🎯 设计目标

根据用户提供的截图，完全重新设计任务执行页面，实现与Manus官网完全一致的布局和交互体验。

## 📐 页面布局

### **整体结构**
- **左侧导航栏**: 占据页面4/5宽度（80%）
- **右侧交互页面**: 占据页面1/5宽度（20%）
- **响应式设计**: 移动端自适应布局

### **左侧导航栏 (4/5宽度)**

#### **1. 顶部控制区域**
```html
<div class="sidebar-header">
    <button class="sidebar-control-btn" onclick="toggleSidebar()" title="取消停靠">
        <i class="bi bi-layout-sidebar-inset-reverse"></i>
    </button>
    <button class="sidebar-control-btn" onclick="searchHistory()" title="搜索">
        <i class="bi bi-search"></i>
    </button>
</div>
```
- ✅ **取消停靠按钮**: 点击收缩左侧导航栏，页面自适应填充
- ✅ **搜索按钮**: 搜索历史对话（功能预留）

#### **2. 新建任务按钮**
```html
<div class="sidebar-new-task">
    <button class="new-task-btn" onclick="createNewTask()">
        <i class="bi bi-plus-circle me-2"></i>
        新建任务
    </button>
</div>
```
- ✅ **全宽按钮**: 填充左侧宽度区域
- ✅ **样式参考**: 根据用户截图设计
- ✅ **功能**: 点击返回主页面创建新任务

#### **3. 历史对话列表**
```html
<div class="sidebar-history">
    <div class="history-section">
        <div class="history-title">今天</div>
        <div class="history-item active">...</div>
    </div>
    <div class="history-section">
        <div class="history-title">昨天</div>
        <div class="history-item">...</div>
    </div>
</div>
```
- ✅ **分组显示**: 按日期分组（今天、昨天等）
- ✅ **任务列表**: 展示历史对话过程的任务
- ✅ **API集成**: 预留接口`@app.get("/sessions/{session_id}/history")`
- ✅ **激活状态**: 当前任务高亮显示

### **右侧交互页面 (1/5宽度)**

#### **1. 顶部导航栏**
```html
<div class="task-content-header">
    <div class="task-title">
        <h3>任务名称</h3>
    </div>
    <div class="task-actions">
        <button class="task-action-btn" title="分享">
            <i class="bi bi-share"></i>
        </button>
        <button class="task-action-btn" title="收藏">
            <i class="bi bi-heart"></i>
        </button>
        <button class="task-action-btn" title="详情">
            <i class="bi bi-three-dots"></i>
        </button>
    </div>
</div>
```
- ✅ **任务名称**: 左侧显示当前任务标题
- ✅ **操作按钮**: 右侧显示分享、收藏、详情按钮

#### **2. 聊天对话区域**
```html
<div class="task-chat-container">
    <div class="chat-message user-message">
        <div class="message-avatar">
            <i class="bi bi-person-circle"></i>
        </div>
        <div class="message-content">
            <div class="message-text">用户消息</div>
            <div class="message-time">时间戳</div>
        </div>
    </div>

    <div class="chat-message assistant-message">
        <div class="message-avatar">
            <img src="assets/logo.jpg" alt="Manus" class="assistant-avatar">
        </div>
        <div class="message-content">
            <div class="message-text">助手回复</div>
            <div class="message-time">时间戳</div>
        </div>
    </div>
</div>
```
- ✅ **滚动区域**: 中间聊天对话部分可滚动
- ✅ **用户消息**: 右对齐，深色背景
- ✅ **助手消息**: 左对齐，浅色背景，带logo头像
- ✅ **打字指示器**: 助手回复时的动画效果
- ✅ **自动滚动**: 新消息自动滚动到底部

#### **3. 底部输入框**
```html
<div class="task-input-container">
    <div class="input-field-container">
        <textarea class="task-input-field" placeholder="发送消息 Manus"></textarea>
        <div class="input-actions">
            <button class="input-action-btn" title="附件">
                <i class="bi bi-paperclip"></i>
            </button>
            <button class="input-action-btn" title="语音">
                <i class="bi bi-mic"></i>
            </button>
            <button class="input-submit-btn" onclick="sendMessage()" title="发送">
                <i class="bi bi-arrow-up"></i>
            </button>
        </div>
    </div>
</div>
```
- ✅ **固定位置**: 底部固定，不随滚动移动
- ✅ **主页样式**: 复用主页面聊天框样式
- ✅ **自动调整**: 输入框高度自动调整
- ✅ **快捷键**: Enter发送，Shift+Enter换行

## ⚡ 交互功能

### **导航栏折叠**
```javascript
function toggleSidebar() {
    const sidebar = document.getElementById('taskSidebar');
    const mainContent = document.getElementById('taskMainContent');

    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
}
```
- ✅ **收缩动画**: 0.3s平滑过渡动画
- ✅ **页面自适应**: 右侧页面自动填充剩余空间
- ✅ **响应式**: 移动端优化

### **消息发送**
```javascript
function sendMessage() {
    // 添加用户消息到聊天容器
    // 清空输入框
    // 滚动到底部
    // 模拟助手回复
}
```
- ✅ **实时更新**: 消息立即显示在聊天区域
- ✅ **输入验证**: 空消息不发送
- ✅ **自动清空**: 发送后清空输入框
- ✅ **模拟回复**: 1秒后显示助手回复

### **历史对话加载**
```javascript
async function loadHistoryFromAPI() {
    // 调用后端API: /sessions/{session_id}/history
    // 渲染历史对话列表
    // 处理错误情况
}
```
- ✅ **API集成**: 预留后端接口调用
- ✅ **数据渲染**: 动态生成历史列表
- ✅ **错误处理**: 网络错误的优雅处理

## 🎨 视觉设计

### **色彩系统**
- **主背景**: `var(--background-primary)` - 主要背景色
- **次背景**: `var(--background-secondary)` - 侧边栏背景
- **边框**: `var(--border-main)` - 统一边框颜色
- **文字**: `var(--text-primary)` - 主要文字颜色
- **次要文字**: `var(--text-secondary)` - 次要文字颜色

### **布局规范**
- **边距**: 统一使用16px、20px、24px
- **圆角**: 8px（按钮）、12px（卡片）、16px（输入框）
- **阴影**: 多层阴影营造立体感
- **过渡**: 0.2s-0.3s平滑动画

### **响应式断点**
```css
@media (max-width: 768px) {
    .task-sidebar {
        width: 100%;
        position: absolute;
        z-index: 1000;
    }

    .task-main-content {
        width: 100%;
    }
}
```

## 🔧 技术实现

### **HTML结构**
```html
<div class="task-page-layout">
    <div class="task-sidebar" id="taskSidebar">
        <!-- 左侧导航栏内容 -->
    </div>
    <div class="task-main-content" id="taskMainContent">
        <!-- 右侧交互页面内容 -->
    </div>
</div>
```

### **CSS布局**
```css
.task-page-layout {
    display: flex;
    height: 100vh;
    width: 100%;
}

.task-sidebar {
    width: 80%;
    transition: width 0.3s ease, margin-left 0.3s ease;
}

.task-main-content {
    width: 20%;
    transition: width 0.3s ease;
}
```

### **JavaScript控制**
```javascript
class TaskPage {
    constructor() {
        this.initializeTaskPage();
        this.setupEventListeners();
    }

    initializeTaskPage() {
        // 初始化输入框
        // 设置事件监听
        // 模拟助手回复
    }
}
```

## 📁 文件结构

### **更新的文件**
1. **`static/manus-main.js`**
   - ✅ `generateTaskPageContent()` - 重新设计页面HTML结构
   - ✅ `initializeTaskPage()` - 初始化任务页面功能
   - ✅ `toggleSidebar()` - 侧边栏折叠功能
   - ✅ `sendMessage()` - 消息发送功能
   - ✅ `loadHistoryFromAPI()` - 历史对话API集成

2. **`static/manus-main.css`**
   - ✅ 添加完整的任务页面样式系统
   - ✅ 响应式设计适配
   - ✅ 深色主题兼容
   - ✅ 动画和过渡效果

3. **`test_manus_ui.html`**
   - ✅ 同步更新测试页面
   - ✅ 确保任务页面初始隐藏

## 🧪 测试方法

### **功能测试**
1. **打开** `test_manus_ui.html`
2. **输入任务** 并提交，进入任务执行页面
3. **测试布局**: 验证4/5和1/5的比例分配
4. **测试折叠**: 点击"取消停靠"按钮
5. **测试消息**: 在底部输入框发送消息
6. **测试响应式**: 调整浏览器窗口大小

### **视觉验证**
- ✅ **布局比例**: 左侧80%，右侧20%
- ✅ **样式一致**: 与用户截图保持一致
- ✅ **动画流畅**: 折叠和消息动画
- ✅ **主题兼容**: 明暗主题切换

### **交互验证**
- ✅ **侧边栏折叠**: 平滑收缩和展开
- ✅ **消息发送**: 实时显示和回复
- ✅ **滚动行为**: 自动滚动到最新消息
- ✅ **输入体验**: 自动调整高度，快捷键支持

## 🚀 下一步计划

### **API集成**
- 🔄 **历史对话**: 集成`/sessions/{session_id}/history`接口
- 🔄 **消息发送**: 连接后端消息处理
- 🔄 **实时更新**: WebSocket或SSE实时通信

### **功能增强**
- 🔄 **搜索功能**: 历史对话搜索
- 🔄 **文件上传**: 附件功能实现
- 🔄 **语音输入**: 语音转文字功能
- 🔄 **消息操作**: 复制、删除、编辑消息

这个新的任务执行页面完全按照您的要求和截图进行设计，提供了与Manus官网一致的用户体验！🎉
