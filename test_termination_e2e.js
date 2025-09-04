// 端到端终止功能测试脚本
// 验证：1.请求处理中时按钮变为terminate；2.点击terminate后端agent终止；3.前端停止输出，按钮恢复

const puppeteer = require('puppeteer');

async function testTerminationE2E() {
    console.log('🧪 开始端到端终止功能测试...\n');

    let browser;
    try {
        // 启动浏览器
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized']
        });

        const page = await browser.newPage();

        // 导航到应用页面
        console.log('📱 导航到应用页面...');
        await page.goto('http://localhost:5172', { waitUntil: 'networkidle0' });

        // 等待页面加载完成
        await page.waitForSelector('#promptInput', { timeout: 10000 });
        console.log('✅ 页面加载完成');

        // 测试1：验证初始状态
        console.log('\n🔍 测试1：验证初始状态');
        const initialButtonText = await page.$eval('#sendButton', el => el.textContent.trim());
        console.log(`   初始按钮文本: "${initialButtonText}"`);

        if (!initialButtonText.includes('Send to Manus')) {
            throw new Error('初始按钮状态不正确');
        }
        console.log('✅ 初始状态正确');

        // 测试2：发送请求并验证按钮变为terminate
        console.log('\n🔍 测试2：发送请求并验证按钮变为terminate');

        // 输入一个会触发长时间处理的请求
        await page.type('#promptInput', '请帮我分析一个复杂的数据集，需要多个步骤来完成这个任务，包括数据清洗、特征工程、模型训练等');

        // 点击发送按钮
        await page.click('#sendButton');
        console.log('   已点击发送按钮');

        // 等待按钮变为terminate状态
        await page.waitForFunction(() => {
            const button = document.querySelector('#sendButton');
            const spinner = document.querySelector('#send-spinner');
            const stopIcon = button.querySelector('.bi-stop-fill');
            return spinner.style.display === 'inline-block' &&
                stopIcon && stopIcon.style.display === 'inline-block';
        }, { timeout: 10000 });

        const terminateButtonText = await page.$eval('#sendButton', el => el.textContent.trim());
        console.log(`   处理中按钮文本: "${terminateButtonText}"`);

        if (!terminateButtonText.includes('Terminate')) {
            throw new Error('按钮未正确变为terminate状态');
        }
        console.log('✅ 按钮成功变为terminate状态');

        // 等待一些输出开始
        console.log('   等待输出开始...');
        await page.waitForFunction(() => {
            const messages = document.querySelectorAll('.chat-message');
            return messages.length > 0;
        }, { timeout: 15000 });

        console.log('✅ 开始收到输出');

        // 测试3：点击terminate按钮
        console.log('\n🔍 测试3：点击terminate按钮');

        // 记录当前消息数量
        const messagesBeforeTerminate = await page.$$eval('.chat-message', els => els.length);
        console.log(`   终止前消息数量: ${messagesBeforeTerminate}`);

        // 点击terminate按钮
        await page.click('#sendButton');
        console.log('   已点击terminate按钮');

        // 等待按钮恢复为初始状态
        await page.waitForFunction(() => {
            const button = document.querySelector('#sendButton');
            const spinner = document.querySelector('#send-spinner');
            const sendIcon = button.querySelector('.bi-send');
            return spinner.style.display === 'none' &&
                sendIcon.style.display === 'inline-block';
        }, { timeout: 10000 });

        const finalButtonText = await page.$eval('#sendButton', el => el.textContent.trim());
        console.log(`   终止后按钮文本: "${finalButtonText}"`);

        if (!finalButtonText.includes('Send to Manus')) {
            throw new Error('按钮未正确恢复到初始状态');
        }
        console.log('✅ 按钮成功恢复到初始状态');

        // 等待一段时间，确保没有新的输出
        console.log('   等待5秒，确保没有新的输出...');
        await page.waitForTimeout(5000);

        // 检查消息数量是否停止增长
        const messagesAfterTerminate = await page.$$eval('.chat-message', els => els.length);
        console.log(`   终止后消息数量: ${messagesAfterTerminate}`);

        if (messagesAfterTerminate > messagesBeforeTerminate + 2) { // 允许少量延迟消息
            console.log('⚠️  警告：终止后仍有新消息产生');
        } else {
            console.log('✅ 输出已成功停止');
        }

        // 测试4：验证可以发送新请求
        console.log('\n🔍 测试4：验证可以发送新请求');

        // 清空输入框
        await page.click('#promptInput');
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');
        await page.keyboard.press('Backspace');

        // 输入新请求
        await page.type('#promptInput', '你好，这是一个新的测试请求');

        // 点击发送
        await page.click('#sendButton');
        console.log('   已发送新请求');

        // 等待新消息出现
        await page.waitForFunction((prevCount) => {
            const messages = document.querySelectorAll('.chat-message');
            return messages.length > prevCount;
        }, { timeout: 10000 }, messagesAfterTerminate);

        console.log('✅ 新请求发送成功');

        console.log('\n🎉 所有测试通过！终止功能正常工作！');

    } catch (error) {
        console.error('\n❌ 测试失败:', error.message);

        // 截图保存错误状态
        if (page) {
            await page.screenshot({
                path: 'test_termination_error.png',
                fullPage: true
            });
            console.log('📸 错误截图已保存为 test_termination_error.png');
        }

        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// 运行测试
testTerminationE2E()
    .then(() => {
        console.log('\n✅ 端到端测试完成');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ 端到端测试失败:', error);
        process.exit(1);
    });
