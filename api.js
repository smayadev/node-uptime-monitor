const express = require('express');
const mariadb = require('mariadb');
const isUrlHttp = require('is-url-http');
const config = require('./config.json');
const app = express();
const port = 8081;

// need some kind of basic key auth

const pool = mariadb.createPool({
    host: config.mariadb.host,
    user: config.mariadb.user,
    password: config.mariadb.password,
    database: config.mariadb.database
})

const queryDatabase = async (query, params = []) => {
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

const validateID = (id) => {
    return Number.isInteger(id);
};

app.get('/', (req, res) => {
    return res.json({
        message: 'Hello World!'
    });
});

app.get('/urls', async (req, res) => {
    // Get all URLS from the database
    let query = 'SELECT * FROM urls';
    try {
        const data = await queryDatabase(query);
        return res.json(data);
    } catch (err) {
        console.error(err);
        return res.status(500).send('Server error');
    }
});

app.use(express.json());
app.post('/add/url', async (req, res)  => {
    // Add a new URL to the database for monitoring
    const newURL = req.body.url;
    if (!isUrlHttp(newURL)) {
        return res.status(400).json({ message: 'Invalid URL' });
    }
    try {
        const data = await queryDatabase('INSERT INTO urls (url) VALUES (?)', [newURL]);
        return res.status(201).json({message: 'URL added'});
    } catch (err) {
        console.error(err);
        return res.status(500).send('Server error');
    }
});

app.use(express.json());
app.post('/delete/url', async (req, res)  => {
    // Delete a URL from the database
    const urlID = req.body.id;
    if (!validateID(urlID)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }
    try {
        const data = await queryDatabase('DELETE FROM urls WHERE id = ?', [urlID]);
        return res.status(201).json({message: 'URL deleted'});
    } catch (err) {
        console.error(err);
        return res.status(500).send('Server error');
    }
});

app.use(express.json());
app.post('/ack/url', (req, res)  => {
    // Ack a URL in the database (stop monitoring it)
    const ackURL = req.body.id;
    return res.status(201).json(ackURL);
});

app.use(express.json());
app.post('/unack/url', (req, res)  => {
    // Unack a URL in the database (begin monitoring again)
    const unackURL = req.body.id;
    return res.status(201).json(unackURL);
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});