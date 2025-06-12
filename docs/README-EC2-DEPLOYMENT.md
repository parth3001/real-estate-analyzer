# Deploying Real Estate Analyzer to EC2

This guide provides step-by-step instructions for deploying the Real Estate Analyzer application to an AWS EC2 instance using Docker containers.

## Prerequisites

1. An AWS account
2. An EC2 instance running Amazon Linux 2
3. An OpenAI API key (required for AI analysis features)
4. SSH key pair for connecting to your EC2 instance

## Deployment Steps

### 1. Launch an EC2 Instance

1. Log in to your AWS Console and navigate to EC2
2. Click "Launch instance"
3. Select Amazon Linux 2 AMI
4. Choose an instance type (t2.micro for testing, t2.small or better for production)
5. Configure the instance:
   - Create or select a key pair for SSH access
   - Create a security group with the following rules:
     - SSH (port 22) from your IP
     - HTTP (port 80) from anywhere
     - Custom TCP (port 3001) from anywhere (or restrict to specific IPs for production)

6. Launch the instance and wait for it to initialize

### 2. Prepare Your EC2 Instance

1. Connect to your EC2 instance:
   ```bash
   ssh -i /path/to/your-key.pem ec2-user@your-ec2-public-ip
   ```

2. Copy the setup script to your EC2 instance:
   ```bash
   scp -i /path/to/your-key.pem deployment/ec2-setup.sh ec2-user@your-ec2-public-ip:~/
   ```

3. Make the script executable and run it:
   ```bash
   chmod +x ~/ec2-setup.sh
   ~/ec2-setup.sh
   ```

4. **IMPORTANT**: When prompted, enter your OpenAI API key. This key is required for the AI analysis features to work.

5. Log out and log back in for the Docker group membership to take effect:
   ```bash
   exit
   ssh -i /path/to/your-key.pem ec2-user@your-ec2-public-ip
   ```

### 3. Deploy the Application

1. Package your application code:
   ```bash
   zip -r real-estate-analyzer.zip . -x "node_modules/*" "frontend/node_modules/*" "backend/node_modules/*" ".git/*"
   ```

2. Transfer the zip file and deployment script to your EC2 instance:
   ```bash
   scp -i /path/to/your-key.pem real-estate-analyzer.zip deployment/deploy.sh ec2-user@your-ec2-public-ip:~/real-estate-analyzer/
   ```

3. SSH into your EC2 instance, extract the files, and run the deployment script:
   ```bash
   ssh -i /path/to/your-key.pem ec2-user@your-ec2-public-ip
   cd ~/real-estate-analyzer
   unzip real-estate-analyzer.zip
   chmod +x deploy.sh
   ./deploy.sh
   ```

4. The deployment script will:
   - Verify that your OpenAI API key is set
   - Build and start the Docker containers
   - Confirm that the API key is properly passed to the backend container

5. Your application should now be running at:
   - Frontend: http://your-ec2-public-ip
   - Backend API: http://your-ec2-public-ip:3001/api

## Troubleshooting OpenAI API Key Issues

If the AI analysis features aren't working, follow these steps:

1. Verify your API key in the .env file:
   ```bash
   cat ~/real-estate-analyzer/.env
   ```

2. Make sure it starts with `sk-` and isn't expired

3. Edit the file if needed:
   ```bash
   nano ~/real-estate-analyzer/.env
   ```

4. After updating the key, restart the containers:
   ```bash
   cd ~/real-estate-analyzer
   docker-compose down
   docker-compose up -d
   ```

5. Check if the key is being passed correctly:
   ```bash
   cd ~/real-estate-analyzer
   docker-compose exec backend sh -c 'echo $OPENAI_API_KEY'
   ```

## Updating the Application

When you need to update your application:

1. Make changes to your local codebase
2. Zip the updated code and transfer it to EC2 as in Step 3 above
3. SSH into your EC2 instance
4. Extract the new code and restart the containers:
   ```bash
   cd ~/real-estate-analyzer
   unzip -o real-estate-analyzer.zip  # -o to overwrite existing files
   docker-compose up -d --build
   ``` 