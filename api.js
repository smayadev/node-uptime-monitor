const express = require('express');
const app = express();
const port = 8081;

// need some kind of basic key auth

app.get('/', (req, res) => {
    res.json({
        message: 'Hello World!'
    });
});

app.get('/urls', (req, res) => {
    // Get all URLS from the database
    res.json({
        message: 'urls'
    });
});

app.use(express.json());
app.post('/add/url', (req, res)  => {
    // Add a new URL to the database for monitoring
    const newURL = req.body;
    res.status(201).json(newURL);
});

app.use(express.json());
app.post('/delete/url', (req, res)  => {
    // Delete a URL from the database
    const deleteURL = req.body;
    res.status(201).json(deleteURL);
});

app.use(express.json());
app.post('/ack/url', (req, res)  => {
    // Ack a URL in the database (stop monitoring it)
    const ackURL = req.body;
    res.status(201).json(ackURL);
});

app.use(express.json());
app.post('/unack/url', (req, res)  => {
    // Unack a URL in the database (begin monitoring again)
    const unackURL = req.body;
    res.status(201).json(unackURL);
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});