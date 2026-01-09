FROM node:20-slim

WORKDIR /app

# Install dependencies for Prisma and canvas (for PDF rendering)
RUN apt-get update && apt-get install -y \
    openssl \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Default command (overridden by docker-compose)
CMD ["npm", "run", "dev"]
