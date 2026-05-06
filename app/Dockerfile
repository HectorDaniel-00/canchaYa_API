# BASE STAGE
FROM node:24-alpine AS base

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./


# DEVELOPMENT STAGE (for Local)
FROM base AS development

# Install all dependencies (including devDependencies)
RUN npm install

# Copy source code
COPY . .

RUN npx prisma generate

# Expose development port
EXPOSE 3007

# Start in development mode
CMD ["npm", "run", "start:dev"]


# BUILD STAGE (for production)
FROM base AS build

# Install all dependencies (need devDependencies for build)
RUN npm install

# Copy source code
COPY . .

RUN npx prisma generate

# Build the application
RUN npm run build

# PRODUCTION STAGE (for production)
FROM node:24-alpine AS production

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built application from build stage
COPY --from=build /usr/src/app/dist ./dist

COPY --from=build /usr/src/app/src/generated ./src/generated
# Copy prisma files too
COPY --from=build /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /usr/src/app/node_modules/@prisma ./node_modules/@prisma

# Expose production port
EXPOSE 3007

# Start in production mode
CMD ["node", "dist/main.js"]