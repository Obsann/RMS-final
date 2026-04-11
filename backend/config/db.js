const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // 1. Trim the URI to remove any accidental leading/trailing spaces
        const uri = process.env.MONGO_URI ? process.env.MONGO_URI.trim() : '';

        if (!uri) {
            throw new Error("MONGO_URI is missing in environment variables.");
        }

        const options = {
            family: 4, // Force IPv4 to avoid Node 18+ DNS resolution bugs
            serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
        };

        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(uri, options);

        console.log('✅ MongoDB connected successfully');

    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);

        // Detailed hint for the ECONNREFUSED error
        if (error.message.includes('ECONNREFUSED')) {
            console.error('TIP: This is usually a DNS or Firewall issue. Ensure your IP is whitelisted in Atlas.');
        }

        process.exit(1);
    }
};

module.exports = connectDB;