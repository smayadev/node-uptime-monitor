# Node.js Uptime Monitor

This is my first project using node.js and express.js, how am I doing?

## Description

Uptime Monitor is a tool designed to monitor the availability URLs. It periodically checks the status of specified URLs from a text file and saves the data to ClickHouse.

## Features

- Asynchronous monitoring of multiple URLs
- Uptime data storage in ClickHouse for efficiency

## Installation

To install the dependencies, run:

```bash
npm install
```

## Configuration

Copy .env.sample to .env:

```bash
cp .env.sample .env
```

Open .env and edit the variables. These are used by Docker and any database variables should match what's set in config.json (see below).

Open config.json and edit the configuration settings accordingly. An example config.json has been provided in this project.

### Configuration Options

- `checkInterval`: amount of time in milliseconds to wait between checks, recommended 60000 ms or higher
- `urls`: location of a text file containing urls to check
- `timeout`: amount of time in seconds to wait for a URL to respond
- `clickhouse`: configuration values for the ClickHouse database and table

## Usage

First, bring up the Docker containers:

```bash
docker-compose up -d
```

Then start the uptime monitor:

```bash
npm run start-monitor
```

In another terminal, start the API:

```bash
npm run start-api
```

## API Documentation

The API provides a way to manage URLs in the MariaDB database.

### GET /urls

Get all URLs in the database.

Example request:
```bash
curl -X GET http://127.0.0.1:8081/urls
```

Example response:
```json
[{"id":1,"url":"https://www.example1.com","ack":0,"created_at":"2025-02-15T23:33:44.000Z"},{"id":2,"url":"https://www.example2.com","ack":0,"created_at":"2025-02-15T23:34:11.000Z"},{"id":3,"url":"https://www.example3.com","ack":0,"created_at":"2025-02-15T23:34:24.000Z"}]
```

### POST /add/url

Add a new URL.

Example request:
```bash
curl -X POST http://127.0.0.1:8081/add/url \
     -H "Content-Type: application/json" \
     -d '{"url": "https://www.example4.com"}'
```

Example response:
```json
{"message":"URL added"}
```

### POST /delete/url

Delete a URL.

Example request:
```bash
curl -X POST http://127.0.0.1:8081/delete/url \
     -H "Content-Type: application/json" \
     -d '{"id": 2}'
```

Example response:
```json
{"message":"URL deleted"}
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

- Retrieve URLs from MySQL or Postgres instead of a text file
  - have a way to ack a url so it doesn't get checked?
  - express api for managing database entries
- Dockerize node app
- Grafana
