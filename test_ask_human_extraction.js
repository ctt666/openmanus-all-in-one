// 测试ask_human内容提取逻辑
// 模拟从后端接收到的各种事件数据

// 模拟的事件数据（基于终端日志）
const testEvents = [
    {
        type: 'tool',
        data: {
            result: `Tool arguments: {"inquire":"您好！为了帮您制定一份合适的周末计划，我需要了解一些信息：\\n1. 您的周末是哪两天？（例如：周六和周日）\\n2. 您希望周末主要做些什么？比如：休息、旅行、学习、运动、聚会等。\\n3. 您是否有特定的地点或活动偏好？（例如：去公园、看电影、去某地旅游等）\\n4. 您是否有时间限制或特别安排？（例如：早上有会议、需要接送家人等）\\n5. 您是独自一人，还是和家人/朋友一起？\\n请告诉我这些信息，以便我为您量身定制一份完美的周末计划。"}`
        }
    },
    {
        type: 'act',
        data: {
            result: `🎯 Tool 'ask_human' completed its mission! Result: INTERACTION_REQUIRED: 您好！为了帮您制定一份合适的周末计划，我需要了解一些信息：\\n1. 您的周末是哪两天？（例如：周六和周日）\\n2. 您希望周末主要做些什么？比如：休息、旅行、学习、运动、聚会等。\\n3. 您是否有特定的地点或活动偏好？（例如：去公园、看电影、去某地旅游等）\\n4. 您是否有时间限制或特别安排？（例如：早上有会议、需要接送家人等）\\n5. 您是独自一人，还是和家人/朋友一起？\\n请告诉我这些信息，以便我为您量身定制一份完美的周末计划。`
        }
    },
    {
        type: 'tool',
        data: {
            result: `🔄 AskHuman tool executed, setting interaction flag...`
        }
    }
];

// 提取逻辑函数（从main.js复制）
function extractAskHumanContent(data, type) {
    console.log(`\n=== 测试事件类型: ${type} ===`);
    console.log('原始数据:', data.result);

    // 通用ask_human检测逻辑 - 检查所有事件类型
    if (data.result && typeof data.result === 'string') {
        // 检测ask_human工具执行完成的情况
        if (data.result.includes('Tool \'ask_human\' completed its mission!')) {
            console.log('✅ 检测到ask_human工具完成');

            // 提取INTERACTION_REQUIRED内容
            const interactionMatch = data.result.match(/INTERACTION_REQUIRED:\s*(.+)/);
            if (interactionMatch) {
                const inquire = interactionMatch[1].trim();
                console.log('✅ 从完成事件中提取到inquire:', inquire);
                return inquire;
            }
        }

        // 检测直接的INTERACTION_REQUIRED标记
        if (data.result.includes('INTERACTION_REQUIRED:')) {
            console.log('✅ 检测到INTERACTION_REQUIRED标记');
            const inquire = data.result.replace(/.*INTERACTION_REQUIRED:\s*/, '').trim();
            console.log('✅ 从INTERACTION_REQUIRED中提取到inquire:', inquire);
            return inquire;
        }
    }

    // 检测ask_human工具的使用
    if (type === 'tool' && data.result && data.result.includes('ask_human')) {
        console.log('✅ 检测到ask_human工具使用');

        // 尝试多种方式提取询问内容
        let inquire = null;

        // 方法1：从JSON格式的tool arguments中提取
        const toolArgsMatch = data.result.match(/Tool arguments: ({[^}]+})/);
        if (toolArgsMatch) {
            try {
                const toolArgs = JSON.parse(toolArgsMatch[1]);
                if (toolArgs.inquire) {
                    inquire = toolArgs.inquire;
                    console.log('✅ 从JSON tool arguments中提取到inquire:', inquire);
                    return inquire;
                }
            } catch (e) {
                console.log('❌ 解析tool arguments JSON失败:', e);
            }
        }

        // 方法2：从inquire字段直接提取
        if (!inquire) {
            const inquireMatch = data.result.match(/inquire["\s]*:["\s]*([^,\n}]+)/);
            if (inquireMatch) {
                inquire = inquireMatch[1].replace(/["']/g, '').trim();
                console.log('✅ 从inquire字段直接提取到:', inquire);
                return inquire;
            }
        }

        // 方法3：从整个结果中查找inquire内容
        if (!inquire) {
            const fullInquireMatch = data.result.match(/inquire["\s]*:["\s]*"([^"]+)"/);
            if (fullInquireMatch) {
                inquire = fullInquireMatch[1];
                console.log('✅ 从完整inquire匹配中提取到:', inquire);
                return inquire;
            }
        }

        if (!inquire) {
            console.log('❌ 无法从ask_human工具事件中提取inquire');
        }
    }

    // 检测工具执行结果中的ask_human
    if (type === 'tool' && data.result && data.result.includes('INTERACTION_REQUIRED:')) {
        const inquire = data.result.replace('INTERACTION_REQUIRED:', '').trim();
        console.log('✅ 从工具执行结果中提取到inquire:', inquire);
        return inquire;
    }

    // 检测所有事件类型中的INTERACTION_REQUIRED标记
    if (data.result && data.result.includes('INTERACTION_REQUIRED:')) {
        const inquire = data.result.replace('INTERACTION_REQUIRED:', '').trim();
        console.log('✅ 从通用INTERACTION_REQUIRED检测中提取到inquire:', inquire);
        return inquire;
    }

    // 检测所有事件类型中的ask_human相关结果
    if (data.result && data.result.includes('Tool \'ask_human\' completed its mission!')) {
        const interactionMatch = data.result.match(/INTERACTION_REQUIRED: (.+)/);
        if (interactionMatch) {
            const inquire = interactionMatch[1].trim();
            console.log('✅ 从ask_human完成事件中提取到inquire:', inquire);
            return inquire;
        }
    }

    console.log('❌ 未找到ask_human相关内容');
    return null;
}

// 运行测试
console.log('🧪 开始测试ask_human内容提取逻辑...\n');

let extractedContent = null;

for (const event of testEvents) {
    const content = extractAskHumanContent(event.data, event.type);
    if (content) {
        extractedContent = content;
        console.log('\n🎉 成功提取到ask_human内容！');
        console.log('提取的内容:', content);
        break;
    }
}

if (!extractedContent) {
    console.log('\n❌ 所有测试事件都未能提取到ask_human内容');
}

console.log('\n📋 测试总结:');
console.log('- 测试事件数量:', testEvents.length);
console.log('- 成功提取:', extractedContent ? '是' : '否');
if (extractedContent) {
    console.log('- 提取的内容长度:', extractedContent.length);
    console.log('- 内容预览:', extractedContent.substring(0, 100) + '...');
}
