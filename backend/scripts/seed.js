/**
 * Seed script — populates the database with example data for all roles.
 * Employees are white-collar administrative/service staff in an RMS platform.
 * Run: npm run seed
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../models/authmodel');
const Request = require('../models/Request');
const Notification = require('../models/Notification');
const DigitalId = require('../models/DigitalId');
const Job = require('../models/Job');
const Household = require('../models/Household');

const seed = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.\n');

        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            Request.deleteMany({}),
            Notification.deleteMany({}),
            DigitalId.deleteMany({}),
            Job.deleteMany({}),
            Household.deleteMany({}),
        ]);
        console.log('🗑️  Cleared existing data');

        // ── Shared password ───────────────────────────────────────────
        const plainPassword = 'password123';

        // ── Create Users ──────────────────────────────────────────────
        const usersData = [
            // ── Admin ──
            {
                username: 'obsan.habtamu',
                email: 'obsan@rms.com',
                password: plainPassword,
                phone: '+251 911 000 001',
                role: 'admin',
                status: 'approved',
                unit: '',
                jobCategory: '',
            },

            // ── Employees (4 leads, one per Service Hub category) ──
            {
                username: 'samson.tadesse',
                email: 'samson.tadesse@rms.com',
                password: plainPassword,
                phone: '+251 911 000 010',
                role: 'employee',
                status: 'approved',
                unit: '',
                jobCategory: 'Identity & Registration',
            },
            {
                username: 'samuel.tolasa',
                email: 'samuel.tolasa@rms.com',
                password: plainPassword,
                phone: '+251 911 000 011',
                role: 'employee',
                status: 'approved',
                unit: '',
                jobCategory: 'Certificates',
            },
            {
                username: 'samuel.fayisa',
                email: 'samuel.fayisa@rms.com',
                password: plainPassword,
                phone: '+251 911 000 012',
                role: 'employee',
                status: 'approved',
                unit: '',
                jobCategory: 'Permits',
            },
            {
                username: 'olyad.amanuel',
                email: 'olyad.amanuel@rms.com',
                password: plainPassword,
                phone: '+251 911 000 013',
                role: 'employee',
                status: 'approved',
                unit: '',
                jobCategory: 'Feedback & Support',
            },

            // ── Residents (clean — no pre-seeded data) ──
            {
                username: 'ramadan.oumer',
                email: 'ramadan.o@rms.com',
                password: plainPassword,
                phone: '+251 955 678 901',
                role: 'resident',
                status: 'approved',
                unit: 'B-108',
            },
            {
                username: 'samira.hambisa',
                email: 'samira.h@rms.com',
                password: plainPassword,
                phone: '+251 966 789 012',
                role: 'resident',
                status: 'approved',
                unit: 'A-203',
            },
        ];

        const createdUsers = [];
        for (const data of usersData) {
            const user = new User(data);
            await user.save();
            createdUsers.push(user);
        }
        console.log(`👤 Created ${createdUsers.length} users`);

        // No seed data — fresh start for manual testing
        console.log(`📋 No requests seeded (fresh start)`);
        console.log(`📋 No jobs seeded (fresh start)`);
        console.log(`🔔 No notifications seeded (fresh start)`);
        console.log(`🆔 No digital IDs seeded (fresh start)`);
        console.log(`🏠 No households seeded (fresh start)`);

        // ── Summary ───────────────────────────────────────────────────
        console.log('\n════════════════════════════════════════════════════════════');
        console.log('  ✅ Database seeded successfully!');
        console.log('════════════════════════════════════════════════════════════');
        console.log('\n  Login credentials (all passwords: password123):');
        console.log('  ──────────────────────────────────────────────────────────');
        console.log('  Admin:              obsan@rms.com');
        console.log('  Employee:           samson.tadesse@rms.com   (Identity & Registration)');
        console.log('  Employee:           samuel.tolasa@rms.com    (Certificates)');
        console.log('  Employee:           samuel.fayisa@rms.com    (Permits)');
        console.log('  Employee:           olyad.amanuel@rms.com    (Feedback & Support)');
        console.log('  Resident:           ramadan.o@rms.com        (B-108)');
        console.log('  Resident:           samira.h@rms.com         (A-203)');
        console.log('════════════════════════════════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
};

seed();

