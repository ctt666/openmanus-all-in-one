// Manus主页面交互逻辑
// 全局变量
let isDarkMode = false;
let mainTextarea = null;
let themeToggle = null;
let mainPage = null;
let taskPage = null;
let currentTaskId = null;
let currentFlowId = null;
let currentSessionId = null;
let currentMode = 'adaptive'; // 默认自适应模式
let leftSidebar = null;
let rightContent = null;
let sidebarToggle = null;
let historyList = null;

// API客户端
class ManusAPIClient {
    constructor() {
        this.baseURL = '';
    }

    async createTask(prompt, mode) {
        try {
            const response = await fetch('/task', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    mode: mode,
                    session_id: currentSessionId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('创建任务失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async createFlow(prompt) {
        try {
            const response = await fetch('/flow', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    session_id: currentSessionId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('创建流程失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async handleInteraction(message, mode, taskId, flowId) {
        try {
            const endpoint = taskId ? `/tasks/${taskId}/interact` : `/flows/${flowId}/interact`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    response: message,
                    mode: mode
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('处理交互失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 获取历史记录
    async getHistory() {
        try {
            const response = await fetch('/sessions/history', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('获取历史记录失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 获取特定会话的历史记录
    async getSessionHistory(sessionId) {
        try {
            const response = await fetch(`/sessions/${sessionId}/history`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('获取会话历史记录失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    connectToEvents(taskId, taskType, onMessage, onError, onClose) {
        const endpoint = taskType === 'task'
            ? `/tasks/${taskId}/events`
            : `/flows/${taskId}/events`;

        const eventSource = new EventSource(endpoint);

        // 处理各种事件类型
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (error) {
                console.error('解析事件数据失败:', error);
            }
        };

        eventSource.onerror = (error) => {
            console.error('SSE连接错误:', error);
            onError(error);
        };

        eventSource.addEventListener('close', () => {
            console.log('SSE连接关闭');
            onClose();
        });

        return eventSource;
    }
}

const apiClient = new ManusAPIClient();

// 自定义悬浮提示类
class CustomTooltip {
    constructor() {
        this.tooltip = null;
        this.currentTarget = null;
        this.hideTimeout = null;
    }

    init() {
        this.createTooltip();
        this.bindEvents();
    }

    initTaskPage() {
        // 任务页面的悬浮提示初始化
        setTimeout(() => {
            this.bindEvents();
        }, 100);
    }

    createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'custom-tooltip';
        this.tooltip.style.cssText = `
            position: absolute;
            background: white;
            color: #333;
            padding: 8px 12px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-size: 13px;
            white-space: nowrap;
            z-index: 10000;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease;
            max-width: 300px;
            white-space: normal;
            word-wrap: break-word;
        `;
        document.body.appendChild(this.tooltip);
    }

    bindEvents() {
        // 绑定所有带有data-tooltip属性的元素，但排除模式按钮
        const tooltipElements = document.querySelectorAll('[data-tooltip]:not(.mode-btn)');

        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', (e) => this.show(e));
            element.addEventListener('mouseleave', () => this.hide());
            element.addEventListener('mousemove', (e) => this.updatePosition(e));
        });

        // 单独绑定模式按钮的悬浮事件
        this.bindModeButtonEvents();
    }

    bindModeButtonEvents() {
        const modeButtons = document.querySelectorAll('.mode-btn');

        modeButtons.forEach(button => {
            button.addEventListener('mouseenter', (e) => this.showModeTooltip(e));
            button.addEventListener('mouseleave', () => this.hide());
            button.addEventListener('mousemove', (e) => this.updateModeTooltipPosition(e));
        });
    }

    show(event) {
        const element = event.target.closest('[data-tooltip]');
        if (!element) return;

        const tooltipText = element.getAttribute('data-tooltip');
        if (!tooltipText) return;

        clearTimeout(this.hideTimeout);
        this.currentTarget = element;
        this.tooltip.textContent = tooltipText;
        this.tooltip.style.opacity = '1';
        this.updatePosition(event);
    }

    showModeTooltip(event) {
        const button = event.target.closest('.mode-btn');
        if (!button) return;

        const bubbleText = button.getAttribute('data-bubble-text');
        const mode = button.getAttribute('data-mode');

        if (!bubbleText) return;

        clearTimeout(this.hideTimeout);
        this.currentTarget = button;

        // 创建模式按钮的特殊悬浮提示内容
        this.tooltip.innerHTML = this.createModeTooltipContent(mode, bubbleText);
        this.tooltip.style.opacity = '1';
        this.updateModeTooltipPosition(event);
    }

    createModeTooltipContent(mode, bubbleText) {
        const modeNames = {
            'adaptive': '⨂A 自适应',
            'agent': 'Agent',
            'chat': 'Chat'
        };

        const modeName = modeNames[mode] || mode;

        return `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <div style="font-weight: 500; color: #333;">${modeName}</div>
            </div>
            <div style="color: #666; font-size: 12px; line-height: 1.4;">${bubbleText}</div>
        `;
    }

    updateModeTooltipPosition(event) {
        if (!this.currentTarget) return;

        const rect = this.tooltip.getBoundingClientRect();
        const buttonRect = this.currentTarget.getBoundingClientRect();

        // 计算位置：在按钮下方居中
        const left = buttonRect.left + (buttonRect.width / 2) - (rect.width / 2);
        const top = buttonRect.bottom + 8;

        this.tooltip.style.left = `${Math.max(10, Math.min(left, window.innerWidth - rect.width - 10))}px`;
        this.tooltip.style.top = `${Math.max(10, top)}px`;
    }

    hide() {
        this.hideTimeout = setTimeout(() => {
            this.tooltip.style.opacity = '0';
            this.currentTarget = null;
        }, 100);
    }

    updatePosition(event) {
        if (!this.currentTarget) return;

        const rect = this.tooltip.getBoundingClientRect();
        const elementRect = this.currentTarget.getBoundingClientRect();

        // 计算位置：在元素下方居中
        const left = elementRect.left + (elementRect.width / 2) - (rect.width / 2);
        const top = elementRect.bottom + 8;

        this.tooltip.style.left = `${Math.max(10, Math.min(left, window.innerWidth - rect.width - 10))}px`;
        this.tooltip.style.top = `${Math.max(10, top)}px`;
    }
}

// 页面初始化
document.addEventListener('DOMContentLoaded', function () {
    initializePage();
    setupEventListeners();
    loadThemePreference();
    initializeLogoFallback();

    // 初始化自定义悬浮提示
    const customTooltip = new CustomTooltip();
    customTooltip.init();

    // 初始化默认模式提示文字
    updatePlaceholderText(currentMode);

    // 检查是否应该显示任务页面
    checkAndRestoreTaskPage();

    // 加载历史记录
    setTimeout(() => {
        loadHistory();
    }, 500);
});

/**
 * 初始化Logo备用方案
 */
function initializeLogoFallback() {
    // 主页面logo处理
    const navbarLogo = document.querySelector('.navbar-logo');
    if (navbarLogo) {
        navbarLogo.addEventListener('error', function () {
            console.log('Logo加载失败，启用备用方案');
            const navbarBrand = this.closest('.navbar-brand');
            if (navbarBrand) {
                navbarBrand.classList.add('logo-fallback');
            }
        });

        navbarLogo.addEventListener('load', function () {
            console.log('Logo加载成功');
        });
    }
}

/**
 * 设置Manus消息Logo备用方案
 */
function setupManusLogoFallback(logoElement) {
    if (!logoElement) return;

    logoElement.addEventListener('error', function () {
        console.log('Manus消息Logo加载失败，启用备用方案');
        const manusAvatar = this.closest('.manus-avatar');
        if (manusAvatar) {
            manusAvatar.classList.add('manus-logo-fallback');
            this.style.display = 'none';
        }
    });

    logoElement.addEventListener('load', function () {
        console.log('Manus消息Logo加载成功');
        const manusAvatar = this.closest('.manus-avatar');
        if (manusAvatar) {
            manusAvatar.classList.remove('manus-logo-fallback');
            this.style.display = 'block';
        }
    });
}

/**
 * 初始化页面
 */
function initializePage() {
    console.log('Manus 主页面初始化完成');

    // 设置默认模式
    currentMode = 'adaptive';

    // 自动调整文本框高度
    if (mainTextarea) {
        autoResizeTextarea(mainTextarea);
    }
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
    // 获取页面元素
    mainTextarea = document.getElementById('mainTextarea');
    themeToggle = document.getElementById('themeToggle');
    mainPage = document.getElementById('mainPage');
    taskPage = document.getElementById('taskPage');
    leftSidebar = document.querySelector('.left-sidebar');
    rightContent = document.querySelector('.right-content');
    sidebarToggle = document.getElementById('sidebarToggle');
    historyList = document.getElementById('historyList');

    // 主文本框事件
    if (mainTextarea) {
        mainTextarea.addEventListener('input', function () {
            autoResizeTextarea(this);
        });

        mainTextarea.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                // 直接发送消息，不需要提交按钮
                sendMessageFromMain();
            }
        });
    }

    // 功能按钮点击事件
    document.querySelectorAll('.feature-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const featureText = this.querySelector('span').textContent;
            handleFeatureClick(featureText);
        });
    });

    // 主题切换按钮
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // 返回主页按钮
    const backBtn = document.getElementById('backToMain');
    if (backBtn) {
        backBtn.addEventListener('click', returnToMainPage);
    }

    // 侧边栏控制按钮
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    // 新建任务按钮
    const newTaskBtn = document.getElementById('newTaskBtn');
    if (newTaskBtn) {
        newTaskBtn.addEventListener('click', createNewTask);
    }

    // 模式按钮点击事件
    document.querySelectorAll('.mode-buttons-list .mode-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            // 移除所有active类
            document.querySelectorAll('.mode-buttons-list .mode-btn').forEach(b => b.classList.remove('active'));
            // 添加active类到当前按钮
            this.classList.add('active');

            const mode = this.getAttribute('data-mode');
            updateModeSelection(mode);

            console.log('切换到模式:', mode);
        });
    });
}

/**
 * 自动调整文本框高度
 */
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}

/**
 * 更新模式选择
 */
function updateModeSelection(mode) {
    currentMode = mode;

    // 更新按钮状态
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-mode') === mode) {
            btn.classList.add('active');
        }
    });

    // 更新输入框提示文字
    updatePlaceholderText(mode);

    console.log('当前模式:', mode);
}

