# Node.js Uptime Monitor

This is my first project using node.js and express.js, how am I doing?

## Description

Uptime Monitor is a tool designed to monitor the availability URLs. It periodically checks the status of specified URLs from a MariaDB table and saves the data to ClickHouse.

URLs to check are stored in a MariaDB table which can be managed using the included API.

## Features

- Asynchronous monitoring of multiple URLs
- Uptime data storage in ClickHouse for efficiency
- Prometheus endpoint for monitoring metrics (status code, status text, response time)
- URLs to monitor stored in MariaDB, can be controlled with built-in API -- integrate with external applications

## Configuration

Copy .env.sample to .env:

```bash
cp .env.sample .env
```

Open .env and edit the variables. These are used by Docker and any database variables should match what's set in config.json (see below). The variable names currently in .env.sample should not be renamed or removed and no new variables should be added (to run under a default configuration).

Open config.json and edit the configuration settings accordingly. An example config.json has been provided in this project.

### Configuration Options

- `checkInterval`: amount of time in milliseconds to wait between checks, recommended 60000 ms or higher
- `timeout`: amount of time in seconds to wait for a URL to respond
- `api_port`: Port the API runs on
- `prometheus_port`: Port the Prometheus metrics endpoint runs on
- `clickhouse`: configuration values for the ClickHouse database and table (Note: see docker/clickhouse/clickhouse-init.sql if using the included docker-compose.yml and .env.sample)
  - `host`: Hostname of the instance running ClickHouse
  - `protocol`: http or https (note: current default configuration is http, https may require additional settings and may be included in a future release)
  - `port`: Port for accessing ClickHouse's http API
  - `user`: User with access to the database
  - `password`: Password of the user with access to the database
  - `database`: Name of the database to query
  - `table`: Name of the table to query
- `mariadb`: configuration values for the MariaDB database (Note: see docker/mariadb/mariadb-init.sql if using the included docker-compose.yml and .env.sample)
  - `timeout`: Timeout to establish connection to MariaDB, in milliseconds
  - `database`: Name of the database to query
  - `password`: Password of the user with access to the database
  - `user`: User with access to the database
  - `host`: Hostname of the instance running MariaDB

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

## Prometheus Metrics Documentation

The Prometheus metrics endpoint can be accessed using the endpoint URL:

```bash
http://127.0.0.1:9091/metrics
```

## API Documentation

The API provides a way to manage URLs in the MariaDB database.

There is no authentication system in place so an API gateway of some sort is needed.

### GET /api/urls

Get all URLs in the database.

Example request:
```bash
curl -X GET http://127.0.0.1:8081/api/urls
```

Example response:
```json
[{"id":1,"url":"https://www.example1.com","ack":0,"created_at":"2025-02-15T23:33:44.000Z"},{"id":2,"url":"https://www.example2.com","ack":0,"created_at":"2025-02-15T23:34:11.000Z"},{"id":3,"url":"https://www.example3.com","ack":0,"created_at":"2025-02-15T23:34:24.000Z"}]
```

### POST /api/add/url

Add a new URL.

Example request:
```bash
curl -X POST http://127.0.0.1:8081/api/add/url \
     -H "Content-Type: application/json" \
     -d '{"url": "https://www.example4.com"}'
```

Example response:
```json
{"message":"URL added"}
```

### POST /api/delete/url

Delete a URL.

Example request:
```bash
curl -X POST http://127.0.0.1:8081/api/delete/url \
     -H "Content-Type: application/json" \
     -d '{"id": 2}'
```

Example response:
```json
{"message":"URL deleted"}
```

### POST /api/ack/url

Ack a URL (stop monitoring it).

Example request:
```bash
curl -X POST http://127.0.0.1:8081/api/ack/url \
     -H "Content-Type: application/json" \
     -d '{"id": 2}'
```

Example response:
```json
{"message":"URL ack'd"}
```

### POST /api/unack/url

Unack a URL (begin monitoring again).

Example request:
```bash
curl -X POST http://127.0.0.1:8081/api/unack/url \
     -H "Content-Type: application/json" \
     -d '{"id": 2}'
```

Example response:
```json
{"message":"URL unack'd"}
```

## Troubleshooting

Helpful commands for troubleshooting.

### ClickHouse

Access ClickHouse in the Docker container:

```bash
docker exec -it uptime_monitor_clickhouse bash
clickhouse-client
```

## Roadmap

- all done for now
