const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');

const seedAdmin = async () => {
    try {
        const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, MONGO_URI } = process.env;

        if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
            throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
        }

        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            console.log('Admin already exists:', adminExists.email);
            process.exit(0);
        }

        const admin = await User.create({
            name: ADMIN_NAME || 'System Admin',
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            role: 'admin',
        });

        console.log(`Admin created: ${admin.email}`);
        process.exit(0);
    } catch (error) {
        console.error('Seed failed:', error.message);
        process.exit(1);
    }
};

seedAdmin();