/**
 * 根据模式更新输入框提示文字
 */
function updatePlaceholderText(mode) {
    const textarea = document.getElementById('mainTextarea');
    if (!textarea) return;

    const placeholders = {
        'adaptive': '分配一个任务或提问任何问题',
        'agent': '给OpenManus分配一个任务',
        'chat': '提问任何问题'
    };

    textarea.placeholder = placeholders[mode] || placeholders['adaptive'];
}

/**
 * 处理功能按钮点击
 */
function handleFeatureClick(featureText) {
    if (featureText === '更多') {
        showToast('更多功能即将上线', 'info');
        return;
    }

    // 根据功能类型填充相应的提示文本
    const featurePrompts = {
        '图片': '请帮我处理这张图片：',
        '幻灯片': '请帮我制作一个关于',
        '网页': '请帮我分析这个网页：',
        '电子表格': '请帮我分析这个电子表格数据，',
        '可视化': '请帮我创建一个数据可视化图表，'
    };

    const prompt = featurePrompts[featureText] || `关于${featureText}的任务：`;

    if (mainTextarea) {
        mainTextarea.value = prompt;
        mainTextarea.focus();
        autoResizeTextarea(mainTextarea);
    }
}

/**
 * 侧边栏控制 (直接版本)
 */
function toggleSidebarDirect() {
    console.log('toggleSidebarDirect 被调用');

    const leftSidebar = document.querySelector('.left-sidebar');
    const rightContent = document.querySelector('.right-content');
    const sidebarToggle = document.getElementById('sidebarToggle');

    console.log('leftSidebar:', leftSidebar);
    console.log('rightContent:', rightContent);

    if (leftSidebar && rightContent && sidebarToggle) {
        leftSidebar.classList.toggle('collapsed');
        rightContent.classList.toggle('expanded');

        // 更新按钮图标
        const icon = sidebarToggle.querySelector('i');
        if (leftSidebar.classList.contains('collapsed')) {
            icon.className = 'bi bi-layout-sidebar-reverse';
            sidebarToggle.title = '展开侧边栏';
            // 显示展开按钮
            showExpandButton();
            console.log('侧边栏已收缩');
        } else {
            icon.className = 'bi bi-layout-sidebar';
            sidebarToggle.title = '取消停靠';
            // 隐藏展开按钮
            hideExpandButton();
            console.log('侧边栏已展开');
        }
    } else {
        console.error('leftSidebar 或 rightContent 或 sidebarToggle 元素未找到');
        console.error('leftSidebar:', leftSidebar);
        console.error('rightContent:', rightContent);
        console.error('sidebarToggle:', sidebarToggle);
    }
}

/**
 * 侧边栏控制 (原版本保留)
 */
function toggleSidebar() {
    toggleSidebarDirect();
}

/**
 * 显示展开按钮
 */
function showExpandButton() {
    let expandBtn = document.getElementById('sidebarExpandBtn');
    if (!expandBtn) {
        expandBtn = document.createElement('button');
        expandBtn.id = 'sidebarExpandBtn';
        expandBtn.className = 'sidebar-expand-btn';
        expandBtn.innerHTML = '<i class="bi bi-layout-sidebar"></i>';
        expandBtn.title = '展开导航栏';
        expandBtn.onclick = toggleSidebarDirect;
        document.body.appendChild(expandBtn);
    }
    expandBtn.classList.add('show');
    console.log('展开按钮已显示');
}

/**
 * 隐藏展开按钮
 */
function hideExpandButton() {
    const expandBtn = document.getElementById('sidebarExpandBtn');
    if (expandBtn) {
        expandBtn.classList.remove('show');
    }
}

/**
 * 创建新任务
 */
function createNewTask() {
    if (mainTextarea) {
        mainTextarea.focus();
        showToast('请输入任务描述', 'info');
    }
}

/**
 * 加载历史记录
 */
