# Node.js Uptime Monitor

## Description

Uptime Monitor is a tool designed to monitor the availability URLs. It periodically checks the status of specified URLs from a MariaDB table and saves the data to ClickHouse.

URLs to check are stored in a MariaDB table which can be managed using the included API.

## Features

- Asynchronous monitoring of multiple URLs
- Uptime data storage in ClickHouse for efficiency
- Prometheus endpoint for monitoring metrics (status code, status text, response time)
- URLs to monitor stored in MariaDB, can be controlled with built-in API -- integrate with external applications

## Configuration

All configuration is read from environment variables. Copy `.env.sample` to `.env`:

```bash
cp .env.sample .env
```

Then edit `.env` using the editor of your choice, setting the variables

This `.env` is used by Docker Compose (for the MariaDB and ClickHouse containers) and by the Node.js services via `dotenv`, so database credentials only need to be set once. Defaults live in `config.js`, so the variables listed below only need to be set when overriding a default.

### Database / required for non-default setups

ClickHouse (see also `docker/clickhouse/clickhouse-init.sql`):

- `CLICKHOUSE_HOST` - hostname of the ClickHouse instance (default: `clickhouse`)
- `CLICKHOUSE_INTERFACE` - `http` or `https` (default: `http`; `https` may require additional settings)
- `CLICKHOUSE_HTTP_PORT` - port for the ClickHouse HTTP API (default: `8123`)
- `CLICKHOUSE_USER` - user with access to the database (default: `default`)
- `CLICKHOUSE_PASSWORD` - password for that user
- `CLICKHOUSE_DB` - database name (default: `uptime_monitor`)
- `CLICKHOUSE_TABLE` - table name (default: `uptime_data`)

MariaDB (see also `docker/mariadb/mariadb-init.sql`):

- `MARIADB_HOST` - hostname of the MariaDB instance (default: `mariadb`)
- `MYSQL_USER` - user with access to the database (default: `user`)
- `MYSQL_PASSWORD` - password for that user
- `MYSQL_DATABASE` - database name (default: `uptime_monitor`)
- `MYSQL_ROOT_PASSWORD` - used by the MariaDB container at first start

### API authentication (required)

- `API_AUTH_TOKEN` - shared secret used as a bearer token on every `/api/*` request. Must be at least 32 characters; the API will refuse to start otherwise. Generate one with `openssl rand -hex 32`.

### Optional overrides

- `CHECK_INTERVAL_MS` - milliseconds between monitoring checks (default: `60000`)
- `REQUEST_TIMEOUT_MS` - per-URL HTTP request timeout (default: `5000`)
- `API_PORT` - port the API listens on (default: `8081`)
- `PROMETHEUS_PORT` - port the Prometheus metrics endpoint listens on (default: `9091`)
- `PROMETHEUS_HOST` - interface the Prometheus metrics server binds to (default: `127.0.0.1`; set to `0.0.0.0` to expose on all interfaces)
- `PROMETHEUS_PROTOCOL` - protocol shown in the startup log line for the metrics URL (default: `http`)
- `MARIADB_CONNECT_TIMEOUT_MS` - MariaDB connection timeout (default: `10000`)

## Usage

First, bring up the Docker containers:

```bash
docker-compose up -d
```

That's it!

## Tests

Run tests with the following command if needed:

```
docker compose run --rm node-test 2>&1
```

## Automated Testing and Security

GitHub Actions runs a CI workflow on every push to `main` and on every pull request. The workflow only runs tests and security checks but does not deploy anything.

- Jest test suite on Node.js 20 and 22
- `npm audit` at high severity or above
- CodeQL static analysis for JavaScript
- Gitleaks scan for committed secrets
- Snyk open source and Snyk Code scans at high severity or above
- Trivy container scans of the API and monitor images at high severity or above

Dependency and tooling updates are handled by Dependabot, which opens pull requests on a weekly schedule:

- npm dependencies (development and production dependencies grouped separately; production updates limited to minor and patch so major bumps land as individual pull requests)
- GitHub Actions version bumps

## Prometheus Metrics Documentation

The Prometheus metrics endpoint can be accessed using the endpoint URL:

```bash
http://127.0.0.1:9091/metrics
```

## API Documentation

The API provides a way to manage URLs in the MariaDB database.

### Authentication

Every `/api/*` route requires an `Authorization: Bearer <token>` header where `<token>` matches `API_AUTH_TOKEN`. Comparison is constant-time. Requests without the header, or with the wrong token, return `401 Unauthorized`.

The curl examples below reference `$API_AUTH_TOKEN`; export it in your shell first.

### GET /api/urls

Get all URLs in the database.

Example request:
```bash
curl -X GET http://127.0.0.1:8081/api/urls \
     -H "Authorization: Bearer $API_AUTH_TOKEN"
```

Example response:
```json
[{"id":1,"url":"https://www.example1.com","ack":0,"created_at":"2025-02-15T23:33:44.000Z"},{"id":2,"url":"https://www.example2.com","ack":0,"created_at":"2025-02-15T23:34:11.000Z"},{"id":3,"url":"https://www.example3.com","ack":0,"created_at":"2025-02-15T23:34:24.000Z"}]
```

### POST /api/urls

Add a new URL. Returns `201 Created`.

Example request:
```bash
curl -X POST http://127.0.0.1:8081/api/urls \
     -H "Authorization: Bearer $API_AUTH_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://www.example4.com"}'
```

Example response:
```json
{"message":"URL added"}
```

### DELETE /api/urls/:id

Delete a URL. Returns `204 No Content`.

Example request:
```bash
curl -X DELETE http://127.0.0.1:8081/api/urls/2 \
     -H "Authorization: Bearer $API_AUTH_TOKEN"
```

### PATCH /api/urls/:id

Ack (stop monitoring) or unack (resume monitoring) a URL. The body's `ack` field is a boolean: `true` to ack, `false` to unack. Returns `200 OK`.

Example request (ack):
```bash
curl -X PATCH http://127.0.0.1:8081/api/urls/2 \
     -H "Authorization: Bearer $API_AUTH_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"ack": true}'
```

Example request (unack):
```bash
curl -X PATCH http://127.0.0.1:8081/api/urls/2 \
     -H "Authorization: Bearer $API_AUTH_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"ack": false}'
```

Example response:
```json
{"message":"URL updated"}
```

## Troubleshooting

Helpful commands for troubleshooting.

### ClickHouse

Access ClickHouse in the Docker container:

```bash
docker exec -it uptime_monitor_clickhouse bash
clickhouse-client
```