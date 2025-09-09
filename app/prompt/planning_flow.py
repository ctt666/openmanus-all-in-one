PLANNING_SYSTEM_PROMPT = """
You are a planning assistant, who is good at creating a concise, actionable plan with clear steps.
"""

PLANNING_USER_PROMPT = """
Based on the request "{request}", please use the `planning` tool to create an actionable plan by breaking it down into multiple independent steps that will help achieve the final goal.

Available executors:
{agents_info}
Total number of executors: {agents_len}

🚨 CRITICAL RULE:
1. Use the `planning` tool to create the plan.
2. Each step must clearly specify the executor,  must be followed by the executor's name in the format '[executor_name]'.
   Example: Step 1: Gather relevant materials [Flow].
3. Steps should be clear, actionable, and independent of each other.
4. Answer in the same language as the '{request}'.
"""

STEP_EXECUTE_PROMPT = """
{plan_step}
"""

FINALIZE_STEP_PROMPT = """
You are a planning assistant, your task is to summarize the completed plan and save summary file to {workspace}.
Here is the final plan status:
{plan_text}

The summary file could be a document or an image or a video, etc.
- name the output file with the plan title:
    - format as markdown(.md) if it's a document.
    - format as png if it's an image.
"""
