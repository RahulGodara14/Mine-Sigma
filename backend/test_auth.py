import ee
import os
import json

KEY_FILE = "serviceAccountKey.json"

def test_connection():
    print("🔍 DIAGNOSTIC: Testing GEE Connection...")

    # 1. Check if file exists
    if not os.path.exists(KEY_FILE):
        print(f"❌ ERROR: '{KEY_FILE}' not found in current folder.")
        return

    # 2. Read the JSON to see the REAL Project ID
    try:
        with open(KEY_FILE, 'r') as f:
            key_data = json.load(f)
            real_project_id = key_data.get("project_id")
            client_email = key_data.get("client_email")
            print(f"   📂 Key File Loaded.")
            print(f"   👤 Service Account: {client_email}")
            print(f"   i️  Target Project ID: {real_project_id}")
    except Exception as e:
        print(f"❌ ERROR reading JSON: {e}")
        return

    # 3. Try to Authenticate
    try:
        credentials = ee.ServiceAccountCredentials(client_email, key_file=KEY_FILE)
        
        # Force the project ID found in the file
        ee.Initialize(credentials, project=real_project_id)
        
        # Try a simple operation to prove it works
        print("   📡 Contacting Google Earth Engine servers...")
        img = ee.Image("USGS/SRTMGL1_003").getInfo()
        
        print("\n✅ SUCCESS! Authentication is working perfectly.")
        
    except Exception as e:
        print("\n❌ AUTHENTICATION FAILED.")
        print(f"   Error Message: {e}")
        
        if "serviceusage" in str(e) or "permission" in str(e).lower():
            print("\n👉 SOLUTION: The 'Service Usage API' is DISABLED for this project.")
            print(f"   Go here: https://console.cloud.google.com/apis/library/serviceusage.googleapis.com?project={real_project_id}")
            print("   Click ENABLE.")

if __name__ == "__main__":
    test_connection() # <--- FIXED TYPO HERE