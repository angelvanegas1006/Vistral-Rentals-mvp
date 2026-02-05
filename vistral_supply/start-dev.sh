#!/bin/bash

# Script para iniciar el servidor de desarrollo
# Uso: ./start-dev.sh [puerto]

PORT=${1:-3003}

echo "🚀 Iniciando servidor en puerto $PORT..."

# Matar procesos en el puerto
echo "🧹 Limpiando puerto $PORT..."
lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
sleep 1

# Intentar método 1: con hostname explícito
echo "📦 Método 1: Con hostname localhost..."
PORT_ARG=""
if [ "$PORT" != "3003" ]; then
  PORT_ARG="--port $PORT"
fi
npm run dev:localhost $PORT_ARG || {
  echo "❌ Método 1 falló, intentando método 2..."
  
  # Método 2: simple con webpack
  echo "📦 Método 2: Simple con webpack..."
  npm run dev:simple $PORT_ARG || {
    echo "❌ Método 2 falló, intentando método 3..."
    
    # Método 3: producción build
    echo "📦 Método 3: Modo producción..."
    echo "🔨 Construyendo aplicación..."
    npm run build
    echo "🚀 Iniciando servidor de producción..."
    npm run start:dev -- --port $PORT
  }
}
