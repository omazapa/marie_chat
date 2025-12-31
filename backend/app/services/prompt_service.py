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

class PromptService:
    def __init__(self):
        # Allow nested event loops (needed for Flask + asyncio)
        nest_asyncio.apply()
        
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
        self.profiles = {
            "developer": "Software Developer: Focuses on code quality, efficiency, technical accuracy, and best practices.",
            "researcher": "Researcher/Academic: Focuses on rigorous analysis, citations, formal language, and deep conceptual understanding.",
            "creator": "Content Creator: Focuses on audience engagement, creativity, storytelling, and visual/emotional appeal.",
            "business": "Business Professional: Focuses on clarity, professionalism, actionable insights, and strategic value.",
            "student": "Student: Focuses on learning, clear explanations of foundational concepts, and step-by-step guidance.",
            "data_scientist": "Data Scientist: Focuses on data-driven insights, statistical rigor, visualization, and reproducible results."
        }

    def get_available_techniques(self) -> Dict[str, str]:
        """Returns a list of available prompt engineering techniques"""
        return self.techniques

    def get_available_templates(self) -> Dict[str, str]:
        """Returns a list of available prompt templates"""
        return self.templates

    def get_available_profiles(self) -> Dict[str, str]:
        """Returns a list of available user profiles"""
        return self.profiles

    async def _generate_optimized_prompt(self, user_input: str, technique: Optional[str] = None, context: Optional[str] = None, profile: Optional[str] = None) -> str:
        """Internal async method to generate the optimized prompt"""
        system_content = (
            "You are an expert Prompt Engineer. Your task is to take a simple user request "
            "and transform it into a high-quality, effective prompt for a Large Language Model. "
            "Use advanced prompt engineering techniques to ensure the best possible results."
        )
        
        technique_instruction = ""
        if technique and technique in self.techniques:
            technique_instruction = f"\nApply the following technique: {self.techniques[technique]}"
        
        profile_instruction = ""
        if profile and profile in self.profiles:
            profile_instruction = f"\nThe user profile is: {self.profiles[profile]}. Tailor the prompt to suit this user's needs and expectations."
        
        context_instruction = ""
        if context:
            context_instruction = f"\nConsider this additional context: {context}"

        user_content = (
            f"User Request: {user_input}"
            f"{technique_instruction}"
            f"{profile_instruction}"
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
                print(f"❌ Provider {settings.DEFAULT_LLM_PROVIDER} not found in provider_factory")
                return f"Error: Provider {settings.DEFAULT_LLM_PROVIDER} not available."
            
            print(f"🤖 Optimizing prompt with {settings.DEFAULT_LLM_PROVIDER} ({settings.DEFAULT_LLM_MODEL})")
            response = ""
            # Use the async generator directly
            async_gen = provider.chat_completion(
                model=settings.DEFAULT_LLM_MODEL,
                messages=messages,
                stream=True
            )
            
            async for chunk in async_gen:
                response += chunk.content
            
            if not response:
                print("⚠️ LLM returned empty response for prompt optimization")
                return f"Error: LLM returned empty response. Original: {user_input}"

            return response.strip()
        except Exception as e:
            print(f"❌ Error in _generate_optimized_prompt: {e}")
            import traceback
            traceback.print_exc()
            return f"Error: Could not optimize prompt. Original: {user_input}"

    def optimize_prompt(self, user_input: str, technique: Optional[str] = None, context: Optional[str] = None, profile: Optional[str] = None) -> str:
        """
        Uses an LLM to optimize a user prompt based on a specific technique and user profile.
        Runs the async generation in a synchronous way using nest-asyncio.
        """
        try:
            # Get or create event loop
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            
            # Run the coroutine synchronously
            return loop.run_until_complete(
                self._generate_optimized_prompt(user_input, technique, context, profile)
            )
        except Exception as e:
            print(f"❌ Error in PromptService.optimize_prompt: {e}")
            import traceback
            traceback.print_exc()
            return f"Error: {str(e)}. Original: {user_input}"

prompt_service = PromptService()
