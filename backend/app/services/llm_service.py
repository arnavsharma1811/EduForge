import requests
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class LLMServiceError(Exception):
    pass

class LLMTimeoutError(LLMServiceError):
    pass

class LLMResponseError(LLMServiceError):
    pass

class LLMService:
    def __init__(self, model: str = "llama3.2:3b", ollama_url: Optional[str] = None):
        self.model = model
        self.ollama_url = ollama_url or os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")

    def generate(self, prompt: str, temperature: float = 0.3, max_tokens: int = 2000) -> str:
        logger.info("LLM request: max_tokens=%d, prompt_length=%d", max_tokens, len(prompt))
        
        # 1. Hugging Face Inference API (Free Gated Access with HF Token)
        hf_token = os.getenv("HF_TOKEN")
        if hf_token:
            hf_model = os.getenv("HF_MODEL", "meta-llama/Llama-3.2-3B-Instruct")
            logger.info("Routing LLM request to Hugging Face Inference API (%s)", hf_model)
            try:
                response = requests.post(
                    "https://api-inference.huggingface.co/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {hf_token}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": hf_model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": temperature,
                        "max_tokens": min(max_tokens, 2048)  # HF Serverless often caps at 2048 output tokens
                    },
                    timeout=(10, 120),
                )
                if response.status_code == 200:
                    data = response.json()
                    result = data["choices"][0]["message"]["content"]
                    logger.info("Hugging Face API response received: %d chars", len(result))
                    return result
                else:
                    logger.warning("Hugging Face HTTP %d: %s", response.status_code, response.text)
            except Exception as e:
                logger.error("Hugging Face API call failed: %s. Falling back.", e)

        # 2. Groq Cloud API (Free tier for Llama 3.2 / 3.1)
        groq_api_key = os.getenv("GROQ_API_KEY")
        if groq_api_key:
            groq_model = os.getenv("GROQ_MODEL", "llama-3.2-3b-preview")
            logger.info("Routing LLM request to Groq API (%s)", groq_model)
            try:
                response = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {groq_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": groq_model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": temperature,
                        "max_tokens": max_tokens
                    },
                    timeout=(10, 120),
                )
                if response.status_code == 200:
                    data = response.json()
                    result = data["choices"][0]["message"]["content"]
                    logger.info("Groq API response received: %d chars", len(result))
                    return result
                else:
                    logger.warning("Groq HTTP %d: %s", response.status_code, response.text)
            except Exception as e:
                logger.error("Groq API call failed: %s. Falling back.", e)

        # 3. Google Gemini API (Free tier via Google AI Studio Key)
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if gemini_api_key:
            gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
            logger.info("Routing LLM request to Gemini API (%s)", gemini_model)
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={gemini_api_key}"
                response = requests.post(
                    url,
                    headers={"Content-Type": "application/json"},
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "temperature": temperature,
                            "maxOutputTokens": max_tokens
                        }
                    },
                    timeout=(10, 120),
                )
                if response.status_code == 200:
                    data = response.json()
                    result = data["candidates"][0]["content"]["parts"][0]["text"]
                    logger.info("Gemini API response received: %d chars", len(result))
                    return result
                else:
                    logger.warning("Gemini HTTP %d: %s", response.status_code, response.text)
            except Exception as e:
                logger.error("Gemini API call failed: %s. Falling back.", e)

        # 4. Local Ollama Fallback (Default behavior if no cloud API keys set)
        logger.info("Routing LLM request to Local Ollama (%s)", self.model)
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
                timeout=(10, 600),
            )

            if response.status_code == 200:
                data = response.json()
                result = data.get("response", "")
                if not result or not result.strip():
                    raise LLMResponseError(f"Ollama returned empty response. Full payload: {data}")
                logger.info("Ollama response received: %d chars", len(result))
                return result
            else:
                raise LLMResponseError(f"Ollama HTTP {response.status_code}: {response.text}")

        except requests.exceptions.ConnectTimeout:
            raise LLMTimeoutError(f"Could not connect to Ollama at {self.ollama_url} within 10s. Is it running?")
        except requests.exceptions.ReadTimeout:
            raise LLMTimeoutError(f"Ollama did not respond within 600s for model={self.model}. Prompt may be too large.")
        except requests.exceptions.ConnectionError as e:
            raise LLMTimeoutError(f"Cannot reach Ollama at {self.ollama_url}. Connection error: {e}")
        except (LLMServiceError,):
            raise
        except Exception as e:
            logger.error("LLM generation failed: %s", e, exc_info=True)
            raise LLMServiceError(f"Unexpected LLM error: {e}") from e