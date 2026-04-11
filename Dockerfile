FROM node:18

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (IMPORTANT FIX HERE)
RUN npm install

# Copy rest of code
COPY . .

# Fix permission issue
RUN chmod +x node_modules/.bin/vite || true

# Build project
RUN npm run build

# Install serve
RUN npm install -g serve

# Expose port
EXPOSE 8080

# Start app
CMD ["serve", "-s", "dist", "-l", "8080"]