async function loadHistory() {
    if (!historyList) return;

    try {
        // 显示加载状态
        historyList.innerHTML = `
            <div class="history-loading">
                <i class="bi bi-arrow-clockwise spinning"></i>
                <p>加载中...</p>
            </div>
        `;

        // 获取历史记录
        const result = await apiClient.getHistory();

        if (result.success) {
            displayHistory(result.data);
        } else {
            showHistoryError('加载失败: ' + result.error);
        }
    } catch (error) {
        console.error('加载历史记录失败:', error);
        showHistoryError('加载失败，请重试');
    }
}

/**
 * 显示历史记录
 */
function displayHistory(historyData) {
    if (!historyList) return;

    if (!historyData || historyData.length === 0) {
        historyList.innerHTML = `
            <div class="history-empty">
                <i class="bi bi-chat-dots"></i>
                <p>暂无历史对话</p>
                <p>开始创建你的第一个任务吧！</p>
            </div>
        `;
        return;
    }

    const historyHTML = historyData.map(item => `
        <div class="history-item" data-session-id="${item.session_id || ''}" data-task-id="${item.task_id || ''}">
            <div class="history-item-icon">
                <i class="bi ${getHistoryItemIcon(item.type || 'task')}"></i>
            </div>
            <div class="history-item-content">
                <div class="history-item-title">${item.title || '未命名任务'}</div>
                <div class="history-item-subtitle">${item.subtitle || '点击查看详情'}</div>
            </div>
            <div class="history-item-time">${formatHistoryTime(item.created_at || item.updated_at)}</div>
        </div>
    `).join('');

    historyList.innerHTML = historyHTML;

    // 添加点击事件
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            const sessionId = item.getAttribute('data-session-id');
            const taskId = item.getAttribute('data-task-id');
            if (sessionId || taskId) {
                loadSessionHistory(sessionId, taskId);
            }
        });
    });
}

/**
 * 获取历史项目图标
 */
function getHistoryItemIcon(type) {
    const iconMap = {
        'task': 'bi-file-text',
        'flow': 'bi-diagram-3',
        'image': 'bi-image',
        'document': 'bi-file-earmark-text',
        'presentation': 'bi-easel',
        'spreadsheet': 'bi-table',
        'chart': 'bi-bar-chart'
    };
    return iconMap[type] || 'bi-file-text';
}

/**
 * 格式化历史时间
 */
function formatHistoryTime(timestamp) {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const oneDay = 24 * 60 * 60 * 1000;

    if (diff < oneDay) {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 7 * oneDay) {
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return days[date.getDay()];
    } else {
        return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    }
}

/**
 * 显示历史记录错误
 */
function showHistoryError(message) {
    if (!historyList) return;

    historyList.innerHTML = `
        <div class="history-error">
            <i class="bi bi-exclamation-triangle"></i>
            <p>${message}</p>
            <button class="retry-btn" onclick="loadHistory()">重试</button>
        </div>
    `;
}

/**
 * 加载会话历史记录
 */
async function loadSessionHistory(sessionId, taskId) {
    try {
        if (sessionId) {
            const result = await apiClient.getSessionHistory(sessionId);
            if (result.success) {
                // 这里可以跳转到任务页面或显示历史对话
                showToast(`加载会话 ${sessionId} 的历史记录`, 'info');
            }
        }
        if (taskId) {
            // 这里可以跳转到任务页面
            showToast(`加载任务 ${taskId}`, 'info');
        }
    } catch (error) {
        console.error('加载会话历史记录失败:', error);
        showToast('加载失败，请重试', 'error');
    }
}

/**
 * 处理提交
 */
