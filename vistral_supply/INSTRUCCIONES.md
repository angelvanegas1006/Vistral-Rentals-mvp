# Instrucciones para Ejecutar la Aplicación Localmente

## Problema Identificado

El servidor puede tener problemas con la detección de interfaces de red. Se han creado múltiples métodos alternativos para ejecutar la aplicación.

## Métodos para Ejecutar la Aplicación

### Método 1: Script Automático (Recomendado)

```bash
./start-dev.sh 3003
```

Este script intentará automáticamente diferentes métodos hasta que uno funcione.

### Método 2: Con Hostname Explícito

```bash
npm run dev:localhost
```

Esto ejecuta: `next dev --hostname localhost --port 3003`

### Método 3: Simple (sin webpack)

```bash
npm run dev:simple
```

Esto ejecuta: `next dev --port 3003`

### Método 4: Modo Producción (Más Estable)

```bash
# Primero construir
npm run build

# Luego ejecutar
npm run start:dev
```

### Método 5: Puerto Personalizado

```bash
# Cualquier puerto que prefieras
npm run dev:simple -- --port 3004
npm run dev:localhost -- --port 3005
```

## Verificar que el Servidor Está Corriendo

Después de ejecutar cualquiera de los métodos, verifica:

1. **Verifica el proceso:**
   ```bash
   lsof -i:3003
   ```

2. **Abre en el navegador:**
   ```
   http://localhost:3003
   ```

3. **Verifica los logs:**
   El servidor debería mostrar algo como:
   ```
   ✓ Ready in Xs
   - Local: http://localhost:3003
   ```

## Si el Servidor No Inicia

### Opción A: Limpiar y Reintentar

```bash
# Matar todos los procesos de Next.js
pkill -f "next dev"
pkill -f "next start"

# Limpiar caché
rm -rf .next

# Reintentar
npm run dev:localhost
```

### Opción B: Verificar Variables de Entorno

```bash
# Verificar que .env.local existe
cat .env.local

# Debe contener:
# NEXT_PUBLIC_SUPABASE_URL=https://dryxwoffrfrtgavcrrgz.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_SLoxGosWZ0iPYQEUVAsMcA_m5G75V4f
```

### Opción C: Usar Modo Producción

El modo producción es más estable y evita problemas del dev server:

```bash
npm run build
npm run start:dev
```

## Solución de Problemas Comunes

### Error: "EADDRINUSE: address already in use"
```bash
# Matar proceso en el puerto
lsof -ti:3003 | xargs kill -9
```

### Error: "EPERM: operation not permitted"
- Ejecuta los comandos directamente en tu terminal (no en el sandbox)
- Verifica permisos de archivos: `chmod -R 755 .`

### Error: "uv_interface_addresses returned Unknown system error"
- Este es un warning del sistema, pero el servidor puede seguir funcionando
- Verifica si responde en http://localhost:3003
- Si no responde, usa el método de producción

### La aplicación se queda cargando
- Ya se aplicaron fixes para esto
- Verifica la consola del navegador (F12) para errores
- Verifica que las variables de entorno estén correctas

## Comandos Útiles

```bash
# Ver qué está usando el puerto
lsof -i:3003

# Matar proceso específico
kill -9 <PID>

# Ver logs en tiempo real
npm run dev:localhost 2>&1 | tee server.log

# Verificar compilación sin ejecutar
npm run build
```

## Alternativas si Nada Funciona

1. **Usar Vercel/Netlify**: Despliega y prueba remotamente
2. **Usar Docker**: Aísla problemas de entorno
3. **Desarrollo en producción**: Usa `npm run build && npm start` siempre
