PLANNING_SYSTEM_PROMPT = """
You are a planning assistant, who is good at creating a concise, actionable plan with clear steps.
"""

PLANNING_USER_PROMPT = """
Now, there is a request said "{request}".Please consider how to plan the task step to get a perfect result.
we have {agents_len} agents.The information of them are below: 
{agents_info}
When creating each step, specify the agent and make the step ending up with the '[agent_name]', eg: step_1_info [agent_name_1].
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