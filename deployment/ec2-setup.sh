#!/bin/bash

# Update system packages
sudo yum update -y

# Install Docker
sudo amazon-linux-extras install docker -y
sudo service docker start
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create app directory
mkdir -p ~/real-estate-analyzer
cd ~/real-estate-analyzer

# Prompt for OpenAI API key
echo "*** IMPORTANT: OpenAI API Key Required ***"
echo "The AI analysis features require a valid OpenAI API key."
read -p "Please enter your OpenAI API key: " OPENAI_KEY

# Create .env file with the provided OpenAI API key
cat > .env << EOL
OPENAI_API_KEY=${OPENAI_KEY}
EOL

echo "EC2 setup completed. Docker and Docker Compose installed."
echo "Your OpenAI API key has been saved to the .env file."
echo "If you need to change it later, edit ~/real-estate-analyzer/.env" 