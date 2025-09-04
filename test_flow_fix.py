#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Flow模式修复验证测试脚本
用于验证前端Flow模式选择是否正确调用后端run_flow_task方法
"""

import asyncio
import json
import logging
from typing import Any, Dict

# 配置日志
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class MockFlowManager:
    """模拟FlowManager类"""

    def __init__(self):
        self.flows = {}
        self.running_flows = {}
        self.interactions = {}
        self.ask_human_tools = {}
        self.queues = {}
        self.sessions = {}

    def create_flow(
        self, prompt: str, session_id: str, chat_history: list
    ) -> Dict[str, Any]:
        """创建Flow"""
        flow_id = f"flow_{len(self.flows) + 1}"
        flow = {
            "id": flow_id,
            "prompt": prompt,
            "session_id": session_id,
            "chat_history": chat_history,
            "status": "created",
            "created_at": "2025-01-02T10:00:00Z",
        }
        self.flows[flow_id] = flow
        logger.info(f"创建Flow: {flow_id}, prompt: {prompt[:50]}...")
        return flow

    def register_running_flow(self, flow_id: str, flow):
        """注册运行中的Flow"""
        self.running_flows[flow_id] = flow
        logger.info(f"注册运行中的Flow: {flow_id}")


class MockTaskManager:
    """模拟TaskManager类"""

    def __init__(self):
        self.tasks = {}
        self.running_tasks = {}
        self.interactions = {}

    def create_task(
        self, prompt: str, session_id: str, chat_history: list
    ) -> Dict[str, Any]:
        """创建Task"""
        task_id = f"task_{len(self.tasks) + 1}"
        task = {
            "id": task_id,
            "prompt": prompt,
            "session_id": session_id,
            "chat_history": chat_history,
            "status": "created",
            "created_at": "2025-01-02T10:00:00Z",
        }
        self.tasks[task_id] = task
        logger.info(f"创建Task: {task_id}, prompt: {prompt[:50]}...")
        return task


class MockApp:
    """模拟FastAPI应用"""

    def __init__(self):
        self.flow_manager = MockFlowManager()
        self.task_manager = MockTaskManager()
        self.routes = {}

    def post(self, path: str):
        """模拟路由装饰器"""

        def decorator(func):
            self.routes[path] = func
            logger.info(f"注册路由: POST {path} -> {func.__name__}")
            return func

        return decorator

    async def handle_request(
        self, path: str, method: str, data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """处理请求"""
        if method == "POST" and path in self.routes:
            func = self.routes[path]
            logger.info(f"调用路由函数: {func.__name__}")
            return await func(data)
        else:
            raise ValueError(f"未找到路由: {method} {path}")


# 模拟后端路由函数
async def create_flow(request_data: dict):
    """模拟创建Flow的路由函数"""
    prompt = request_data.get("prompt")
    session_id = request_data.get("session_id")
    chat_history = request_data.get("chat_history", [])

    if not prompt:
        raise ValueError("Prompt is required")

    logger.info(f"create_flow 被调用，prompt: {prompt[:50]}...")

    flow_task = app.flow_manager.create_flow(prompt, session_id, chat_history)

    # 模拟异步任务创建
    asyncio.create_task(
        run_flow_task(flow_task["id"], prompt, session_id, chat_history)
    )

    return {"task_id": flow_task["id"]}


async def create_task(request_data: dict):
    """模拟创建Task的路由函数"""
    prompt = request_data.get("prompt")
    session_id = request_data.get("session_id")
    chat_history = request_data.get("chat_history", [])

    if not prompt:
        raise ValueError("Prompt is required")

    logger.info(f"create_task 被调用，prompt: {prompt[:50]}...")

    task = app.task_manager.create_task(prompt, session_id, chat_history)

    # 模拟异步任务创建
    asyncio.create_task(run_task(task["id"], prompt, session_id, chat_history))

    return {"task_id": task["id"]}


async def run_flow_task(
    flow_id: str, prompt: str, session_id: str = None, chat_history: list = None
):
    """模拟运行Flow任务"""
    logger.info(f"=== run_flow_task 被调用 === flow_id: {flow_id}")
    logger.info(f"Flow任务开始执行，prompt: {prompt[:50]}...")

    # 模拟Flow执行
    await asyncio.sleep(0.1)
    logger.info(f"Flow任务执行完成: {flow_id}")


async def run_task(
    task_id: str, prompt: str, session_id: str = None, chat_history: list = None
):
    """模拟运行普通任务"""
    logger.info(f"=== run_task 被调用 === task_id: {task_id}")
    logger.info(f"普通任务开始执行，prompt: {prompt[:50]}...")

    # 模拟任务执行
    await asyncio.sleep(0.1)
    logger.info(f"普通任务执行完成: {task_id}")


# 模拟前端请求
async def simulate_frontend_request(mode: str, prompt: str):
    """模拟前端请求"""
    logger.info(f"\n{'='*50}")
    logger.info(f"模拟前端请求: 模式={mode}, prompt={prompt[:50]}...")

    request_data = {
        "prompt": prompt,
        "session_id": f"session_{mode}_{hash(prompt) % 1000}",
        "chat_history": [],
    }

    if mode == "flow":
        # 模拟Flow模式请求
        logger.info("前端选择Flow模式，发送请求到 /flows")
        try:
            result = await app.handle_request("/flows", "POST", request_data)
            logger.info(f"Flow创建成功: {result}")
        except Exception as e:
            logger.error(f"Flow创建失败: {e}")
    else:
        # 模拟Chat模式请求
        logger.info("前端选择Chat模式，发送请求到 /tasks")
        try:
            result = await app.handle_request("/tasks", "POST", request_data)
            logger.info(f"Task创建成功: {result}")
        except Exception as e:
            logger.error(f"Task创建失败: {e}")


async def main():
    """主测试函数"""
    global app
    app = MockApp()

    # 注册路由
    app.post("/flows")(create_flow)
    app.post("/tasks")(create_task)

    logger.info("开始Flow模式修复验证测试...")

    # 测试1: Flow模式
    await simulate_frontend_request("flow", "请帮我规划一个7天的旅行计划")

    # 测试2: Chat模式
    await simulate_frontend_request("chat", "什么是人工智能？")

    # 测试3: 再次Flow模式
    await simulate_frontend_request("flow", "分析一下今天的股票市场趋势")

    logger.info("\n测试完成！")

    # 验证结果
    logger.info(f"\n验证结果:")
    logger.info(f"Flow数量: {len(app.flow_manager.flows)}")
    logger.info(f"Task数量: {len(app.task_manager.tasks)}")

    # 检查是否调用了正确的函数
    flow_ids = list(app.flow_manager.flows.keys())
    task_ids = list(app.task_manager.tasks.keys())

    logger.info(f"创建的Flow IDs: {flow_ids}")
    logger.info(f"创建的Task IDs: {task_ids}")


if __name__ == "__main__":
    asyncio.run(main())
