import firebase_admin
from firebase_admin import credentials, firestore
import os

# Path to your downloaded JSON key
CRED_PATH = "serviceAccountKey.json"

def get_db_client():
    # Check if firebase app is already initialized to prevent errors on reload
    if not firebase_admin._apps:
        if os.path.exists(CRED_PATH):
            cred = credentials.Certificate(CRED_PATH)
            firebase_admin.initialize_app(cred)
        else:
            # Fallback for production environments (Google Cloud Run/App Engine)
            # where credentials are auto-detected
            firebase_admin.initialize_app()

    return firestore.client()

db = get_db_client()