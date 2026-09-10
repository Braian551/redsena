# RedSENA — frontend

Frontend React + Vite con autenticación mediante Firebase Authentication y Google.

## Configuración local

1. Copia `.env.example` como `.env.local`.
2. Completa las variables `VITE_FIREBASE_*` con la configuración de tu aplicación web de Firebase.
3. En Firebase Console, abre **Authentication → Sign-in method**, habilita **Google** y agrega los dominios autorizados (por ejemplo `localhost`).
4. Instala dependencias y arranca Vite:

```bash
npm ci
npm run dev
```

La sesión se mantiene con `onAuthStateChanged`. La pantalla de bienvenida permite entrar con `signInWithPopup` y la vista autenticada permite cerrar sesión.

## Publicaciones y perfil

La vista autenticada incluye un feed responsive con creación de publicaciones, likes y comentarios, además de un perfil con bio editable y resumen de actividad. Mientras el backend social y GraphQL evolucionan, los datos de posts y perfil se guardan en `localStorage` detrás de `src/features/posts/model/postRepository.js`; Firebase sigue siendo la fuente de identidad del usuario.

Cuando exista el endpoint GraphQL, reemplaza ese adaptador por el cliente de datos del backend sin cambiar los componentes de UI. La URL prevista queda documentada en `VITE_GRAPHQL_URL`.

## Docker

Para servir el frontend como una imagen estática de Nginx:

```bash
cp .env.docker.example .env.docker
docker compose --env-file .env.docker up --build
```

La aplicación quedará disponible en `http://localhost:8080`. El build acepta la configuración pública de Firebase como argumentos; no coloques credenciales de Firebase Admin en ningún archivo del frontend.

## Validación

```bash
npm run lint
npm run build
```

El archivo `.env.local` está ignorado por Git. La configuración web de Firebase usa variables públicas del cliente; no coloques credenciales de Firebase Admin ni claves privadas en el frontend.
