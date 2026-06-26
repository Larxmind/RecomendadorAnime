# Usamos una imagen ligera oficial de Python
FROM python:3.12-slim

# Evita que Python escriba archivos .pyc en el disco y asegura que los logs salgan directos a la consola
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copiamos e instalamos las dependencias abstrayendo la caché de Docker
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos el código del backend
COPY . .

# Exponemos el puerto de FastAPI
EXPOSE 8000

# Arrancamos la aplicación escuchando en todas las interfaces de red del contenedor
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]