async function handleSubmit() {
    const text = mainTextarea ? mainTextarea.value.trim() : '';
    if (!text) {
        showToast('请输入任务描述', 'warning');
        return;
    }

    // 生成会话ID
    if (!currentSessionId) {
        currentSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    try {
        let result;
        let taskId;
        let taskType;

        if (currentMode === 'search') {
            // Agent模式，创建流程
            result = await apiClient.createFlow(text);
            taskId = result.data?.flow_id;
            taskType = 'flow';
            currentFlowId = taskId;
            currentTaskId = null;
        } else {
            // 自适应/Chat模式，创建任务
            result = await apiClient.createTask(text, currentMode);
            taskId = result.data?.task_id;
            taskType = 'task';
            currentTaskId = taskId;
            currentFlowId = null;
        }

        if (result.success && taskId) {
            showTaskPage(text, currentMode, taskId, taskType);
        } else {
            showToast(result.error || '创建任务失败', 'error');
        }
    } catch (error) {
        console.error('提交失败:', error);
        showToast('提交失败，请重试', 'error');
    }
}

/**
 * 从主页面发送消息
 */
async function sendMessageFromMain() {
    const text = mainTextarea ? mainTextarea.value.trim() : '';
    if (!text) {
        showToast('请输入任务描述', 'warning');
        return;
    }

    // 清空输入框
    mainTextarea.value = '';
    autoResizeTextarea(mainTextarea);

    // 创建任务并跳转到任务页面
    await handleSubmit();
}

/**
 * 显示任务执行页面
 */
function showTaskPage(taskText, mode, taskId = null, taskType = null) {
    if (mainPage) mainPage.style.display = 'none';
    if (taskPage) taskPage.style.display = 'block';

    // 更新URL以包含任务ID
    const actualTaskId = taskId || currentTaskId || currentFlowId;
    if (actualTaskId) {
        const newUrl = `/?taskId=${actualTaskId}&mode=${mode}&type=${taskType || (currentTaskId ? 'task' : 'flow')}`;
        window.history.pushState({ taskId: actualTaskId, mode: mode, taskType: taskType }, '', newUrl);
        console.log('URL已更新:', newUrl);
    }

    // 保存任务状态到本地存储
    const taskState = {
        isTaskPageActive: true,
        taskText: taskText,
        mode: mode,
        taskId: currentTaskId,
        flowId: currentFlowId,
        sessionId: currentSessionId,
        taskType: taskType,
        timestamp: Date.now()
    };
    localStorage.setItem('manusTaskState', JSON.stringify(taskState));

    // 设置会话标记，表明当前在任务页面
    sessionStorage.setItem('shouldRestoreTask', 'true');

    // 生成任务执行页面内容
    generateTaskPageContent(taskText, mode, taskId, taskType);

    // 只有在创建新任务时才保存初始用户消息（不是从历史恢复）
    const isRestoringFromHistory = sessionStorage.getItem('restoringFromHistory') === 'true';
    if (!isRestoringFromHistory) {
        saveInitialUserMessage(taskText);
    }
}

/**
 * 保存初始用户消息到聊天历史
 */
function saveInitialUserMessage(taskText) {
    // 检查是否已经保存过这条消息（避免重复保存）
    if (chatHistory.length > 0 && chatHistory[0].type === 'user' && chatHistory[0].content === taskText) {
        console.log('初始用户消息已存在，跳过保存');
        return;
    }

    // 保存初始用户消息
    chatHistoryManager.addMessage('user', taskText);
    console.log('已保存初始用户消息到聊天历史:', taskText);
}

/**
 * 生成任务执行页面内容
 */
function generateTaskPageContent(taskText, mode, taskId = null, taskType = null) {
    const modeNames = {
        'search': 'Agent模式',
        'adaptive': '自适应模式',
        'chat': 'Chat模式'
    };

    const taskPageContent = `
        <div class="task-page-layout">
            <!-- 展开按钮 -->
            <button class="sidebar-expand-btn" id="sidebarExpandBtn" onclick="toggleSidebar()" title="展开导航栏">
                <i class="bi bi-layout-sidebar-inset"></i>
            </button>

            <!-- 左侧导航栏 (1/5宽度) -->
            <div class="task-sidebar" id="taskSidebar">
                <!-- 顶部控制区域 -->
                <div class="sidebar-header">
                    <button class="sidebar-control-btn" onclick="toggleSidebar()" title="取消停靠">
                        <i class="bi bi-layout-sidebar-inset-reverse"></i>
                    </button>
                    <button class="sidebar-control-btn" onclick="searchHistory()" title="搜索">
                        <i class="bi bi-search"></i>
                    </button>
                </div>

                <!-- 新建任务按钮 -->
                <div class="sidebar-new-task">
                    <button class="new-task-btn" onclick="createNewTask()">
                        <i class="bi bi-plus-circle me-2"></i>
                        新建任务
                    </button>
                </div>

                <!-- 历史对话列表 -->
                <div class="sidebar-history" id="sidebarHistory">
                    <div class="history-loading">
                        <i class="bi bi-arrow-clockwise spinning"></i>
                        <span>加载历史记录...</span>
                    </div>
                </div>
            </div>

            <!-- 右侧交互页面 (4/5宽度) -->
            <div class="task-main-content" id="taskMainContent">
                <!-- 内容包装器 - 2/3宽度居中 -->
                <div class="task-content-wrapper">
                    <!-- 顶部导航栏 -->
                    <div class="task-content-header">
                    <div class="task-title">
                        <h3>${taskText.substring(0, 50)}${taskText.length > 50 ? '...' : ''}</h3>
                    </div>
                    <div class="task-actions">
                        <button class="task-action-btn" title="分享">
                            <i class="bi bi-share"></i>
                        </button>
                        <button class="task-action-btn" title="收藏">
                            <i class="bi bi-heart"></i>
                        </button>
                        <button class="task-action-btn" title="详情">
                            <i class="bi bi-info-circle"></i>
                        </button>
                    </div>
                </div>

                <!-- 聊天对话区域 -->
                <div class="task-chat-container" id="taskChatContainer">
                    <div class="chat-message user-message">
                        <div class="message-avatar">
                            <i class="bi bi-person-circle"></i>
                        </div>
                        <div class="message-content">
                            <div class="message-text">${taskText}</div>
                            <div class="message-time">${new Date().toLocaleTimeString()}</div>
                        </div>
                    </div>

                    <!-- 移除静态的助手消息模板，改为动态创建 -->
                </div>

                                <!-- 底部输入框 -->
                <div class="chat-input-container">
                    <div class="chat-input-wrapper">
                        <div class="chat-input-content">
                            <div class="chat-input-box">
                                <div class="input-controls">
                                    <button class="control-btn file-btn" data-tooltip="附加文件">
                                        <i class="bi bi-paperclip"></i>
                                    </button>
                                    <div class="mode-selector">
                                        <button class="mode-btn ${mode === 'adaptive' ? 'active' : ''}" data-mode="adaptive" data-bubble-text="智能适配即时答案和 Agent 模式">
                                            <i class="bi bi-magic"></i>
                                        </button>
                                        <button class="mode-btn ${mode === 'search' ? 'active' : ''}" data-mode="agent" data-bubble-text="处理复杂任务并自主交付结果">
                                            <i class="bi bi-robot"></i>
                                        </button>
                                        <button class="mode-btn ${mode === 'chat' ? 'active' : ''}" data-mode="chat" data-bubble-text="回答日常问题或在开始任务前进行对话">
                                            <i class="bi bi-chat-dots"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="input-area">
                                    <textarea id="taskInputField" placeholder="输入您的消息..." rows="1"></textarea>
                                    <button class="submit-btn" onclick="sendMessage()">
                                        <i class="bi bi-send"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;

    taskPage.innerHTML = taskPageContent;

    // 初始化任务页面
    initializeTaskPage(taskId, taskType);
}

function initializeTaskPage(taskId = null, taskType = null) {
    // 初始化输入框自动调整高度
    const taskInputField = document.getElementById('taskInputField');
    if (taskInputField) {
        taskInputField.addEventListener('input', function () {
            autoResizeTextarea(this);
        });

        // 回车发送消息
        taskInputField.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // 初始化模式选择按钮
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const mode = this.getAttribute('data-mode');
            updateTaskModeSelection(mode);
        });
    });

    // 初始化自定义悬浮提示
    const customTooltip = new CustomTooltip();
    customTooltip.initTaskPage();

    // 加载历史记录
    loadHistoryRecords();

    // 如果有任务ID，加载聊天历史并连接到事件流
    if (taskId && taskType) {
        loadChatHistoryForTask(taskId);
        connectToTaskEvents(taskId, taskType);
    } else {
        // 模拟助手回复（用于测试）
        setTimeout(() => {
            showAssistantResponse();
        }, 2000);
    }
}

/**
 * 更新任务页面的模式选择
 */
function updateTaskModeSelection(mode) {
    currentMode = mode;

    // 更新按钮状态
    document.querySelectorAll('#taskPage .mode-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-mode') === mode) {
            btn.classList.add('active');
        }
    });

    console.log('任务页面当前模式:', mode);
}

/**
 * 连接到任务事件流
 */
function connectToTaskEvents(taskId, taskType) {
    console.log(`连接到${taskType}事件流:`, taskId);

    const eventSource = apiClient.connectToEvents(
        taskId,
        taskType,
        handleTaskEvent,
        handleTaskError,
        handleTaskClose
    );
}

// 全局变量：当前的Manus消息容器
let currentManusMessage = null;
let thinkingSteps = [];

// 聊天历史管理
let chatHistory = [];  // 当前会话的聊天历史
let chatHistoryManager = {
    // 保存聊天历史到localStorage
    saveChatHistory: function (taskId, taskType, history) {
        try {
            const key = `manusChatHistory_${taskId}`;
            const historyData = {
                taskId: taskId,
                taskType: taskType,
                history: history,
                timestamp: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(historyData));
            console.log('聊天历史已保存:', key);
        } catch (error) {
            console.error('保存聊天历史失败:', error);
        }
    },

    // 从localStorage加载聊天历史
    loadChatHistory: function (taskId) {
        try {
            const key = `manusChatHistory_${taskId}`;
            const historyStr = localStorage.getItem(key);
            if (!historyStr) return [];

            const historyData = JSON.parse(historyStr);

            // 检查历史是否过期（7天）
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
            const age = Date.now() - historyData.timestamp;

            if (age > maxAge) {
                localStorage.removeItem(key);
                return [];
            }

            console.log('聊天历史已加载:', key, historyData.history.length, '条消息');
            return historyData.history || [];
        } catch (error) {
            console.error('加载聊天历史失败:', error);
            return [];
        }
    },

    // 添加消息到历史
    addMessage: function (type, content, timestamp = null) {
        const message = {
            type: type,  // 'user' | 'manus' | 'thinking'
            content: content,
            timestamp: timestamp || Date.now(),
            id: Date.now() + Math.random()
        };

        chatHistory.push(message);

        // 如果有当前任务ID，自动保存
        if (currentTaskId || currentFlowId) {
            const taskId = currentTaskId || currentFlowId;
            const taskType = currentTaskId ? 'task' : 'flow';
            this.saveChatHistory(taskId, taskType, chatHistory);
        }

        return message;
    },

    // 清空当前聊天历史
    clearHistory: function () {
        chatHistory = [];
    },

    // 设置当前聊天历史
    setHistory: function (history) {
        chatHistory = history || [];
    }
};

/**
 * 处理任务事件
 */
function handleTaskEvent(event) {
    console.log('收到任务事件:', event);

    switch (event.type) {
        case 'think':
            handleThinkEvent(event);
            break;
        case 'interaction':
            handleInteractionEvent(event);
            break;
        case 'complete':
            handleCompleteEvent(event);
            break;
        case 'step':
            handleStepEvent(event);
            break;
        case 'status':
            handleStatusEvent(event);
            break;
        case 'error':
            handleErrorEvent(event);
            break;
        case 'ask_human':
            handleAskHumanEvent(event);
            break;
        case 'tool':
            handleToolEvent(event);
            break;
        case 'message':
            handleMessageEvent(event);
            break;
        case 'parse_error':
            handleParseErrorEvent(event);
            break;
        case 'connection_error':
            handleConnectionErrorEvent(event);
            break;
        case 'connection_open':
            handleConnectionOpenEvent(event);
            break;
        default:
            console.log('未处理的事件类型:', event.type, event);
    }
}

/**
 * 处理步骤事件
 */
function handleStepEvent(event) {
    if (event.content) {
        addAssistantMessage(event.content);
    }
}

/**
 * 处理状态事件
 */
function handleStatusEvent(event) {
    console.log(`任务状态: ${event.status}`);
    if (event.steps && event.steps.length > 0) {
        event.steps.forEach(step => {
            if (step.content) {
                addAssistantMessage(step.content);
            }
        });
    }
}

/**
 * 处理错误事件
 */
function handleErrorEvent(event) {
    console.error(`任务执行错误: ${event.message || '未知错误'}`);
}

/**
 * 处理ask_human事件
 */
function handleAskHumanEvent(event) {
    addAssistantMessage(event.question || event.message);
    console.log('等待用户回复...');
}

/**
 * 处理think事件
 */
function handleThinkEvent(event) {
    if (!currentManusMessage) {
        createManusMessage();
    }

    if (event.result) {
        thinkingSteps.push({
            content: event.result,
            time: new Date().toLocaleTimeString()
        });

        // 更新思考过程显示
        updateThinkingProcess();

        // 保存思考步骤到聊天历史
        chatHistoryManager.addMessage('thinking', event.result);
    }
}

/**
 * 处理interaction事件
 */
function handleInteractionEvent(event) {
    if (!currentManusMessage) {
        createManusMessage();
    }

    if (event.result) {
        updateManusMessageContent(event.result);
        finishCurrentMessage();
    }
}

/**
 * 处理complete事件
 */
function handleCompleteEvent(event) {
    if (!currentManusMessage) {
        createManusMessage();
    }

    if (event.result) {
        updateManusMessageContent(event.result);
    }

    finishCurrentMessage();
}

/**
 * 处理tool事件
 */
function handleToolEvent(event) {
    console.log(`🔧 使用工具: ${event.tool || '未知工具'}`);
    if (event.content) {
        addAssistantMessage(event.content);
    }
}

/**
 * 处理message事件
 */
function handleMessageEvent(event) {
    if (event.content) {
        addAssistantMessage(event.content);
    } else {
        console.log('收到消息事件');
    }
}

/**
 * 处理解析错误事件
 */
function handleParseErrorEvent(event) {
    console.error('⚠️ 数据解析错误:', event.error);
    console.error('解析错误详情:', event);
}

/**
 * 处理连接错误事件
 */
function handleConnectionErrorEvent(event) {
    console.error(`❌ 连接错误: ${event.message}`);
}

/**
 * 处理连接打开事件
 */
function handleConnectionOpenEvent(event) {
    console.log('✅ SSE连接已建立');
}

/**
 * 处理任务错误
 */
function handleTaskError(error) {
    console.error('任务事件流错误:', error);
    console.error(`连接错误: ${error.message}`);
}

/**
 * 处理任务关闭
 */
function handleTaskClose() {
    console.log('任务事件流已关闭');
    console.log('事件流连接已关闭');
}

/**
 * 添加系统消息
 */
function addSystemMessage(text, type = 'info') {
    const chatContainer = document.getElementById('taskChatContainer');
    if (!chatContainer) return;

    const systemMessage = document.createElement('div');
    systemMessage.className = `system-message ${type}`;
    systemMessage.innerHTML = `
        <div class="system-message-content">
            <i class="bi bi-info-circle"></i>
            <span>${text}</span>
            <div class="system-message-time">${new Date().toLocaleTimeString()}</div>
        </div>
    `;
    chatContainer.appendChild(systemMessage);
    scrollChatToBottom();
}

/**
 * 创建Manus消息
 */
function createManusMessage() {
    const chatContainer = document.getElementById('taskChatContainer');
    if (!chatContainer) return;

    const messageId = 'manus-msg-' + Date.now();

    const manusMessage = document.createElement('div');
    manusMessage.className = 'chat-message manus-message';
    manusMessage.id = messageId;
    manusMessage.innerHTML = `
        <div class="manus-message-container">
            <div class="manus-header">
                <div class="manus-avatar">
                    <img src="/assets/logo.jpg" alt="Manus" class="manus-logo">
                </div>
                <span class="manus-name">manus</span>
            </div>
            <div class="manus-content">
                <div class="thinking-process-section" style="display: none;">
                    <div class="thinking-header" onclick="toggleThinking('${messageId}')">
                        <div class="thinking-title">
                            <i class="bi bi-lightbulb"></i>
                            <span>思考过程</span>
                        </div>
                        <div class="thinking-toggle">
                            <i class="bi bi-chevron-down"></i>
                        </div>
                    </div>
                    <div class="thinking-content">
                        <div class="thinking-steps">
                            <!-- 思考步骤将在这里动态添加 -->
                        </div>
                    </div>
                </div>
                <div class="message-text" style="display: none;">
                    <!-- 消息内容将在这里显示 -->
                </div>
            </div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        </div>
    `;

    chatContainer.appendChild(manusMessage);

    // 设置logo备用方案
    const logoElement = manusMessage.querySelector('.manus-logo');
    setupManusLogoFallback(logoElement);

    // 设置当前消息容器
    currentManusMessage = manusMessage;
    thinkingSteps = [];

    scrollChatToBottom();
    return manusMessage;
}

/**
 * 更新思考过程
 */
function updateThinkingProcess() {
    if (!currentManusMessage) return;

    const thinkingSection = currentManusMessage.querySelector('.thinking-process-section');
    const thinkingStepsContainer = currentManusMessage.querySelector('.thinking-steps');

    if (thinkingSection && thinkingStepsContainer) {
        // 显示思考过程区域
        thinkingSection.style.display = 'block';

        // 清空并重新添加所有思考步骤
        thinkingStepsContainer.innerHTML = '';
        thinkingSteps.forEach(step => {
            const thinkingStep = document.createElement('div');
            thinkingStep.className = 'thinking-step';
            thinkingStep.innerHTML = `
                <div class="thinking-step-content">${step.content}</div>
                <div class="thinking-step-time">${step.time}</div>
            `;
            thinkingStepsContainer.appendChild(thinkingStep);
        });
    }
}

/**
 * 更新Manus消息内容
 */
function updateManusMessageContent(content) {
    if (!currentManusMessage) return;

    const messageText = currentManusMessage.querySelector('.message-text');
    if (messageText) {
        messageText.textContent = content;
        messageText.style.display = 'block';
    }

    scrollChatToBottom();

    // 保存Manus消息到聊天历史
    chatHistoryManager.addMessage('manus', content);
}

/**
 * 完成当前消息
 */
function finishCurrentMessage() {
    currentManusMessage = null;
    thinkingSteps = [];
}

/**
 * 切换思考过程显示
 */
function toggleThinking(messageId) {
    const message = document.getElementById(messageId);
    if (!message) return;

    const thinkingContent = message.querySelector('.thinking-content');
    const toggleIcon = message.querySelector('.thinking-toggle i');

    if (thinkingContent && toggleIcon) {
        if (thinkingContent.style.display === 'none' || thinkingContent.style.display === '') {
            thinkingContent.style.display = 'block';
            toggleIcon.className = 'bi bi-chevron-up';
        } else {
            thinkingContent.style.display = 'none';
            toggleIcon.className = 'bi bi-chevron-down';
        }
    }
}

/**
 * 发送消息
 */
async function sendMessage() {
    const taskInputField = document.getElementById('taskInputField');
    const chatContainer = document.getElementById('taskChatContainer');

    if (!taskInputField || !chatContainer) return;

    const message = taskInputField.value.trim();
    if (!message) return;

    // 添加用户消息
    const userMessage = document.createElement('div');
    userMessage.className = 'chat-message user-message';
    userMessage.innerHTML = `
        <div class="message-avatar">
            <i class="bi bi-person-circle"></i>
        </div>
        <div class="message-content">
            <div class="message-text">${message}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        </div>
    `;
    chatContainer.appendChild(userMessage);

    // 保存用户消息到聊天历史
    chatHistoryManager.addMessage('user', message);

    // 清空输入框
    taskInputField.value = '';
    autoResizeTextarea(taskInputField);

    // 滚动到底部
    scrollChatToBottom();

    // 如果有活跃的任务，发送交互
    if (currentTaskId || currentFlowId) {
        try {
            const result = await apiClient.handleInteraction(
                message,
                currentMode,
                currentTaskId,
                currentFlowId
            );

            if (result.success) {
                console.log('交互成功:', result);
            } else {
                showToast(`交互失败: ${result.error}`, 'error');
                console.error('交互失败:', result.error);
            }
        } catch (error) {
            showToast('交互发送失败，请检查网络连接', 'error');
            console.error('发送交互失败:', error);
        }
    } else {
        // 没有活跃任务，模拟回复
        setTimeout(() => {
            addAssistantMessage('收到您的消息，但当前没有活跃的任务。请返回主页面创建新任务。');
        }, 1000);
    }
}

/**
 * 添加助手消息 - 已废弃，使用createManusMessage替代
 */
function addAssistantMessage(text) {
    console.log('addAssistantMessage已废弃，使用createManusMessage替代');

    // 为了兼容性，创建新的Manus消息
    if (!currentManusMessage) {
        createManusMessage();
    }

    updateManusMessageContent(text);
    finishCurrentMessage();
}

/**
 * 显示助手回复（测试用）
 */
function showAssistantResponse() {
    const responses = [
        '好的，我将按照下列计划进行工作：\n1. 调研机票和酒店价格，确定最佳出行时段\n2. 收集日本著名景点和美食信息及图片\n3. 研究语言障碍问题和解决方案\n4. 寻找环境优雅的温泉酒店推荐\n5. 制定详细行程安排\n6. 计算整体预算并生成最终攻略文档\n7. 向用户交付完整的旅行攻略\n\n在我的工作过程中，你可以随时打断我，告诉我新的想法或者调整计划。',
        '我正在为您处理这个任务，请稍等片刻...',
        '让我来帮助您完成这个任务。'
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    addAssistantMessage(randomResponse);
}

/**
 * 滚动聊天容器到底部
 */
function scrollChatToBottom() {
    const chatContainer = document.getElementById('taskChatContainer');
    if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

/**
 * 切换侧边栏
 */
function toggleSidebar() {
    const sidebar = document.getElementById('taskSidebar');
    const expandBtn = document.getElementById('sidebarExpandBtn');
    const mainContent = document.getElementById('taskMainContent');

    if (sidebar && expandBtn && mainContent) {
        if (sidebar.classList.contains('collapsed')) {
            // 展开侧边栏
            sidebar.classList.remove('collapsed');
            expandBtn.style.display = 'none';
            mainContent.classList.remove('full-width');
        } else {
            // 收缩侧边栏
            sidebar.classList.add('collapsed');
            expandBtn.style.display = 'block';
            mainContent.classList.add('full-width');
        }
    }
}

/**
 * 创建新任务 - 在新标签页打开主页面
 */
function createNewTask() {
    console.log('创建新任务 - 在新标签页打开');

    // 在新标签页打开主页面，添加参数确保显示主页面
    window.open('/?new=true', '_blank');

    showToast('已在新标签页打开主页面', 'success');
}

/**
 * 检查并恢复任务页面状态
 * 只在用户明确刷新任务页面时恢复，不在访问主页时自动恢复
 */
function checkAndRestoreTaskPage() {
    try {
        const taskStateStr = localStorage.getItem('manusTaskState');
        if (!taskStateStr) {
            // 没有任务状态，确保显示主页面
            ensureMainPageVisible();
            return;
        }

        const taskState = JSON.parse(taskStateStr);

        // 检查状态是否有效（24小时内）
        const now = Date.now();
        const stateAge = now - taskState.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24小时

        if (stateAge > maxAge) {
            localStorage.removeItem('manusTaskState');
            sessionStorage.removeItem('shouldRestoreTask');
            ensureMainPageVisible();
            return;
        }

        // 检查URL参数或特殊标记来判断是否应该恢复任务页面
        const urlParams = new URLSearchParams(window.location.search);
        const isNewTask = urlParams.get('new') === 'true';
        const urlTaskId = urlParams.get('taskId');
        const urlMode = urlParams.get('mode');
        const urlType = urlParams.get('type');

        const shouldRestoreTask = !isNewTask && (
            urlTaskId ||  // URL中有taskId参数
            urlParams.get('restore') === 'task' ||
            sessionStorage.getItem('shouldRestoreTask') === 'true'
        );

        // 清除会话标记
        sessionStorage.removeItem('shouldRestoreTask');

        // 只有在明确需要恢复任务时才恢复
        if (shouldRestoreTask && taskState.isTaskPageActive) {
            let restoreTaskId, restoreMode, restoreTaskType, restoreTaskText;

            // 优先使用URL参数中的任务信息
            if (urlTaskId) {
                restoreTaskId = urlTaskId;
                restoreMode = urlMode || taskState.mode;
                restoreTaskType = urlType || taskState.taskType;
                restoreTaskText = taskState.taskText || `恢复任务: ${urlTaskId}`;
                console.log('从URL恢复任务页面状态:', urlTaskId);
            } else {
                restoreTaskId = taskState.taskId || taskState.flowId;
                restoreMode = taskState.mode;
                restoreTaskType = taskState.taskType;
                restoreTaskText = taskState.taskText;
                console.log('从存储恢复任务页面状态:', restoreTaskId);
            }

            if (restoreTaskId && restoreMode) {
                // 恢复全局状态
                if (restoreTaskType === 'flow') {
                    currentFlowId = restoreTaskId;
                    currentTaskId = null;
                } else {
                    currentTaskId = restoreTaskId;
                    currentFlowId = null;
                }
                currentSessionId = taskState.sessionId;
                currentMode = restoreMode;

                // 设置恢复标记，避免重复保存初始用户消息
                sessionStorage.setItem('restoringFromHistory', 'true');
                showTaskPage(restoreTaskText, restoreMode, restoreTaskId, restoreTaskType);
                sessionStorage.removeItem('restoringFromHistory');
            } else {
                console.log('任务信息不完整，显示主页面');
                ensureMainPageVisible();
            }
        } else {
            // 如果不需要恢复任务页面，确保显示主页面
            console.log('显示主页面');
            ensureMainPageVisible();
        }
    } catch (error) {
        console.error('恢复任务页面状态失败:', error);
        localStorage.removeItem('manusTaskState');
        // 出错时默认显示主页面
        ensureMainPageVisible();
    }
}

/**
 * 确保主页面可见
 */
function ensureMainPageVisible() {
    if (taskPage) taskPage.style.display = 'none';
    if (mainPage) mainPage.style.display = 'block';
    console.log('主页面已显示');
}

/**
 * 加载历史记录
 */
async function loadHistoryRecords() {
    const historyContainer = document.getElementById('sidebarHistory');
    if (!historyContainer) return;

    try {
        const result = await apiClient.getHistory();

        if (result.success) {
            renderHistoryRecords(result.data, historyContainer);
        } else {
            showHistoryError(historyContainer, result.error);
        }
    } catch (error) {
        console.error('加载历史记录失败:', error);
        showHistoryError(historyContainer, '网络错误');
    }
}

/**
 * 渲染历史记录
 */
function renderHistoryRecords(data, container) {
    const { chat_history = [], flow_history = [] } = data;

    // 合并并按时间排序，统一id字段
    const allHistory = [
        ...chat_history.map(item => ({ ...item, type: 'chat', id: item.task_id })),
        ...flow_history.map(item => ({ ...item, type: 'flow', id: item.flow_id }))
    ].sort((a, b) => new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp));

    if (allHistory.length === 0) {
        container.innerHTML = `
            <div class="history-empty">
                <i class="bi bi-chat-dots"></i>
                <p>暂无历史记录</p>
            </div>
        `;
        return;
    }

    // 按日期分组
    const groupedHistory = groupHistoryByDate(allHistory);

    let html = '';
    for (const [dateLabel, items] of Object.entries(groupedHistory)) {
        html += `
            <div class="history-section">
                <div class="history-title">${dateLabel}</div>
        `;

        items.forEach(item => {
            const title = item.prompt || item.message || '未命名任务';
            const time = formatTime(item.created_at || item.timestamp);
            const isActive = (item.type === 'chat' && item.id === currentTaskId) ||
                (item.type === 'flow' && item.id === currentFlowId);

            html += `
                <div class="history-item ${isActive ? 'active' : ''}"
                     data-id="${item.id}"
                     data-type="${item.type}"
                     onclick="selectHistoryItem('${item.id}', '${item.type}')">
                    <div class="history-item-content">
                        <div class="history-item-title">${truncateText(title, 40)}</div>
                        <div class="history-item-time">${time}</div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
    }

    container.innerHTML = html;
}

