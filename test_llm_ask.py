# Your tool implementation
def square_the_number(num: float) -> dict:
    return {"result": num**2}  # 返回字典格式


# Define Tools
tools = [
    {
        "type": "function",
        "function": {
            "name": "square_the_number",
            "description": "Calculate square of a number",  # 简化描述
            "parameters": {
                "type": "object",
                "required": ["num"],  # 简化参数名
                "properties": {
                    "num": {
                        "type": "number",
                        "description": "Number to square",  # 简化描述
                    }
                },
            },
        },
    }
]

from openai import OpenAI

if __name__ == "__main__":
    # Define LLM
    client = OpenAI(
        # Use a custom endpoint compatible with OpenAI API
        base_url="http://127.0.0.1:8080/v1",  # api_base
        api_key="EMPTY",
    )

    messages = [{"role": "user", "content": "square the number 1024"}]

    completion = client.chat.completions.create(
        messages=messages,
        model="Qwen3-Coder-30B-A3B-Instruct",
        max_tokens=4096,  # 从65536降低到4096
        tools=tools,
    )

    print(completion.choices[0])
