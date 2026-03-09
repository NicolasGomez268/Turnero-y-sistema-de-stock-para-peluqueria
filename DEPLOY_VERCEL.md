# 🚀 Deploy Frontend en Vercel

## Prerrequisitos
- Cuenta en GitHub (con el proyecto subido)
- Backend desplegado en PythonAnywhere

## Paso 1: Crear cuenta en Vercel
1. Ir a https://vercel.com/
2. Sign up with GitHub
3. Autorizar acceso a GitHub

## Paso 2: Importar proyecto

### 2.1 Desde Dashboard
1. Click "Add New..." > "Project"
2. Buscar tu repositorio: `Turnero-y-sistema-de-stock-para-peluqueria`
3. Click "Import"

### 2.2 Configurar proyecto
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

## Paso 3: Configurar variables de entorno

En "Environment Variables", agregar:

```env
VITE_API_BASE_URL=https://TU_USUARIO.pythonanywhere.com
VITE_DEFAULT_SERVICE_ID=13
VITE_ENV=production
```

**Importante**: Cambiar `TU_USUARIO` por tu usuario de PythonAnywhere.

## Paso 4: Deploy
1. Click "Deploy"
2. Esperar a que termine el build (~2-3 minutos)
3. Vercel asignará una URL automáticamente

## Paso 5: Actualizar CORS en backend

Copiar la URL de Vercel (ej: `https://tu-proyecto.vercel.app`)

### En PythonAnywhere:
```bash
# Editar .env
nano /home/TU_USUARIO/Turnero-y-sistema-de-stock-para-peluqueria/.env

# Actualizar:
CORS_ALLOWED_ORIGINS=https://tu-proyecto.vercel.app
ALLOWED_HOSTS=TU_USUARIO.pythonanywhere.com

# Guardar (Ctrl+O, Enter, Ctrl+X)

# Reload web app desde el panel de PythonAnywhere
```

## Paso 6: Configurar dominio custom (Opcional)

### 6.1 En Vercel:
1. Settings > Domains
2. Add domain
3. Seguir instrucciones para configurar DNS

### 6.2 Actualizar CORS:
```env
CORS_ALLOWED_ORIGINS=https://tudominio.com,https://www.tudominio.com,https://tu-proyecto.vercel.app
```

## Paso 7: Verificar deploy
Acceder a tu URL de Vercel:
- Homepage: `https://tu-proyecto.vercel.app`
- Booking: `https://tu-proyecto.vercel.app/`
- Admin: `https://tu-proyecto.vercel.app/admin`

## Actualizaciones automáticas

Vercel detecta automáticamente cambios en GitHub:
1. Push a `develop` → Deploy automático
2. Ver progreso en Vercel Dashboard > Deployments

### Deploy manual:
```bash
# Instalar Vercel CLI (opcional)
npm install -g vercel

# Desde frontend/
cd frontend
vercel --prod
```

## Troubleshooting

### Error "Network Error" o CORS:
Verificar que:
1. Backend esté corriendo
2. CORS_ALLOWED_ORIGINS incluya la URL de Vercel
3. URL en VITE_API_BASE_URL sea correcta (sin `/api` al final)

### Error 404 en rutas:
Vercel automáticamente maneja SPA routing con Vite.

### Build fails:
```bash
# Ver logs en Vercel Dashboard > Deployments > [tu deploy] > Build Logs

# Verificar localmente:
cd frontend
npm install
npm run build
```

### Variables de entorno no se actualizan:
1. Settings > Environment Variables > Edit
2. Redeploy desde Deployments tab

## Configuración de producción

### Optimizaciones aplicadas:
- ✅ Code splitting automático
- ✅ Minificación CSS/JS
- ✅ Tree shaking
- ✅ Compresión gzip/brotli
- ✅ CDN global de Vercel
- ✅ HTTPS automático
- ✅ HTTP/2

### Performance esperado:
- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Lighthouse Score: 90+

## URLs finales
- Producción: `https://tu-proyecto.vercel.app`
- Preview (branches): `https://tu-proyecto-git-BRANCH.vercel.app`
- Admin: `https://tu-proyecto.vercel.app/admin`

## Notas importantes
- **Plan gratuito**: Incluye 100GB bandwidth, unlimited deployments
- **Dominio**: `*.vercel.app` (custom domain en planes pagos)
- **Preview deployments**: Cada PR genera un preview automático
- **Analytics**: Disponible en plan Pro
- **Build time**: Límite de 45 min en plan gratuito

## Integración CI/CD
Vercel + GitHub = Deploy automático:
1. Commit → Push → Deploy
2. Pull Request → Preview deployment
3. Merge a develop → Production deployment
