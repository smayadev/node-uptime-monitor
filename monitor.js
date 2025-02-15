const isUrlHttp = require('is-url-http');
var axios = require('axios');
const config = require('./config.json');
const { initClickHouseClient, queryMariaDBDatabase } = require('./common');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const checkInterval = config.checkInterval;

const fetchURLs = async () => {

    console.log('Initialising ClickHouse client');
    const client = await initClickHouseClient();

    const currentTimestamp = new Date().toISOString().replace('T', ' ').replace('Z', '').split('.')[0];
    console.log("Current Timestamp:", currentTimestamp);
    console.log("Getting URL data...");

    var urls = await queryMariaDBDatabase('SELECT url FROM urls');
    urls = urls.map(row => row.url).filter(url => isUrlHttp(url));

    if (urls.length === 0) {
        console.log("No URLs found in the database. Retrying after delay...");
        await delay(checkInterval);
        return process.nextTick(fetchURLs);
    }

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
