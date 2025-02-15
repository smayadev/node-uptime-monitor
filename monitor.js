var axios = require('axios');
var fs = require('fs');

const config = require('./config.json');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const checkInterval = config.checkInterval;

var urls = fs.readFileSync(config.urls).toString().split("\n");

async function fetchURLs() {

    console.log("Current Date and Time:", new Date().toLocaleString());
    console.log("Getting URL data...");

    var apiRequests = urls.map(url => axios.get(url, { timeout: config.timeout }));

    var results = await Promise.allSettled(apiRequests);

    results.forEach((result, index) => {
        console.log(`Processing URL ${index + 1}:`, urls[index]);
        if (result.status === "fulfilled") {
            console.log(`${index + 1} Success:`, urls[index], result.value.statusText, result.value.status);
        } else {
            console.error(`${index + 1} Failed:`, urls[index], result.reason.code, result.reason.status);
        }
    });

    console.log("All requests completed\n");

    await delay(checkInterval);

    process.nextTick(fetchURLs)
}

fetchURLs();
