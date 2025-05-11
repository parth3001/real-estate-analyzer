#!/bin/bash

# Check if .env file exists
if [ ! -f .env ]; then
  echo "ERROR: .env file not found!"
  echo "Please run the ec2-setup.sh script first to set up your environment."
  exit 1
fi

# Check if OpenAI API key is set
if ! grep -q "OPENAI_API_KEY=" .env || grep -q "OPENAI_API_KEY=$" .env; then
  echo "ERROR: OpenAI API key not found in .env file!"
  echo "Please edit your .env file and add your OpenAI API key:"
  echo "OPENAI_API_KEY=your_actual_api_key"
  exit 1
fi

echo "Environment configuration verified..."

# Pull the latest code (if using git)
# git pull origin main

# Build and start the containers
docker-compose up -d --build

echo "Real Estate Analyzer deployed successfully!"
echo "Frontend is accessible at http://YOUR_EC2_PUBLIC_IP"
echo "Backend API is accessible at http://YOUR_EC2_PUBLIC_IP:3001/api"

# Verify the OpenAI API key is properly passed to the backend container
echo "Verifying OpenAI API key in backend container..."
if docker-compose exec backend sh -c 'echo $OPENAI_API_KEY | grep -q "^sk-"'; then
  echo "✅ OpenAI API key is properly configured in the backend container."
else
  echo "⚠️ Warning: OpenAI API key may not be properly configured in the backend container."
  echo "AI analysis features may not work correctly."
  echo "Check your .env file and restart the containers with: docker-compose down && docker-compose up -d"
fi 