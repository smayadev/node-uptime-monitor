const { createClient } = require('@clickhouse/client');
const isUrlHttp = require('is-url-http');
const mariadb = require('mariadb');
var axios = require('axios');
const config = require('./config.json');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const checkInterval = config.checkInterval;

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

const fetchURLs = async () => {

    console.log('Initialising ClickHouse client');
    const client = await initClickHouseClient();

    const currentTimestamp = new Date().toISOString().replace('T', ' ').replace('Z', '').split('.')[0];
    console.log("Current Timestamp:", currentTimestamp);
    console.log("Getting URL data...");

    var urls = await queryMariaDBDatabase('SELECT url FROM urls');
    urls = urls.map(row => row.url).filter(url => isUrlHttp(url));

    var apiRequests = urls.map(url => axios.get(url, { timeout: config.timeout }));

    var results = await Promise.allSettled(apiRequests);

    for (const [index, result] of results.entries()) {

        let statusCode = 0;
        let statusText = "UNKNOWN";
        let url = urls[index];

        console.log(`Processing URL ${index + 1}:`, urls[index]);

        if (result.status === "fulfilled") {
            statusCode = result.value.status || 0;
            statusText = result.value.statusText || "UNKNOWN";
            console.log(`${index + 1} Success:`, url, statusText, statusCode);
        } else {
            statusCode = result.reason.response?.status || 0;
            statusText = result.reason.code || "ERROR";
            console.error(`${index + 1} Failed:`, url, statusText, statusCode);
        }

        try {
            await client.insert({
                table: config.clickhouse.table,
                values: [{
                    timestamp: currentTimestamp,
                    url: url,
                    status_code: statusCode,
                    status_text: statusText
                }],
                format: 'JSONEachRow'
            });
        } catch (error) {
            console.error("Error inserting data into ClickHouse:", error);
        }

    };

    console.log("All requests completed\n");

    await client.close();

    await delay(checkInterval);

    process.nextTick(fetchURLs)
}

fetchURLs();
