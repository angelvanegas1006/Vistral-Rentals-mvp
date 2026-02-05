# Solución de Problemas de Permisos de npm

## Problema
Error `EACCES: permission denied` al intentar instalar dependencias en `node_modules`.

## Solución

Ejecuta estos comandos en tu terminal (uno por uno):

### 1. Arreglar permisos del directorio del proyecto
```bash
cd "/Users/manuelgomezvega/Desktop/Vistral-Rentals/Rentals Vistral"
sudo chown -R $(whoami) .
```

### 2. Si node_modules existe y tiene permisos incorrectos, eliminarlo y recrearlo
```bash
# Eliminar node_modules si existe
rm -rf node_modules

# Eliminar package-lock.json si existe (opcional, pero recomendado)
rm -f package-lock.json
```

### 3. Instalar dependencias de nuevo
```bash
npm install
```

## Alternativa: Usar npx para evitar problemas de permisos

Si los problemas persisten, puedes intentar:

```bash
# Limpiar caché de npm
npm cache clean --force

# Instalar sin usar el caché global
npm install --no-optional --legacy-peer-deps
```

## Verificar permisos

Para verificar que los permisos están correctos:

```bash
ls -la | grep node_modules
```

Deberías ver que el propietario es tu usuario, no root.
