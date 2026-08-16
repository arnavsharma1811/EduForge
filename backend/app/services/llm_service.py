import os
import requests
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class LLMServiceError(Exception):
    pass

class LLMTimeoutError(LLMServiceError):
    pass


class LLMService:
    def __init__(self):
        # --- Try Groq first ---
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        # llama-3.2-3b-preview was decommissioned by Groq. Use a current supported model.
        # You can also override this with the GROQ_MODEL env var in Render.
        self.groq_model = os.getenv("GROQ_MODEL", "llama3-8b-8192")

        # --- Fallback to Gemini (works on Render free tier, no outbound DNS issues) ---
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        self.gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

        # --- Last resort: HuggingFace (NOTE: may NOT work on Render free tier due to outbound network restrictions) ---
        self.hf_token = os.getenv("HF_TOKEN")
        self.hf_model = os.getenv("HF_MODEL", "meta-llama/Llama-3.2-3B-Instruct")

        if self.groq_api_key:
            logger.info(f"✅ LLM Provider: Groq with model: {self.groq_model}")
        elif self.gemini_api_key:
            logger.info(f"✅ LLM Provider: Gemini with model: {self.gemini_model}")
        elif self.hf_token:
            logger.warning(f"⚠️  LLM Provider: HuggingFace (may fail on Render free tier): {self.hf_model}")
        else:
            logger.error("❌ No LLM credentials configured! Set GROQ_API_KEY or GEMINI_API_KEY.")

    def generate(self, prompt: str, temperature: float = 0.3, max_tokens: int = 2000) -> str:
        """Try Groq first, then Gemini, then HF as last resort."""
        if self.groq_api_key:
            try:
                return self._generate_groq(prompt, temperature, max_tokens)
            except Exception as e:
                logger.error(f"Groq failed: {e}.")
                if self.gemini_api_key:
                    logger.info("Falling back to Gemini...")
                    return self._generate_gemini(prompt, temperature, max_tokens)
                elif self.hf_token:
                    logger.warning("Falling back to HuggingFace (may fail on Render free tier)...")
                    return self._generate_hf(prompt, temperature, max_tokens)
                else:
                    raise LLMServiceError(f"Groq failed and no fallback configured: {e}")
        elif self.gemini_api_key:
            return self._generate_gemini(prompt, temperature, max_tokens)
        elif self.hf_token:
            return self._generate_hf(prompt, temperature, max_tokens)
        else:
            raise LLMServiceError("No LLM provider configured. Set GROQ_API_KEY or GEMINI_API_KEY.")

    def _generate_groq(self, prompt: str, temperature: float, max_tokens: int) -> str:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.groq_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.groq_model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        if response.status_code == 200:
            return response.json()["choices"][0]["message"]["content"].strip()
        else:
            raise LLMServiceError(f"Groq API error: {response.status_code} - {response.text}")

    def _generate_gemini(self, prompt: str, temperature: float, max_tokens: int) -> str:
        """Call Google Gemini via REST API (works on Render free tier)."""
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.gemini_model}:generateContent?key={self.gemini_api_key}"
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }
        try:
            response = requests.post(url, json=payload, timeout=60)
            if response.status_code == 200:
                data = response.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "").strip()
                raise LLMServiceError(f"Unexpected Gemini response structure: {data}")
            else:
                raise LLMServiceError(f"Gemini API error: {response.status_code} - {response.text}")
        except LLMServiceError:
            raise
        except Exception as e:
            logger.error(f"Gemini request failed: {e}")
            raise LLMServiceError(f"Gemini request failed: {e}")

    def _generate_hf(self, prompt: str, temperature: float, max_tokens: int) -> str:
        """HuggingFace Inference API - NOTE: may not work on Render free tier (outbound DNS restricted)."""
        url = f"https://api-inference.huggingface.co/models/{self.hf_model}"
        headers = {"Authorization": f"Bearer {self.hf_token}"}
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
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    return data[0].get("generated_text", "").strip()
                elif isinstance(data, dict):
                    return data.get("generated_text", "").strip()
                else:
                    raise LLMServiceError(f"Unexpected HF response: {data}")
            else:
                raise LLMServiceError(f"HF API error: {response.status_code} - {response.text}")
        except Exception as e:
            logger.error(f"HF request failed: {e}")
            raise LLMServiceError(f"HF request failed: {e}")