# -------------------------
# Stage 1: Build the React application
# -------------------------

# Use the official Node.js 20 Alpine image.
# Alpine is a lightweight Linux distribution, making the image smaller.
FROM node:20-alpine AS build

# Set the working directory inside the container.
WORKDIR /app

# Copy package.json and package-lock.json first.
# This allows Docker to cache dependency installation if these files
# haven't changed.
COPY package*.json ./

# Install project dependencies exactly as specified in package-lock.json.
# npm ci is recommended for production builds because it is faster and
# guarantees reproducible installs.
RUN npm ci

# Copy the rest of the application's source code.
COPY . .

# Build-time environment variable.
# Vite will replace import.meta.env.VITE_API_URL with this value.
# By default, API requests are sent to "/api".
ARG VITE_API_URL=/api

# Build the optimized production version of the React application.
RUN npm run build


# -------------------------
# Stage 2: Serve the application
# -------------------------

# Use a lightweight Nginx image to serve the static files.
FROM nginx:alpine

# Copy the built React application from the build stage
# into Nginx's default web directory.
COPY --from=build /app/dist /usr/share/nginx/html

# Replace the default Nginx configuration with a custom one.
# This is commonly used to:
# - support React Router (SPA routing)
# - configure caching
# - proxy API requests if needed
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Document that the container listens on port 80.
EXPOSE 80