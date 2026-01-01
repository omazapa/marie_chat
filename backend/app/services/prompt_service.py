"""
Prompt Engineering Service
Handles prompt optimization and technique application
"""

from app.config import settings
from app.services.llm_provider import ChatMessage
from app.services.llm_service import llm_service


class PromptService:
    def __init__(self):
        self.techniques = {
            "cot": "Chain of Thought: Encourages the model to explain its reasoning step-by-step.",
            "few_shot": "Few-Shot: Provides examples to guide the model's output format and style.",
            "persona": "Persona: Assigns a specific role or character to the model.",
            "delimited": "Delimited: Uses clear delimiters to separate different parts of the prompt.",
            "structured": "Structured Output: Requests the output in a specific format like JSON or Markdown.",
            "tot": "Tree of Thoughts: Explores multiple reasoning paths simultaneously.",
            "step_back": "Step-Back Prompting: Asks the model to first identify the broader principles or concepts involved.",
            "self_critique": "Self-Critique: Instructs the model to review and refine its own response for accuracy and quality.",
            "analogical": "Analogical Reasoning: Uses analogies to explain complex or abstract concepts more clearly.",
            "rit": "Reasoning in Thought: Encourages the model to use a <thought> block for internal reasoning before responding.",
        }
        self.templates = {
            "creative": "Write a creative story or poem about {topic}. Use vivid imagery and emotional depth.",
            "technical": "Explain the technical concept of {topic} in detail. Include architecture, pros/cons, and code examples if applicable.",
            "academic": "Provide a scholarly analysis of {topic}. Cite potential sources and use formal academic language.",
            "summary": "Summarize the following text into a concise set of bullet points: {topic}",
            "code_review": "Review the following code for bugs, performance issues, and best practices: {topic}",
        }
        self.profiles = {
            "developer": "Software Developer: Expert in multiple programming languages, focuses on clean code (SOLID, DRY), performance optimization, security, and comprehensive documentation. Prefers technical, concise, and implementation-ready responses.",
            "researcher": "Researcher/Academic: Expert in scientific methodology, focuses on evidence-based analysis, peer-reviewed citations, formal academic tone, and exploring theoretical implications. Prefers deep, nuanced, and well-structured scholarly content.",
            "creator": "Content Creator: Expert in digital storytelling and marketing, focuses on audience psychology, viral potential, creative hooks, and multi-platform adaptation. Prefers engaging, imaginative, and emotionally resonant content.",
            "business": "Business Professional: Expert in corporate strategy and communication, focuses on ROI, actionable executive summaries, professional etiquette, and market alignment. Prefers clear, high-level, and results-oriented insights.",
            "student": "Student/Learner: Focuses on building foundational knowledge, clear analogies, step-by-step explanations, and identifying key learning objectives. Prefers educational, encouraging, and easy-to-digest information.",
            "data_scientist": "Data Scientist: Expert in statistics and machine learning, focuses on data integrity, algorithmic efficiency, statistical significance, and clear data visualization. Prefers rigorous, mathematical, and reproducible analysis.",
        }

    def get_available_techniques(self) -> dict[str, str]:
        """Returns a list of available prompt engineering techniques"""
        return self.techniques

    def get_available_templates(self) -> dict[str, str]:
        """Returns a list of available prompt templates"""
        return self.templates

    def get_available_profiles(self) -> dict[str, str]:
        """Returns a list of available user profiles"""
        return self.profiles

    def _generate_optimized_prompt(
        self,
        user_input: str,
        technique: str | None = None,
        context: str | None = None,
        profile: str | None = None,
    ) -> str:
        """Internal method to generate the optimized prompt synchronously"""
        system_content = (
            "You are a world-class Prompt Engineer specializing in Large Language Models. "
            "Your goal is to rewrite the user's request into a highly effective, professional, and structured prompt. "
            "\n\nFollow these principles for the optimized prompt:"
            "\n1. Role & Context: Define a clear persona for the LLM based on the user's profile."
            "\n2. Task Specification: Be extremely specific about what the LLM should do."
            "\n3. Constraints & Requirements: Include technical, stylistic, or structural constraints."
            "\n4. Output Format: Specify exactly how the response should be formatted (Markdown, JSON, etc.)."
            "\n5. Tone & Style: Match the tone to the user's profile and intent."
            "\n\nIMPORTANT: Return ONLY the rewritten prompt. Do not include any explanations, 'Here is your prompt', or conversational filler."
        )

        technique_instruction = ""
        if technique and technique in self.techniques:
            technique_instruction = f"\n- MANDATORY TECHNIQUE: {self.techniques[technique]}"

        profile_instruction = ""
        if profile and profile in self.profiles:
            profile_instruction = f"\n- TARGET USER PROFILE: {self.profiles[profile]}"

        context_instruction = ""
        if context:
            context_instruction = f"\n- ADDITIONAL CONTEXT: {context}"

        user_content = (
            "Please optimize the following user request into a professional prompt:\n"
            f"--- USER REQUEST START ---\n{user_input}\n--- USER REQUEST END ---\n"
            "\nInstructions for optimization:"
            f"{profile_instruction}"
            f"{technique_instruction}"
            f"{context_instruction}"
            "\n\nRewrite this request into a comprehensive prompt that will yield the highest quality response from an LLM. "
            "The resulting prompt should be ready to be used directly with another AI model."
        )

        messages = [
            ChatMessage(role="system", content=system_content),
            ChatMessage(role="user", content=user_content),
        ]

        try:
            # Get current settings for default model/provider
            config = llm_service.settings_service.get_settings()
            provider_name = config.get("llm", {}).get(
                "default_provider", settings.DEFAULT_LLM_PROVIDER
            )
            model_name = config.get("llm", {}).get("default_model", settings.DEFAULT_LLM_MODEL)

            from app.services.provider_factory import provider_factory

            provider = provider_factory.get_provider(provider_name)

            if not provider:
                print(f"❌ Provider {provider_name} not found in provider_factory")
                return f"Error: Provider {provider_name} not available."

            print(f"🤖 Optimizing prompt with {provider_name} ({model_name})")

            # Use the synchronous version to avoid event loop conflicts with eventlet
            chunk = provider.chat_completion_sync(model=model_name, messages=messages)

            response = chunk.content

            if not response:
                print("⚠️ LLM returned empty response for prompt optimization")
                return f"Error: LLM returned empty response. Original: {user_input}"

            return response.strip()
        except Exception as e:
            print(f"❌ Error in _generate_optimized_prompt: {e}")
            import traceback

            traceback.print_exc()
            return f"Error: Could not optimize prompt. Original: {user_input}"

    def optimize_prompt(
        self,
        user_input: str,
        technique: str | None = None,
        context: str | None = None,
        profile: str | None = None,
    ) -> str:
        """
        Uses an LLM to optimize a user prompt based on a specific technique and user profile.
        """
        return self._generate_optimized_prompt(user_input, technique, context, profile)


prompt_service = PromptService()
