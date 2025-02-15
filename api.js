const express = require('express');
const mariadb = require('mariadb');
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

app.get('/', (req, res) => {
    res.json({
        message: 'Hello World!'
    });
});

app.get('/urls', async (req, res) => {
    // Get all URLS from the database
    let query = 'SELECT * FROM urls';
    try {
        const data = await queryDatabase(query);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.use(express.json());
app.post('/add/url', async (req, res)  => {
    // Add a new URL to the database for monitoring
    const newURL = req.body.url;
    try {
        const data = await queryDatabase('INSERT INTO urls (url) VALUES (?)', [newURL]);
        res.status(201).json({'message': 'URL added'});
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
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