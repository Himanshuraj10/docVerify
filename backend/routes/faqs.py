from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import difflib

from backend.database import get_db
from backend.models.models import FAQ
from backend.schemas.schemas import FAQResponse, ChatbotQueryRequest, ChatbotQueryResponse

router = APIRouter(prefix="/api", tags=["Help Desk & Chatbot"])

@router.get("/faqs", response_model=List[FAQResponse])
def get_all_faqs(db: Session = Depends(get_db)):
    faqs = db.query(FAQ).filter(FAQ.is_enabled == True).order_by(FAQ.sort_order.asc()).all()
    return faqs

@router.post("/chatbot", response_model=ChatbotQueryResponse)
def query_knowledge_chatbot(payload: ChatbotQueryRequest, db: Session = Depends(get_db)):
    """
    Knowledge-based rule and semantic matcher.
    Designed with a clean abstraction ready for external LLM attachment.
    Transparently notes that responses are sourced from the verified local knowledge base.
    """
    query = payload.message.strip().lower()
    faqs = db.query(FAQ).filter(FAQ.is_enabled == True).all()

    best_match = None
    highest_score = 0.0

    for faq in faqs:
        q_text = faq.question.lower()
        # Direct word overlap
        q_words = set(q_text.split())
        query_words = set(query.split())
        overlap = len(q_words.intersection(query_words)) / max(len(query_words), 1)

        # Sequence matcher ratio
        seq_ratio = difflib.SequenceMatcher(None, query, q_text).ratio()

        score = max(overlap, seq_ratio)
        if score > highest_score:
            highest_score = score
            best_match = faq

    # Suggested questions to present to user
    sample_questions = [
        "What does the forensic heatmap mean?",
        "Why is my document marked as suspicious?",
        "How is blockchain verification secure?",
        "How do I submit an appeal or complaint?"
    ]

    if best_match and highest_score > 0.28:
        reply = (
            f"{best_match.answer}\n\n"
            f"(Source: Verified Knowledge Base — FAQ #{best_match.id})"
        )
        return ChatbotQueryResponse(
            reply=reply,
            matched_faq_id=best_match.id,
            confidence=round(highest_score, 2),
            suggested_questions=sample_questions
        )

    fallback_reply = (
        "I couldn't locate an exact match in our verification knowledge base. "
        "Here are common topics, or you can submit an official inquiry through the Complaint & Appeals desk."
    )
    return ChatbotQueryResponse(
        reply=fallback_reply,
        matched_faq_id=None,
        confidence=0.1,
        suggested_questions=sample_questions
    )
