const crypto = require('crypto');
const express = require('express');
const config = require('./config');
const { queryMariaDBDatabase } = require('./common');
const app = express();
const port = config.api_port;

if (!config.api_auth_token || config.api_auth_token.length < 32) {
    throw new Error('API_AUTH_TOKEN must be set and at least 32 characters');
}

const expectedTokenHash = crypto.createHash('sha256').update(config.api_auth_token).digest();

const requireAuth = (req, res, next) => {
    const header = req.headers.authorization;
    if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const providedHash = crypto.createHash('sha256').update(header.slice(7)).digest();
    if (!crypto.timingSafeEqual(providedHash, expectedTokenHash)) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    return next();
};

app.use(express.json());

const isUrlHttp = (url) => {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

const parseId = (raw) => {
    const id = Number.parseInt(raw, 10);
    return Number.isInteger(id) && id > 0 && String(id) === String(raw) ? id : null;
};

app.get('/', (req, res) => {
    return res.json({
        message: 'Hello World!'
    });
});

app.use('/api', requireAuth);

app.get('/api/urls', async (req, res) => {
    try {
        const data = await queryMariaDBDatabase('SELECT * FROM urls');
        return res.json(data);
    } catch (err) {
        console.error(err);
        return res.status(500).send('Server error');
    }
});

app.post('/api/urls', async (req, res) => {
    const newURL = req.body.url;
    if (!isUrlHttp(newURL)) {
        return res.status(400).json({ message: 'Invalid URL' });
    }
    try {
        await queryMariaDBDatabase('INSERT INTO urls (url) VALUES (?)', [newURL]);
        return res.status(201).json({ message: 'URL added' });
    } catch (err) {
        console.error(err);
        return res.status(500).send('Server error');
    }
});

app.delete('/api/urls/:id', async (req, res) => {
    const urlID = parseId(req.params.id);
    if (urlID === null) {
        return res.status(400).json({ message: 'Invalid ID' });
    }
    try {
        await queryMariaDBDatabase('DELETE FROM urls WHERE id = ?', [urlID]);
        return res.status(204).send();
    } catch (err) {
        console.error(err);
        return res.status(500).send('Server error');
    }
});

app.patch('/api/urls/:id', async (req, res) => {
    const urlID = parseId(req.params.id);
    if (urlID === null) {
        return res.status(400).json({ message: 'Invalid ID' });
    }
    if (typeof req.body.ack !== 'boolean') {
        return res.status(400).json({ message: 'Invalid ack value' });
    }
    try {
        await queryMariaDBDatabase('UPDATE urls SET ack = ? WHERE id = ?', [req.body.ack ? 1 : 0, urlID]);
        return res.status(200).json({ message: 'URL updated' });
    } catch (err) {
        console.error(err);
        return res.status(500).send('Server error');
    }
});

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`);
    });
}

module.exports = app;
