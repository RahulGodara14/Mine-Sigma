FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    PYTHONPATH="/app:/app/backend:/ai_engine:/"

WORKDIR /app

# Install system dependencies required for geospatial packages (rasterio, gdal, shapely)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgdal-dev \
    gdal-bin \
    libgeos-dev \
    libproj-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt* backend/requirements.txt* ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code and ai_engine
COPY ai_engine/ /app/ai_engine/
COPY ai_engine/ /ai_engine/
COPY backend/ /app/
COPY backend/ /app/backend/

EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
