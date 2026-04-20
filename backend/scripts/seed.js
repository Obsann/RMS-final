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
        const plainPassword = 'password1234';

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

            // ── Special Employees (Senior administrative staff) ──
            {
                username: 'samuel.tolasa',
                email: 'samuel.tolasa@rms.com',
                password: plainPassword,
                phone: '+251 911 000 010',
                role: 'special-employee',
                status: 'approved',
                unit: '',
                jobCategory: 'Operations Management',
            },
            {
                username: 'temesgen.alemu',
                email: 'temesgen.a@rms.com',
                password: plainPassword,
                phone: '+251 911 000 011',
                role: 'special-employee',
                status: 'approved',
                unit: '',
                jobCategory: 'Resident Affairs',
            },

            // ── Employees (White-collar RMS administrative roles) ──
            {
                username: 'mekdes.girma',
                email: 'mekdes.g@rms.com',
                password: plainPassword,
                phone: '+251 911 111 001',
                role: 'employee',
                status: 'approved',
                unit: '',
                jobCategory: 'ID & Registration',       // handles new resident onboarding & document intake
            },
            {
                username: 'yonas.tesfaye',
                email: 'yonas.t@rms.com',
                password: plainPassword,
                phone: '+251 911 111 002',
                role: 'employee',
                status: 'approved',
                unit: '',
                jobCategory: 'Complaint Handling',       // receives, logs, and routes complaints
            },
            {
                username: 'selamawit.bekele',
                email: 'selamawit.b@rms.com',
                password: plainPassword,
                phone: '+251 911 111 003',
                role: 'employee',
                status: 'approved',
                unit: '',
                jobCategory: 'Document Processing',      // manages certificates, letters, ID records
            },
            {
                username: 'nahom.getachew',
                email: 'nahom.g@rms.com',
                password: plainPassword,
                phone: '+251 911 111 004',
                role: 'employee',
                status: 'approved',
                unit: '',
                jobCategory: 'Records Management',       // coordinates security patrols & incident reports
            },
            {
                username: 'fikirte.haile',
                email: 'fikirte.h@rms.com',
                password: plainPassword,
                phone: '+251 911 111 005',
                role: 'employee',
                status: 'approved',
                unit: '',
                jobCategory: 'Resident Services',        // community announcements, welfare tasks
            },

            // ── Residents ──
            {
                username: 'abebe.kebede',
                email: 'abebe.k@rms.com',
                password: plainPassword,
                phone: '+251 911 234 567',
                role: 'resident',
                status: 'approved',
                unit: 'A-101',
                dependents: [
                    { name: 'Meron Abebe', relationship: 'Wife', age: 30 },
                    { name: 'Dawit Abebe', relationship: 'Son', age: 5 },
                ],
            },
            {
                username: 'fatima.mohammed',
                email: 'fatima.m@rms.com',
                password: plainPassword,
                phone: '+251 922 345 678',
                role: 'resident',
                status: 'approved',
                unit: 'B-205',
                dependents: [
                    { name: 'Ahmed Mohammed', relationship: 'Husband', age: 38 },
                ],
            },
            {
                username: 'dawit.tadesse',
                email: 'dawit.t@rms.com',
                password: plainPassword,
                phone: '+251 933 456 789',
                role: 'resident',
                status: 'approved',
                unit: 'C-312',
                dependents: [
                    { name: 'Liya Dawit', relationship: 'Wife', age: 28 },
                    { name: 'Henok Dawit', relationship: 'Son', age: 8 },
                    { name: 'Sara Dawit', relationship: 'Daughter', age: 3 },
                ],
            },
            {
                username: 'tigist.haile',
                email: 'tigist.h@rms.com',
                password: plainPassword,
                phone: '+251 944 567 890',
                role: 'resident',
                status: 'approved',
                unit: 'A-204',
            },
            {
                username: 'ramadan.oumer',
                email: 'ramadan.o@rms.com',
                password: plainPassword,
                phone: '+251 955 678 901',
                role: 'resident',
                status: 'approved',
                unit: 'B-108',
                dependents: [
                    { name: 'Amina Oumer', relationship: 'Wife', age: 27 },
                    { name: 'Yusuf Ramadan', relationship: 'Son', age: 2 },
                ],
            },
        ];

        const createdUsers = await User.create(usersData);
        console.log(`👤 Created ${createdUsers.length} users`);

        // Build lookup map
        const u = {};
        createdUsers.forEach((user) => { u[user.email] = user; });

        // ── Seed Requests ─────────────────────────────────────────────
        // These are white-collar / administrative complaints, not maintenance tasks
        const requests = [
            {
                type: 'complaint',
                resident: u['abebe.k@rms.com']._id, unit: 'A-101',
                category: 'Administration',
                subject: 'Residency certificate not issued after 2 weeks',
                description: 'Applied for a residency certificate two weeks ago. No response yet. Need it urgently for a bank application.',
                status: 'pending', priority: 'high',
            },
            {
                type: 'complaint',
                resident: u['fatima.m@rms.com']._id, unit: 'B-205',
                category: 'Security',
                subject: 'Suspicious individuals seen near Block B gate at night',
                description: 'For the past three nights, unknown individuals have been loitering near the main gate after midnight. Residents are uncomfortable.',
                status: 'in-progress', priority: 'urgent',
                isEscalated: true,
                escalatedBy: u['yonas.t@rms.com']._id,
                escalatedAt: new Date(),
                escalationNote: 'Admin — this is the second report from Block B residents this week. Requires police coordination.',
                response: { message: 'Security staff notified, reviewing CCTV footage', respondedBy: u['samuel.tolasa@rms.com']._id, respondedAt: new Date() },
            },
            {
                type: 'complaint',
                resident: u['dawit.t@rms.com']._id, unit: 'C-312',
                category: 'Administration',
                subject: 'Household registration data is incorrect in the system',
                description: 'My household record still shows an old address from the previous unit. Needs correction before I can process my ID renewal.',
                status: 'pending', priority: 'medium',
            },
            {
                type: 'certificate',
                resident: u['tigist.h@rms.com']._id, unit: 'A-204',
                category: 'Administrative',
                subject: 'Birth registration letter for child',
                description: 'Need an official letter confirming child residency for birth certificate registration at the sub-city office.',
                status: 'completed', priority: 'medium',
                resolvedAt: new Date(),
                response: { message: 'Letter prepared and ready for collection at the office', respondedBy: u['selamawit.b@rms.com']._id, respondedAt: new Date() },
            },
            {
                type: 'complaint',
                resident: u['ramadan.o@rms.com']._id, unit: 'B-108',
                category: 'Community',
                subject: 'No announcement about upcoming community meeting',
                description: 'Heard from neighbours that a community meeting was held last week. We were never notified. Requesting better communication.',
                status: 'pending', priority: 'low',
            },
            {
                type: 'complaint',
                resident: u['abebe.k@rms.com']._id, unit: 'A-101',
                category: 'Security',
                subject: 'Unregistered vehicle parked in resident zone for 5 days',
                description: 'An unregistered vehicle has been occupying a resident parking spot for 5 days. Not responding to notices left on windshield.',
                status: 'in-progress', priority: 'high',
                isEscalated: true,
                escalatedBy: u['nahom.g@rms.com']._id,
                escalatedAt: new Date(),
                escalationNote: 'Admin — vehicle plates are not in our registry. Possible unauthorized access.',
                response: { message: 'Parking incident logged, vehicle details sent to traffic authority', respondedBy: u['samuel.tolasa@rms.com']._id, respondedAt: new Date() },
            },
            {
                type: 'certificate',
                resident: u['fatima.m@rms.com']._id, unit: 'B-205',
                category: 'Administrative',
                subject: 'Address confirmation letter for passport application',
                description: 'Need an official address confirmation letter to submit with passport renewal application.',
                status: 'pending', priority: 'medium',
            },
        ];

        const createdRequests = await Request.create(requests);
        console.log(`📋 Created ${createdRequests.length} requests`);

        // ── Jobs — no seeded tasks (created via workspace) ─────────
        console.log(`📋 Skipped jobs (no seed data)`);

        // ── Seed Notifications ────────────────────────────────────────
        const notifications = [
            // Admin — only security/escalation alerts
            { userId: u['obsan@rms.com']._id, type: 'system', title: 'Suspicious individuals reported — Block B gate', message: 'Yonas Tesfaye escalated a security report: unknown individuals are loitering near the Block B main gate nightly. Police coordination may be required.', readStatus: false },
            { userId: u['obsan@rms.com']._id, type: 'system', title: 'Unregistered vehicle in resident zone — Block A', message: 'Nahom Getachew escalated a parking security incident. Vehicle plates not in system. Possible unauthorized access.', readStatus: false },
            { userId: u['obsan@rms.com']._id, type: 'account_update', title: 'New resident registered: Ramadan Oumer (B-108)', message: 'Ramadan Oumer has completed registration and is pending approval.', readStatus: true },

            // Special Employee — Samuel Tolasa
            { userId: u['samuel.tolasa@rms.com']._id, type: 'request_update', title: 'Urgent complaint escalated to you', message: 'Yonas Tesfaye routed an urgent security complaint from Block B for your review.', readStatus: false },
            { userId: u['samuel.tolasa@rms.com']._id, type: 'job_update', title: 'Job completed: Birth registration letter (A-204)', message: 'Selamawit Bekele completed preparing the official letter for Tigist Haile.', readStatus: true },
            { userId: u['samuel.tolasa@rms.com']._id, type: 'system', title: '2 administrative jobs overdue', message: 'Residency certificate (A-101) and household record correction (C-312) are both past their due dates.', readStatus: false },

            // Special Employee — Temesgen Alemu
            { userId: u['temesgen.a@rms.com']._id, type: 'system', title: 'Resident affairs update', message: '4 new complaints submitted this week across Blocks A, B, and C. Review assignment status.', readStatus: false },

            // Employee — Mekdes Girma (Resident Registration)
            { userId: u['mekdes.g@rms.com']._id, type: 'job_update', title: 'New task: Correct household record — Dawit Tadesse', message: 'You have been assigned to update the household database record for Unit C-312. Please verify documents and update before the due date.', readStatus: false },

            // Employee — Yonas Tesfaye (Complaint Processing)
            { userId: u['yonas.t@rms.com']._id, type: 'request_update', title: 'New complaint assigned — Block B security', message: 'A new urgent security complaint has been submitted by Fatima Mohammed (B-205). Process and escalate if necessary.', readStatus: false },

            // Employee — Selamawit Bekele (Document & Records)
            { userId: u['selamawit.b@rms.com']._id, type: 'job_update', title: 'New task: Process residency certificate — Abebe Kebede', message: 'Assigned to you: issue official residency certificate for Unit A-101. High priority — resident is waiting. Already overdue.', readStatus: false },

            // Employee — Nahom Getachew (Security Coordination)
            { userId: u['nahom.g@rms.com']._id, type: 'job_update', title: 'New task: Investigate unregistered vehicle — A-101 parking', message: 'Run vehicle plate through registry, contact owner, and file a full parking violation report by end of day.', readStatus: false },

            // Employee — Fikirte Haile (Community Affairs)
            { userId: u['fikirte.h@rms.com']._id, type: 'job_update', title: 'New task: Community meeting announcement', message: 'Draft and distribute the community meeting notice to all Block residents by Thursday.', readStatus: false },

            // Resident — Abebe
            { userId: u['abebe.k@rms.com']._id, type: 'request_update', title: 'Your certificate request is being processed', message: 'Your residency certificate application is under review by our document team.', readStatus: false },

            // Resident — Fatima
            { userId: u['fatima.m@rms.com']._id, type: 'status_update', title: 'Security concern acknowledged', message: 'Your security report about the Block B gate has been escalated. Our team is reviewing CCTV footage.', readStatus: false },

            // Resident — Tigist
            { userId: u['tigist.h@rms.com']._id, type: 'request_update', title: 'Your letter is ready for collection', message: 'The official residency letter for child birth registration is ready. Please collect it at the RMS office during working hours.', readStatus: false },

            // Resident — Ramadan
            { userId: u['ramadan.o@rms.com']._id, type: 'account_update', title: 'Welcome to RMS Kebele!', message: 'Your account has been approved. You can now submit requests, view your household profile, and manage your digital ID.', readStatus: false },
        ];

        const createdNotifications = await Notification.create(notifications);
        console.log(`🔔 Created ${createdNotifications.length} notifications`);

        // ── Seed Digital IDs ──────────────────────────────────────────
        const digitalIds = [
            {
                user: u['abebe.k@rms.com']._id,
                qrCode: DigitalId.generateQRCode(u['abebe.k@rms.com']._id, 'A-101'),
                status: 'approved',
                issuedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                expiresAt: new Date(Date.now() + 275 * 24 * 60 * 60 * 1000),
                approvedBy: u['obsan@rms.com']._id,
                approvedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            },
            {
                user: u['ramadan.o@rms.com']._id,
                qrCode: DigitalId.generateQRCode(u['ramadan.o@rms.com']._id, 'B-108'),
                status: 'pending',
            },
            {
                user: u['dawit.t@rms.com']._id,
                qrCode: DigitalId.generateQRCode(u['dawit.t@rms.com']._id, 'C-312'),
                status: 'approved',
                issuedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
                expiresAt: new Date(Date.now() + 305 * 24 * 60 * 60 * 1000),
                approvedBy: u['obsan@rms.com']._id,
                approvedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            },
        ];

        const createdDigitalIds = await DigitalId.create(digitalIds);
        console.log(`🆔 Created ${createdDigitalIds.length} digital IDs`);

        // ── Seed Households ───────────────────────────────────────────
        const households = [
            {
                houseNo: 'A-101', headOfHousehold: u['abebe.k@rms.com']._id,
                address: { kebele: '01', woreda: '05', subCity: 'Bole', streetAddress: 'Block A, Unit 101' },
                type: 'residential', status: 'active',
            },
            {
                houseNo: 'B-205', headOfHousehold: u['fatima.m@rms.com']._id,
                address: { kebele: '01', woreda: '05', subCity: 'Bole', streetAddress: 'Block B, Unit 205' },
                type: 'residential', status: 'active',
            },
            {
                houseNo: 'C-312', headOfHousehold: u['dawit.t@rms.com']._id,
                address: { kebele: '01', woreda: '05', subCity: 'Bole', streetAddress: 'Block C, Unit 312' },
                type: 'residential', status: 'active',
            },
            {
                houseNo: 'B-108', headOfHousehold: u['ramadan.o@rms.com']._id,
                address: { kebele: '01', woreda: '05', subCity: 'Bole', streetAddress: 'Block B, Unit 108' },
                type: 'residential', status: 'active',
            },
        ];

        const createdHouseholds = await Household.create(households);
        console.log(`🏠 Created ${createdHouseholds.length} households`);

        // ── Summary ───────────────────────────────────────────────────
        console.log('\n════════════════════════════════════════════════════════════');
        console.log('  ✅ Database seeded successfully!');
        console.log('════════════════════════════════════════════════════════════');
        console.log('\n  Login credentials (all passwords: password123):');
        console.log('  ──────────────────────────────────────────────────────────');
        console.log('  Admin:              obsan@rms.com');
        console.log('  Special Employee:   samuel.tolasa@rms.com    (Operations Management)');
        console.log('  Special Employee:   temesgen.a@rms.com       (Resident Affairs)');
        console.log('  Employee:           mekdes.g@rms.com         (Resident Registration)');
        console.log('  Employee:           yonas.t@rms.com          (Complaint Processing)');
        console.log('  Employee:           selamawit.b@rms.com      (Document & Records)');
        console.log('  Employee:           nahom.g@rms.com          (Security Coordination)');
        console.log('  Employee:           fikirte.h@rms.com        (Community Affairs)');
        console.log('  Resident:           abebe.k@rms.com          (A-101)');
        console.log('  Resident:           fatima.m@rms.com         (B-205)');
        console.log('  Resident:           dawit.t@rms.com          (C-312)');
        console.log('  Resident:           tigist.h@rms.com         (A-204)');
        console.log('  Resident:           ramadan.o@rms.com        (B-108)');
        console.log('════════════════════════════════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
};

seed();
