var axios = require('axios');
var fs = require('fs');

const config = require('./config.json');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const checkInterval = config.checkInterval;

var urls = fs.readFileSync(config.urls).toString().split("\n");

async function fetchURLs() {

    console.log("Getting URL data...");

    var apiRequests = urls.map(url => axios.get(url, { timeout: config.timeout }));

    var results = await Promise.allSettled(apiRequests);

    results.forEach((result, index) => {
        if (result.status === "fulfilled") {
            console.log(`${index + 1} Success:`, result.value.config.url, result.value.statusText, result.value.status);
        } else {
            console.error(`${index + 1} Failed:`, result.reason.config.url, result.reason.code, result.reason.status);
        }
    });

    console.log("All requests completed");

    await delay(checkInterval);

    process.nextTick(fetchURLs)
}

fetchURLs();
