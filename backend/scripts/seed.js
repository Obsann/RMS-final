/**
 * Seed script — populates the database with example data for all roles.
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

        // ── Hash password (shared) ─────────────────────────────────
        const hashedPassword = await bcrypt.hash('password123', 12);

        // ── Create Users ───────────────────────────────────────────
        const usersData = [
            // Admin
            {
                username: 'obsan.habtamu',
                email: 'obsan@rms.com',
                password: hashedPassword,
                phone: '+251 911 000 001',
                role: 'admin',
                status: 'approved',
                unit: '',
                jobCategory: '',
            },
            // Special Employees
            {
                username: 'samuel.tolasa',
                email: 'samuel.tolasa@rms.com',
                password: hashedPassword,
                phone: '+251 911 000 010',
                role: 'special-employee',
                status: 'approved',
                unit: '',
                jobCategory: 'Management',
            },
            {
                username: 'temesgen.alemu',
                email: 'temesgen.a@rms.com',
                password: hashedPassword,
                phone: '+251 911 000 011',
                role: 'special-employee',
                status: 'approved',
                unit: '',
                jobCategory: 'Management',
            },
            // Employees
            {
                username: 'samuel.fayisa',
                email: 'samuel.f@rms.com',
                password: hashedPassword,
                phone: '+251 911 111 001',
                role: 'employee',
                status: 'approved',
                unit: '',
                jobCategory: 'Plumbing',
            },
            {
                username: 'tesfaye.alemu',
                email: 'tesfaye.a@rms.com',
                password: hashedPassword,
                phone: '+251 911 111 002',
                role: 'employee',
                status: 'approved',
                unit: '',
                jobCategory: 'Electrical',
            },
            {
                username: 'biruk.woldemariam',
                email: 'biruk.w@rms.com',
                password: hashedPassword,
                phone: '+251 911 111 003',
                role: 'employee',
                status: 'approved',
                unit: '',
                jobCategory: 'General Maintenance',
            },
            {
                username: 'mekonnen.desta',
                email: 'mekonnen.d@rms.com',
                password: hashedPassword,
                phone: '+251 911 111 004',
                role: 'employee',
                status: 'approved',
                unit: '',
                jobCategory: 'Carpentry',
            },
            {
                username: 'hana.worku',
                email: 'hana.w@rms.com',
                password: hashedPassword,
                phone: '+251 911 111 005',
                role: 'employee',
                status: 'approved',
                unit: '',
                jobCategory: 'Cleaning',
            },
            // Residents
            {
                username: 'abebe.kebede',
                email: 'abebe.k@rms.com',
                password: hashedPassword,
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
                password: hashedPassword,
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
                password: hashedPassword,
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
                password: hashedPassword,
                phone: '+251 944 567 890',
                role: 'resident',
                status: 'approved',
                unit: 'A-204',
            },
            {
                username: 'ramadan.oumer',
                email: 'ramadan.o@rms.com',
                password: hashedPassword,
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
        createdUsers.forEach((user) => {
            u[user.email] = user;
        });

        // ── Seed Requests ──────────────────────────────────────────
        const requests = [
            {
                type: 'maintenance', resident: u['abebe.k@rms.com']._id, unit: 'A-101',
                category: 'Plumbing', subject: 'No water supply since morning',
                description: 'Water has been cut off in Block A since 6 AM. Multiple residents affected.',
                status: 'pending', priority: 'high',
            },
            {
                type: 'complaint', resident: u['fatima.m@rms.com']._id, unit: 'B-205',
                category: 'Electrical', subject: 'Streetlight outage on Block B road',
                description: 'Three streetlights near Block B have been out for two nights. Safety concern.',
                status: 'in-progress', priority: 'high',
                response: { message: 'Assigned to electrician', respondedBy: u['samuel.tolasa@rms.com']._id, respondedAt: new Date() },
            },
            {
                type: 'complaint', resident: u['dawit.t@rms.com']._id, unit: 'C-312',
                category: 'General', subject: 'Loud construction noise during rest hours',
                description: 'Construction work continues past 10 PM, disturbing residents.',
                status: 'pending', priority: 'medium',
            },
            {
                type: 'maintenance', resident: u['tigist.h@rms.com']._id, unit: 'A-204',
                category: 'Plumbing', subject: 'Sewage overflow near Block A entrance',
                description: 'Sewage from the main drain is overflowing. Health hazard.',
                status: 'completed', priority: 'high', resolvedAt: new Date(),
                response: { message: 'Drain cleared and sanitized', respondedBy: u['samuel.f@rms.com']._id, respondedAt: new Date() },
            },
            {
                type: 'complaint', resident: u['ramadan.o@rms.com']._id, unit: 'B-108',
                category: 'General', subject: 'Garbage not collected for 4 days',
                description: 'Waste collection truck has not visited Block B for four days.',
                status: 'pending', priority: 'medium',
            },
            {
                type: 'maintenance', resident: u['abebe.k@rms.com']._id, unit: 'A-101',
                category: 'Security', subject: 'Suspicious activity near parking area',
                description: 'Unknown individuals seen near Block A parking lot late at night.',
                status: 'in-progress', priority: 'urgent',
                response: { message: 'Security patrol increased', respondedBy: u['samuel.tolasa@rms.com']._id, respondedAt: new Date() },
            },
            {
                type: 'certificate', resident: u['fatima.m@rms.com']._id, unit: 'B-205',
                category: 'Administrative', subject: 'Address confirmation letter needed',
                description: 'Need official address confirmation letter for bank account opening.',
                status: 'pending', priority: 'low',
            },
        ];

        const createdRequests = await Request.create(requests);
        console.log(`📋 Created ${createdRequests.length} requests/complaints`);

        // ── Seed Jobs ──────────────────────────────────────────────
        const jobs = [
            {
                title: 'Fix water main – Block A', description: 'Diagnose and repair water supply issue affecting all of Block A.',
                category: 'Plumbing', priority: 'high', status: 'assigned',
                unit: 'A-101', location: 'Block A main pipe',
                sourceRequest: createdRequests[0]._id,
                assignedTo: u['samuel.f@rms.com']._id, assignedBy: u['samuel.tolasa@rms.com']._id,
                assignedAt: new Date(), dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                createdBy: u['samuel.tolasa@rms.com']._id,
            },
            {
                title: 'Repair streetlights – Block B road', description: 'Replace bulbs on three broken streetlights.',
                category: 'Electrical', priority: 'high', status: 'in-progress',
                unit: 'B-205', location: 'Block B main road',
                sourceRequest: createdRequests[1]._id,
                assignedTo: u['tesfaye.a@rms.com']._id, assignedBy: u['samuel.tolasa@rms.com']._id,
                assignedAt: new Date(), dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
                createdBy: u['samuel.tolasa@rms.com']._id,
            },
            {
                title: 'Security patrol – Block A parking', description: 'Increase night patrol near Block A parking area.',
                category: 'Security', priority: 'urgent', status: 'assigned',
                unit: 'A-101', location: 'Block A parking lot',
                sourceRequest: createdRequests[5]._id,
                assignedTo: u['biruk.w@rms.com']._id, assignedBy: u['temesgen.a@rms.com']._id,
                assignedAt: new Date(), dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000),
                createdBy: u['temesgen.a@rms.com']._id,
            },
            {
                title: 'General clean-up – Community park', description: 'Weekly deep cleaning of the community park and play area.',
                category: 'Cleaning', priority: 'medium', status: 'completed',
                location: 'Community park',
                assignedTo: u['hana.w@rms.com']._id, assignedBy: u['temesgen.a@rms.com']._id,
                assignedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                completionNotes: 'Park cleaned, broken bench flagged for carpentry repair.',
                createdBy: u['temesgen.a@rms.com']._id,
            },
        ];

        // Link first request to its job
        await Request.findByIdAndUpdate(createdRequests[0]._id, { job: null }); // will set after
        const createdJobs = await Job.create(jobs);
        await Request.findByIdAndUpdate(createdRequests[0]._id, { job: createdJobs[0]._id });
        await Request.findByIdAndUpdate(createdRequests[1]._id, { job: createdJobs[1]._id });
        await Request.findByIdAndUpdate(createdRequests[5]._id, { job: createdJobs[2]._id });
        console.log(`🔧 Created ${createdJobs.length} jobs`);

        // ── Seed Notifications ─────────────────────────────────────
        const notifications = [
            // Admin
            { userId: u['obsan@rms.com']._id, type: 'status_update', title: 'Urgent: Water supply outage – Block A', message: 'Abebe Kebede reported a water supply outage affecting Block A since 6 AM.', readStatus: false },
            { userId: u['obsan@rms.com']._id, type: 'request_update', title: 'New certificate request from Fatima Mohammed', message: 'Fatima Mohammed (B-205) requested an address confirmation letter.', readStatus: false },
            { userId: u['obsan@rms.com']._id, type: 'system', title: 'New resident registered', message: 'Ramadan Oumer has registered as a new resident in Unit B-108.', readStatus: true },
            { userId: u['obsan@rms.com']._id, type: 'job_update', title: 'Job completed: Community park cleanup', message: 'Hana Worku completed the weekly park cleanup. Ready for verification.', readStatus: true },

            // Special Employee - Samuel Tolasa
            { userId: u['samuel.tolasa@rms.com']._id, type: 'request_update', title: 'New complaint assigned to you', message: 'Admin assigned you the streetlight outage complaint from Block B.', readStatus: false },
            { userId: u['samuel.tolasa@rms.com']._id, type: 'job_update', title: 'Job completed: Park cleanup by Hana Worku', message: 'Employee Hana Worku has marked the park cleanup task as completed.', readStatus: true },
            { userId: u['samuel.tolasa@rms.com']._id, type: 'system', title: '3 requests pending over 48 hours', message: 'There are 3 community requests that have been pending for more than 48 hours.', readStatus: false },

            // Employee - Samuel Fayisa
            { userId: u['samuel.f@rms.com']._id, type: 'job_update', title: 'New task: Fix water main – Block A', message: 'You have been assigned to fix the water main pipe in Block A. High priority.', readStatus: false },
            { userId: u['samuel.f@rms.com']._id, type: 'system', title: 'Team meeting – Monday 9:00 AM', message: 'Mandatory briefing on Monday at 9 AM.', readStatus: true },

            // Employee - Tesfaye Alemu
            { userId: u['tesfaye.a@rms.com']._id, type: 'job_update', title: 'New task: Repair streetlights – Block B', message: 'Assigned: repair three broken streetlights on Block B road.', readStatus: false },

            // Resident - Abebe
            { userId: u['abebe.k@rms.com']._id, type: 'request_update', title: 'Your request is being processed', message: 'Your water supply issue has been assigned to a plumber.', readStatus: false },
            { userId: u['abebe.k@rms.com']._id, type: 'status_update', title: 'Security patrol increased', message: 'Your security concern has been addressed. Night patrols increased.', readStatus: true },

            // Resident - Ramadan
            { userId: u['ramadan.o@rms.com']._id, type: 'account_update', title: 'Welcome to RMS Kebele', message: 'Your account has been approved. You can now submit requests and manage your profile.', readStatus: false },
        ];

        const createdNotifications = await Notification.create(notifications);
        console.log(`🔔 Created ${createdNotifications.length} notifications`);

        // ── Seed Digital IDs ───────────────────────────────────────
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

        // ── Seed Households ────────────────────────────────────────
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

        // ── Summary ──────────────────────────────────────────────
        console.log('\n════════════════════════════════════════════════════════════');
        console.log('  ✅ Database seeded successfully!');
        console.log('════════════════════════════════════════════════════════════');
        console.log('\n  Login credentials (all passwords: password123):');
        console.log('  ──────────────────────────────────────────────────────────');
        console.log('  Admin:              obsan@rms.com');
        console.log('  Special Employee:   samuel.tolasa@rms.com');
        console.log('  Special Employee:   temesgen.a@rms.com');
        console.log('  Employee:           samuel.f@rms.com    (Plumbing)');
        console.log('  Employee:           tesfaye.a@rms.com   (Electrical)');
        console.log('  Employee:           biruk.w@rms.com     (General Maintenance)');
        console.log('  Employee:           mekonnen.d@rms.com  (Carpentry)');
        console.log('  Employee:           hana.w@rms.com      (Cleaning)');
        console.log('  Resident:           abebe.k@rms.com     (A-101)');
        console.log('  Resident:           fatima.m@rms.com    (B-205)');
        console.log('  Resident:           dawit.t@rms.com     (C-312)');
        console.log('  Resident:           tigist.h@rms.com    (A-204)');
        console.log('  Resident:           ramadan.o@rms.com   (B-108)');
        console.log('════════════════════════════════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
};

seed();