/**
 * 按日期分组历史记录
 */
function groupHistoryByDate(history) {
    const groups = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    history.forEach(item => {
        const itemDate = new Date(item.created_at || item.timestamp);
        let dateLabel;

        if (isSameDate(itemDate, today)) {
            dateLabel = '今天';
        } else if (isSameDate(itemDate, yesterday)) {
            dateLabel = '昨天';
        } else {
            dateLabel = formatDate(itemDate);
        }

        if (!groups[dateLabel]) {
            groups[dateLabel] = [];
        }
        groups[dateLabel].push(item);
    });

    return groups;
}

/**
 * 判断两个日期是否为同一天
 */
function isSameDate(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();
}

/**
 * 截断文本
 */
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * 显示历史记录错误
 */
function showHistoryError(container, error) {
    container.innerHTML = `
        <div class="history-error">
            <i class="bi bi-exclamation-triangle"></i>
            <p>加载失败</p>
            <small>${error}</small>
            <button onclick="loadHistoryRecords()" class="retry-btn">重试</button>
        </div>
    `;
}

/**
 * 选择历史记录项
 */
function selectHistoryItem(id, type) {
    console.log('选择历史记录:', id, type);

    // 清空当前聊天历史（内存）
    chatHistoryManager.clearHistory();

    // 清空聊天界面（UI）
    clearChatContainer();

    // 设置当前任务ID
    if (type === 'chat') {
        currentTaskId = id;
        currentFlowId = null;
        currentMode = 'adaptive'; // 默认模式
    } else if (type === 'flow') {
        currentFlowId = id;
        currentTaskId = null;
        currentMode = 'search'; // Agent模式
    }

    // 更新URL以反映当前任务
    const newUrl = `/?taskId=${id}&mode=${currentMode}&type=${type}`;
    window.history.pushState({ taskId: id, mode: currentMode, taskType: type }, '', newUrl);
    console.log('历史任务URL已更新:', newUrl);

    // 设置恢复标记
    sessionStorage.setItem('restoringFromHistory', 'true');

    // 加载该任务的聊天历史
    loadChatHistoryForTask(id);

    // 清除恢复标记
    sessionStorage.removeItem('restoringFromHistory');

    showToast(`已切换到${type === 'flow' ? 'Agent' : 'Chat'}任务`, 'success');
}

