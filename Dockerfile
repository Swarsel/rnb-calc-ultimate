FROM node:20-alpine

# Set up the main working directory
WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./
COPY calc/package*.json ./calc/

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the project
RUN npm run build

# Expose the app's port (Railway uses PORT env variable)
EXPOSE 3000

# Run the server
CMD [ "node", "server.js" ]
