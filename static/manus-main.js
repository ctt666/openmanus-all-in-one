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
            console.log('🔗 handleInteraction 开始 - 参数:', { message, mode, taskId, flowId, currentSessionId });

            // 根据模式选择正确的API端点
            let endpoint;
            let requestBody;

            // 获取聊天历史记录并转换为后端期望的格式
            const rawChatHistory = chatHistoryManager.getHistory();

            // 排除最后一条消息（用户刚刚发送的消息），因为已经通过prompt参数传递
            const historyWithoutLastMessage = rawChatHistory.slice(0, -1);

            const chatHistory = historyWithoutLastMessage.map(msg => {
                // 将前端的type字段转换为后端期望的role字段
                let role;
                if (msg.type === 'user') {
                    role = 'user';
                } else if (msg.type === 'manus' || msg.type === 'thinking') {
                    role = 'assistant';
                } else {
                    role = 'assistant'; // 默认为assistant
                }

                return {
                    role: role,
                    content: msg.content
                };
            });
            console.log('📚 原始聊天历史记录:', rawChatHistory);
            console.log('📚 排除最后一条消息后的历史记录:', historyWithoutLastMessage);
            console.log('📚 转换后的聊天历史记录:', chatHistory);

            if (taskId) {
                // 使用task API
                endpoint = '/task';
                requestBody = {
                    prompt: message,
                    task_id: taskId,
                    session_id: currentSessionId,
                    chat_history: chatHistory
                };
                console.log('📝 使用task API:', endpoint, requestBody);
            } else if (flowId) {
                // 使用flow API
                endpoint = '/flow';
                requestBody = {
                    prompt: message,
                    flow_id: flowId,
                    session_id: currentSessionId,
                    chat_history: chatHistory
                };
                console.log('📝 使用flow API:', endpoint, requestBody);
            } else {
                throw new Error('No task or flow ID provided');
            }

            console.log('🚀 发送请求到:', endpoint);
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            console.log('📡 收到响应:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ 响应错误:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('✅ 响应数据:', data);
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('❌ 处理交互失败:', error);
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

        console.log(`🔗 连接到SSE事件流: ${endpoint}`);

        const eventSource = new EventSource(endpoint);

        // 处理各种事件类型
        eventSource.onmessage = (event) => {
            try {
                console.log('📨 收到SSE消息:', event.data);
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (error) {
                console.error('解析事件数据失败:', error);
            }
        };

        // 处理特定事件类型
        eventSource.addEventListener('status', (event) => {
            console.log('📊 状态事件:', event.data);
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (error) {
                console.error('解析状态事件失败:', error);
            }
        });

        eventSource.addEventListener('think', (event) => {
            console.log('💭 思考事件:', event.data);
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (error) {
                console.error('解析思考事件失败:', error);
            }
        });

        eventSource.addEventListener('log', (event) => {
            console.log('📝 日志事件:', event.data);
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (error) {
                console.error('解析日志事件失败:', error);
            }
        });

        eventSource.addEventListener('plan', (event) => {
            console.log('📋 计划事件:', event.data);
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (error) {
                console.error('解析计划事件失败:', error);
            }
        });

        eventSource.addEventListener('step_start', (event) => {
            console.log('🚀 步骤开始事件:', event.data);
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (error) {
                console.error('解析步骤开始事件失败:', error);
            }
        });

        eventSource.addEventListener('step', (event) => {
            console.log('📝 步骤事件:', event.data);
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (error) {
                console.error('解析步骤事件失败:', error);
            }
        });

        eventSource.addEventListener('step_finish', (event) => {
            console.log('✅ 步骤完成事件:', event.data);
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (error) {
                console.error('解析步骤完成事件失败:', error);
            }
        });

        eventSource.addEventListener('interaction', (event) => {
            console.log('🔄 交互事件:', event.data);
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (error) {
                console.error('解析交互事件失败:', error);
            }
        });

        eventSource.addEventListener('ask_human', (event) => {
            console.log('🤔 询问人类事件:', event.data);
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (error) {
                console.error('解析询问人类事件失败:', error);
            }
        });

        eventSource.addEventListener('complete', (event) => {
            console.log('✅ 完成事件:', event.data);
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (error) {
                console.error('解析完成事件失败:', error);
            }
        });

        eventSource.addEventListener('error', (event) => {
            console.log('❌ 错误事件:', event.data);
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (error) {
                console.error('解析错误事件失败:', error);
            }
        });

        eventSource.onopen = () => {
            console.log('✅ SSE连接已建立');
        };

        eventSource.onerror = (error) => {
            console.error('❌ SSE连接错误:', error);
            onError(error);
        };

        eventSource.addEventListener('close', () => {
            console.log('🔌 SSE连接关闭');
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

        if (!bubbleText || !this.tooltip) return;

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
        if (!this.currentTarget || !this.tooltip) return;

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
            if (this.tooltip) {
                this.tooltip.style.opacity = '0';
            }
            this.currentTarget = null;
        }, 100);
    }

    updatePosition(event) {
        if (!this.currentTarget || !this.tooltip) return;

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
        console.log('🔍 历史记录API响应:', result);

        if (result.success) {
            console.log('🔍 历史记录数据:', result.data);
            displayHistory(result.data);
        } else {
            console.error('❌ 历史记录加载失败:', result.error);
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
    console.log('🔍 displayHistory调用，historyData:', historyData);
    console.log('🔍 historyData类型:', typeof historyData);
    console.log('🔍 historyData是否为数组:', Array.isArray(historyData));

    if (!historyList) {
        console.error('❌ historyList元素不存在！');
        return;
    }

    // 检查historyData是否为数组，如果不是则尝试提取数组
    let historyArray = historyData;
    if (historyData && typeof historyData === 'object' && !Array.isArray(historyData)) {
        console.log('🔍 historyData是对象，尝试提取数组...');
        // 如果historyData是对象，尝试提取数组
        if (historyData.chat_history && Array.isArray(historyData.chat_history)) {
            historyArray = historyData.chat_history;
            console.log('✅ 使用chat_history数组，长度:', historyArray.length);
        } else if (historyData.flow_history && Array.isArray(historyData.flow_history)) {
            historyArray = historyData.flow_history;
            console.log('✅ 使用flow_history数组，长度:', historyArray.length);
        } else if (historyData.data && Array.isArray(historyData.data)) {
            historyArray = historyData.data;
            console.log('✅ 使用data数组，长度:', historyArray.length);
        } else {
            console.warn('❌ historyData不是数组格式，无法提取数组:', historyData);
            historyArray = [];
        }
    } else if (Array.isArray(historyData)) {
        console.log('✅ historyData已经是数组，长度:', historyData.length);
    } else {
        console.warn('❌ historyData不是有效的数据格式:', historyData);
        historyArray = [];
    }

    if (!historyArray || !Array.isArray(historyArray) || historyArray.length === 0) {
        historyList.innerHTML = `
            <div class="history-empty">
                <i class="bi bi-chat-dots"></i>
                <p>暂无历史对话</p>
                <p>开始创建你的第一个任务吧！</p>
            </div>
        `;
        return;
    }

    const historyHTML = historyArray.map(item => `
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
    await handleSubmitWithText(text);
}

/**
 * 处理提交（带文本参数）
 */
async function handleSubmitWithText(text) {
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

        if (currentMode === 'agent') {
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

    // 创建任务并跳转到任务页面，传递文本内容
    await handleSubmitWithText(text);
}

/**
 * 显示任务执行页面
 */
function showTaskPage(taskText, mode, taskId = null, taskType = null) {
    console.log('🔍 显示任务页面 - taskText:', taskText, 'mode:', mode, 'taskId:', taskId, 'taskType:', taskType);
    console.log('🔍 mainPage元素:', mainPage);
    console.log('🔍 taskPage元素:', taskPage);

    if (mainPage) {
        mainPage.style.display = 'none';
        console.log('✅ 隐藏主页面');
    } else {
        console.error('❌ mainPage元素不存在！');
    }

    if (taskPage) {
        taskPage.style.display = 'block';
        console.log('✅ 显示任务页面');
    } else {
        console.error('❌ taskPage元素不存在！');
    }

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

    // 初始化任务页面，设置任务ID
    initializeTaskPage(taskId, taskType);

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
        'agent': 'Agent模式',
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
                <!-- 内容包装器 - 占据4/5宽度居中 -->
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
                <div class="chat-input-section">
                    <!-- 完整的聊天框容器 -->
                    <div class="chat-box-container">
                        <!-- 主输入框 -->
                        <div class="main-input-area">
                            <textarea class="chat-textarea" id="taskInputField" placeholder="输入您的消息..." rows="2"></textarea>
                        </div>

                        <!-- 输入控制按钮 -->
                        <div class="input-controls">
                            <div class="control-buttons-left">
                                <button class="control-btn upload-btn" data-tooltip="上传文件及更多">
                                    <i class="bi bi-plus"></i>
                                </button>
                                <div class="mode-buttons-container">
                                    <ul class="mode-buttons-list">
                                        <li class="mode-button-item">
                                            <button type="button" class="mode-btn ${mode === 'adaptive' ? 'active' : ''}" data-mode="adaptive" data-bubble-text="智能适配即时答案和 Agent 模式">
                                                <div class="mode-btn-content">
                                                    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16" color="var(--icon-secondary)" class="mode-icon">
                                                        <g clip-path="url(#e6892072d0f08b69f567f6a075d5191f0)">
                                                            <path d="M7.9987 8.66927C8.36689 8.66927 8.66536 8.37079 8.66536 8.0026C8.66536 7.63441 8.36689 7.33594 7.9987 7.33594C7.63051 7.33594 7.33203 7.63441 7.33203 8.0026C7.33203 8.37079 7.63051 8.66927 7.9987 8.66927Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                                                            <path d="M10.4679 5.5321C7.43972 2.51725 3.8846 1.16991 2.53059 2.53059C1.16991 3.8846 2.51725 7.43972 5.5321 10.4679" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                                                            <path d="M13.729 5.5321C14.1482 4.24274 14.0955 3.15364 13.4694 2.53059C12.1154 1.16991 8.56028 2.51725 5.5321 5.5321C2.51725 8.56028 1.16991 12.1154 2.53059 13.4694C3.34907 14.2919 4.97182 14.1249 6.79629 13.1982" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                                                            <path d="M13.9043 13.6582L13.5625 12.7598H10.6523L10.3105 13.6777C10.1771 14.0358 10.0632 14.2783 9.96875 14.4053C9.87435 14.529 9.71973 14.5908 9.50488 14.5908C9.32259 14.5908 9.16146 14.5241 9.02148 14.3906C8.88151 14.2572 8.81152 14.1058 8.81152 13.9365C8.81152 13.8389 8.8278 13.738 8.86035 13.6338C8.8929 13.5296 8.94661 13.3848 9.02148 13.1992L10.8525 8.55078C10.9046 8.41732 10.9665 8.25781 11.0381 8.07227C11.113 7.88346 11.1911 7.72721 11.2725 7.60352C11.3571 7.47982 11.4661 7.38053 11.5996 7.30566C11.7363 7.22754 11.904 7.18848 12.1025 7.18848C12.3044 7.18848 12.472 7.22754 12.6055 7.30566C12.7422 7.38053 12.8512 7.47819 12.9326 7.59863C13.0173 7.71908 13.0872 7.84928 13.1426 7.98926C13.2012 8.12598 13.2744 8.3099 13.3623 8.54102L15.2324 13.1602C15.3789 13.5117 15.4521 13.7673 15.4521 13.9268C15.4521 14.0928 15.3822 14.2458 15.2422 14.3857C15.1055 14.5225 14.9395 14.5908 14.7441 14.5908C14.6302 14.5908 14.5326 14.5697 14.4512 14.5273C14.3698 14.4883 14.3014 14.4346 14.2461 14.3662C14.1908 14.2946 14.1305 14.1872 14.0654 14.0439C14.0036 13.8975 13.9499 13.7689 13.9043 13.6582ZM11.0332 11.6709H13.1719L12.0928 8.7168L11.0332 11.6709Z" fill="currentColor"></path>
                                                        </g>
                                                        <defs>
                                                            <clipPath id="e6892072d0f08b69f567f6a075d5191f0">
                                                                <rect width="16" height="16" fill="white"></rect>
                                                            </clipPath>
                                                        </defs>
                                                    </svg>
                                                </div>
                                            </button>
                                            <div class="mode-btn-bg"></div>
                                        </li>
                                        <li class="mode-button-item">
                                            <button type="button" class="mode-btn ${mode === 'agent' ? 'active' : ''}" data-mode="agent" data-bubble-text="处理复杂任务并自主交付结果">
                                                <div class="mode-btn-content">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" width="16" height="16" color="var(--icon-secondary)" class="mode-icon">
                                                        <path d="M7.9987 8.66536C8.36689 8.66536 8.66536 8.36689 8.66536 7.9987C8.66536 7.63051 8.36689 7.33203 7.9987 7.33203C7.63051 7.33203 7.33203 7.63051 7.33203 7.9987C7.33203 8.36689 7.63051 8.66536 7.9987 8.66536Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                                                        <path d="M13.4694 13.4694C14.8301 12.1154 13.4827 8.56028 10.4679 5.5321C7.43972 2.51725 3.8846 1.16991 2.53059 2.53059C1.16991 3.8846 2.51725 7.43972 5.5321 10.4679C8.56028 13.4827 12.1154 14.8301 13.4694 13.4694Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                                                        <path d="M10.4679 10.4679C13.4827 7.43972 14.8301 3.8846 13.4694 2.53059C12.1154 1.16991 8.56028 2.51725 5.5321 5.5321C2.51725 8.56028 1.16991 12.1154 2.53059 13.4694C3.8846 14.8301 7.43972 13.4827 10.4679 10.4679Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                                                    </svg>
                                                </div>
                                            </button>
                                            <div class="mode-btn-bg"></div>
                                        </li>
                                        <li class="mode-button-item">
                                            <button type="button" class="mode-btn ${mode === 'chat' ? 'active' : ''}" data-mode="chat" data-bubble-text="回答日常问题或在开始任务前进行对话">
                                                <div class="mode-btn-content">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" width="16" height="16" color="var(--icon-primary)" class="mode-icon">
                                                        <path d="M14 10C14 10.3536 13.8595 10.6928 13.6095 10.9428C13.3594 11.1929 13.0203 11.3333 12.6667 11.3333H4.66667L2 14V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H12.6667C13.0203 2 13.3594 2.14048 13.6095 2.39052C13.8595 2.64057 14 2.97971 14 3.33333V10Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                                                        <path d="M5.33337 6.66602H5.34004" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
                                                        <path d="M8 6.66602H8.00667" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
                                                        <path d="M10.6666 6.66602H10.6733" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
                                                    </svg>
                                                </div>
                                            </button>
                                            <div class="mode-btn-bg"></div>
                                        </li>
                                    </ul>
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
    // 设置当前任务ID和类型
    if (taskId && taskType) {
        if (taskType === 'flow') {
            currentFlowId = taskId;
            currentTaskId = null;
        } else {
            currentTaskId = taskId;
            currentFlowId = null;
        }

        // 确保有session ID
        if (!currentSessionId) {
            currentSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        console.log('任务页面初始化 - TaskId:', currentTaskId, 'FlowId:', currentFlowId, 'Type:', taskType, 'SessionId:', currentSessionId);
    }

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

        // 加载步骤数据
        const stepsLoaded = agentStepsManager.loadSteps(taskId);
        if (stepsLoaded && agentSteps.length > 0) {
            console.log('步骤数据已加载，更新UI');
            updateAgentStepsUI();
        }
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

// 全局变量：当前的Manus消息容器（已废弃，使用新的思考过程容器）
// let currentManusMessage = null;
// let thinkingSteps = [];

// Agent模式步骤管理
let agentSteps = [];  // 当前agent模式的步骤列表
let currentStepIndex = -1;  // 当前正在执行的步骤索引
let agentStepsManager = {
    // 添加新步骤
    addStep: function (stepContent, stepType = 'step') {
        const step = {
            id: Date.now() + Math.random(),
            content: stepContent,
            type: stepType,
            status: 'pending', // pending, in_progress, completed
            subEvents: [], // think, act等子事件
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

    // 获取当前步骤
    getCurrentStep: function () {
        return agentSteps[currentStepIndex] || null;
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
            // 尝试从多个来源获取任务ID
            let taskId = currentTaskId || currentFlowId;

            // 如果还是没有，尝试从URL获取
            if (!taskId) {
                const urlParams = new URLSearchParams(window.location.search);
                taskId = urlParams.get('taskId');
            }

            // 如果还是没有，使用默认值
            if (!taskId) {
                taskId = 'default';
            }

            const key = `manusAgentSteps_${taskId}`;
            const stepsData = {
                steps: agentSteps,
                currentStepIndex: currentStepIndex,
                timestamp: Date.now(),
                taskId: taskId
            };
            localStorage.setItem(key, JSON.stringify(stepsData));
            console.log('步骤数据已保存:', key, '步骤数量:', agentSteps.length, '任务ID:', taskId);
        } catch (error) {
            console.error('保存步骤数据失败:', error);
        }
    },

    // 从localStorage加载步骤
    loadSteps: function (taskId) {
        try {
            // 尝试多个可能的键
            const possibleKeys = [];

            if (taskId) {
                possibleKeys.push(`manusAgentSteps_${taskId}`);
            }

            // 尝试从URL获取taskId
            const urlParams = new URLSearchParams(window.location.search);
            const urlTaskId = urlParams.get('taskId');
            if (urlTaskId && !possibleKeys.includes(`manusAgentSteps_${urlTaskId}`)) {
                possibleKeys.push(`manusAgentSteps_${urlTaskId}`);
            }

            // 尝试当前的任务ID
            if (currentTaskId && !possibleKeys.includes(`manusAgentSteps_${currentTaskId}`)) {
                possibleKeys.push(`manusAgentSteps_${currentTaskId}`);
            }

            // 尝试当前的flow ID
            if (currentFlowId && !possibleKeys.includes(`manusAgentSteps_${currentFlowId}`)) {
                possibleKeys.push(`manusAgentSteps_${currentFlowId}`);
            }

            // 最后尝试默认键
            possibleKeys.push('manusAgentSteps_default');

            console.log('尝试加载步骤数据，可能的键:', possibleKeys);

            for (const key of possibleKeys) {
                const stepsStr = localStorage.getItem(key);
                if (stepsStr) {
                    console.log('找到步骤数据，键:', key);

                    const stepsData = JSON.parse(stepsStr);
                    console.log('步骤数据内容:', stepsData);

                    // 检查数据是否过期（7天）
                    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
                    if (Date.now() - stepsData.timestamp > maxAge) {
                        console.log('步骤数据已过期，删除:', key);
                        localStorage.removeItem(key);
                        continue;
                    }

                    agentSteps = stepsData.steps || [];
                    currentStepIndex = stepsData.currentStepIndex || -1;
                    console.log('步骤数据已加载:', key, agentSteps.length, '个步骤', '当前步骤索引:', currentStepIndex);
                    return true;
                }
            }

            console.log('没有找到任何步骤数据');
            return false;
        } catch (error) {
            console.error('加载步骤数据失败:', error);
            return false;
        }
    }
};

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
    },

    // 获取当前聊天历史
    getHistory: function () {
        return chatHistory || [];
    }
};

/**
 * 处理任务事件
 */
function handleTaskEvent(event) {
    console.log('收到任务事件:', event);
    console.log('事件类型:', event.type, '事件内容:', event);

    // 处理所有agent模式相关的事件
    switch (event.type) {
        case 'plan':
            console.log('📋 处理plan事件');
            handlePlanEvent(event);
            break;
        case 'step_start':
            console.log('🚀 处理step_start事件');
            console.log('🚀 step_start事件详情:', JSON.stringify(event, null, 2));
            handleStepStartEvent(event);
            break;
        case 'step_finish':
            console.log('✅ 处理step_finish事件');
            console.log('✅ step_finish事件详情:', JSON.stringify(event, null, 2));
            handleStepFinishEvent(event);
            break;
        case 'step':
            console.log('📝 处理step事件');
            console.log('📝 step事件详情:', JSON.stringify(event, null, 2));
            handleStepEvent(event);
            break;
        case 'interaction':
            console.log('🔄 处理interaction事件');
            handleInteractionEvent(event);
            break;
        case 'complete':
            console.log('🏁 处理complete事件');
            handleCompleteEvent(event);
            break;
        case 'think':
            console.log('💭 处理think事件');
            // 只在chat模式下处理think事件，agent模式下已归为step事件
            if (currentMode !== 'agent') {
                handleThinkEvent(event);
            }
            break;
        case 'act':
            console.log('🔧 处理act事件');
            // 只在chat模式下处理act事件，agent模式下已归为step事件
            if (currentMode !== 'agent') {
                handleActEvent(event);
            }
            break;
        case 'summary':
            console.log('📊 处理summary事件');
            handleSummaryEvent(event);
            break;
        case 'ask_human':
            // ask_human事件会触发interaction事件，这里只记录日志
            console.log('🤔 收到ask_human事件，等待interaction事件:', event);
            break;
        default:
            // 其他事件只在控制台记录，不显示在页面上
            console.log(`[忽略事件] ${event.type}:`, event);
    }
}

/**
 * 处理步骤事件
 */
function handleStepEvent(event) {
    if (event.content) {
        addChatMessage(event.content);
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
                addChatMessage(step.content);
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
    addChatMessage(event.question || event.message);
    console.log('等待用户回复...');
}

/**
 * 处理think事件（仅在chat模式下）
 */
function handleThinkEvent(event) {
    console.log('💭 处理think事件:', event);

    if (event.result) {
        // 只在chat模式下处理think事件
        if (currentMode === 'agent') {
            console.log('⚠️ agent模式下think事件已归为step事件，跳过处理');
            return;
        }

        // 添加思考步骤到当前openmanus消息
        addThinkingStepToCurrentMessage(event.result);

        // 保存思考步骤到聊天历史
        chatHistoryManager.addMessage('thinking', event.result);

        console.log('✅ think事件已添加到思考过程区域');
    }
}

/**
 * 处理act事件（仅在chat模式下）
 */
function handleActEvent(event) {
    console.log('🔧 处理act事件:', event);

    if (event.result) {
        // 只在chat模式下处理act事件
        if (currentMode === 'agent') {
            console.log('⚠️ agent模式下act事件已归为step事件，跳过处理');
            return;
        }

        // 直接添加到聊天消息
        addChatMessage(event.result);

        // 保存到聊天历史
        chatHistoryManager.addMessage('manus', event.result);

        console.log('✅ act事件已添加到聊天界面');
    }
}

/**
 * 处理interaction事件
 */
function handleInteractionEvent(event) {
    console.log('🔄 处理interaction事件:', event);

    if (event.result) {
        // 第三部分：添加到聊天消息
        addAgentChatMessage('interaction', event.result);

        // 保存到聊天历史
        chatHistoryManager.addMessage('manus', event.result);
        console.log('✅ interaction事件内容已添加到聊天界面');
    } else {
        console.log('⚠️ interaction事件没有result字段:', event);
    }
}

/**
 * 处理complete事件
 */
function handleCompleteEvent(event) {
    console.log('🏁 处理complete事件:', event);

    if (event.result) {
        // 第三部分：添加到聊天消息
        addAgentChatMessage('complete', event.result);

        // 保存到聊天历史
        chatHistoryManager.addMessage('manus', event.result);
        console.log('✅ complete事件内容已添加到聊天界面');
    }
}

/**
 * 处理tool事件
 */
function handleToolEvent(event) {
    console.log(`🔧 使用工具: ${event.tool || '未知工具'}`);
    if (event.content) {
        addChatMessage(event.content);
    }
}

/**
 * 处理message事件
 */
function handleMessageEvent(event) {
    if (event.content) {
        addChatMessage(event.content);
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
 * 处理日志事件
 */
function handleLogEvent(event) {
    console.log('📝 日志事件:', event.result || event.message);
    if (event.result || event.message) {
        // 直接添加聊天消息，不使用已废弃的addAssistantMessage
        addChatMessage(event.result || event.message);
    }
}

/**
 * 处理计划事件
 */
function handlePlanEvent(event) {
    console.log('📋 处理plan事件:', event);

    if (event.result) {
        console.log('🔍 开始处理plan事件，内容:', event.result);

        // 清空之前的步骤
        agentStepsManager.clearSteps();

        // 创建agent模式的消息容器
        console.log('🔍 调用createAgentModeMessage...');
        createAgentModeMessage();

        // 第一部分：添加计划内容到聊天消息
        console.log('🔍 调用addAgentChatMessage...');
        addAgentChatMessage('plan', event.result);

        // 保存到聊天历史
        chatHistoryManager.addMessage('manus', event.result);

        console.log('✅ plan事件已添加到聊天界面');
    }
}

/**
 * 处理步骤开始事件
 */
function handleStepStartEvent(event) {
    console.log('🚀 处理step_start事件:', event);
    console.log('🚀 当前agentSteps数组:', agentSteps);

    if (event.result) {
        // 第二部分：添加新步骤到步骤列表
        const step = agentStepsManager.addStep(event.result, 'step');
        step.status = 'in_progress';

        // 设置当前步骤
        agentStepsManager.setCurrentStep(agentSteps.length - 1);

        console.log('🚀 添加步骤后agentSteps数组:', agentSteps);
        console.log('🚀 当前步骤索引:', currentStepIndex);

        // 更新UI显示步骤列表
        updateAgentStepsUI();

        console.log('✅ step_start事件已添加到步骤列表');
    }
}

/**
 * 处理步骤完成事件
 */
function handleStepFinishEvent(event) {
    console.log('✅ 处理step_finish事件:', event);
    console.log('✅ 当前agentSteps数组:', agentSteps);
    console.log('✅ 当前步骤索引:', currentStepIndex);

    if (event.result) {
        // 第二部分：更新当前步骤状态为完成
        const currentStep = agentStepsManager.getCurrentStep();
        if (currentStep) {
            agentStepsManager.updateStepStatus(currentStep.id, 'completed');
            console.log('✅ 更新步骤状态为completed:', currentStep);

            // 更新UI显示步骤完成状态（打勾表示完成）
            updateAgentStepsUI();

            console.log('✅ step_finish事件已更新步骤状态');
        } else {
            console.log('⚠️ 没有找到当前步骤');
        }
    }
}

/**
 * 处理step事件
 */
function handleStepEvent(event) {
    console.log('📝 处理step事件:', event);

    if (event.result) {
        // 第二部分：添加step内容到当前步骤的子事件中
        const currentStep = agentStepsManager.getCurrentStep();
        if (currentStep) {
            agentStepsManager.addSubEvent(currentStep.id, 'step', event.result);

            // 更新UI显示子事件
            updateAgentStepsUI();

            console.log('✅ step事件已添加到当前步骤');
        } else {
            // 如果没有当前步骤，创建一个新的步骤
            console.log('⚠️ 没有当前步骤，创建新步骤');
            const step = agentStepsManager.addStep('自动创建的步骤', 'step');
            step.status = 'in_progress';
            agentStepsManager.setCurrentStep(agentSteps.length - 1);

            // 添加step内容到新步骤的子事件中
            agentStepsManager.addSubEvent(step.id, 'step', event.result);

            // 更新UI显示
            updateAgentStepsUI();

            console.log('✅ step事件已添加到新创建的步骤');
        }
    }
}

/**
 * 处理总结事件
 */
function handleSummaryEvent(event) {
    console.log('📊 处理summary事件:', event);

    if (event.result) {
        // 第三部分：添加到聊天消息
        addAgentChatMessage('summary', event.result);
    }
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
 * 添加调试日志到页面
 */
function addDebugLog(message) {
    const chatContainer = document.getElementById('taskChatContainer');
    if (!chatContainer) return;

    const debugMessage = document.createElement('div');
    debugMessage.className = 'debug-message';
    debugMessage.innerHTML = `
        <div class="debug-message-content">
            <i class="bi bi-bug"></i>
            <span>${message}</span>
            <div class="debug-message-time">${new Date().toLocaleTimeString()}</div>
        </div>
    `;
    chatContainer.appendChild(debugMessage);
    scrollChatToBottom();
}

/**
 * 确保思考过程容器存在
 */
function ensureThinkingProcessContainer() {
    const chatContainer = document.getElementById('taskChatContainer');
    if (!chatContainer) return;

    // 检查是否已存在思考过程容器
    let thinkingContainer = document.getElementById('thinkingProcessContainer');
    if (!thinkingContainer) {
        thinkingContainer = document.createElement('div');
        thinkingContainer.id = 'thinkingProcessContainer';
        thinkingContainer.className = 'thinking-process-container';
        thinkingContainer.innerHTML = `
            <div class="thinking-process-header" onclick="toggleThinkingProcess()">
                <div class="thinking-process-title">
                    <img src="/assets/logo.jpg" alt="manus" class="thinking-process-icon">
                    <span>思考过程</span>
                </div>
                <div class="thinking-process-toggle">
                    <i class="bi bi-chevron-up"></i>
                </div>
            </div>
            <div class="thinking-process-content">
                <div class="thinking-process-steps">
                    <!-- 思考步骤将在这里动态添加 -->
                </div>
            </div>
        `;

        // 插入到聊天容器的开头
        chatContainer.insertBefore(thinkingContainer, chatContainer.firstChild);

        // 设置logo备用方案
        const logoElement = thinkingContainer.querySelector('.thinking-process-icon');
        setupManusLogoFallback(logoElement);
    }

    return thinkingContainer;
}

/**
 * 添加思考步骤
 */
function addThinkingStep(content) {
    const thinkingContainer = document.getElementById('thinkingProcessContainer');
    if (!thinkingContainer) return;

    const stepsContainer = thinkingContainer.querySelector('.thinking-process-steps');
    if (!stepsContainer) return;

    const stepElement = document.createElement('div');
    stepElement.className = 'thinking-step';
    stepElement.innerHTML = `
        <div class="thinking-step-content">${content}</div>
    `;

    stepsContainer.appendChild(stepElement);
    scrollChatToBottom();
}

/**
 * 切换思考过程显示/隐藏
 */
function toggleThinkingProcess() {
    const thinkingContainer = document.querySelector('.thinking-process-container');
    if (!thinkingContainer) return;

    const content = thinkingContainer.querySelector('.thinking-process-content');
    const toggleButton = thinkingContainer.querySelector('.thinking-process-toggle');

    if (content && toggleButton) {
        if (content.style.display === 'none' || content.style.display === '') {
            content.style.display = 'block';
            toggleButton.classList.remove('rotated');
        } else {
            content.style.display = 'none';
            toggleButton.classList.add('rotated');
        }
    }
}

// 当前openmanus回复消息的引用
let currentManusMessage = null;

/**
 * 创建agent模式的消息容器
 */
function createAgentModeMessage() {
    console.log('🔍 创建agent模式消息容器...');
    const chatContainer = document.getElementById('taskChatContainer');
    console.log('🔍 taskChatContainer元素:', chatContainer);
    if (!chatContainer) {
        console.error('❌ 找不到taskChatContainer元素！');
        return null;
    }

    // 清除当前的openmanus消息引用
    clearCurrentManusMessage();

    currentManusMessage = document.createElement('div');
    currentManusMessage.className = 'chat-message-block agent-mode-message';
    currentManusMessage.innerHTML = `
        <div class="chat-message-header">
            <img src="/assets/logo.jpg" alt="OpenManus" class="chat-message-logo">
            <span class="chat-message-name">OpenManus</span>
        </div>
        <div class="agent-steps-container">
            <div class="agent-steps-list" id="agentStepsList">
                <!-- 步骤列表将在这里动态生成 -->
            </div>
        </div>
        <div class="manus-response-content"></div>
    `;

    chatContainer.appendChild(currentManusMessage);

    // 设置logo备用方案
    const logoElements = currentManusMessage.querySelectorAll('img');
    logoElements.forEach(logo => setupManusLogoFallback(logo));

    scrollChatToBottom();
    return currentManusMessage;
}

/**
 * 创建或获取当前的openmanus回复消息
 */
function getCurrentManusMessage() {
    if (!currentManusMessage) {
        const chatContainer = document.getElementById('taskChatContainer');
        if (!chatContainer) return null;

        currentManusMessage = document.createElement('div');
        currentManusMessage.className = 'chat-message-block';
        currentManusMessage.innerHTML = `
            <div class="chat-message-header">
                <img src="/assets/logo.jpg" alt="OpenManus" class="chat-message-logo">
                <span class="chat-message-name">OpenManus</span>
            </div>
            <div class="thinking-process-container" style="display: none;">
                <div class="thinking-process-header">
                    <div class="thinking-process-title">思考过程</div>
                    <div class="thinking-process-toggle" onclick="toggleThinkingProcess()">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down">
                            <path d="m6 9 6 6 6-6"></path>
                        </svg>
                    </div>
                </div>
                <div class="thinking-process-content">
                    <div class="thinking-process-steps"></div>
                </div>
            </div>
            <div class="manus-response-content"></div>
        `;

        chatContainer.appendChild(currentManusMessage);

        // 设置logo备用方案
        const logoElements = currentManusMessage.querySelectorAll('img');
        logoElements.forEach(logo => setupManusLogoFallback(logo));

        scrollChatToBottom();
    }
    return currentManusMessage;
}

/**
 * 清除当前的openmanus回复消息引用
 */
function clearCurrentManusMessage() {
    currentManusMessage = null;
}

/**
 * 添加思考步骤到当前openmanus消息
 */
function addThinkingStepToCurrentMessage(content) {
    const message = getCurrentManusMessage();
    if (!message) return;

    const thinkingContainer = message.querySelector('.thinking-process-container');
    const thinkingSteps = message.querySelector('.thinking-process-steps');

    if (thinkingContainer && thinkingSteps) {
        // 显示思考过程容器
        thinkingContainer.style.display = 'block';

        // 添加思考步骤
        const stepElement = document.createElement('div');
        stepElement.className = 'thinking-step';

        // 解析内容，提取标题和描述
        const lines = content.split('\n').filter(line => line.trim());
        const title = lines[0] || '思考步骤';
        const description = lines.slice(1).join('\n') || content;

        stepElement.innerHTML = `
            <div class="thinking-step-header">
                <div class="thinking-step-dot"></div>
                <strong class="thinking-step-title">${title}</strong>
            </div>
            <div class="thinking-step-content-wrapper">
                <div class="thinking-step-connector"></div>
                <div class="thinking-step-content">${description}</div>
            </div>
        `;
        thinkingSteps.appendChild(stepElement);

        scrollChatToBottom();
    }
}

/**
 * 添加内容到当前openmanus消息的响应部分
 */
function addContentToCurrentMessage(content) {
    const message = getCurrentManusMessage();
    if (!message) return;

    const responseContent = message.querySelector('.manus-response-content');
    if (responseContent) {
        // 将换行符转换为HTML换行，并转义HTML特殊字符
        const formattedContent = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');

        responseContent.innerHTML += formattedContent;
        scrollChatToBottom();
    }
}

/**
 * 更新agent步骤UI
 */
function updateAgentStepsUI() {
    console.log('🔄 更新agent步骤UI');
    console.log('🔄 当前agentSteps数组:', agentSteps);
    console.log('🔄 当前步骤索引:', currentStepIndex);

    const stepsList = document.getElementById('agentStepsList');
    if (!stepsList) {
        console.log('⚠️ 找不到agentStepsList元素');
        return;
    }

    // 清空现有内容
    stepsList.innerHTML = '';

    // 遍历所有步骤并创建UI
    agentSteps.forEach((step, index) => {
        console.log(`🔄 创建步骤元素 ${index}:`, step);
        const stepElement = createStepElement(step, index);
        stepsList.appendChild(stepElement);
    });

    console.log('🔄 步骤UI更新完成，共创建', agentSteps.length, '个步骤');
    scrollChatToBottom();
}

/**
 * 创建步骤元素
 */
function createStepElement(step, index) {
    const stepDiv = document.createElement('div');
    stepDiv.className = 'flex flex-col';
    stepDiv.dataset.stepId = step.id;

    // 步骤状态图标
    const statusIcon = getStepStatusIcon(step.status);

    // 步骤内容
    const stepContent = step.content || `步骤 ${index + 1}`;

    // 展开/折叠按钮 - 所有步骤都显示按钮
    const hasSubEvents = step.subEvents && step.subEvents.length > 0;
    const toggleButton = `<span class="flex-shrink-0 flex">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down transition-transform duration-300 w-4 h-4 step-chevron">
            <path d="m6 9 6 6 6-6"></path>
        </svg>
    </span>`;

    stepDiv.innerHTML = `
        <div class="text-sm w-full clickable flex gap-2 justify-between group/header truncate text-[var(--text-primary)]" data-event-id="${step.id}" onclick="toggleStep(${step.id})">
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
            <div class="flex flex-col gap-3 flex-1 min-w-0 overflow-hidden pt-2 transition-[max-height,opacity] duration-150 ease-in-out step-sub-content" style="max-height: 0; opacity: 0;">
                ${createSubEventsHTML(step.subEvents)}
            </div>
        </div>
    `;

    return stepDiv;
}

/**
 * 获取步骤状态图标
 */
function getStepStatusIcon(status) {
    switch (status) {
        case 'completed':
            return `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check text-[var(--icon-white)] dark:text-[var(--icon-white-tsp)]">
                <path d="M20 6 9 17l-5-5"></path>
            </svg>`;
        case 'in_progress':
            return `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-loader-2 animate-spin text-[var(--icon-white)] dark:text-[var(--icon-white-tsp)]">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>`;
        case 'pending':
        default:
            return `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle text-[var(--icon-white)] dark:text-[var(--icon-white-tsp)]">
                <circle cx="12" cy="12" r="10"></circle>
            </svg>`;
    }
}

/**
 * 创建子事件HTML
 */
function createSubEventsHTML(subEvents) {
    if (!subEvents || subEvents.length === 0) return '';

    return subEvents.map((event, index) => {
        const eventIcon = getEventIcon(event.type);
        return `
            <div class="flex items-center group gap-2 w-full" data-event-id="${event.id || index}">
                <div class="flex-1 min-w-0">
                    <div class="rounded-[15px] px-[10px] py-[3px] border border-[var(--border-light)] bg-[var(--fill-tsp-gray-main)] inline-flex max-w-full gap-[4px] items-center relative h-[28px] overflow-hidden clickable hover:bg-[var(--fill-tsp-gray-dark)] dark:hover:bg-white/[0.02]" data-event-id="${event.id || index}">
                        <div class="w-[21px] inline-flex items-center flex-shrink-0 text-[var(--text-primary)]">
                            ${eventIcon}
                        </div>
                        <div title="${event.content}" class="max-w-[100%] truncate text-[var(--text-secondary)] relative top-[-1px]">
                            <span class="text-[13px]">${event.content}</span>
                        </div>
                    </div>
                </div>
                <div class="float-right transition text-[12px] text-[var(--text-tertiary)] invisible group-hover:visible">星期一</div>
            </div>
        `;
    }).join('');
}

/**
 * 获取事件图标
 */
function getEventIcon(eventType) {
    switch (eventType) {
        case 'step':
            return `<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 18 18" fill="none" style="min-width: 21px; min-height: 21px;">
                <g filter="url(#:r3kt:_filter0_ii_1527_83590)">
                    <path d="M2 4.7C2 3.20883 3.20883 2 4.7 2H13.3C14.7912 2 16 3.20883 16 4.7V13.3C16 14.7912 14.7912 16 13.3 16H4.7C3.20883 16 2 14.7912 2 13.3V4.7Z" fill="url(#:r3kt:_paint0_linear_1527_83590)"></path>
                </g>
                <path d="M2.42857 4.7C2.42857 3.44552 3.44552 2.42857 4.7 2.42857H13.3C14.5545 2.42857 15.5714 3.44552 15.5714 4.7V13.3C15.5714 14.5545 14.5545 15.5714 13.3 15.5714H4.7C3.44552 15.5714 2.42857 14.5545 2.42857 13.3V4.7Z" stroke="#B9B9B7" stroke-width="0.857143"></path>
                <circle cx="8.625" cy="8.625" r="3" stroke="#535350" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"></circle>
                <path d="M10.875 10.875L12.375 12.375" stroke="#535350" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"></path>
                <defs>
                    <filter id=":r3kt:_filter0_ii_1527_83590" x="1.5" y="1.5" width="15" height="15" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                        <feFlood flood-opacity="0" result="BackgroundImageFix"></feFlood>
                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"></feBlend>
                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"></feColorMatrix>
                        <feOffset dx="1" dy="1"></feOffset>
                        <feGaussianBlur stdDeviation="0.25"></feGaussianBlur>
                        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"></feComposite>
                        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.6 0"></feColorMatrix>
                        <feBlend mode="normal" in2="shape" result="effect1_innerShadow_1527_83590"></feBlend>
                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"></feColorMatrix>
                        <feOffset dx="-1" dy="-1"></feOffset>
                        <feGaussianBlur stdDeviation="0.25"></feGaussianBlur>
                        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"></feComposite>
                        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"></feColorMatrix>
                        <feBlend mode="normal" in2="effect1_innerShadow_1527_83590" result="effect2_innerShadow_1527_83590"></feBlend>
                    </filter>
                    <linearGradient id=":r3kt:_paint0_linear_1527_83590" x1="9" y1="2" x2="9" y2="16" gradientUnits="userSpaceOnUse">
                        <stop stop-color="white" stop-opacity="0"></stop>
                        <stop offset="1" stop-opacity="0.16"></stop>
                    </linearGradient>
                </defs>
            </svg>`;
        default:
            return `<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 18 18" fill="none" style="min-width: 21px; min-height: 21px;">
                <circle cx="9" cy="9" r="7" stroke="#535350" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"></circle>
                <path d="M9 6v6M9 6h3M9 6H6" stroke="#535350" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>`;
    }
}

/**
 * 切换步骤展开/折叠
 */
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
            // 展开
            subEvents.style.display = 'flex';
            subContent.style.maxHeight = '1000px';
            subContent.style.opacity = '1';
            if (chevron) {
                chevron.style.transform = 'rotate(180deg)';
            }
            console.log('🔄 已展开步骤');
        } else {
            // 折叠
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

/**
 * 格式化消息内容
 */
function formatMessageContent(content) {
    if (!content) return '';

    // 将换行符转换为HTML换行，并转义HTML特殊字符
    return content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
}

/**
 * 添加agent模式的聊天消息
 */
function addAgentChatMessage(type, content) {
    console.log('🔍 addAgentChatMessage调用 - type:', type, 'content:', content);
    console.log('🔍 currentManusMessage:', currentManusMessage);

    if (!currentManusMessage) {
        console.error('❌ 没有找到当前消息容器！currentManusMessage为null');
        console.log('🔍 尝试重新创建消息容器...');
        createAgentModeMessage();
        if (!currentManusMessage) {
            console.error('❌ 重新创建消息容器失败！');
            return;
        }
    }

    const responseContent = currentManusMessage.querySelector('.manus-response-content');
    console.log('🔍 responseContent元素:', responseContent);
    if (!responseContent) {
        console.error('❌ 没有找到响应内容容器！');
        return;
    }

    // 格式化内容
    const formattedContent = formatMessageContent(content);

    // 根据类型添加不同的样式
    let messageClass = '';
    let icon = '';

    switch (type) {
        case 'plan':
            messageClass = 'agent-plan-message';
            icon = '📋';
            break;
        case 'step':
            messageClass = 'agent-step-message';
            icon = '📝';
            break;
        case 'interaction':
            messageClass = 'agent-interaction-message';
            icon = '🔄';
            break;
        case 'complete':
            messageClass = 'agent-complete-message';
            icon = '🏁';
            break;
        case 'summary':
            messageClass = 'agent-summary-message';
            icon = '📊';
            break;
        default:
            messageClass = 'agent-default-message';
            icon = '💬';
    }

    // 创建消息元素
    const messageElement = document.createElement('div');
    messageElement.className = `agent-chat-message ${messageClass}`;
    messageElement.innerHTML = `
        <div class="agent-message-icon">${icon}</div>
        <div class="agent-message-content">${formattedContent}</div>
    `;

    responseContent.appendChild(messageElement);
    scrollChatToBottom();
}

/**
 * 添加聊天消息（不使用聊天气泡）
 */
function addChatMessage(content) {
    addContentToCurrentMessage(content);
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

    // 清除当前的openmanus消息引用，准备新的回复
    clearCurrentManusMessage();

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
    console.log('发送消息 - TaskId:', currentTaskId, 'FlowId:', currentFlowId, 'Mode:', currentMode);

    if (currentTaskId || currentFlowId) {
        try {
            console.log('开始发送交互请求...');
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
        console.log('没有活跃任务，无法发送交互');
        // 没有活跃任务，模拟回复
        setTimeout(() => {
            addChatMessage('收到您的消息，但当前没有活跃的任务。请返回主页面创建新任务。');
        }, 1000);
    }
}

/**
 * 测试API连接
 */
async function testAPIConnection() {
    console.log('🧪 测试API连接...');
    try {
        const response = await fetch('/task', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: 'test',
                task_id: 'test_id',
                session_id: 'test_session'
            })
        });
        console.log('🧪 API测试响应:', response.status, response.statusText);
    } catch (error) {
        console.error('🧪 API测试失败:', error);
    }
}

