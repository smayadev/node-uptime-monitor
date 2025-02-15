CREATE DATABASE IF NOT EXISTS uptime_monitor;

CREATE TABLE IF NOT EXISTS uptime_monitor.uptime_data (
    timestamp DateTime64(3),
    url String,
    status_code UInt32,
    status_text String
) ENGINE = MergeTree()
ORDER BY (url, timestamp)
TTL timestamp + INTERVAL 30 DAY;