# Despliegue de RedSENA en Ubuntu mediante SSH

## Alcance

Este procedimiento despliega el estado actual del repositorio en una VPS Ubuntu usando Docker Compose. Está adaptado al proyecto real: el backend usa Spring Boot, GraphQL, JPA, Flyway, Redis, Actuator y validación condicional de tokens Firebase; el frontend usa React/Vite y Firebase. La base social y sus operaciones deben seguir evolucionando con migraciones y pruebas versionadas.

El servidor compartido ya tiene otro proyecto ocupando `80` y `443`. RedSENA se instala en `/opt/redsena-prod`, con red/volúmenes propios y `172.17.0.1:18080`, una dirección privada del bridge Docker accesible por el edge autorizado. No se deben detener contenedores ajenos, ejecutar `docker system prune`, usar `docker compose down -v` sobre el otro proyecto ni editar sus archivos sin autorización explícita.

## Preparación local

Validar antes de transferir:

```powershell
cd backend/demo
.\mvnw.cmd test

cd ../../frontend/redsena
npm ci
npm run lint
npm run build
```

El build de frontend debe ejecutarse con dependencias limpias. No subas `node_modules`, `dist`, `target`, `.env.local` ni credenciales de Firebase Admin.

## Acceso y reconocimiento del servidor

Usar la cuenta autorizada por el administrador:

```bash
ssh root@2.25.174.118
```

Antes de crear el entorno, revisar sin modificar nada:

```bash
ss -ltnp
docker ps
docker compose version
df -h /
```

Confirmar quién controla `80` y `443` antes de cambiar `REDSENA_HTTP_BIND` o `REDSENA_HTTP_PORT`. En esta VPS ambos pertenecen al proyecto `angelow`; por eso RedSENA usa el puerto privado `18080` sobre `172.17.0.1` y el edge autorizado enruta el dominio.

## Transferencia aislada

Transferir el código a un directorio exclusivo, por ejemplo `/opt/redsena-prod`. La transferencia debe excluir `.git`, `node_modules`, `dist`, `target` y todos los archivos `.env`.

Crear el entorno de producción solamente en el servidor:

```bash
cd /opt/redsena-prod/deploy
cp .env.production.example .env.production
chmod 600 .env.production
${EDITOR:-vi} .env.production
```

Completar `POSTGRES_PASSWORD`, `JWT_SECRET`, `FIREBASE_PROJECT_ID` y las variables públicas `VITE_FIREBASE_*`. Las variables Firebase Web se incorporan al bundle del frontend; no son credenciales Admin. En Firebase Console agregar `redsena.online` a los dominios autorizados y habilitar los proveedores que use la aplicación. No registrar el archivo ni mostrarlo con `cat` en una sesión compartida.

## Despliegue reproducible

```bash
cd /opt/redsena-prod/deploy
bash scripts/deploy.sh
```

El script valida Compose, construye las imágenes del backend/frontend, arranca solamente el proyecto Compose `redsena-prod`, espera sus health checks y ejecuta smoke tests. No elimina imágenes no usadas porque el servidor es compartido.

## Validación

Validación local en la VPS:

```bash
cd /opt/redsena-prod/deploy
bash scripts/verify.sh
curl -i -H 'Host: redsena.online' http://172.17.0.1:18080/
curl -i -H 'Host: redsena.online' http://172.17.0.1:18080/health
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

El resultado esperado es HTTP `200` para `/` y `/health`, y estado `UP` en la respuesta de salud. PostgreSQL y Redis no publican puertos del host.

## Publicación del dominio

El DNS de `redsena.online` apunta a `2.25.174.118`, pero eso no basta cuando otro proyecto posee `80/443`. Para hacer público el dominio, un administrador autorizado debe agregar una ruta explícita en el edge existente:

```text
Host: redsena.online
Upstream: http://172.17.0.1:18080
```

La modificación debe conservar todas las rutas de Angelow y requiere backup, `nginx -t`, recarga controlada y validación de ambos dominios. Después de aplicarla, verificar desde una red externa:

```bash
curl -I https://redsena.online/
curl -i https://redsena.online/health
```

El certificado TLS debe ser gestionado por el edge que ya controla `443`. En esta VPS el certificado de `redsena.online`/`www.redsena.online` se mantiene mediante el Certbot del edge compartido. No ejecutar Certbot dentro de RedSENA mientras ese puerto pertenezca a otro proyecto.

## Operación y rollback

Consultar logs únicamente del proyecto RedSENA:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=200 backend frontend nginx
```

Para reiniciar RedSENA sin afectar el resto:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml restart
```

No usar `down -v` en producción: elimina los volúmenes propios de PostgreSQL/uploads. Un rollback debe consistir en transferir una versión conocida del repositorio y volver a ejecutar `bash scripts/deploy.sh`; las migraciones de base de datos futuras deberán ser versionadas y reversibles según la capacidad que las introduzca.
