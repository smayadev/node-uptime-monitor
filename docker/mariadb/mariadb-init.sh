#!/bin/bash
set -euo pipefail

# Unset default MariaDB environment variables to avoid conflicts with socket-based authentication during initialization.
unset MARIADB_HOST MYSQL_HOST MYSQL_TCP_PORT

# Use socket-based authentication to avoid any issues with host-based auth during init.
mariadb --socket=/run/mysqld/mysqld.sock -uroot -p"${MYSQL_ROOT_PASSWORD}" <<EOF
CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\`;

USE \`${MYSQL_DATABASE}\`;

CREATE TABLE IF NOT EXISTS urls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    url VARCHAR(255) NOT NULL,
    ack INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE USER IF NOT EXISTS '${API_DB_USER}'@'%' IDENTIFIED BY '${API_DB_PASSWORD}';
GRANT SELECT, INSERT, UPDATE, DELETE ON \`${MYSQL_DATABASE}\`.\`urls\` TO '${API_DB_USER}'@'%';

CREATE USER IF NOT EXISTS '${MONITOR_DB_USER}'@'%' IDENTIFIED BY '${MONITOR_DB_PASSWORD}';
GRANT SELECT ON \`${MYSQL_DATABASE}\`.\`urls\` TO '${MONITOR_DB_USER}'@'%';

DROP USER IF EXISTS '${MYSQL_USER}'@'%';

FLUSH PRIVILEGES;
EOF
