# AniHub

Plataforma de streaming de anime. Proyecto intermodular 2DAW - UNIR.

## Requisitos

- Node.js v18+
- pnpm

## Instalación

1. Clona el repositorio
2. Instala dependencias:
```bash
   cd backend
   npm install
```
3. Crea el archivo `backend/.env`:
```
   JWT_SECRET=anihub_secret_2024
   PORT=3000
```

## Arrancar el proyecto
```bash
pnpm run dev
```

Abre http://localhost:3000 en el navegador.

## Usuarios de prueba

| Usuario | Contraseña | Rol     |
|---------|------------|---------|
| admin   | admin123   | Admin   |
| prueba  | prueba123  | Viewer  |