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
        logger.info("LLM request: model=%s, max_tokens=%d, prompt_length=%d", self.model, max_tokens, len(prompt))
        try:
            response = requests.post(
                self.ollama_url,
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": temperature,
                        "num_predict": max_tokens,  # Ollama uses num_predict, not max_tokens
                    },
                },
                timeout=(10, 600),  # Increased read timeout to 600s for long generation
            )

            if response.status_code == 200:
                data = response.json()
                result = data.get("response", "")
                if not result or not result.strip():
                    raise LLMResponseError(f"Ollama returned empty response. Full payload: {data}")
                logger.info("LLM response received: %d chars", len(result))
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