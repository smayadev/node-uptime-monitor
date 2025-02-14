# Node.js Uptime Monitor

## Description

Uptime Monitor is a tool designed to monitor the availability URLs. It periodically checks the status of specified URLs and will track the availability in a database in the future.

## Features

- Monitor multiple URLs

## Installation

To install the dependencies, run:

```bash
npm install
```

## Configuration

Open config.json and edit the configuration settings accordingly. An example config.json has been provided in this project.

### Configuration Options

- `checkInterval`: amount of time in milliseconds to wait between checks
- `urls`: location of a text file containing urls to check
- `timeout`: amount of time in seconds to wait for a URL to respond

## Usage

To start the uptime monitor, run:

```bash
npm start
```
