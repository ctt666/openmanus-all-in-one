// 前端集成测试 - 模拟完整的ask_human交互流程

// 模拟前端状态
let currentInteractionTaskId = null;
let chat_state = 'none';
let chatHistory = [];

// 模拟DOM元素
const mockElements = {
    messageInput: {
        placeholder: 'Ask Manus...',
        value: '',
        set placeholder(value) {
            this._placeholder = value;
            console.log(`📝 输入框占位符更新为: ${value}`);
        },
        get placeholder() {
            return this._placeholder || 'Ask Manus...';
        }
    },
    longThoughtCheckbox: {
        checked: true
    }
};

// 模拟addMessage函数
function addMessage(text, sender) {
    console.log(`💬 添加消息 - 发送者: ${sender}`);
    console.log(`📄 消息内容: ${text.substring(0, 100)}...`);

    chatHistory.push({
        role: sender,
        content: text,
        timestamp: new Date().toISOString()
    });
}

// 模拟toggle_chat_state函数
function toggle_chat_state(state) {
    chat_state = state;
    console.log(`🔄 聊天状态更新为: ${state}`);
}

// 模拟showErrorToast函数
function showErrorToast(message) {
    console.log(`🔔 显示提示: ${message}`);
}

// 模拟handleAskHumanResponse函数
async function handleAskHumanResponse(userResponse) {
    if (!currentInteractionTaskId) {
        console.log('❌ 没有当前交互任务ID');
        return;
    }

    try {
        console.log(`👤 用户回答: ${userResponse}`);

        // 显示用户回答
        addMessage(userResponse, 'user');

        // 模拟发送到后端
        console.log(`📤 发送回答到后端: /tasks/${currentInteractionTaskId}/interact`);

        // 清除交互状态
        currentInteractionTaskId = null;

        // 更新输入框占位符
        mockElements.messageInput.placeholder = 'Ask Manus...';

        // 显示成功提示
        showErrorToast('回答已提交，继续处理中...');

        console.log('✅ ask_human回答处理完成');

    } catch (error) {
        console.error('❌ 处理ask_human回答失败:', error);
        showErrorToast('提交回答失败: ' + error.message);
    }
}

// 模拟sendMessage函数
function sendMessage(message) {
    console.log(`\n🚀 发送消息: ${message}`);

    // 检查是否正在等待ask_human的回答
    if (chat_state !== 'none' && !currentInteractionTaskId) {
        showErrorToast('Chat bot still under working, please wait...');
        console.log('❌ 聊天机器人正在工作中，请等待...');
        return;
    }

    if (currentInteractionTaskId) {
        console.log('✅ 检测到ask_human等待回答，处理用户回答');
        handleAskHumanResponse(message);
        return;
    }

    console.log('✅ 正常消息处理流程');
}

// 模拟事件处理函数
function handleEvent(event, type) {
    console.log(`\n📡 接收到事件 - 类型: ${type}`);

    try {
        const data = JSON.parse(event.data);
        console.log('📄 事件数据:', data.result ? data.result.substring(0, 100) + '...' : '无结果');

        // 通用ask_human检测逻辑
        if (data.result && typeof data.result === 'string') {
            // 检测ask_human工具执行完成的情况
            if (data.result.includes('Tool \'ask_human\' completed its mission!')) {
                console.log('✅ 检测到ask_human工具完成');

                // 提取INTERACTION_REQUIRED内容
                const interactionMatch = data.result.match(/INTERACTION_REQUIRED:\s*(.+)/);
                if (interactionMatch) {
                    const inquire = interactionMatch[1].trim();
                    console.log('✅ 提取到ask_human内容:', inquire.substring(0, 100) + '...');

                    // 作为AI消息显示
                    addMessage(inquire, 'ai');

                    // 设置交互状态
                    currentInteractionTaskId = 'test-task-id-123';

                    // 更新聊天状态
                    toggle_chat_state('none');

                    // 更新输入框占位符
                    mockElements.messageInput.placeholder = '请输入您的回答...';

                    console.log('✅ ask_human内容已显示，等待用户回答');
                    return;
                }
            }
        }

        console.log('ℹ️ 事件处理完成（非ask_human相关）');

    } catch (e) {
        console.error('❌ 事件处理错误:', e);
    }
}

// 测试流程
console.log('🧪 开始前端集成测试...\n');

// 1. 模拟接收到ask_human事件
console.log('=== 步骤1: 模拟接收到ask_human事件 ===');
const askHumanEvent = {
    data: JSON.stringify({
        result: `🎯 Tool 'ask_human' completed its mission! Result: INTERACTION_REQUIRED: 您好！为了帮您制定一份合适的周末计划，我需要了解一些信息：\\n1. 您的周末是哪两天？（例如：周六和周日）\\n2. 您希望周末主要做些什么？比如：休息、旅行、学习、运动、聚会等。\\n3. 您是否有特定的地点或活动偏好？（例如：去公园、看电影、去某地旅游等）\\n4. 您是否有时间限制或特别安排？（例如：早上有会议、需要接送家人等）\\n5. 您是独自一人，还是和家人/朋友一起？\\n请告诉我这些信息，以便我为您量身定制一份完美的周末计划。`
    })
};

handleEvent(askHumanEvent, 'act');

// 2. 模拟用户尝试发送消息（应该被阻止）
console.log('\n=== 步骤2: 模拟用户尝试发送消息（应该被阻止） ===');
sendMessage('这是一个测试消息');

// 3. 模拟用户回答ask_human问题
console.log('\n=== 步骤3: 模拟用户回答ask_human问题 ===');
sendMessage('我的周末是周六和周日，希望休息和运动，和家人一起，没有特别安排');

// 4. 验证状态
console.log('\n=== 步骤4: 验证最终状态 ===');
console.log('📊 最终状态:');
console.log('- 当前交互任务ID:', currentInteractionTaskId);
console.log('- 聊天状态:', chat_state);
console.log('- 聊天历史记录数量:', chatHistory.length);
console.log('- 输入框占位符:', mockElements.messageInput.placeholder);

console.log('\n📋 聊天历史记录:');
chatHistory.forEach((msg, index) => {
    console.log(`${index + 1}. [${msg.role}] ${msg.content.substring(0, 50)}...`);
});

console.log('\n🎉 前端集成测试完成！');
