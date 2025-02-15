# Node.js Uptime Monitor

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

```
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

```
docker-compose up -d
```

Then start the uptime monitor:

```bash
npm start
```

## Troubleshooting

Helpful commands for troubleshooting.

### ClickHouse

Access ClickHouse in the Docker container:

```
docker exec -it uptime_monitor_clickhouse bash
clickhouse-client
```

## Roadmap

- Retrieve URLs from MySQL or Postgres instead of a text file
- Dockerize node app
