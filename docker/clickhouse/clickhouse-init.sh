#!/bin/bash
set -euo pipefail

clickhouse-client --user default --password "${CLICKHOUSE_PASSWORD}" --multiquery <<EOF
CREATE DATABASE IF NOT EXISTS \`${CLICKHOUSE_DB}\`;

CREATE TABLE IF NOT EXISTS \`${CLICKHOUSE_DB}\`.uptime_data (
    timestamp DateTime,
    url String,
    status_code UInt16,
    status_text String,
    request_duration UInt16
) ENGINE = MergeTree()
ORDER BY (url, timestamp)
TTL timestamp + INTERVAL 30 DAY;

CREATE USER IF NOT EXISTS \`${CLICKHOUSE_MONITOR_USER}\` IDENTIFIED WITH sha256_password BY '${CLICKHOUSE_MONITOR_PASSWORD}';

GRANT INSERT ON \`${CLICKHOUSE_DB}\`.uptime_data TO \`${CLICKHOUSE_MONITOR_USER}\`;
EOF
