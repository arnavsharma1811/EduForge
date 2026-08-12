import os
import requests
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class LLMServiceError(Exception):
    pass

class LLMService:
    def __init__(self, model: Optional[str] = None):
        self.hf_token = os.getenv("HF_TOKEN")
        self.hf_model = os.getenv("HF_MODEL", "meta-llama/Llama-3.2-3B-Instruct")
        self.ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
        self.model = model or os.getenv("LLM_MODEL", "llama3.2:3b")
        self.use_hf = bool(self.hf_token)
        if self.use_hf:
            logger.info(f"Using Hugging Face Inference API: {self.hf_model}")
        else:
            logger.warning("HF_TOKEN not set, falling back to Ollama")

    def generate(self, prompt: str, temperature: float = 0.3, max_tokens: int = 2000) -> str:
        if self.use_hf:
            return self._generate_hf(prompt, temperature, max_tokens)
        else:
            return self._generate_ollama(prompt, temperature, max_tokens)

    def _generate_hf(self, prompt: str, temperature: float, max_tokens: int) -> str:
        url = f"https://api-inference.huggingface.co/models/{self.hf_model}"
        headers = {"Authorization": f"Bearer {self.hf_token}"}
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": max_tokens,
                "temperature": temperature,
                "return_full_text": False,
            }
        }
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            if response.status_code == 200:
                data = response.json()
                # HF can return a list or dict
                if isinstance(data, list) and len(data) > 0 and 'generated_text' in data[0]:
                    return data[0]['generated_text'].strip()
                elif isinstance(data, dict) and 'generated_text' in data:
                    return data['generated_text'].strip()
                else:
                    raise LLMServiceError(f"Unexpected HF response: {data}")
            elif response.status_code == 503:
                # Model is loading, wait and retry (optional)
                raise LLMServiceError("HF model is loading, please try again in a moment.")
            else:
                raise LLMServiceError(f"HF API error: {response.status_code} - {response.text}")
        except Exception as e:
            logger.error(f"HF generation failed: {e}")
            raise LLMServiceError(f"HF API error: {e}")

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
                    }
                },
                timeout=120
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("response", "").strip()
            else:
                raise LLMServiceError(f"Ollama error: {response.status_code} - {response.text}")
        except Exception as e:
            logger.error(f"Ollama generation failed: {e}")
            raise LLMServiceError(f"Ollama error: {e}")