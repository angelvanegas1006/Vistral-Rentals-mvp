# Guía para Conectar tu Cuenta de GitHub

## Paso 1: Instalar Git

1. Descarga Git desde: https://git-scm.com/download/win
2. Instala Git con las opciones por defecto
3. Reinicia tu terminal después de la instalación

## Paso 2: Configurar Git con tus credenciales

Después de instalar Git, ejecuta estos comandos en PowerShell o CMD:

```bash
# Configura tu nombre de usuario
git config --global user.name "Tu Nombre"

# Configura tu email de GitHub
git config --global user.email "tu-email@ejemplo.com"
```

## Paso 3: Conectar con GitHub

### Opción A: Usar GitHub CLI (Recomendado)

1. Instala GitHub CLI desde: https://cli.github.com/
2. Ejecuta: `gh auth login`
3. Sigue las instrucciones para autenticarte

### Opción B: Usar Personal Access Token

1. Ve a GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Genera un nuevo token con permisos de `repo`
3. Cuando hagas `git push`, usa el token como contraseña

### Opción C: Usar SSH Keys

1. Genera una clave SSH:
   ```bash
   ssh-keygen -t ed25519 -C "tu-email@ejemplo.com"
   ```

2. Copia tu clave pública:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```

3. Agrega la clave en GitHub: Settings → SSH and GPG keys → New SSH key

## Paso 4: Conectar Cursor con GitHub

1. Abre Cursor
2. Ve a Settings (Ctrl+,)
3. Busca "GitHub" en la configuración
4. Conecta tu cuenta de GitHub desde allí

## Verificar la conexión

```bash
# Verifica tu configuración de Git
git config --list

# Prueba la conexión con GitHub
gh auth status
```
