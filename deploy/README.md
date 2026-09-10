# RedSENA deployment module

This module deploys the current RedSENA application as one isolated Docker Compose project. It uses its own Compose project name, network, PostgreSQL volume, uploads volume and loopback HTTP port.

The public server already hosts another project on ports 80 and 443. RedSENA therefore uses the private Docker host-bridge binding `172.17.0.1:18080`; the existing edge must route `redsena.online` to that address before the domain can be public. This module never stops, prunes, reconfigures or removes containers belonging to the other project.

On Ubuntu:

```bash
cd /opt/redsena-prod/deploy
cp .env.production.example .env.production
chmod 600 .env.production
# Fill the file without committing or printing it.
bash scripts/deploy.sh
bash scripts/verify.sh
```

`verify.sh` checks that `/` and `/health` return HTTP 200 and that the backend health payload reports `UP`. The deployed baseline includes the React/Vite frontend, Spring Boot/GraphQL backend, Flyway schema migration, PostgreSQL, Redis, media volume and Actuator health checks. The application should still be treated as an evolving product: configure Firebase authorized domains and review the implemented GraphQL operations before exposing new capabilities publicly.
