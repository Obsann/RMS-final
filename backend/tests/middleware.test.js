const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = require('../server');
const User = require('../models/authmodel');

describe('Auth Middleware', () => {

    describe('Token Validation', () => {
        it('should reject requests without token', async () => {
            const res = await request(app)
                .get('/api/requests');

            expect(res.status).toBe(401);
        });

        it('should reject invalid token', async () => {
            const res = await request(app)
                .get('/api/requests')
                .set('Authorization', 'Bearer invalid-token');

            expect(res.status).toBe(401);
        });

        it('should reject expired token', async () => {
            const password = await bcrypt.hash('Test@123', 12);
            const user = await User.create({
                username: 'expuser',
                email: 'expuser@test.com',
                password,
                role: 'resident',
                status: 'approved'
            });

            const expiredToken = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '0s' }
            );

            const res = await request(app)
                .get('/api/requests')
                .set('Authorization', `Bearer ${expiredToken}`);

            expect(res.status).toBe(401);
        });

        it('should accept valid token', async () => {
            const password = await bcrypt.hash('Test@123', 12);
            const user = await User.create({
                username: 'validuser',
                email: 'validuser@test.com',
                password,
                role: 'resident',
                status: 'approved'
            });

            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({ email: 'validuser@test.com', password: 'Test@123' });

            const res = await request(app)
                .get('/api/requests')
                .set('Authorization', `Bearer ${loginRes.body.token}`);

            expect(res.status).toBe(200);
        });
    });

    describe('Admin Auth Middleware', () => {
        it('should allow admin access to admin routes', async () => {
            const password = await bcrypt.hash('Test@123', 12);
            await User.create({
                username: 'admtest',
                email: 'admtest@test.com',
                password,
                role: 'admin',
                status: 'approved'
            });

            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({ email: 'admtest@test.com', password: 'Test@123' });

            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${loginRes.body.token}`);

            expect(res.status).toBe(200);
        });

        it('should reject non-admin from admin routes', async () => {
            const password = await bcrypt.hash('Test@123', 12);
            await User.create({
                username: 'nonaaadm',
                email: 'nonadm@test.com',
                password,
                role: 'resident',
                status: 'approved'
            });

            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({ email: 'nonadm@test.com', password: 'Test@123' });

            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${loginRes.body.token}`);

            expect(res.status).toBe(403);
        });
    });

    describe('Employee Auth Middleware', () => {
        it('should allow employee access to employee routes', async () => {
            const password = await bcrypt.hash('Test@123', 12);
            await User.create({
                username: 'emptest',
                email: 'emptest@test.com',
                password,
                role: 'employee',
                status: 'approved'
            });

            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({ email: 'emptest@test.com', password: 'Test@123' });

            const res = await request(app)
                .get('/api/jobs')
                .set('Authorization', `Bearer ${loginRes.body.token}`);

            expect(res.status).toBe(200);
        });

        it('should reject resident from employee routes', async () => {
            const password = await bcrypt.hash('Test@123', 12);
            await User.create({
                username: 'restest',
                email: 'restest@test.com',
                password,
                role: 'resident',
                status: 'approved'
            });

            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({ email: 'restest@test.com', password: 'Test@123' });

            const res = await request(app)
                .get('/api/jobs')
                .set('Authorization', `Bearer ${loginRes.body.token}`);

            expect(res.status).toBe(403);
        });
    });
});

describe('Password Reset Flow', () => {
    it('should request password reset and reset password', async () => {
        const password = await bcrypt.hash('OldPass@123', 12);
        await User.create({
            username: 'resetuser',
            email: 'resetuser@test.com',
            password,
            role: 'resident',
            status: 'approved'
        });

        // Request reset
        const resetReq = await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: 'resetuser@test.com' });

        expect(resetReq.status).toBe(200);

        // If token is returned in dev mode
        if (resetReq.body.resetToken) {
            // Reset password
            const resetRes = await request(app)
                .post('/api/auth/reset-password')
                .send({
                    email: 'resetuser@test.com',
                    token: resetReq.body.resetToken,
                    newPassword: 'NewPass@123'
                });

            expect(resetRes.status).toBe(200);

            // Verify new password works
            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({ email: 'resetuser@test.com', password: 'NewPass@123' });

            expect(loginRes.status).toBe(200);
            expect(loginRes.body).toHaveProperty('token');
        }
    });

    it('should prevent email enumeration', async () => {
        const res = await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: 'nonexistent@test.com' });

        // Should return 200 even for non-existent email
        expect(res.status).toBe(200);
    });
});

describe('Registration Security', () => {
    it('should force all registrations to resident role', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'sneakyadmin',
                email: 'sneaky@test.com',
                password: 'Sneaky@123',
                role: 'admin'
            });

        expect(res.status).toBe(201);
        // Even though role: 'admin' was sent, user should be resident
        expect(res.body.user.role).toBe('resident');
        expect(res.body.user.status).toBe('pending');
    });
});
