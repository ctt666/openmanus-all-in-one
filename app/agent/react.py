from abc import ABC, abstractmethod
from typing import Optional

from pydantic import Field

from app.agent.base import BaseAgent
from app.config import config
from app.llm import LLM
from app.logger import logger
from app.prompt.react import SUMMARIZE_PROMPT
from app.schema import AgentState, Memory, Message


class ReActAgent(BaseAgent, ABC):
    name: str
    description: Optional[str] = None

    system_prompt: Optional[str] = None
    next_step_prompt: Optional[str] = None
    summarize_prompt: str = SUMMARIZE_PROMPT

    llm: Optional[LLM] = Field(default_factory=LLM)
    memory: Memory = Field(default_factory=Memory)
    state: AgentState = AgentState.IDLE

    max_steps: int = 10
    current_step: int = 0

    @abstractmethod
    async def think(self) -> (bool, str):
        """Process current state and decide next action"""

    @abstractmethod
    async def act(self) -> str:
        """Execute decided actions"""

    async def step(self) -> str:
        """Execute a single step: think and act."""
        should_act, thought = await self.think()
        if not should_act:
            return thought
        act_result = await self.act()
        return f"{thought}\n{act_result}"

    async def summarize(self, request: str) -> str:
        summarize_prompt = self.summarize_prompt.format(
            request=request, directory=config.workspace_root
        )
        user_msg = Message.user_message(summarize_prompt)
        self.messages += [user_msg]

        try:
            # Get response with tool options
            response = await self.llm.ask(
                messages=self.messages,
            )
            return response
        except Exception as e:
            logger.error(f"🚨 Oops! The {self.name}'s thinking process hit a snag: {e}")
            self.memory.add_message(
                Message.assistant_message(
                    f"Error encountered while processing: {str(e)}"
                )
            )
            return "summary encountered an error, please try again"
