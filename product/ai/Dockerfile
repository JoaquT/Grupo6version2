# product/ai/Dockerfile
FROM python:3.9-slim

WORKDIR /app

# Instalar dependencias del sistema para PostgreSQL
RUN apt-get update && apt-get install -y libpq-dev gcc

# Copiar e instalar requerimientos
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código
COPY . .

# Exponer puerto (Flask suele usar 5000)
EXPOSE 5000

# Comando de inicio
CMD ["python", "appia.py"]