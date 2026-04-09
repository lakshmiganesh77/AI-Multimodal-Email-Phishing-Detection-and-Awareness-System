from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from api.chatbot import chatbot
import traceback
import logging

logger = logging.getLogger("phishguard.chat")
router = APIRouter(tags=["AI Chatbot"])

class ChatRequest(BaseModel):
    message: str
    email_id: Optional[int] = None

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        email_data = None
        
        if request.email_id:
            from database.database import get_db_conn
            conn = get_db_conn()
            cur = conn.cursor()
            
            cur.execute("""
            SELECT sender, subject, label, risk_score, reasons, body, body_html
            FROM email_scans
            WHERE id = ?
            """, (request.email_id,))
            
            row = cur.fetchone()
            conn.close()
            
            if row:
                email_data = {
                    "sender": row[0],
                    "subject": row[1],
                    "label": row[2],
                    "risk_score": row[3],
                    "reasons": row[4],
                    "body": row[5],
                    "body_html": row[6] if len(row) > 6 else ""
                }
        
        response_text = await chatbot.chat(request.message, email_data)
        
        return {
            "response": response_text,
            "context_used": email_data is not None,
            "ollama_available": False 
        }
        
    except Exception as e:
        logger.error("Chatbot Error", exc_info=True)
        return {
            "response": "Gemini AI encountered a processing error. Please try again.",
            "context_used": False,
            "ollama_available": False,
            "error": str(e)
        }
