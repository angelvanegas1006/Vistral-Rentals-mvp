# Conectar con GitHub - Cuenta angelvanegas1006

## ✅ Paso 1: Remoto configurado
El repositorio ya está conectado a: `https://github.com/angelvanegas1006/Vistral-Rentals-mvp.git`

## Paso 2: Crear Personal Access Token (PAT)

1. **Ve a GitHub.com** e inicia sesión con la cuenta `angelvanegas1006`

2. **Ve a Settings**:
   - Haz clic en tu foto de perfil (esquina superior derecha)
   - Selecciona "Settings"

3. **Ve a Developer settings**:
   - En el menú lateral izquierdo, baja hasta "Developer settings"
   - Haz clic en "Personal access tokens"
   - Selecciona "Tokens (classic)"

4. **Genera un nuevo token**:
   - Haz clic en "Generate new token" → "Generate new token (classic)"
   - Dale un nombre descriptivo: `Rentals-Vistral-Local`
   - Selecciona los permisos necesarios:
     - ✅ `repo` (Full control of private repositories)
     - ✅ `workflow` (si usas GitHub Actions)
   - Haz clic en "Generate token"

5. **Copia el token inmediatamente** (solo se muestra una vez):
   - Ejemplo: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Paso 3: Configurar Git Credential Manager

Cuando hagas `git push` o `git pull`, Git te pedirá credenciales:
- **Usuario**: `angelvanegas1006`
- **Contraseña**: Pega el Personal Access Token (NO uses tu contraseña de GitHub)

## Paso 4: Probar la conexión

```bash
# Verificar el remoto
git remote -v

# Intentar hacer fetch (esto te pedirá credenciales)
git fetch origin

# O hacer push (si tienes commits)
git push -u origin main
```

## Alternativa: Usar GitHub CLI (más fácil)

Si prefieres una forma más fácil, instala GitHub CLI:

1. Descarga desde: https://cli.github.com/
2. Instala GitHub CLI
3. Ejecuta: `gh auth login`
4. Sigue las instrucciones para autenticarte con la cuenta `angelvanegas1006`

## Nota sobre la cuenta actual

Tu Git está configurado con:
- **Nombre**: Gustavo García Ramos
- **Email**: gustavo.garcia@prophero.com

Si quieres cambiar el email para que coincida con la cuenta de GitHub, ejecuta:
```bash
git config --global user.email "tu-email-de-github@ejemplo.com"
```
