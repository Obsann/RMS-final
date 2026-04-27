const request = require('supertest');
const app = require('../server');
const User = require('../models/authmodel');
const DigitalId = require('../models/DigitalId');

const createUserAndLogin = async (overrides = {}) => {
    const loginPassword = overrides.password || 'Test@123';
    const user = await User.create({
        username: overrides.username || 'testuser',
        email: overrides.email || 'test@example.com',
        password: loginPassword,
        role: overrides.role || 'resident',
        status: overrides.status || 'approved',
        ...overrides
    });

    const res = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: loginPassword });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();

    return { user, token: res.body.token };
};

describe('Digital ID Controller', () => {

    describe('POST /api/digital-id/generate', () => {
        it('should generate digital ID for authenticated user', async () => {
            const { token, user } = await createUserAndLogin({
                username: 'iduser',
                email: 'iduser@test.com'
            });

            const res = await request(app)
                .post('/api/digital-id/generate')
                .set('Authorization', `Bearer ${token}`)
                .send({});

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('digitalId');
        });

        it('should prevent duplicate digital ID generation', async () => {
            const { token, user } = await createUserAndLogin({
                username: 'dupid',
                email: 'dupid@test.com'
            });

            // First generation
            await request(app)
                .post('/api/digital-id/generate')
                .set('Authorization', `Bearer ${token}`);

            // Second attempt should fail
            const res = await request(app)
                .post('/api/digital-id/generate')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/digital-id/:id/approve', () => {
        it('should allow admin to approve digital ID', async () => {
            const { token: userToken, user } = await createUserAndLogin({
                username: 'appuser',
                email: 'appuser@test.com'
            });

            const { token: adminToken } = await createUserAndLogin({
                username: 'idadmin',
                email: 'idadmin@test.com',
                role: 'admin'
            });

            // Generate ID
            const genRes = await request(app)
                .post('/api/digital-id/generate')
                .set('Authorization', `Bearer ${userToken}`);

            // Approve
            const res = await request(app)
                .post(`/api/digital-id/${genRes.body.digitalId._id}/approve`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.digitalId.status).toBe('approved');
        });

        it('should allow employee to approve digital ID', async () => {
            const { token: userToken } = await createUserAndLogin({
                username: 'emp-applicant',
                email: 'emp-applicant@test.com'
            });

            const { token: employeeToken } = await createUserAndLogin({
                username: 'idemployee',
                email: 'idemployee@test.com',
                role: 'employee'
            });

            const genRes = await request(app)
                .post('/api/digital-id/generate')
                .set('Authorization', `Bearer ${userToken}`);

            const res = await request(app)
                .post(`/api/digital-id/${genRes.body.digitalId._id}/approve`)
                .set('Authorization', `Bearer ${employeeToken}`);

            expect(res.status).toBe(200);
            expect(res.body.digitalId.status).toBe('issued');
        });

        it('should reject approval from a resident', async () => {
            const { token, user } = await createUserAndLogin({
                username: 'nonappuser',
                email: 'nonappuser@test.com'
            });

            const genRes = await request(app)
                .post('/api/digital-id/generate')
                .set('Authorization', `Bearer ${token}`);

            const res = await request(app)
                .post(`/api/digital-id/${genRes.body.digitalId._id}/approve`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(403);
        });
    });

    describe('POST /api/digital-id/:id/revoke', () => {
        it('should allow admin to revoke digital ID', async () => {
            const { token: userToken } = await createUserAndLogin({
                username: 'revuser',
                email: 'revuser@test.com'
            });

            const { token: adminToken } = await createUserAndLogin({
                username: 'revadmin',
                email: 'revadmin@test.com',
                role: 'admin'
            });

            // Generate and approve first
            const genRes = await request(app)
                .post('/api/digital-id/generate')
                .set('Authorization', `Bearer ${userToken}`);

            await request(app)
                .post(`/api/digital-id/${genRes.body.digitalId._id}/approve`)
                .set('Authorization', `Bearer ${adminToken}`);

            // Revoke
            const res = await request(app)
                .post(`/api/digital-id/${genRes.body.digitalId._id}/revoke`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ reason: 'Document expired' });

            expect(res.status).toBe(200);
        });
    });

    describe('GET /api/digital-id/me', () => {
        it('should return own digital ID', async () => {
            const { token } = await createUserAndLogin({
                username: 'meid',
                email: 'meid@test.com'
            });

            // Generate first
            await request(app)
                .post('/api/digital-id/generate')
                .set('Authorization', `Bearer ${token}`);

            const res = await request(app)
                .get('/api/digital-id/me')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
        });
    });

    describe('GET /api/digital-id/stats', () => {
        it('should return stats for admin', async () => {
            const { token } = await createUserAndLogin({
                username: 'statsadm',
                email: 'statsadm@test.com',
                role: 'admin'
            });

            const res = await request(app)
                .get('/api/digital-id/stats')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('total');
        });
    });
});
