const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            console.log('Admin already exists:', adminExists.email);
            process.exit(0);
        }

        const admin = await User.create({
            name: 'System Admin',
            email: 'shiwangi@gmail.com',
            password: 'Shiwangi123$',
            role: 'admin',
        });

        console.log(`Admin created: ${admin.email} / Shiwangi123$`);
        process.exit(0);
    } catch (error) {
        console.error('Seed failed:', error.message);
        process.exit(1);
    }
};

seedAdmin();
