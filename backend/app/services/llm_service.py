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
        # You can override this with the GROQ_MODEL env var in Render.
        # Make sure GROQ_MODEL in Render is NOT set to 'llama-3.2-3b-preview'!
        self.groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

        # --- Fallback to Gemini (works on Render free tier) ---
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        self.gemini_model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

        # --- Last resort: HuggingFace ---
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
                logger.error(f"❌ Groq failed (Model: {self.groq_model}): {e}")
                if self.gemini_api_key:
                    logger.info("🔄 Falling back to Gemini...")
                    return self._generate_gemini(prompt, temperature, max_tokens)
                elif self.hf_token:
                    logger.warning("🔄 Falling back to HuggingFace...")
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
            "Authorization": f"Bearer {self.groq_api_key.strip() if self.groq_api_key else ''}",
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
            raise LLMServiceError(f"Groq API error {response.status_code}: {response.text}")

    def _generate_gemini(self, prompt: str, temperature: float, max_tokens: int) -> str:
        """Call Google Gemini via REST API (v1 / v1beta fallback)."""
        clean_key = self.gemini_api_key.strip() if self.gemini_api_key else ""
        clean_model = self.gemini_model.strip() if self.gemini_model else "gemini-1.5-flash"
        
        # Strip any leading 'models/' if user included it in env var
        if clean_model.startswith("models/"):
            clean_model = clean_model[7:]

        # Try v1 first, then v1beta
        endpoints = [
            f"https://generativelanguage.googleapis.com/v1/models/{clean_model}:generateContent?key={clean_key}",
            f"https://generativelanguage.googleapis.com/v1beta/models/{clean_model}:generateContent?key={clean_key}",
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={clean_key}",
        ]

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }

        last_error = ""
        for url in endpoints:
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
                    last_error = f"Gemini API error ({url.split('/')[3]}): {response.status_code} - {response.text}"
            except LLMServiceError as e:
                last_error = str(e)
            except Exception as e:
                last_error = f"Gemini request failed: {e}"

        raise LLMServiceError(last_error)

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