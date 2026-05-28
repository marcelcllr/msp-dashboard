# Cómo subir tu dashboard a internet

## Paso 1 — Crear cuenta en Supabase (base de datos)
1. Ve a https://supabase.com y crea una cuenta gratis
2. Clic en "New project" → ponle nombre "msp-dashboard" → elige región "South America"
3. Espera ~2 minutos a que se cree
4. Ve a "SQL Editor" → pega el contenido de SUPABASE_SETUP.sql → clic "Run"
5. Ve a "Settings" → "API" → copia:
   - Project URL (algo como https://xxxxx.supabase.co)
   - anon/public key (texto largo que empieza con eyJ...)

## Paso 2 — Crear cuenta en GitHub
1. Ve a https://github.com y crea una cuenta gratis
2. Clic en "New repository" → nombre: "msp-dashboard" → Public → Create
3. Sube todos los archivos de esta carpeta al repositorio
   (puedes usar el botón "uploading an existing file" en GitHub)

## Paso 3 — Crear cuenta en Vercel
1. Ve a https://vercel.com → "Sign up with GitHub"
2. Clic "Add New Project" → importa tu repositorio "msp-dashboard"
3. Antes de hacer Deploy, ve a "Environment Variables" y agrega:
   - VITE_SUPABASE_URL = (la URL de Supabase del paso 1)
   - VITE_SUPABASE_ANON_KEY = (la key de Supabase del paso 1)
   - VITE_APP_PASSWORD = (la contraseña que quieras, ej: MielMSP2024)
4. Clic "Deploy" → espera ~1 minuto

## Resultado
Tu dashboard estará en una URL tipo: https://msp-dashboard.vercel.app
- Marcel entra desde su celular con esa URL + contraseña
- Gustavo entra desde su celular con esa URL + contraseña
- Todo se sincroniza automáticamente entre los dos

## Cambiar la contraseña después
Ve a Vercel → tu proyecto → Settings → Environment Variables → edita VITE_APP_PASSWORD
