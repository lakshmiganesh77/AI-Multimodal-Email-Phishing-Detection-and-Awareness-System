from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
import logging

from core.rate_limit import limiter
from core.security import create_access_token, verify_password, ACCESS_TOKEN_EXPIRE_MINUTES, verify_token
from database.database import get_db_conn
from pydantic import BaseModel

logger = logging.getLogger("phishguard.routers.auth")

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    username: str
    role: str

@router.post("/login", response_model=LoginResponse)
@limiter.limit("10/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    """Login with username/password. Returns a JWT access token."""
    client_ip = request.client.host if request.client else "unknown"
    from database.database import get_db
    from database.models import User
    
    db = next(get_db())
    
    # Using strict SQLAlchemy Models
    user_record = db.query(User).filter(User.username == form_data.username).first()

    if not user_record or not verify_password(form_data.password, user_record.hashed_password):
        logger.warning(f"FAILED LOGIN | ip={client_ip} | username={form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(
        data={"sub": user_record.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    logger.info(f"SUCCESSFUL LOGIN | ip={client_ip} | username={user_record.username}")
    
    # Store JWT in HttpOnly cookie instead of sending it down directly
    from fastapi.responses import JSONResponse
    response = JSONResponse(content={"access_token": token, "token_type": "bearer", "username": user_record.username, "role": user_record.role})
    import os
    response.set_cookie(
        key="access_token",
        value=f"Bearer {token}",
        httponly=True,
        secure=os.getenv("ENVIRONMENT", "development").lower() == "production",
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    return response

@router.get("/me")
def get_me(username: str = Depends(verify_token)):
    """Returns current authenticated user info."""
    from database.database import get_db
    from database.models import User
    
    db = next(get_db())
    user_record = db.query(User).filter(User.username == username).first()
    
    if not user_record:
        raise HTTPException(status_code=404, detail="User not found")
    return {"username": user_record.username, "role": user_record.role}
