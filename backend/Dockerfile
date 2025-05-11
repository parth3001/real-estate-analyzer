FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Create data directory
RUN mkdir -p ./data/deals

# Expose port 3001
EXPOSE 3001

# Start the application
CMD ["npm", "start"] 