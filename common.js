const { createClient } = require('@clickhouse/client');
const mariadb = require('mariadb');
const config = require('./config.json');

const initClickHouseClient = async () => {

    var host = config.clickhouse.host;
    var protocol = config.clickhouse.protocol;
    var port = config.clickhouse.port;

    const client = createClient({
      url: `${protocol}://${host}:${port}`,
      username: config.clickhouse.username,
      password: config.clickhouse.password,
      database: config.clickhouse.database
    });
  
    console.log('ClickHouse ping');

    if (!(await client.ping())) {
      throw new Error('failed to ping ClickHouse!');
    }

    console.log('ClickHouse pong!');

    return client;
    
};  

const pool = mariadb.createPool({
    host: config.mariadb.host,
    user: config.mariadb.user,
    password: config.mariadb.password,
    database: config.mariadb.database
})

const queryMariaDBDatabase = async (query, params = []) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query(query, params);
        return rows;
    } catch (err) {
        throw err;
    } finally {
        if (conn) conn.release();
    }
};

module.exports = { initClickHouseClient, queryMariaDBDatabase };