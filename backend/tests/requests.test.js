const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = require('../server');
const User = require('../models/authmodel');
const Request = require('../models/Request');

// Helper to create a user and get auth token
const createUserAndLogin = async (overrides = {}) => {
    const password = await bcrypt.hash('Test@123', 12);
    const user = await User.create({
        username: overrides.username || 'testuser',
        email: overrides.email || 'test@example.com',
        password,
        role: overrides.role || 'resident',
        status: overrides.status || 'approved',
        ...overrides
    });

    const res = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'Test@123' });

    return { user, token: res.body.token };
};

describe('Request Controller', () => {

    describe('POST /api/requests', () => {
        it('should create a new request', async () => {
            const { token } = await createUserAndLogin();

            const res = await request(app)
                .post('/api/requests')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    type: 'id_renewal',
                    subject: 'Need ID Renewal',
                    description: 'My ID card has expired and needs renewal'
                });

            expect(res.status).toBe(201);
            expect(res.body.request).toHaveProperty('_id');
            expect(res.body.request.type).toBe('id_renewal');
            expect(res.body.request.status).toBe('pending');
        });

        it('should reject request with missing required fields', async () => {
            const { token } = await createUserAndLogin();

            const res = await request(app)
                .post('/api/requests')
                .set('Authorization', `Bearer ${token}`)
                .send({ type: 'id_renewal' });

            expect(res.status).toBe(400);
        });

        it('should reject unauthenticated requests', async () => {
            const res = await request(app)
                .post('/api/requests')
                .send({
                    type: 'id_renewal',
                    subject: 'Test',
                    description: 'Test description'
                });

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/requests', () => {
        it('should return only own requests for residents', async () => {
            const { token, user } = await createUserAndLogin();
            const { user: user2 } = await createUserAndLogin({
                username: 'other',
                email: 'other@test.com'
            });

            // Create requests for both users
            await Request.create({
                userId: user._id,
                type: 'id_renewal',
                subject: 'My Request',
                description: 'My description',
                status: 'pending'
            });
            await Request.create({
                userId: user2._id,
                type: 'birth_certificate',
                subject: 'Other Request',
                description: 'Other description',
                status: 'pending'
            });

            const res = await request(app)
                .get('/api/requests')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.requests.length).toBe(1);
            expect(res.body.requests[0].subject).toBe('My Request');
        });

        it('should return all requests for admin', async () => {
            const { token } = await createUserAndLogin({
                username: 'admin',
                email: 'admin@test.com',
                role: 'admin'
            });

            const user = await User.create({
                username: 'resident1',
                email: 'r1@test.com',
                password: await bcrypt.hash('pass123', 12),
                role: 'resident',
                status: 'approved'
            });

            await Request.create({
                userId: user._id,
                type: 'id_renewal',
                subject: 'Request 1',
                description: 'Desc 1',
                status: 'pending'
            });

            const res = await request(app)
                .get('/api/requests')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.requests.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('PATCH /api/requests/:id/status', () => {
        it('should allow employee to update request status', async () => {
            const { token } = await createUserAndLogin({
                username: 'employee',
                email: 'emp@test.com',
                role: 'employee'
            });

            const resident = await User.create({
                username: 'resident2',
                email: 'r2@test.com',
                password: await bcrypt.hash('pass123', 12),
                role: 'resident',
                status: 'approved'
            });

            const req = await Request.create({
                userId: resident._id,
                type: 'id_renewal',
                subject: 'Status Test',
                description: 'Testing status update',
                status: 'pending'
            });

            const res = await request(app)
                .patch(`/api/requests/${req._id}/status`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'in_progress' });

            expect(res.status).toBe(200);
        });

        it('should reject status update from resident', async () => {
            const { token, user } = await createUserAndLogin({
                username: 'resident3',
                email: 'r3@test.com',
                role: 'resident'
            });

            const req = await Request.create({
                userId: user._id,
                type: 'id_renewal',
                subject: 'Resident Update',
                description: 'Should fail',
                status: 'pending'
            });

            const res = await request(app)
                .patch(`/api/requests/${req._id}/status`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'in_progress' });

            expect(res.status).toBe(403);
        });
    });

    describe('DELETE /api/requests/:id', () => {
        it('should allow admin to delete request', async () => {
            const { token } = await createUserAndLogin({
                username: 'deladmin',
                email: 'deladmin@test.com',
                role: 'admin'
            });

            const resident = await User.create({
                username: 'delres',
                email: 'delres@test.com',
                password: await bcrypt.hash('pass123', 12),
                role: 'resident',
                status: 'approved'
            });

            const req = await Request.create({
                userId: resident._id,
                type: 'id_renewal',
                subject: 'Delete Me',
                description: 'To be deleted',
                status: 'pending'
            });

            const res = await request(app)
                .delete(`/api/requests/${req._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
        });
    });
});