/**
 * 加载历史对话（原有函数保持兼容）
 */
async function loadHistoryFromAPI() {
    try {
        const result = await apiClient.getHistory();
        if (result.success) {
            console.log('历史记录:', result.data);
        }
    } catch (error) {
        console.error('加载历史对话失败:', error);
    }
}

/**
 * 搜索历史
 */
function searchHistory() {
    showToast('搜索功能即将上线', 'info');
}

/**
 * 为指定任务加载聊天历史
 */
function loadChatHistoryForTask(taskId) {
    console.log('加载任务聊天历史:', taskId);

    // 从localStorage加载历史
    const history = chatHistoryManager.loadChatHistory(taskId);

    if (history.length === 0) {
        console.log('没有找到聊天历史');
        return;
    }

    // 设置当前聊天历史
    chatHistoryManager.setHistory(history);

    // 恢复聊天界面
    restoreChatInterface(history);
}

/**
 * 清空聊天容器
 */
function clearChatContainer() {
    const chatContainer = document.getElementById('taskChatContainer');
    if (!chatContainer) return;

    // 清空所有聊天消息
    chatContainer.innerHTML = '';

    // 重置当前消息状态
    currentManusMessage = null;
    thinkingSteps = [];

    console.log('聊天容器已清空');
}

/**
 * 恢复聊天界面
 */
