const isUrlHttp = require('is-url-http');
var axios = require('axios');
const express = require('express');
const promClient = require('prom-client');
const config = require('./config.json');
const { initClickHouseClient, queryMariaDBDatabase } = require('./common');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const checkInterval = config.checkInterval;

// Initial Prometheus configuration
const registry = new promClient.Registry();

// Omitting default metrics for now
// collectDefaultMetrics({ register: registry })

// Define a custom Gauge metric for response status
const httpResponseStatusCodeGauge = new promClient.Gauge({
    name: 'http_response_status_code',
    help: 'HTTP response status code',
    labelNames: ['url', 'status_code']
});

const httpResponseStatusTextGauge = new promClient.Counter({
    name: 'http_response_status_text',
    help: 'HTTP response status text',
    labelNames: ['url', 'status_text']
});

// Define a histogram for response time tracking
const responseTimeHistogram = new promClient.Histogram({
    name: 'http_response_time_seconds',
    help: 'Response time of monitored URLs',
    labelNames: ['url'],
    buckets: [0.1, 0.3, 0.5, 1, 2, 5] // Define time buckets
});

// Register the metrics
registry.registerMetric(httpResponseStatusCodeGauge);
registry.registerMetric(httpResponseStatusTextGauge);
registry.registerMetric(responseTimeHistogram);

// Primary function
const fetchURLs = async () => {
    // Fetch URLs from the database and check their status

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

    const instance = axios.create() 

    instance.interceptors.request.use((config) => {
        config.headers['request-startTime'] = new Date().getTime();
        return config
    })

    instance.interceptors.response.use((response) => {
        const currentTime = new Date().getTime()      
        const startTime = response.config.headers['request-startTime']      
        response.requestDuration = currentTime - startTime;   
        return response
    })

    var apiRequests = urls.map(url => instance.get(url, { timeout: config.timeout }));

    var results = await Promise.allSettled(apiRequests);

    for (const [index, result] of results.entries()) {

        let statusCode = 0;
        let statusText = "UNKNOWN";
        let url = urls[index];
        let responseTime;

        try {
            responseTime = result.value.requestDuration / 1000;
        } catch (error) {
            responseTime = null;
        }

        console.log("Response Time: ", responseTime);

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

        httpResponseStatusCodeGauge.set({ url: url, status_code: statusCode }, statusCode);
        httpResponseStatusTextGauge.inc({ url: url, status_text: statusText });

        if (responseTime) {
            responseTimeHistogram.observe({ url: url }, responseTime);
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

// Express server for Prometheus metrics
const app = express();
const port = config.prometheus_port || 9091;

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', registry.contentType);
    res.send(await registry.metrics());
});

app.listen(port, () => {
    console.log(`Prometheus metrics available at http://127.0.0.1:${port}/metrics`);
});

