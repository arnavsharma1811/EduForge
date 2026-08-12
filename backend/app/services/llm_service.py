import os
import requests
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.hf_token = os.getenv("HF_TOKEN")
        self.hf_model = os.getenv("HF_MODEL", "meta-llama/Llama-3.2-3B-Instruct")
        self.model = os.getenv("LLM_MODEL", "llama3.2:3b")
        self.ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
        
        if not self.hf_token:
            logger.warning("HF_TOKEN not set! LLM calls will fail.")
        else:
            logger.info(f"Using HF model: {self.hf_model}")

    def generate(self, prompt: str, temperature: float = 0.3, max_tokens: int = 2000) -> str:
        """Generate using Hugging Face (primary) or fallback to Ollama."""
        if self.hf_token:
            return self._generate_hf(prompt, temperature, max_tokens)
        else:
            return self._generate_ollama(prompt, temperature, max_tokens)

    def _generate_hf(self, prompt: str, temperature: float, max_tokens: int) -> str:
        """Call Hugging Face Inference API."""
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

        try:
            logger.info(f"Calling HF API: {self.hf_model}")
            response = requests.post(url, headers=headers, json=payload, timeout=120)
            logger.info(f"HF response status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    return data[0].get("generated_text", "").strip()
                elif isinstance(data, dict):
                    return data.get("generated_text", "").strip()
                else:
                    raise Exception(f"Unexpected HF response format: {data}")
            elif response.status_code == 503:
                # Model is loading
                raise Exception("Model is loading. Please wait and try again.")
            else:
                raise Exception(f"HF API error: {response.status_code} - {response.text}")

        except Exception as e:
            logger.error(f"HF generation failed: {e}")
            # Fallback to Ollama if HF fails
            return self._generate_ollama(prompt, temperature, max_tokens)

    def _generate_ollama(self, prompt: str, temperature: float, max_tokens: int) -> str:
        """Fallback to local Ollama."""
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
                timeout=120,
            )
            if response.status_code == 200:
                return response.json().get("response", "").strip()
            else:
                raise Exception(f"Ollama error: {response.status_code}")
        except Exception as e:
            logger.error(f"Ollama failed: {e}")
            raise Exception(f"Both HF and Ollama failed. Last error: {e}")