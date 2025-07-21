# Webhook Routes - Clerk Integration
# 
# This module handles webhooks from Clerk for user lifecycle events.
# Currently handles user creation to initialize challenge quotas.

from fastapi import APIRouter, Request, HTTPException, Depends
from ..database.db import create_challenge_quota
from ..database.models import get_db
from svix.webhooks import Webhook, WebhookVerificationError
import os
import json

router = APIRouter()

@router.post("/clerk")
async def handle_user_created(request: Request, db = Depends(get_db)):
    """
    Handle Clerk webhook events, specifically user creation.
    
    When a new user is created in Clerk, this endpoint:
    1. Verifies the webhook signature
    2. Creates initial challenge quotas for the user
    
    Args:
        request: FastAPI request object containing webhook payload
        db: Database session for quota creation
    
    Returns:
        dict: Status of the webhook processing
    
    Raises:
        HTTPException: 400 for invalid webhook, 500 for server errors
    """
    webhook_secret = os.getenv("CLERK_WEBHOOK_SECRET")
    
    if not webhook_secret:
        raise HTTPException(status_code=500, detail="CLERK_WEBHOOK_SECRET is not set")
    
    body = await request.body()
    payload = body.decode("utf-8")
    headers = dict(request.headers)
    
    try: 
        wh = Webhook(webhook_secret)
        wh.verify(payload, headers)
        
        data = json.loads(payload)
        
        # Only process user.created events
        if data.get("type") != "user.created":
            return {"status": "ignored"}
        
        user_data = data.get("data", {})
        user_id = user_data.get("id")
        
        # Validate user_id exists
        if not user_id:
            raise HTTPException(status_code=422, detail="Invalid webhook payload: missing user ID")
        
        # Create initial challenge quotas for the new user
        create_challenge_quota(db, user_id, "interview")
        create_challenge_quota(db, user_id, "scenario")
        
        return {"status": "success", "user_id": user_id}
    
    except WebhookVerificationError:
        raise HTTPException(status_code=401, detail="Invalid webhook signature")
    
    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="Invalid JSON payload")