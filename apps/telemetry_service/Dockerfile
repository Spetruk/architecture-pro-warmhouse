# Build stage for Python application
FROM python:3.10-slim AS python-builder

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Runtime stage for Python application
FROM python:3.10-slim

WORKDIR /app

# Copy installed dependencies from builder stage
COPY --from=python-builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=python-builder /usr/local/bin /usr/local/bin

# Copy application files
COPY . .

# Expose port
EXPOSE 8082

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=main.py
ENV FLASK_ENV=production

# Run the application with Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8082", "main:app"]