function restoreChatInterface(history) {
    const chatContainer = document.getElementById('taskChatContainer');
    if (!chatContainer) return;

    console.log('恢复', history.length, '条历史消息');

    // 清空现有的聊天消息
    clearChatContainer();

    // 按时间顺序恢复消息
    let currentManusMsg = null;
    let currentThinkingSteps = [];

    history.forEach(message => {
        switch (message.type) {
            case 'user':
                // 创建用户消息
                const userMessage = document.createElement('div');
                userMessage.className = 'chat-message user-message';
                userMessage.innerHTML = `
                    <div class="message-avatar">
                        <i class="bi bi-person-circle"></i>
                    </div>
                    <div class="message-content">
                        <div class="message-text">${message.content}</div>
                        <div class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</div>
                    </div>
                `;
                chatContainer.appendChild(userMessage);
                currentManusMsg = null; // 重置Manus消息
                break;

            case 'manus':
                // 如果没有当前Manus消息，创建新的
                if (!currentManusMsg) {
                    currentManusMsg = createManusMessageForHistory();
                    currentThinkingSteps = [];
                }

                // 更新消息内容
                const messageText = currentManusMsg.querySelector('.message-text');
                if (messageText) {
                    messageText.textContent = message.content;
                    messageText.style.display = 'block';
                }
                break;

            case 'thinking':
                // 如果没有当前Manus消息，创建一个
                if (!currentManusMsg) {
                    currentManusMsg = createManusMessageForHistory();
                    currentThinkingSteps = [];
                }

                // 添加思考步骤
                currentThinkingSteps.push({
                    content: message.content,
                    time: new Date(message.timestamp).toLocaleTimeString()
                });

                // 更新思考过程显示
                updateThinkingProcessForHistory(currentManusMsg, currentThinkingSteps);
                break;
        }
    });

    scrollChatToBottom();
}

