#!/bin/bash

# Create .env if not exists
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file. Please update it with your settings."
fi

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start the server
uvicorn main:app --host 0.0.0.0 --port 3000 --reload