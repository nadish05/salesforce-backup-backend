FROM node:20

# Install Salesforce CLI
RUN npm install --global @salesforce/cli

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "src/server.js"]