const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../server');
const User = require('../models/authmodel');
const Job = require('../models/Job');

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

describe('Job Controller', () => {

    describe('POST /api/jobs', () => {
        it('should allow admin to create a job', async () => {
            const { token } = await createUserAndLogin({
                username: 'jobadmin',
                email: 'jobadmin@test.com',
                role: 'admin'
            });

            const res = await request(app)
                .post('/api/jobs')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    title: 'Fix Road Light',
                    description: 'Broken street light near block A',
                    category: 'maintenance',
                    priority: 'high'
                });

            expect(res.status).toBe(201);
            expect(res.body.job).toHaveProperty('_id');
            expect(res.body.job.title).toBe('Fix Road Light');
        });

        it('should reject job creation from non-admin', async () => {
            const { token } = await createUserAndLogin({
                username: 'jobemp',
                email: 'jobemp@test.com',
                role: 'employee'
            });

            const res = await request(app)
                .post('/api/jobs')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    title: 'Unauthorized Job',
                    description: 'Should not work'
                });

            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/jobs', () => {
        it('should return jobs for employee', async () => {
            const { token: adminToken } = await createUserAndLogin({
                username: 'jobadmin2',
                email: 'jobadmin2@test.com',
                role: 'admin'
            });

            const { token: empToken, user: employee } = await createUserAndLogin({
                username: 'jobworker',
                email: 'jobworker@test.com',
                role: 'employee'
            });

            // Admin creates job
            await request(app)
                .post('/api/jobs')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Test Job',
                    description: 'A test job',
                    priority: 'medium'
                });

            const res = await request(app)
                .get('/api/jobs')
                .set('Authorization', `Bearer ${empToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('jobs');
        });

        it('should reject job listing from resident', async () => {
            const { token } = await createUserAndLogin({
                username: 'jobres',
                email: 'jobres@test.com',
                role: 'resident'
            });

            const res = await request(app)
                .get('/api/jobs')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(403);
        });
    });

    describe('POST /api/jobs/:id/assign', () => {
        it('should allow admin to assign job to employee', async () => {
            const { token: adminToken } = await createUserAndLogin({
                username: 'assignadmin',
                email: 'assignadmin@test.com',
                role: 'admin'
            });

            const { user: employee } = await createUserAndLogin({
                username: 'assignemp',
                email: 'assignemp@test.com',
                role: 'employee'
            });

            const jobRes = await request(app)
                .post('/api/jobs')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Assign Test Job',
                    description: 'Job to be assigned',
                    priority: 'low'
                });

            const res = await request(app)
                .post(`/api/jobs/${jobRes.body.job._id}/assign`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ assignedTo: employee._id });

            expect(res.status).toBe(200);
        });
    });

    describe('GET /api/jobs/stats', () => {
        it('should return job statistics for admin', async () => {
            const { token } = await createUserAndLogin({
                username: 'statsadmin',
                email: 'statsadmin@test.com',
                role: 'admin'
            });

            const res = await request(app)
                .get('/api/jobs/stats')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('total');
        });
    });
});
