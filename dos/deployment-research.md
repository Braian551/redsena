# Investigación de despliegue de RedSENA

**Fecha:** 2026-09-10  
**Aplicación:** Spec 002  
**Alcance:** despliegue reproducible del monolito actual en una VPS Ubuntu compartida

## Hallazgos aplicables

| Tema | Hallazgo de la fuente | Decisión en RedSENA |
|---|---|---|
| Orden de arranque | Compose espera a una dependencia con `condition: service_healthy` cuando el servicio define `healthcheck`. | PostgreSQL/Redis deben estar healthy antes del backend; backend/frontend/media antes del reverse proxy. |
| Persistencia | Los volúmenes viven fuera del ciclo de vida de los contenedores y Docker los recomienda para datos persistentes; pueden montarse read-only en otro servicio. | `redsena_prod_postgres_data` conserva la base y `redsena_prod_uploads` se monta RW en backend y RO en media. |
| Reverse proxy | Nginx reenvía solicitudes con `proxy_pass`; los headers de host, IP y protocolo deben definirse explícitamente cuando el proxy los necesite. | El Nginx interno enruta `/` a frontend, `/graphql` y `/api/` a backend, `/media/` a media. |
| Salud | Actuator expone `/actuator/health`; los endpoints expuestos deben limitarse y protegerse. | El backend publica solo los endpoints seleccionados y el Nginx público expone `/health` como fachada agregada. |
| Firebase web | Los dominios usados por autenticación web deben estar autorizados en Firebase Console. | `redsena.online` queda como prerrequisito de Firebase; no se colocan secretos Admin en `VITE_*`. |

## Fuentes primarias

- [Docker — Control startup and shutdown order in Compose](https://docs.docker.com/compose/how-tos/startup-order/)
- [Docker — Volumes](https://docs.docker.com/engine/storage/volumes/)
- [NGINX — Reverse Proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy)
- [Spring Boot — Actuator endpoints](https://docs.spring.io/spring-boot/reference/actuator/endpoints.html)
- [Spring Boot — Health endpoint](https://docs.spring.io/spring-boot/api/rest/actuator/health.html)
- [Firebase — Google sign-in for web](https://firebase.google.com/docs/auth/web/google-signin)

## Topología elegida

```text
Internet
   │ HTTPS / 80-443
   ▼
Edge compartido (fuera de RedSENA)
   │ http://172.17.0.1:18080
   ▼
Nginx redsena-prod
   ├── frontend:80
   ├── backend:8080
   └── media:80
       │
       ├── PostgreSQL:5432 (solo red Compose)
       └── Redis:6379 (solo red Compose)
```

El puerto `172.17.0.1:18080` evita competir con el proyecto Angelow que ya posee `80/443`. El binding es privado para el host/edge autorizado, no una publicación directa de PostgreSQL o Redis.

## Contrato operativo

```bash
cd /opt/redsena-prod/deploy
chmod 600 .env.production
bash scripts/deploy.sh
bash scripts/verify.sh
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

El script valida el modelo Compose antes de construir, usa `--remove-orphans` solo dentro del proyecto `redsena-prod`, no ejecuta prune y no elimina volúmenes. El rollback previsto es redeployar una revisión conocida del repositorio; `docker compose down -v` está prohibido en producción porque elimina los volúmenes propios.

## Límites y pendientes

- El volumen local de uploads no es object storage ni CDN global; la abstracción `MediaStorage` permite sustituirlo más adelante.
- No hay backup automático en este corte; el operador debe establecer una política de backup antes de depender del entorno como única copia.
- HTTPS/certificados y el enrutamiento de `redsena.online` pertenecen al edge compartido.
- El smoke público verifica disponibilidad, no reemplaza el flujo autenticado real de Firebase.
