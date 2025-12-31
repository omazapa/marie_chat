import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Mock settings if needed, but let's try to use real ones
from app.config import settings
from app.services.prompt_service import prompt_service

async def test_optimize():
    print("Testing prompt optimization...")
    result = await prompt_service._generate_optimized_prompt("Write a hello world in python")
    print(f"Result: {result}")

if __name__ == "__main__":
    asyncio.run(test_optimize())
