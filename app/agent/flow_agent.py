from typing import List

from pydantic import Field

from app.agent.manus import Manus
from app.prompt.flow_step_agent import NEXT_STEP_PROMPT, SYSTEM_PROMPT
from app.tool import (
    AskHuman,
    Bash,
    PythonExecute,
    StrReplaceEditor,
    Terminate,
    ToolCollection,
)

# from app.tool import (
#     AskHuman,
#     Bash,
#     PythonExecute,
#     StrReplaceEditor,
#     Terminate,
#     ToolCollection,
# )


class FlowAgent(Manus):
    """An agent that extends from the ManusAgent paradigm for every flow step."""

    name: str = "flow"
    description: str = "an autonomous AI programmer that executes every flow step."

    system_prompt: str = SYSTEM_PROMPT
    next_step_prompt: str = NEXT_STEP_PROMPT

    available_tools: ToolCollection = Field(
        default_factory=lambda: ToolCollection(
            PythonExecute(),
            StrReplaceEditor(),
            AskHuman(),
            Terminate(),
            Bash(),
        )
    )
    max_steps: int = 30

    def set_prompt(self, render: dict):
        """Set the prompt for the agent"""
        self.next_step_prompt = NEXT_STEP_PROMPT.format(**render)
        self.system_prompt = SYSTEM_PROMPT.format(**render)
