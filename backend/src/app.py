from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from clerk_backend_api import Clerk
from .routes import challenge, webhooks, health
import os

clerk_sdk = Clerk(bearer_auth=os.getenv("CLERK_SECRET_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins= [
        "http://localhost:5173",
        "https://intrvu-production.up.railway.app",    
        "https://intrvu-one.vercel.app",
        # "https://intrvu.store",  # Your custom domain
        # "https://www.intrvu.store",  # Your custom domain with www
        "https://www.intrvu.online",
        "https://intrvu.online",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include challenge router with API prefix
app.include_router(challenge.router, prefix="/api")

app.include_router(webhooks.router, prefix="/webhooks")

app.include_router(health.router, prefix="/api")