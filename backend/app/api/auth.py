from fastapi import APIRouter, Depends, HTTPException
from appwrite.client import Client
from appwrite.services.account import Account
from appwrite.services.databases import Databases
import os
from dotenv import load_dotenv
from pydantic import BaseModel

# Load environment variables
load_dotenv()

# Initialize Appwrite client
client = Client()
client.set_endpoint(os.getenv('APPWRITE_ENDPOINT', 'http://localhost/v1'))
client.set_project(os.getenv('APPWRITE_PROJECT_ID', 'your-project-id'))
client.set_key(os.getenv('APPWRITE_API_KEY', 'your-api-key'))

account = Account(client)
db = Databases(client)

# Create router
router = APIRouter(prefix="/auth", tags=["auth"])

class UserRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
async def register_user(user: UserRequest):
    try:
        result = account.create(
            user_id='unique()', 
            email=user.email, 
            password=user.password
        )
        return {"success": True, "user": result}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/login")
async def login_user(user: UserRequest):
    try:
        # Using the correct session creation method for email/password
        session = account.create_email_password_session(
            email=user.email, 
            password=user.password
        )
        return {"success": True, "session": session}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/feedback")
async def save_feedback(user_id: str, feedback: str):
    try:
        result = db.create_document(
            database_id=os.getenv('APPWRITE_DATABASE_ID', 'your-database-id'),
            collection_id=os.getenv('APPWRITE_COLLECTION_ID', 'your-collection-id'),
            document_id="unique()",
            data={"user_id": user_id, "feedback": feedback}
        )
        return {"success": True, "document": result}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/feedback/{user_id}")
async def get_feedback(user_id: str):
    try:
        documents = db.list_documents(
            database_id=os.getenv('APPWRITE_DATABASE_ID', 'your-database-id'),
            collection_id=os.getenv('APPWRITE_COLLECTION_ID', 'your-collection-id'),
            queries=["user_id=" + user_id]
        )
        return {"success": True, "feedback": documents}
    except Exception as e:
        return {"success": False, "error": str(e)}