const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/authmodel');

// Mock database connection
beforeAll(async () => {
    // Jest will run this before all tests
    // We assume the app connects to the DB in server.js, 
    // but for testing we might want to ensure a connection or use a test DB
    // For this existing codebase, we'll rely on the existing connection logic OR 
    // if you have a separate test database URI, set it in process.env
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Auth Endpoints', () => {
    let adminToken;
    let userToken;
    let adminId;
    let userId;
    let userBId;
    let userBToken;

    // Setup test data
    beforeAll(async () => {
        // Clear users
        await User.deleteMany({ email: { $in: ['testadmin@example.com', 'testuser@example.com', 'testuserb@example.com'] } });

        // Create Admin
        const adminRes = await request(app).post('/api/auth/register').send({
            username: 'TestAdmin',
            email: 'testadmin@example.com',
            password: 'password123',
            role: 'admin',
            phone: '0911111111'
        });
        // Login to get token
        const adminLogin = await request(app).post('/api/auth/login').send({
            email: 'testadmin@example.com',
            password: 'password123'
        });
        adminToken = adminLogin.body.token;
        adminId = adminLogin.body.user.id;

        // Create User A
        const userRes = await request(app).post('/api/auth/register').send({
            username: 'TestUserA',
            email: 'testuser@example.com',
            password: 'password123',
            phone: '0922222222',
            unit: 'B-12'
        });
        // Approve user (admins approve others) -> Actually for now let's just update DB manually to be fast
        await User.updateOne({ email: 'testuser@example.com' }, { status: 'approved' });

        const userLogin = await request(app).post('/api/auth/login').send({
            email: 'testuser@example.com',
            password: 'password123'
        });
        userToken = userLogin.body.token;
        userId = userLogin.body.user.id;

        // Create User B
        const userBRes = await request(app).post('/api/auth/register').send({
            username: 'TestUserB',
            email: 'testuserb@example.com',
            password: 'password123',
            phone: '0933333333',
            unit: 'C-05'
        });
        await User.updateOne({ email: 'testuserb@example.com' }, { status: 'approved' });

        const userBLogin = await request(app).post('/api/auth/login').send({
            email: 'testuserb@example.com',
            password: 'password123'
        });
        userBToken = userBLogin.body.token;
        userBId = userBLogin.body.user.id;
    });

    describe('IDOR Protection (checkUser)', () => {
        it('should allow user to view their own profile', async () => {
            const res = await request(app)
                .get(`/api/auth/checkUser/${userId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.user.email).toEqual('testuser@example.com');
        });

        it('should allow user to view their own profile via /me', async () => {
            const res = await request(app) // /me maps to checkUser without ID param
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.user.email).toEqual('testuser@example.com');
        });

        it('should DENY user from viewing another user profile', async () => {
            const res = await request(app)
                .get(`/api/auth/checkUser/${userBId}`) // User A trying to see User B
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toEqual(403);
        });

        it('should allow ADMIN to view any profile', async () => {
            const res = await request(app)
                .get(`/api/auth/checkUser/${userId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.user.email).toEqual('testuser@example.com');
        });
    });
});
