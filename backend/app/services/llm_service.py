import os
import requests
import logging
import time
from typing import Optional

logger = logging.getLogger(__name__)


class LLMServiceError(Exception):
    pass

class LLMTimeoutError(LLMServiceError):
    pass


class LLMService:
    def __init__(self):
        self.hf_token = os.getenv("HF_TOKEN")
        self.hf_model = os.getenv("HF_MODEL", "meta-llama/Llama-3.2-3B-Instruct")
        self.ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
        self.model = os.getenv("LLM_MODEL", "llama3.2:3b")
        
        if not self.hf_token:
            logger.warning("⚠️ HF_TOKEN not set! LLM calls will fail.")
        else:
            logger.info(f"✅ Using HF model: {self.hf_model}")

    def generate(self, prompt: str, temperature: float = 0.3, max_tokens: int = 2000) -> str:
        """Generate using Hugging Face with retries."""
        if self.hf_token:
            for attempt in range(3):
                try:
                    return self._generate_hf(prompt, temperature, max_tokens)
                except Exception as e:
                    logger.error(f"HF attempt {attempt+1} failed: {e}")
                    if attempt < 2:
                        time.sleep(2 ** attempt)
                    else:
                        logger.error("All HF attempts failed. Falling back to Ollama.")
                        return self._generate_ollama(prompt, temperature, max_tokens)
        else:
            return self._generate_ollama(prompt, temperature, max_tokens)
        
        return "AI service unavailable. Please try again later."

    def _generate_hf(self, prompt: str, temperature: float, max_tokens: int) -> str:
        url = f"https://api-inference.huggingface.co/models/{self.hf_model}"
        headers = {
            "Authorization": f"Bearer {self.hf_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": max_tokens,
                "temperature": temperature,
                "return_full_text": False,
                "do_sample": True,
            },
        }

        logger.info(f"📡 Calling HF API: {self.hf_model}")
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        logger.info(f"📡 HF response status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                return data[0].get("generated_text", "").strip()
            elif isinstance(data, dict):
                return data.get("generated_text", "").strip()
            else:
                raise LLMServiceError(f"Unexpected HF response: {data}")
        elif response.status_code == 503:
            raise LLMServiceError("Model loading, please retry.")
        else:
            raise LLMServiceError(f"HF API error: {response.status_code} - {response.text}")

    def _generate_ollama(self, prompt: str, temperature: float, max_tokens: int) -> str:
        try:
            response = requests.post(
                self.ollama_url,
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": temperature,
                        "num_predict": max_tokens,
                    },
                },
                timeout=60,
            )
            if response.status_code == 200:
                return response.json().get("response", "").strip()
            else:
                raise LLMServiceError(f"Ollama error: {response.status_code}")
        except Exception as e:
            logger.error(f"Ollama failed: {e}")
            raise LLMServiceError(f"Ollama failed: {e}")