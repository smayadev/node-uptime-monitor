CREATE DATABASE IF NOT EXISTS uptime_monitor;

CREATE TABLE IF NOT EXISTS uptime_monitor.uptime_data (
    timestamp DateTime,
    url String,
    status_code UInt16,
    status_text String
    request_duration UInt16
) ENGINE = MergeTree()
ORDER BY (url, timestamp)
TTL timestamp + INTERVAL 30 DAY;
