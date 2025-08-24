# Use official Node.js image
FROM node:24-alpine3.22

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend code
COPY . .

# Expose port
EXPOSE 4000

# Start the app
CMD ["node", "index.js"]