/**
 * 为历史恢复创建Manus消息
 */
function createManusMessageForHistory() {
    const chatContainer = document.getElementById('taskChatContainer');
    if (!chatContainer) return null;

    const messageId = 'manus-msg-history-' + Date.now();

    const manusMessage = document.createElement('div');
    manusMessage.className = 'chat-message manus-message';
    manusMessage.id = messageId;
    manusMessage.innerHTML = `
        <div class="manus-message-container">
            <div class="manus-header">
                <div class="manus-avatar">
                    <img src="/assets/logo.jpg" alt="Manus" class="manus-logo">
                </div>
                <span class="manus-name">manus</span>
            </div>
            <div class="manus-content">
                <div class="thinking-process-section" style="display: none;">
                    <div class="thinking-header" onclick="toggleThinking('${messageId}')">
                        <div class="thinking-title">
                            <i class="bi bi-lightbulb"></i>
                            <span>思考过程</span>
                        </div>
                        <div class="thinking-toggle">
                            <i class="bi bi-chevron-down"></i>
                        </div>
                    </div>
                    <div class="thinking-content">
                        <div class="thinking-steps">
                            <!-- 思考步骤将在这里动态添加 -->
                        </div>
                    </div>
                </div>
                <div class="message-text" style="display: none;">
                    <!-- 消息内容将在这里显示 -->
                </div>
            </div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        </div>
    `;

    chatContainer.appendChild(manusMessage);

    // 设置logo备用方案
    const logoElement = manusMessage.querySelector('.manus-logo');
    setupManusLogoFallback(logoElement);

    return manusMessage;
}

/**
 * 为历史恢复更新思考过程
 */
function updateThinkingProcessForHistory(manusMessage, steps) {
    if (!manusMessage || !steps.length) return;

    const thinkingSection = manusMessage.querySelector('.thinking-process-section');
    const thinkingStepsContainer = manusMessage.querySelector('.thinking-steps');

    if (thinkingSection && thinkingStepsContainer) {
        // 显示思考过程区域
        thinkingSection.style.display = 'block';

        // 清空并重新添加所有思考步骤
        thinkingStepsContainer.innerHTML = '';
        steps.forEach(step => {
            const thinkingStep = document.createElement('div');
            thinkingStep.className = 'thinking-step';
            thinkingStep.innerHTML = `
                <div class="thinking-step-content">${step.content}</div>
                <div class="thinking-step-time">${step.time}</div>
            `;
            thinkingStepsContainer.appendChild(thinkingStep);
        });
    }
}

/**
 * 格式化日期
 */
function formatDate(date) {
    return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric'
    });
}

/**
 * 格式化时间
 */
function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * 返回主页面
 */
function returnToMainPage() {
    if (taskPage) taskPage.style.display = 'none';
    if (mainPage) mainPage.style.display = 'block';

    // 重置URL到主页面
    window.history.pushState({}, '', '/');
    console.log('URL已重置到主页面');

    // 清除任务状态
    localStorage.removeItem('manusTaskState');

    // 清除会话标记
    sessionStorage.removeItem('shouldRestoreTask');

    // 清空文本框
    if (mainTextarea) {
        mainTextarea.value = '';
        autoResizeTextarea(mainTextarea);
    }

    // 重置全局状态
    currentTaskId = null;
    currentFlowId = null;
    currentMode = 'adaptive';

    // 设置默认模式
    currentMode = 'adaptive';
}

/**
 * 切换主题
 */
function toggleTheme() {
    isDarkMode = !isDarkMode;

    if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeToggle) {
            themeToggle.querySelector('i').className = 'bi bi-sun';
        }
    } else {
        document.documentElement.removeAttribute('data-theme');
        if (themeToggle) {
            themeToggle.querySelector('i').className = 'bi bi-moon';
        }
    }

    localStorage.setItem('manusTheme', isDarkMode ? 'dark' : 'light');
}

/**
 * 加载主题偏好
 */
function loadThemePreference() {
    const savedTheme = localStorage.getItem('manusTheme');
    if (savedTheme === 'dark') {
        isDarkMode = true;
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeToggle) {
            themeToggle.querySelector('i').className = 'bi bi-sun';
        }
    }
}

/**
 * 显示Toast通知
 */
function showToast(message, type = 'info') {
    // 创建toast元素
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // 添加样式
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-size: 14px;
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;

    // 根据类型设置背景色
    const colors = {
        'success': '#28a745',
        'error': '#dc3545',
        'warning': '#ffc107',
        'info': '#17a2b8'
    };
    toast.style.backgroundColor = colors[type] || colors.info;

    // 添加到页面
    document.body.appendChild(toast);

    // 显示动画
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 100);

    // 自动隐藏
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}
