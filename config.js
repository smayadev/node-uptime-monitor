require('dotenv').config();

const env = process.env;

const num = (v, fallback) => (v === undefined || v === '' ? fallback : Number(v));

module.exports = {
    checkInterval: num(env.CHECK_INTERVAL_MS, 60000),
    timeout: num(env.REQUEST_TIMEOUT_MS, 5000),
    api_port: num(env.API_PORT, 8081),
    prometheus_port: num(env.PROMETHEUS_PORT, 9091),
    prometheus_host: env.PROMETHEUS_HOST || 'http://127.0.0.1',
    clickhouse: {
        host: env.CLICKHOUSE_HOST || 'clickhouse',
        protocol: env.CLICKHOUSE_INTERFACE || 'http',
        port: num(env.CLICKHOUSE_HTTP_PORT, 8123),
        username: env.CLICKHOUSE_USER || 'default',
        password: env.CLICKHOUSE_PASSWORD || '',
        database: env.CLICKHOUSE_DB || 'uptime_monitor',
        table: env.CLICKHOUSE_TABLE || 'uptime_data',
    },
    mariadb: {
        host: env.MARIADB_HOST || 'mariadb',
        user: env.MYSQL_USER || 'user',
        password: env.MYSQL_PASSWORD || '',
        database: env.MYSQL_DATABASE || 'uptime_monitor',
        connectTimeout: num(env.MARIADB_CONNECT_TIMEOUT_MS, 10000),
    },
};
