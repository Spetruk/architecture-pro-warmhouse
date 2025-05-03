# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Runtime stage
FROM node:18-alpine

WORKDIR /app

# Copy node_modules from builder stage
COPY --from=builder /app/node_modules /app/node_modules

# Copy application files
COPY ./src ./src
COPY package*.json ./

# Expose port
EXPOSE 8083

# Set node environment
ENV NODE_ENV=production

# Run the application
CMD ["node", "src/server.js"]