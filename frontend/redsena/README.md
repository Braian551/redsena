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

## Foto de perfil

La foto de Google se usa automáticamente al iniciar sesión con ese proveedor. Desde **Mi perfil → Editar perfil**, el usuario puede seleccionar una imagen JPG, PNG o WebP de hasta 5 MB. La imagen se guarda en Firebase Storage en una ruta por usuario (`profile-photos/{uid}/avatar`) y se actualiza el `photoURL` del perfil Firebase; por eso la foto propia prevalece sobre la de Google en el feed y el perfil.

Para desplegar las reglas de Storage, inicia sesión con Firebase CLI y selecciona el proyecto correspondiente antes de ejecutar desde la raíz del repositorio:

```bash
firebase use TU_PROJECT_ID
firebase deploy --only storage
```

Las reglas exigen sesión, restringen cada archivo al propio `uid`, aceptan únicamente JPG/PNG/WebP y limitan el tamaño a 5 MB. `VITE_FIREBASE_STORAGE_BUCKET` debe estar completo en `.env.local`.

## Publicaciones y perfil

La vista autenticada incluye un feed responsive con creación de publicaciones, imágenes, likes explícitos y comentarios, además de un perfil con bio editable. Con `VITE_SOCIAL_BACKEND_ENABLED=true`, `src/features/posts/model/postRepository.js` usa GraphQL para el feed y mutaciones; las imágenes se cargan por multipart a `/api/uploads` y se sirven desde `/media/*`. `localStorage` solo se usa cuando la bandera está en `false`.

El cliente agrega el Firebase ID token como Bearer y usa `Idempotency-Key` en creación de posts/comentarios. La URL del endpoint queda documentada en `VITE_GRAPHQL_URL`.

## Docker

Para validar solo el contenedor del frontend como una imagen estática de Nginx:

```bash
docker compose --env-file .env.local up --build
```

La aplicación quedará disponible en `http://localhost:8080`. El build acepta la configuración pública de Firebase como argumentos; no coloques credenciales de Firebase Admin en ningún archivo del frontend.

Para validar el stack completo desde `backend/demo`, usa el archivo local que contiene las mismas variables públicas:

```bash
docker compose --env-file ../../frontend/redsena/.env.local up --build
```

Ese Compose construye el frontend y conecta `/graphql`, `/api/*` y `/media/*` mediante el reverse proxy. Si habilitas la foto de perfil, publica también `storage.rules` en el proyecto Firebase con `firebase deploy --only storage`.

## Validación

```bash
npm run lint
npm run build
```

El archivo `.env.local` está ignorado por Git. La configuración web de Firebase usa variables públicas del cliente; no coloques credenciales de Firebase Admin ni claves privadas en el frontend.