/**
 * 添加助手消息 - 已废弃，使用addChatMessage替代
 */
function addAssistantMessage(text) {
    console.log('addAssistantMessage已废弃，使用addChatMessage替代');

    // 直接添加聊天消息，不使用旧的Manus消息格式
    addChatMessage(text);
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
    addChatMessage(randomResponse);
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
            mainContent.classList.remove('expanded');
        } else {
            // 收缩侧边栏
            sidebar.classList.add('collapsed');
            expandBtn.style.display = 'block';
            mainContent.classList.add('expanded');
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

                // 加载步骤数据
                const stepsLoaded = agentStepsManager.loadSteps(restoreTaskId);
                if (stepsLoaded && agentSteps.length > 0) {
                    console.log('恢复任务时步骤数据已加载，更新UI');
                    updateAgentStepsUI();
                }
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
        currentMode = 'agent'; // Agent模式
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

    // 清除当前的openmanus消息引用
    clearCurrentManusMessage();

    // 清空agent步骤
    agentStepsManager.clearSteps();

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
    history.forEach(message => {
        switch (message.type) {
            case 'user':
                // 清除当前的openmanus消息引用，准备新的回复
                clearCurrentManusMessage();

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
                break;

            case 'manus':
                // 添加内容到当前openmanus消息
                addContentToCurrentMessage(message.content);
                break;

            case 'thinking':
                // 添加思考步骤到当前openmanus消息
                addThinkingStepToCurrentMessage(message.content);
                break;
        }
    });

    scrollChatToBottom();
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
