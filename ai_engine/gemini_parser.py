import os
import json
import re
from dotenv import load_dotenv
import pdfplumber
import google.generativeai as genai

# Load environment variables
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend/.env"))
load_dotenv(env_path)

# Get credentials
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

def extract_text_from_pdf(file_path):
    """
    Extract text from PDF using pdfplumber.
    Free, no API calls, works offline.
    """
    try:
        print(f"📄 PDF Parser: Processing {file_path}...")
        
        text = ""
        with pdfplumber.open(file_path) as pdf:
            print(f"📄 PDF Parser: Found {len(pdf.pages)} pages")
            for i, page in enumerate(pdf.pages):
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        
        if text.strip():
            print(f"✅ PDF Parser: Extracted {len(text)} characters from {len(pdf.pages)} pages")
            return text
        else:
            print("⚠️ PDF Parser: No text found in PDF (might be scanned/image-based)")
            return None
        
    except Exception as e:
        print(f"❌ PDF Parser Error: {e}")
        return None

def validate_dimensions(params):
    """
    Validate and sanitize extracted dimensions.
    Ensures values are reasonable (100m to 100km).
    """
    MIN_DIM = 100  # 100 meters
    MAX_DIM = 100000  # 100 km
    
    for key in ['length_m', 'width_m', 'depth_m']:
        if params.get(key) is not None:
            val = params[key]
            # If value is unreasonably large, set to None
            if val > MAX_DIM or val < MIN_DIM:
                print(f"⚠️ Validation: {key}={val} is outside reasonable range [{MIN_DIM}, {MAX_DIM}], setting to None")
                params[key] = None
    
    return params

def extract_mining_params_with_regex(text):
    """
    Extract mining parameters using regex patterns.
    Fallback when Gemini is unavailable.
    """
    try:
        print("🔍 Regex Parser: Extracting mining parameters from text...")
        
        params = {}
        
        # Extract latitude (look for patterns like "lat", "latitude", "23.xxx")
        lat_match = re.search(r'(?:lat|latitude)[\s:]*([0-9]{1,2}\.[0-9]{4,})', text, re.IGNORECASE)
        params['lat'] = float(lat_match.group(1)) if lat_match else None
        
        # Extract longitude (look for patterns like "lon", "longitude", "82.xxx")
        lon_match = re.search(r'(?:lon|longitude)[\s:]*([0-9]{1,3}\.[0-9]{4,})', text, re.IGNORECASE)
        params['lon'] = float(lon_match.group(1)) if lon_match else None
        
        # Extract length in meters
        length_match = re.search(r'(?:length|l)[\s:]*([0-9]{2,5})\s*(?:m|meter)', text, re.IGNORECASE)
        params['length_m'] = int(length_match.group(1)) if length_match else None
        
        # Extract width in meters
        width_match = re.search(r'(?:width|w)[\s:]*([0-9]{2,5})\s*(?:m|meter)', text, re.IGNORECASE)
        params['width_m'] = int(width_match.group(1)) if width_match else None
        
        # Extract depth in meters
        depth_match = re.search(r'(?:depth|d)[\s:]*([0-9]{1,4})\s*(?:m|meter)', text, re.IGNORECASE)
        params['depth_m'] = int(depth_match.group(1)) if depth_match else None
        
        # Extract project name (look for common patterns)
        project_match = re.search(r'(?:project|site|mine)[\s:]*([A-Za-z0-9_\s]{5,50}?)(?:\n|,|$)', text, re.IGNORECASE)
        params['project_name'] = project_match.group(1).strip() if project_match else None
        
        # Extract lease ID
        lease_match = re.search(r'(?:lease|permit|id)[\s:]*([A-Z0-9\-]{3,20})', text, re.IGNORECASE)
        params['lease_id'] = lease_match.group(1) if lease_match else None
        
        # Validate dimensions
        params = validate_dimensions(params)
        
        # Only return if we extracted at least some data
        if any(v is not None for v in params.values()):
            print(f"✅ Regex Parser: Successfully extracted parameters: {params}")
            return params
        else:
            print("⚠️ Regex Parser: Could not extract any parameters")
            return None
        
    except Exception as e:
        print(f"❌ Regex Parser Error: {e}")
        return None

def extract_mining_params_from_text(text):
    """
    Use Gemini to extract mining parameters from extracted text.
    Falls back to regex extraction if Gemini is unavailable.
    """
    if not text:
        return None
    
    # Try Gemini first if API key is available
    if GOOGLE_API_KEY:
        try:
            print("🤖 Gemini: Extracting mining parameters from text...")
            
            prompt = f"""Analyze the following mining document text and extract these parameters in JSON format:
- lat (latitude, numeric) - REQUIRED
- lon (longitude, numeric) - REQUIRED
- length_m (length/area in meters, numeric) - OPTIONAL, can be null
- width_m (width/area in meters, numeric) - OPTIONAL, can be null
- depth_m (depth in meters, numeric) - OPTIONAL, can be null
- project_name (string) - REQUIRED
- lease_id (string) - OPTIONAL, can be null

Focus on extracting coordinates (lat/lon) and project name. Other fields can be null if not found.

Document text:
{text}

Return ONLY valid JSON, no other text. Example: {{ "lat": 23.7, "lon": 86.4, "length_m": null, "width_m": null, "depth_m": null, "project_name": "Jharia", "lease_id": null }}"""
            
            # Try multiple models in order of preference
            models_to_try = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-2.0-pro-exp']
            response = None
            
            for model_name in models_to_try:
                try:
                    print(f"🤖 Gemini: Trying {model_name}...")
                    model = genai.GenerativeModel(model_name)
                    response = model.generate_content(prompt)
                    print(f"✅ Gemini: Using {model_name}")
                    break
                except Exception as model_error:
                    print(f"⚠️ Gemini: {model_name} not available, trying next...")
                    continue
            
            if response:
                # Parse the response
                response_text = response.text.strip()
                # Remove markdown code blocks if present
                if response_text.startswith("```"):
                    response_text = response_text.split("```")[1]
                    if response_text.startswith("json"):
                        response_text = response_text[4:]
                
                params = json.loads(response_text)
                # Validate dimensions
                params = validate_dimensions(params)
                print(f"✅ Gemini: Successfully extracted parameters: {params}")
                return params
        
        except Exception as e:
            print(f"❌ Gemini Error: {e}")
    
    # Fallback to regex extraction
    print("⚠️ Falling back to regex-based extraction...")
    return extract_mining_params_with_regex(text)

def extract_mining_params(file_path):
    """
    Main function to extract mining parameters from uploaded document.
    Uses pdfplumber for PDF parsing and Gemini/Regex for parameter extraction.
    """
    print(f"🤖 AI PARSER: Reading {file_path}...")
    
    # Step 1: Extract text from PDF using pdfplumber
    extracted_text = extract_text_from_pdf(file_path)
    
    # Step 2: Extract parameters from text using Gemini or Regex
    if extracted_text:
        params = extract_mining_params_from_text(extracted_text)
        if params:
            return params
    
    # If no parameters could be extracted, return None
    print("❌ Could not extract mining parameters from document")
    return None