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
            adminExists.name = ADMIN_NAME || adminExists.name || 'System Admin';
            adminExists.email = ADMIN_EMAIL;
            adminExists.password = ADMIN_PASSWORD;
            adminExists.isVerified = true;
            adminExists.verificationOTP = undefined;
            adminExists.verificationOTPExpires = undefined;
            adminExists.verificationOTPSentAt = undefined;
            await adminExists.save();

            console.log(`Admin updated: ${adminExists.email}`);
            process.exit(0);
        }

        const admin = await User.create({
            name: ADMIN_NAME || 'System Admin',
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            role: 'admin',
            isVerified: true,
        });

        console.log(`Admin created: ${admin.email}`);
        process.exit(0);
    } catch (error) {
        console.error('Seed failed:', error.message);
        process.exit(1);
    }
};

seedAdmin();
