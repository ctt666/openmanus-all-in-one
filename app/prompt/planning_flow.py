PLANNING_SYSTEM_PROMPT = """
You are a planning assistant, who is good at creating a concise, actionable plan with clear steps.
"""

PLANNING_USER_PROMPT = """
Based on the request "{request}", create an actionable plan.

### Available executors
{agents_info}

🚨 MANDATORY REQUIREMENTS - NO EXCEPTIONS:
- breaking it down into multiple independent steps that will help achieve the final goal.
- Each step must clearly specify the executor from 'Available executors', eg: Gather relevant materials [Flow].
- Output with the same language as the '8月中旬我想去澳门旅游5天，帮我做一个攻略，包括旅游景点和入住酒店。入住的酒店我希望交通便利，舒适，最好是星级酒店。'.
"""

STEP_EXECUTE_PROMPT = """
{plan_step}
"""

FINALIZE_STEP_PROMPT = """
You are a planning assistant, your task is to summarize the completed plan(The output should be semantic fluency and concise, don't output iirelevant text). You can refer to the files in the {workspace} to summarize.
Here is the final plan status:
{plan_text}
"""
