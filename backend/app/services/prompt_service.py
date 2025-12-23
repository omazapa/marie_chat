"""
Prompt Engineering Service
Handles prompt optimization and technique application
"""
import asyncio
from typing import List, Dict, Any, Optional
from app.services.llm_service import llm_service
from app.services.llm_provider import ChatMessage
from app.config import settings

class PromptService:
    def __init__(self):
        self.techniques = {
            "cot": "Chain of Thought: Encourages the model to explain its reasoning step-by-step.",
            "few_shot": "Few-Shot: Provides examples to guide the model's output format and style.",
            "persona": "Persona: Assigns a specific role or character to the model.",
            "delimited": "Delimited: Uses clear delimiters to separate different parts of the prompt.",
            "structured": "Structured Output: Requests the output in a specific format like JSON or Markdown.",
            "tot": "Tree of Thoughts: Explores multiple reasoning paths simultaneously."
        }
        self.templates = {
            "creative": "Write a creative story or poem about {topic}. Use vivid imagery and emotional depth.",
            "technical": "Explain the technical concept of {topic} in detail. Include architecture, pros/cons, and code examples if applicable.",
            "academic": "Provide a scholarly analysis of {topic}. Cite potential sources and use formal academic language.",
            "summary": "Summarize the following text into a concise set of bullet points: {topic}",
            "code_review": "Review the following code for bugs, performance issues, and best practices: {topic}"
        }

    def get_available_techniques(self) -> Dict[str, str]:
        """Returns a list of available prompt engineering techniques"""
        return self.techniques

    def get_available_templates(self) -> Dict[str, str]:
        """Returns a list of available prompt templates"""
        return self.templates

    async def _generate_optimized_prompt(self, user_input: str, technique: Optional[str] = None, context: Optional[str] = None) -> str:
        """Internal async method to generate the optimized prompt"""
        system_content = (
            "You are an expert Prompt Engineer. Your task is to take a simple user request "
            "and transform it into a high-quality, effective prompt for a Large Language Model. "
            "Use advanced prompt engineering techniques to ensure the best possible results."
        )
        
        technique_instruction = ""
        if technique and technique in self.techniques:
            technique_instruction = f"\nApply the following technique: {self.techniques[technique]}"
        
        context_instruction = ""
        if context:
            context_instruction = f"\nConsider this additional context: {context}"

        user_content = (
            f"User Request: {user_input}"
            f"{technique_instruction}"
            f"{context_instruction}"
            "\n\nPlease provide the optimized prompt only, without any introductory or concluding text."
        )

        messages = [
            ChatMessage(role="system", content=system_content),
            ChatMessage(role="user", content=user_content)
        ]

        try:
            from app.services.provider_factory import provider_factory
            provider = provider_factory.get_provider(settings.DEFAULT_LLM_PROVIDER)
            
            response = ""
            async for chunk in provider.chat_completion(
                model=settings.DEFAULT_LLM_MODEL,
                messages=messages,
                stream=True
            ):
                response += chunk.content
            
            return response.strip()
        except Exception as e:
            print(f"Error in _generate_optimized_prompt: {e}")
            return f"Error: Could not optimize prompt. Original: {user_input}"

    def optimize_prompt(self, user_input: str, technique: Optional[str] = None, context: Optional[str] = None) -> str:
        """
        Uses an LLM to optimize a user prompt based on a specific technique.
        Runs the async generation in a synchronous way.
        """
        try:
            # Use a new event loop to run the async task
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(self._generate_optimized_prompt(user_input, technique, context))
            loop.close()
            return result
        except Exception as e:
            print(f"Error optimizing prompt: {e}")
            return f"Error: Could not optimize prompt. Original: {user_input}"

prompt_service = PromptService()
