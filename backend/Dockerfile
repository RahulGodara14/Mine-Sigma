FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

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

# Copy requirements from either root or backend/ context
COPY requirements.txt* backend/requirements.txt* ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy source files (works for both root context and backend context)
COPY backend/ ./
COPY . ./

EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
