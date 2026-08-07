import json
import re
import logging
from typing import List, Dict, TypedDict
from langgraph.graph import StateGraph, END
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)

def _extract_json_object(text: str) -> dict:
    """Robustly extract a JSON object from a string with possible markdown fences."""
    cleaned = re.sub(r'```(?:json)?\s*', '', text)
    cleaned = re.sub(r'```\s*$', '', cleaned).strip()
    start = cleaned.find('{')
    end = cleaned.rfind('}')
    if start == -1 or end == -1:
        raise ValueError("No JSON object found in response")
    candidate = cleaned[start:end+1]
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        logger.warning("Failed to parse JSON, attempting repair...")
        repaired = re.sub(r',(\s*[}\]])', r'\1', candidate)  # remove trailing commas
        try:
            return json.loads(repaired)
        except json.JSONDecodeError as e:
            raise ValueError(f"Could not parse JSON: {e}. Raw: {candidate[:200]}...")

class CourseState(TypedDict):
    text: str
    chunks: List[str]
    topics: List[str]
    course_structure: Dict
    validation_feedback: str
    final_output: Dict

class CourseGenerationAgent:
    def __init__(self):
        self.llm = LLMService()

    def _chunk_text(self, text: str, chunk_size: int = 1500) -> List[str]:
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        chunks = []
        current = ""
        for p in paragraphs:
            if len(current) + len(p) < chunk_size:
                current += p + "\n\n"
            else:
                if current:
                    chunks.append(current.strip())
                current = p + "\n\n"
        if current:
            chunks.append(current.strip())
        if not chunks:
            import re
            sentences = re.split(r'(?<=[.!?])\s+', text)
            current = ""
            for s in sentences:
                if len(current) + len(s) < chunk_size:
                    current += s + " "
                else:
                    if current:
                        chunks.append(current.strip())
                    current = s + " "
            if current:
                chunks.append(current.strip())
        return chunks

    def chunk_text_node(self, state: CourseState):
        chunks = self._chunk_text(state["text"], chunk_size=1500)
        logger.info(">>> Node: chunk — %d chunks", len(chunks))
        return {"chunks": chunks}

    def extract_topics_node(self, state: CourseState):
        logger.info(">>> Node: extract_topics")
        combined = "\n".join(state["chunks"][:5])
        prompt = f"""Extract the main topics from the following text. Return as a JSON list of strings.
Text: {combined}
Topics:"""
        response = self.llm.generate(prompt, max_tokens=300)
        try:
            topics = json.loads(response)
            if not isinstance(topics, list):
                topics = []
        except:
            match = re.search(r'\[.*\]', response, re.DOTALL)
            if match:
                topics = json.loads(match.group(0))
            else:
                topics = []
        logger.info(">>> Extracted %d topics", len(topics))
        return {"topics": topics}

    def generate_structure_node(self, state: CourseState):
        logger.info(">>> Node: generate_structure — %d topics", len(state["topics"]))
        topics_str = "\n".join(state["topics"])
        prompt = f"""Create a structured course outline from the following topics.
Topics:
{topics_str}

Output a SINGLE valid JSON object (no markdown, no extra text) with this schema:
{{
  "title": "string",
  "description": "string",
  "estimated_time": "string",
  "objectives": ["string"],
  "prerequisites": ["string"],
  "difficulty": "beginner" | "intermediate" | "advanced",
  "chapters": [
    {{
      "title": "string",
      "topics": [
        {{
          "title": "string",
          "lessons": [
            {{
              "title": "string",
              "explanation": "string",
              "key_takeaways": ["string"],
              "examples": ["string"],
              "summary": "string"
            }}
          ]
        }}
      ]
    }}
  ]
}}

Output ONLY the JSON — no explanation before or after."""
        response = self.llm.generate(prompt, max_tokens=5000)  # Increased to 5000
        logger.debug("generate_structure raw LLM response:\n%s", response[:500])
        structure = _extract_json_object(response)
        logger.info(">>> Generated course structure with title=%s", structure.get("title", "?"))
        return {"course_structure": structure}

    def validate_structure_node(self, state: CourseState):
        structure = state["course_structure"]
        logger.info(">>> Node: validate_structure")
        prompt = f"""Validate the following course structure. Is it complete and well-formed? 
Provide feedback in 2-3 sentences. Be concise.

Structure: {json.dumps(structure, indent=2)[:3000]}

Feedback:"""
        feedback = self.llm.generate(prompt, max_tokens=300)
        logger.info(">>> Validation feedback: %s", feedback[:200])
        return {"validation_feedback": feedback}

    def refine_structure_node(self, state: CourseState):
        structure = state["course_structure"]
        feedback = state["validation_feedback"]
        logger.info(">>> Node: refine_structure")
        prompt = f"""Refine the course structure based on the feedback below.
Output ONLY a valid JSON object (same schema as input, no markdown fences).

Structure: {json.dumps(structure, indent=2)[:3000]}
Feedback: {feedback}

Refined JSON:"""
        response = self.llm.generate(prompt, max_tokens=5000)
        logger.debug("refine_structure raw LLM response:\n%s", response[:500])
        try:
            refined = _extract_json_object(response)
        except ValueError as e:
            logger.warning("Could not parse refined structure, keeping original: %s", e)
            refined = structure
        logger.info(">>> Refinement complete, title=%s", refined.get("title", "?"))
        return {"final_output": refined}

    def run(self, text: str) -> Dict:
        logger.info("=== CourseGenerationAgent.run() started, text_length=%d ===", len(text))
        builder = StateGraph(CourseState)
        builder.add_node("chunk", self.chunk_text_node)
        builder.add_node("topics", self.extract_topics_node)
        builder.add_node("generate", self.generate_structure_node)
        builder.add_node("validate", self.validate_structure_node)
        builder.add_node("refine", self.refine_structure_node)

        builder.set_entry_point("chunk")
        builder.add_edge("chunk", "topics")
        builder.add_edge("topics", "generate")
        builder.add_edge("generate", "validate")
        builder.add_edge("validate", "refine")
        builder.add_edge("refine", END)

        graph = builder.compile()
        initial_state = {
            "text": text,
            "chunks": [],
            "topics": [],
            "course_structure": {},
            "validation_feedback": "",
            "final_output": {},
        }
        result = graph.invoke(initial_state)
        final = result.get("final_output", {})
        if not final:
            raise ValueError("LangGraph pipeline completed but produced no final_output.")
        logger.info("=== CourseGenerationAgent.run() completed successfully ===")
        return final