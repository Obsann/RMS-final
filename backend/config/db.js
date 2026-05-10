const mongoose = require('mongoose');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI?.trim();

        if (!uri) {
            throw new Error("MONGO_URI is missing in environment variables.");
        }

        console.log('Connecting to MongoDB Atlas...');

        await mongoose.connect(uri, {
            family: 4,
            serverSelectionTimeoutMS: 30000,
        });

        console.log('✅ MongoDB connected successfully');

    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);

        if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
            console.error('TIP: Check Atlas IP whitelist + internet connection + DNS resolution');
        }

        process.exit(1);
    }
};

module.exports = connectDB;