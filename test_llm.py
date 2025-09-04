import asyncio

from app.llm import LLM


async def main():
    llm = LLM(config_name="default")
    result = await llm.ask_tool(
        [
            {
                "role": "user",
                "content": "帮我制定一份周末计划，周末两天从早上5点到晚上10点，爱好放松、学习，没有其他限制",
            }
        ]
    )
    print(result.content)
    print("=====================================\n\n")
    print(result.reasoning_content)


if __name__ == "__main__":
    asyncio.run(main())
