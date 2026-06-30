# Use the official Python 3.12 slim image as the base image.
# "slim" is a smaller version of Python that reduces the final image size.
FROM python:3.12-slim

# Set the working directory inside the container.
# All following commands will be executed from /app.
WORKDIR /app

# Install system packages required for building some Python packages
# (e.g., psycopg2) and then clean up the apt cache to keep the image small.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy only the requirements file first.
# This allows Docker to cache dependency installation if the requirements
# haven't changed between builds.
COPY requirements.txt .

# Install all Python dependencies listed in requirements.txt.
# --no-cache-dir prevents pip from storing downloaded package caches,
# reducing the final image size.
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application source code into the container.
COPY . .

# Create the uploads directory if it doesn't already exist.
# This is where uploaded files will be stored.
RUN mkdir -p /app/uploads

# Document that the application listens on port 8000.
# This does not actually publish the port—it serves as metadata.
EXPOSE 8000

# Start the FastAPI application using Uvicorn.
# --host 0.0.0.0 makes the server accessible from outside the container.
# --port 8000 tells Uvicorn which port to listen on.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]