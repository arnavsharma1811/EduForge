import json
import re
import logging
from typing import List, Dict, TypedDict
from langgraph.graph import StateGraph, END
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)

def _extract_json_object(text: str) -> dict:
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
        repaired = re.sub(r',(\s*[}\]])', r'\1', candidate)
        try:
            return json.loads(repaired)
        except json.JSONDecodeError as e:
            raise ValueError(f"Could not parse JSON: {e}. Raw: {candidate[:200]}...")

def _extract_json_array(text: str) -> list:
    cleaned = re.sub(r"```(?:json)?\s*", "", text).strip()
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, list):
            return parsed
        if isinstance(parsed, dict) and "questions" in parsed:
            return parsed["questions"]
    except json.JSONDecodeError:
        pass
    start = cleaned.find("[")
    if start == -1:
        raise ValueError("No JSON array found in LLM response")
    depth = 0
    for i in range(start, len(cleaned)):
        if cleaned[i] == "[":
            depth += 1
        elif cleaned[i] == "]":
            depth -= 1
            if depth == 0:
                candidate = cleaned[start : i + 1]
                try:
                    return json.loads(candidate)
                except json.JSONDecodeError:
                    break
    raise ValueError("Could not parse JSON array from LLM response")

class PYQState(TypedDict):
    text: str
    questions: List[str]
    question_topic_map: List[Dict]
    ranked_topics: List[Dict]
    final_output: Dict

class PYQAnalysisAgent:
    def __init__(self):
        self.llm = LLMService()

    def extract_questions_node(self, state: PYQState):
        logger.info(">>> Node: extract_questions")
        prompt = f"""Extract all questions from the following text. Return as a JSON array of strings.
Text: {state['text']}

Output ONLY a JSON array of strings."""
        response = self.llm.generate(prompt, max_tokens=3000)
        try:
            questions = _extract_json_array(response)
        except ValueError as e:
            logger.warning(f"Failed to extract questions: {e}")
            questions = []
        return {"questions": questions}

    def map_topics_node(self, state: PYQState):
        logger.info(">>> Node: map_topics")
        questions_str = json.dumps(state['questions'])
        prompt = f"""Given these questions, map each to a topic name.
Return a JSON array of objects with keys "question" and "topic".
Questions: {questions_str}

Output ONLY a JSON array of objects."""
        response = self.llm.generate(prompt, max_tokens=3000)
        try:
            question_topic_map = _extract_json_array(response)
        except ValueError as e:
            logger.warning(f"Failed to map topics: {e}")
            question_topic_map = []
        return {"question_topic_map": question_topic_map}

    def rank_topics_node(self, state: PYQState):
        logger.info(">>> Node: rank_topics")
        topic_counts = {}
        topic_questions = {}
        for item in state['question_topic_map']:
            topic = item.get("topic", "Unknown")
            q = item.get("question", "")
            topic_counts[topic] = topic_counts.get(topic, 0) + 1
            if topic not in topic_questions:
                topic_questions[topic] = []
            topic_questions[topic].append(q)

        ranked = sorted(
            [{"topic": k, "frequency": v, "questions": topic_questions[k]} for k, v in topic_counts.items()],
            key=lambda x: x["frequency"],
            reverse=True
        )
        
        n = len(ranked)
        for i, item in enumerate(ranked):
            if i < n / 3:
                item["priority"] = "high"
            elif i < 2 * n / 3:
                item["priority"] = "medium"
            else:
                item["priority"] = "low"
                
        return {"ranked_topics": ranked}

    def generate_study_material_node(self, state: PYQState):
        logger.info(">>> Node: generate_study_material")
        ranked_topics = state["ranked_topics"]
        for topic_data in ranked_topics[:10]:
            prompt = f"""Generate study material for this topic based on these questions.
Topic: {topic_data['topic']}
Questions: {json.dumps(topic_data['questions'])}

Output a SINGLE valid JSON object with:
- "summary": string
- "key_points": list of strings
- "model_answers": list of objects with "question" and "answer" strings

Output ONLY the JSON object."""
            response = self.llm.generate(prompt, max_tokens=3000)
            try:
                study_material = _extract_json_object(response)
                topic_data["study_material"] = study_material
            except ValueError as e:
                logger.warning(f"Failed to generate study material for topic {topic_data['topic']}: {e}")
                topic_data["study_material"] = {"summary": "", "key_points": [], "model_answers": []}
        return {"ranked_topics": ranked_topics}

    def generate_quizzes_node(self, state: PYQState):
        logger.info(">>> Node: generate_quizzes")
        ranked_topics = state["ranked_topics"]
        for topic_data in ranked_topics[:10]:
            prompt = f"""Generate exactly 3 multiple-choice questions for the topic: {topic_data['topic']}.
Output ONLY a JSON array of objects, each with:
- "question": string
- "options": list of exactly 4 strings
- "correct_answer": string
- "explanation": string

Output ONLY the JSON array."""
            response = self.llm.generate(prompt, max_tokens=2000)
            try:
                quiz_questions = _extract_json_array(response)
                topic_data["quiz"] = {"questions": quiz_questions}
            except ValueError as e:
                logger.warning(f"Failed to generate quiz for topic {topic_data['topic']}: {e}")
                topic_data["quiz"] = {"questions": []}
                
        final_output = {
            "title": "PYQ Analysis: Inferred Subject",
            "total_questions_found": len(state["questions"]),
            "priority_topics": ranked_topics
        }
        return {"ranked_topics": ranked_topics, "final_output": final_output}

    def run(self, text: str) -> Dict:
        logger.info("=== PYQAnalysisAgent.run() started ===")
        builder = StateGraph(PYQState)
        builder.add_node("extract_questions", self.extract_questions_node)
        builder.add_node("map_topics", self.map_topics_node)
        builder.add_node("rank_topics", self.rank_topics_node)
        builder.add_node("generate_study_material", self.generate_study_material_node)
        builder.add_node("generate_quizzes", self.generate_quizzes_node)

        builder.set_entry_point("extract_questions")
        builder.add_edge("extract_questions", "map_topics")
        builder.add_edge("map_topics", "rank_topics")
        builder.add_edge("rank_topics", "generate_study_material")
        builder.add_edge("generate_study_material", "generate_quizzes")
        builder.add_edge("generate_quizzes", END)

        graph = builder.compile()
        initial_state = {
            "text": text,
            "questions": [],
            "question_topic_map": [],
            "ranked_topics": [],
            "final_output": {},
        }
        result = graph.invoke(initial_state)
        final = result.get("final_output", {})
        if not final:
            raise ValueError("LangGraph pipeline completed but produced no final_output.")
        logger.info("=== PYQAnalysisAgent.run() completed successfully ===")
        return final
