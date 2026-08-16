import os
import requests
import logging
import time
from typing import Optional

logger = logging.getLogger(__name__)

# --- Exceptions required by chat.py ---
class LLMServiceError(Exception):
    pass

class LLMTimeoutError(LLMServiceError):
    pass


class LLMService:
    def __init__(self):
        self.hf_token = os.getenv("HF_TOKEN")
        self.hf_model = os.getenv("HF_MODEL", "meta-llama/Llama-3.2-3B-Instruct")
        
        if not self.hf_token:
            logger.warning("⚠️ HF_TOKEN not set! AI generation will fail.")
        else:
            logger.info(f"✅ Using HF model: {self.hf_model}")

    def generate(self, prompt: str, temperature: float = 0.3, max_tokens: int = 2000) -> str:
        """Generate using Hugging Face Inference API with retries."""
        if not self.hf_token:
            raise LLMServiceError("HF_TOKEN not configured")

        for attempt in range(3):
            try:
                return self._generate_hf(prompt, temperature, max_tokens)
            except LLMTimeoutError:
                # Propagate timeout errors directly
                raise
            except Exception as e:
                logger.error(f"HF attempt {attempt+1} failed: {e}")
                if attempt < 2:
                    time.sleep(2 ** attempt)  # 1, 2, 4 seconds
                else:
                    logger.error("All HF attempts failed.")
                    raise LLMServiceError(f"HF generation failed after retries: {e}")

        raise LLMServiceError("HF generation failed")

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
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=60)
        except requests.exceptions.Timeout:
            logger.error("HF request timed out")
            raise LLMTimeoutError("HF API request timed out")
        except Exception as e:
            logger.error(f"HF request failed: {e}")
            raise LLMServiceError(f"HF request failed: {e}")

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
            raise LLMServiceError("Model is loading, please retry.")
        else:
            raise LLMServiceError(f"HF API error: {response.status_code} - {response.text}")