# ✅ Checklist Deploy - TINCHO Barbería

## Pre-Deploy
- [x] Limpieza de archivos de desarrollo
- [x] .gitignore actualizado
- [x] Rama develop lista
- [x] Tests básicos pasando
- [x] Variables de entorno configuradas

## Backend (PythonAnywhere)
- [ ] Cuenta creada en PythonAnywhere
- [ ] Repositorio clonado o código subido
- [ ] Entorno virtual creado
- [ ] Dependencias instaladas (`requirements.txt`)
- [ ] Variables de entorno configuradas (`.env`)
  - [ ] `SECRET_KEY` generada (secreta)
  - [ ] `DEBUG=False`
  - [ ] `ALLOWED_HOSTS` configurado
  - [ ] `CORS_ALLOWED_ORIGINS` (URL de Vercel)
- [ ] Migraciones aplicadas
- [ ] Superusuario creado
- [ ] Archivos estáticos recolectados
- [ ] WSGI configurado
- [ ] Virtualenv apuntando correctamente
- [ ] Static files configurados
- [ ] Web app reloaded
- [ ] Verificación: `/api/servicios/` funciona
- [ ] Admin panel accesible

## Frontend (Vercel)
- [ ] Repositorio en GitHub actualizado
- [ ] Cuenta creada en Vercel
- [ ] Proyecto importado desde GitHub
- [ ] Variables de entorno configuradas:
  - [ ] `VITE_API_BASE_URL` (URL de PythonAnywhere)
  - [ ] `VITE_DEFAULT_SERVICE_ID`
  - [ ] `VITE_ENV=production`
- [ ] Deploy exitoso
- [ ] URL de Vercel obtenida
- [ ] CORS actualizado en backend con URL de Vercel
- [ ] Verificación: App funciona en producción
- [ ] Rutas funcionando (booking, admin)
- [ ] Login admin funciona

## Post-Deploy
- [ ] Probar flujo completo:
  - [ ] Cliente reserva turno
  - [ ] Admin ve turno en agenda
  - [ ] Admin puede modificar turno
  - [ ] Admin puede gestionar barberos
  - [ ] Admin puede gestionar servicios
  - [ ] Admin puede ver stock (si aplica)
- [ ] Verificar responsive en móviles
- [ ] Probar en diferentes navegadores
- [ ] Configurar monitoreo (opcional)
- [ ] Backup de base de datos configurado

## Dominio Custom (Opcional)
- [ ] Dominio comprado
- [ ] DNS configurado en Vercel
- [ ] SSL configurado (automático en Vercel)
- [ ] CORS actualizado con nuevo dominio
- [ ] `ALLOWED_HOSTS` actualizado

## Documentación
- [ ] URLs de producción documentadas
- [ ] Credenciales guardadas de forma segura
- [ ] Proceso de actualización documentado
- [ ] Contactos de soporte anotados

## URLs de Producción
```
Frontend: https://[tu-proyecto].vercel.app
Backend API: https://[tu-usuario].pythonanywhere.com
Admin Panel: https://[tu-proyecto].vercel.app/admin
API Docs: https://[tu-usuario].pythonanywhere.com/api/
```

## Comandos útiles

### Actualizar backend:
```bash
cd /home/[tu-usuario]/Turnero-y-sistema-de-stock-para-peluqueria
git pull origin develop
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
# Reload desde panel de PythonAnywhere
```

### Actualizar frontend:
```bash
# Hacer push a GitHub (deploy automático)
git add .
git commit -m "Update frontend"
git push origin develop
```

## Troubleshooting

### Backend no responde (500):
1. Ver error log en PythonAnywhere
2. Verificar permisos de archivos
3. Verificar variables de entorno
4. Verificar migraciones

### Frontend no conecta con backend:
1. Verificar URL en `VITE_API_BASE_URL`
2. Verificar CORS en backend
3. Verificar que backend esté corriendo
4. Ver console en navegador

### Admin login no funciona:
1. Verificar superusuario creado
2. Verificar token en localStorage
3. Verificar endpoint `/admin-api/login/`
4. Ver network tab en DevTools
