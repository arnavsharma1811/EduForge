import requests
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self, model: str = "llama3.2:3b", ollama_url: Optional[str] = None):
        self.model = model
        self.ollama_url = ollama_url or os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
    
    def generate(self, prompt: str, temperature: float = 0.3, max_tokens: int = 2000) -> str:
        try:
            response = requests.post(
                self.ollama_url,
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": temperature,
                        "max_tokens": max_tokens
                    }
                },
                timeout=120
            )
            if response.status_code == 200:
                return response.json().get("response", "")
            else:
                raise Exception(f"Ollama error: {response.status_code} - {response.text}")
        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            raise