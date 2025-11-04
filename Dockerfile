# Base image
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm@10

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies stage
FROM base AS dependencies
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS build
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN pnpm prisma generate

# Build the application
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm@10

WORKDIR /app

# Copy package files and prisma schema
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Install Prisma CLI temporarily for generating client
RUN pnpm add -D prisma

# Generate Prisma Client in production stage
RUN pnpm prisma generate

# Remove Prisma CLI to reduce image size
RUN pnpm remove prisma

# Copy built application
COPY --from=build /app/dist ./dist

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "dist/main.js"]
