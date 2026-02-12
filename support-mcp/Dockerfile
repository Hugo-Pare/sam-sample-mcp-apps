FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source and build files
COPY tsconfig.json ./
COPY src ./src

# Install dev dependencies and build
RUN npm install typescript @types/node @types/express && \
    npm run build && \
    npm prune --production

# Expose SSE and HTTP ports
EXPOSE 5000 5001

# Start both SSE and HTTP servers
CMD ["sh", "-c", "node dist/index.js & node dist/streamable-http.js & wait"]
