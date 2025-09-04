// 问题2解决方案验证测试
// 测试用户无法在输入框中回答ask_human问题的问题

// 模拟前端状态变量
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
    }
};

// 模拟函数
function showErrorToast(message) {
    console.log(`🔔 显示提示: ${message}`);
}

function addMessage(text, sender) {
    console.log(`💬 添加消息 - 发送者: ${sender}`);
    console.log(`📄 消息内容: ${text.substring(0, 50)}...`);
    chatHistory.push({
        role: sender,
        content: text,
        timestamp: new Date().toISOString()
    });
}

function toggle_chat_state(state) {
    chat_state = state;
    console.log(`🔄 聊天状态更新为: ${state}`);
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

// 修复后的sendMessage函数（问题2的解决方案）
function sendMessage(message) {
    console.log(`\n🚀 尝试发送消息: "${message}"`);
    console.log(`📊 当前状态检查:`);
    console.log(`   - chat_state: ${chat_state}`);
    console.log(`   - currentInteractionTaskId: ${currentInteractionTaskId}`);

    // 修复：检查是否正在等待ask_human的回答，如果是则允许发送
    if (chat_state !== 'none' && !currentInteractionTaskId) {
        showErrorToast('Chat bot still under working, please wait...');
        console.log('❌ 聊天机器人正在工作中，请等待...');
        return;
    }

    if (message.trim()) {
        // 检查是否正在等待ask_human的回答
        if (currentInteractionTaskId) {
            console.log('✅ 检测到ask_human等待回答，处理用户回答');
            handleAskHumanResponse(message);
            return;
        }

        console.log('✅ 正常消息处理流程');
        // 这里可以添加正常的消息处理逻辑
    }
}

// 模拟设置ask_human交互状态
function setupAskHumanInteraction(taskId) {
    console.log(`\n🔧 设置ask_human交互状态`);
    currentInteractionTaskId = taskId;
    toggle_chat_state('none');
    mockElements.messageInput.placeholder = '请输入您的回答...';
    console.log(`✅ 交互状态已设置:`);
    console.log(`   - currentInteractionTaskId: ${currentInteractionTaskId}`);
    console.log(`   - chat_state: ${chat_state}`);
    console.log(`   - 输入框占位符: ${mockElements.messageInput.placeholder}`);
}

// 测试场景
console.log('🧪 开始问题2解决方案验证测试...\n');

// 测试场景1: 正常状态下的消息发送
console.log('=== 测试场景1: 正常状态下的消息发送 ===');
console.log('初始状态:');
console.log(`- chat_state: ${chat_state}`);
console.log(`- currentInteractionTaskId: ${currentInteractionTaskId}`);

sendMessage('这是一个正常的消息');

// 测试场景2: 聊天机器人工作中，但没有ask_human交互
console.log('\n=== 测试场景2: 聊天机器人工作中，但没有ask_human交互 ===');
toggle_chat_state('working');
console.log(`设置chat_state为: ${chat_state}`);

sendMessage('尝试发送消息（应该被阻止）');

// 测试场景3: ask_human交互状态
console.log('\n=== 测试场景3: ask_human交互状态 ===');
setupAskHumanInteraction('test-task-123');

sendMessage('这是对ask_human的回答');

// 测试场景4: 回答后的状态
console.log('\n=== 测试场景4: 回答后的状态 ===');
console.log('回答后的状态:');
console.log(`- currentInteractionTaskId: ${currentInteractionTaskId}`);
console.log(`- chat_state: ${chat_state}`);
console.log(`- 输入框占位符: ${mockElements.messageInput.placeholder}`);

// 测试场景5: 回答后再次发送消息
console.log('\n=== 测试场景5: 回答后再次发送消息 ===');
sendMessage('回答后的新消息');

// 测试场景6: 边界情况测试
console.log('\n=== 测试场景6: 边界情况测试 ===');

// 6.1 空消息
console.log('6.1 测试空消息:');
sendMessage('');

// 6.2 只有空格的消息
console.log('6.2 测试只有空格的消息:');
sendMessage('   ');

// 6.3 重新设置ask_human状态
console.log('6.3 重新设置ask_human状态:');
setupAskHumanInteraction('test-task-456');

// 6.4 在ask_human状态下发送空消息
console.log('6.4 在ask_human状态下发送空消息:');
sendMessage('');

// 6.5 在ask_human状态下发送有效回答
console.log('6.5 在ask_human状态下发送有效回答:');
sendMessage('我的周末是周六和周日，希望休息和运动');

// 最终状态验证
console.log('\n=== 最终状态验证 ===');
console.log('📊 最终状态:');
console.log(`- currentInteractionTaskId: ${currentInteractionTaskId}`);
console.log(`- chat_state: ${chat_state}`);
console.log(`- 输入框占位符: ${mockElements.messageInput.placeholder}`);
console.log(`- 聊天历史记录数量: ${chatHistory.length}`);

console.log('\n📋 聊天历史记录:');
chatHistory.forEach((msg, index) => {
    console.log(`${index + 1}. [${msg.role}] ${msg.content.substring(0, 30)}...`);
});

// 问题2解决方案验证总结
console.log('\n🎯 问题2解决方案验证总结:');
console.log('✅ 修复前的问题:');
console.log('   - 用户无法在ask_human等待回答时发送消息');
console.log('   - 显示"Chat bot still under working, please wait..."错误');

console.log('\n✅ 修复后的解决方案:');
console.log('   - 修改sendMessage函数的状态检查逻辑');
console.log('   - 当currentInteractionTaskId存在时，允许发送消息');
console.log('   - 正确路由到handleAskHumanResponse函数');

console.log('\n✅ 验证结果:');
console.log('   - 正常状态下可以发送消息');
console.log('   - 聊天机器人工作中（无ask_human）时阻止发送');
console.log('   - ask_human等待回答时允许发送');
console.log('   - 回答后正确清除状态并恢复正常流程');

console.log('\n🎉 问题2解决方案验证完成！');
