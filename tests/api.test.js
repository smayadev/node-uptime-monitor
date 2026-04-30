const TEST_TOKEN = 'test-token-of-sufficient-length-32-chars';
process.env.API_AUTH_TOKEN = TEST_TOKEN;

const request = require('supertest');

jest.mock('../common', () => ({
    queryMariaDBDatabase: jest.fn()
}));

const { queryMariaDBDatabase } = require('../common');
const app = require('../api');

const auth = (req) => req.set('Authorization', `Bearer ${TEST_TOKEN}`);

afterEach(() => {
    jest.clearAllMocks();
});

describe('GET /', () => {
    it('returns hello world message (no auth required)', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: 'Hello World!' });
    });
});

describe('auth middleware', () => {
    it('rejects requests without an Authorization header with 401', async () => {
        const res = await request(app).get('/api/urls');
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ message: 'Unauthorized' });
    });

    it('rejects malformed Authorization header with 401', async () => {
        const res = await request(app)
            .get('/api/urls')
            .set('Authorization', 'NotBearer something');
        expect(res.status).toBe(401);
    });

    it('rejects wrong bearer token with 401', async () => {
        const res = await request(app)
            .get('/api/urls')
            .set('Authorization', 'Bearer wrong-token');
        expect(res.status).toBe(401);
        expect(queryMariaDBDatabase).not.toHaveBeenCalled();
    });
});

describe('GET /api/urls', () => {
    it('returns URL list from database', async () => {
        const mockUrls = [
            { id: 1, url: 'https://example.com', ack: 0 },
            { id: 2, url: 'https://test.com', ack: 1 }
        ];
        queryMariaDBDatabase.mockResolvedValue(mockUrls);

        const res = await auth(request(app).get('/api/urls'));
        expect(res.status).toBe(200);
        expect(res.body).toEqual(mockUrls);
        expect(queryMariaDBDatabase).toHaveBeenCalledWith('SELECT * FROM urls');
    });

    it('returns 500 on database error', async () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        queryMariaDBDatabase.mockRejectedValue(new Error('DB error'));

        const res = await auth(request(app).get('/api/urls'));
        expect(res.status).toBe(500);
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });
});

describe('POST /api/urls', () => {
    it('rejects non-HTTP URL with 400', async () => {
        const res = await auth(request(app).post('/api/urls'))
            .send({ url: 'ftp://bad.com' });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ message: 'Invalid URL' });
    });

    it('adds valid URL and returns 201', async () => {
        queryMariaDBDatabase.mockResolvedValue({});

        const res = await auth(request(app).post('/api/urls'))
            .send({ url: 'https://example.com' });
        expect(res.status).toBe(201);
        expect(res.body).toEqual({ message: 'URL added' });
        expect(queryMariaDBDatabase).toHaveBeenCalledWith(
            'INSERT INTO urls (url) VALUES (?)',
            ['https://example.com']
        );
    });

    it('returns 500 on database error', async () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        queryMariaDBDatabase.mockRejectedValue(new Error('DB error'));

        const res = await auth(request(app).post('/api/urls'))
            .send({ url: 'https://example.com' });
        expect(res.status).toBe(500);
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });
});

describe('DELETE /api/urls/:id', () => {
    it('rejects non-integer ID with 400', async () => {
        const res = await auth(request(app).delete('/api/urls/abc'));
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ message: 'Invalid ID' });
    });

    it('deletes valid ID and returns 204', async () => {
        queryMariaDBDatabase.mockResolvedValue({});

        const res = await auth(request(app).delete('/api/urls/1'));
        expect(res.status).toBe(204);
        expect(res.body).toEqual({});
        expect(queryMariaDBDatabase).toHaveBeenCalledWith(
            'DELETE FROM urls WHERE id = ?',
            [1]
        );
    });

    it('returns 500 on database error', async () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        queryMariaDBDatabase.mockRejectedValue(new Error('DB error'));

        const res = await auth(request(app).delete('/api/urls/1'));
        expect(res.status).toBe(500);
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });
});

describe('PATCH /api/urls/:id', () => {
    it('rejects non-integer ID with 400', async () => {
        const res = await auth(request(app).patch('/api/urls/abc'))
            .send({ ack: true });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ message: 'Invalid ID' });
    });

    it('rejects non-boolean ack with 400', async () => {
        const res = await auth(request(app).patch('/api/urls/1'))
            .send({ ack: 'yes' });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ message: 'Invalid ack value' });
    });

    it('acks valid ID and returns 200', async () => {
        queryMariaDBDatabase.mockResolvedValue({});

        const res = await auth(request(app).patch('/api/urls/1'))
            .send({ ack: true });
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: 'URL updated' });
        expect(queryMariaDBDatabase).toHaveBeenCalledWith(
            'UPDATE urls SET ack = ? WHERE id = ?',
            [1, 1]
        );
    });

    it('unacks valid ID and returns 200', async () => {
        queryMariaDBDatabase.mockResolvedValue({});

        const res = await auth(request(app).patch('/api/urls/1'))
            .send({ ack: false });
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: 'URL updated' });
        expect(queryMariaDBDatabase).toHaveBeenCalledWith(
            'UPDATE urls SET ack = ? WHERE id = ?',
            [0, 1]
        );
    });

    it('returns 500 on database error', async () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        queryMariaDBDatabase.mockRejectedValue(new Error('DB error'));

        const res = await auth(request(app).patch('/api/urls/1'))
            .send({ ack: true });
        expect(res.status).toBe(500);
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });
});
