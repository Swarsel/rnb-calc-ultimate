FROM node:20-alpine

# Set up the main working directory
WORKDIR /usr/src/app

# Copy all files (needed for subpkg to work correctly)
COPY . .

# Install all dependencies (postinstall will set up subpackages)
RUN npm install

# Build the project
RUN npm run build

# Expose the app's port (Railway uses PORT env variable)
EXPOSE 3000

# Run the server
CMD [ "node", "server.js" ]
