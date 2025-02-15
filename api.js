const express = require('express');
const isUrlHttp = require('is-url-http');
const config = require('./config.json');
const { queryMariaDBDatabase } = require('./common');
const app = express();
const port = config.api_port;

// need some kind of basic key auth

app.get('/', (req, res) => {
    return res.json({
        message: 'Hello World!'
    });
});

app.get('/api/urls', async (req, res) => {
    // Get all URLS from the database
    let query = 'SELECT * FROM urls';
    try {
        const data = await queryMariaDBDatabase(query);
        return res.json(data);
    } catch (err) {
        console.error(err);
        return res.status(500).send('Server error');
    }
});

app.use(express.json());
app.post('/api/add/url', async (req, res)  => {
    // Add a new URL to the database for monitoring
    const newURL = req.body.url;
    if (!isUrlHttp(newURL)) {
        return res.status(400).json({ message: 'Invalid URL' });
    }
    try {
        const data = await queryMariaDBDatabase('INSERT INTO urls (url) VALUES (?)', [newURL]);
        return res.status(201).json({message: 'URL added'});
    } catch (err) {
        console.error(err);
        return res.status(500).send('Server error');
    }
});

app.use(express.json());
app.post('/api/delete/url', async (req, res)  => {
    // Delete a URL from the database
    const urlID = req.body.id;
    if (!Number.isInteger(urlID)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }
    try {
        const data = await queryMariaDBDatabase('DELETE FROM urls WHERE id = ?', [urlID]);
        return res.status(201).json({message: 'URL deleted'});
    } catch (err) {
        console.error(err);
        return res.status(500).send('Server error');
    }
});

app.use(express.json());
app.post('/api/ack/url', async (req, res)  => {
    // Ack a URL in the database (stop monitoring it)
    const urlID = req.body.id;
    if (!Number.isInteger(urlID)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }
    try {
        const data = await queryMariaDBDatabase('UPDATE urls SET ack = 1 WHERE id = ?', [urlID]);
        return res.status(201).json({message: "URL ack'd"});
    } catch (err) {
        console.error(err);
        return res.status(500).send('Server error');
    }
});

app.use(express.json());
app.post('/api/unack/url', async (req, res)  => {
    // Unack a URL in the database (begin monitoring again)
    const urlID = req.body.id;
    if (!Number.isInteger(urlID)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }
    try {
        const data = await queryMariaDBDatabase('UPDATE urls SET ack = 0 WHERE id = ?', [urlID]);
        return res.status(201).json({message: "URL unack'd"});
    } catch (err) {
        console.error(err);
        return res.status(500).send('Server error');
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});