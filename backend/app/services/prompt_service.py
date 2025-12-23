"""
Prompt Engineering Service
Handles prompt optimization and technique application
"""
import asyncio
import nest_asyncio
from typing import List, Dict, Any, Optional
from app.services.llm_service import llm_service
from app.services.llm_provider import ChatMessage
from app.config import settings

# Allow nested event loops
nest_asyncio.apply()

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
            
            if not provider:
                return f"Error: Provider {settings.DEFAULT_LLM_PROVIDER} not available."
            
            response = ""
            # Use the async generator directly
            async_gen = provider.chat_completion(
                model=settings.DEFAULT_LLM_MODEL,
                messages=messages,
                stream=True
            )
            
            async for chunk in async_gen:
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
            # Get the current event loop or create a new one
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            
            # Run the coroutine
            if loop.is_running():
                # If the loop is already running (thanks to nest_asyncio), we can use run_until_complete
                return loop.run_until_complete(self._generate_optimized_prompt(user_input, technique, context))
            else:
                # If the loop is not running, we can run it
                return loop.run_until_complete(self._generate_optimized_prompt(user_input, technique, context))
        except Exception as e:
            print(f"Error optimizing prompt: {e}")
            # Last resort fallback
            try:
                return asyncio.run(self._generate_optimized_prompt(user_input, technique, context))
            except Exception as e2:
                print(f"Fallback optimization failed: {e2}")
                return f"Error: Could not optimize prompt. Original: {user_input}"

prompt_service = PromptService()
