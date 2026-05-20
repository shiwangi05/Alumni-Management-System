const nodemailer = require('nodemailer');

// Create transporter - uses Ethereal (free test emails) by default
// To use real Gmail: set EMAIL_HOST=smtp.gmail.com, EMAIL_USER, EMAIL_PASS in .env
const createTransporter = async () => {
    // If real email config provided, use it
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: Number(process.env.EMAIL_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    // Otherwise use Ethereal test account (emails viewable at ethereal.email)
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });
};

/**
 * Send a welcome/registration email
 */
const sendWelcomeEmail = async ({ name, email, role }) => {
    try {
        const transporter = await createTransporter();
        const roleLabel = role === 'alumni' ? 'Alumni' : 'Student';
        const info = await transporter.sendMail({
            from: `"AlumniConnect" <no-reply@alumniconnect.com>`,
            to: email,
            subject: `Welcome to AlumniConnect, ${name}! 🎓`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width:600px; margin:0 auto; background:#0f0c29; color:#fff; border-radius:12px; overflow:hidden;">
                    <div style="background:linear-gradient(135deg,#667eea,#764ba2); padding:40px 30px; text-align:center;">
                        <h1 style="margin:0; font-size:28px;">🎓 AlumniConnect</h1>
                        <p style="margin:8px 0 0; opacity:0.85;">Connecting Alumni & Students</p>
                    </div>
                    <div style="padding:36px 30px;">
                        <h2 style="color:#a78bfa;">Welcome, ${name}!</h2>
                        <p style="color:#c4b5fd; line-height:1.7;">
                            Your <strong>${roleLabel}</strong> account has been created successfully.
                            You're now part of a growing community connecting students with experienced professionals.
                        </p>
                        ${role === 'alumni' ? `
                        <div style="background:rgba(102,126,234,0.15); border-left:4px solid #667eea; padding:16px; border-radius:8px; margin:20px 0;">
                            <p style="margin:0; color:#c4b5fd;">As an <strong>Alumni</strong>, you can:</p>
                            <ul style="color:#a78bfa; margin:8px 0 0; padding-left:20px;">
                                <li>Complete your professional profile</li>
                                <li>Accept mentorship requests from students</li>
                                <li>Post success stories to inspire others</li>
                                <li>Browse upcoming events</li>
                            </ul>
                        </div>` : `
                        <div style="background:rgba(102,126,234,0.15); border-left:4px solid #667eea; padding:16px; border-radius:8px; margin:20px 0;">
                            <p style="margin:0; color:#c4b5fd;">As a <strong>Student</strong>, you can:</p>
                            <ul style="color:#a78bfa; margin:8px 0 0; padding-left:20px;">
                                <li>Browse the alumni directory</li>
                                <li>Send mentorship requests to alumni</li>
                                <li>Read inspiring success stories</li>
                                <li>Register for events</li>
                            </ul>
                        </div>`}
                        <p style="color:#a78bfa; margin-top:24px;">Get started by completing your profile to make the most of AlumniConnect.</p>
                    </div>
                    <div style="background:rgba(255,255,255,0.05); padding:20px 30px; text-align:center; color:#6b7280; font-size:13px;">
                        © 2026 AlumniConnect · MCA Project
                    </div>
                </div>
            `,
        });

        // Log preview URL for Ethereal test emails
        if (!process.env.EMAIL_USER) {
            console.log(`📧 Welcome email preview: ${nodemailer.getTestMessageUrl(info)}`);
        }
    } catch (err) {
        // Email failures should NOT break registration
        console.error('Email send error:', err.message);
    }
};

/**
 * Send mentorship status update email to student
 */
const sendMentorshipStatusEmail = async ({ studentEmail, studentName, alumniName, status }) => {
    try {
        const transporter = await createTransporter();
        const isAccepted = status === 'accepted';
        const info = await transporter.sendMail({
            from: `"AlumniConnect" <no-reply@alumniconnect.com>`,
            to: studentEmail,
            subject: `Mentorship Request ${isAccepted ? 'Accepted ✅' : 'Update'} — AlumniConnect`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width:600px; margin:0 auto; background:#0f0c29; color:#fff; border-radius:12px; overflow:hidden;">
                    <div style="background:linear-gradient(135deg,#667eea,#764ba2); padding:40px 30px; text-align:center;">
                        <h1 style="margin:0; font-size:28px;">🎓 AlumniConnect</h1>
                    </div>
                    <div style="padding:36px 30px;">
                        <h2 style="color:#a78bfa;">Hello, ${studentName}!</h2>
                        ${isAccepted ? `
                        <div style="background:rgba(16,185,129,0.15); border-left:4px solid #10b981; padding:20px; border-radius:8px; margin:16px 0;">
                            <p style="margin:0; color:#6ee7b7; font-size:18px;">🎉 Great news! <strong>${alumniName}</strong> has <strong>accepted</strong> your mentorship request!</p>
                        </div>
                        <p style="color:#c4b5fd; line-height:1.7;">You can now start a conversation with your mentor through the <strong>Messages</strong> section in AlumniConnect.</p>
                        ` : `
                        <div style="background:rgba(239,68,68,0.1); border-left:4px solid #ef4444; padding:20px; border-radius:8px; margin:16px 0;">
                            <p style="margin:0; color:#fca5a5;">Your mentorship request to <strong>${alumniName}</strong> was not accepted this time.</p>
                        </div>
                        <p style="color:#c4b5fd; line-height:1.7;">Don't be discouraged! Browse the alumni directory to find other mentors who match your interests.</p>
                        `}
                    </div>
                    <div style="background:rgba(255,255,255,0.05); padding:20px 30px; text-align:center; color:#6b7280; font-size:13px;">
                        © 2026 AlumniConnect · MCA Project
                    </div>
                </div>
            `,
        });
        if (!process.env.EMAIL_USER) {
            console.log(`📧 Mentorship email preview: ${nodemailer.getTestMessageUrl(info)}`);
        }
    } catch (err) {
        console.error('Email send error:', err.message);
    }
};

/**
 * Send event RSVP confirmation email
 */
const sendEventRsvpEmail = async ({ userEmail, userName, eventTitle, eventDate, eventVenue }) => {
    try {
        const transporter = await createTransporter();
        const formattedDate = new Date(eventDate).toLocaleDateString('en-IN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });
        const info = await transporter.sendMail({
            from: `"AlumniConnect" <no-reply@alumniconnect.com>`,
            to: userEmail,
            subject: `RSVP Confirmed: ${eventTitle} 📅`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width:600px; margin:0 auto; background:#0f0c29; color:#fff; border-radius:12px; overflow:hidden;">
                    <div style="background:linear-gradient(135deg,#667eea,#764ba2); padding:40px 30px; text-align:center;">
                        <h1 style="margin:0; font-size:28px;">🎓 AlumniConnect</h1>
                    </div>
                    <div style="padding:36px 30px;">
                        <h2 style="color:#a78bfa;">You're going, ${userName}! 🎉</h2>
                        <p style="color:#c4b5fd;">Your RSVP has been confirmed for:</p>
                        <div style="background:rgba(102,126,234,0.15); border:1px solid rgba(102,126,234,0.3); padding:20px; border-radius:10px; margin:16px 0;">
                            <h3 style="margin:0 0 12px; color:#fff; font-size:20px;">${eventTitle}</h3>
                            <p style="margin:4px 0; color:#a78bfa;">📅 ${formattedDate}</p>
                            ${eventVenue ? `<p style="margin:4px 0; color:#a78bfa;">📍 ${eventVenue}</p>` : ''}
                        </div>
                        <p style="color:#9ca3af; font-size:13px; margin-top:20px;">We look forward to seeing you there!</p>
                    </div>
                    <div style="background:rgba(255,255,255,0.05); padding:20px 30px; text-align:center; color:#6b7280; font-size:13px;">
                        © 2026 AlumniConnect · MCA Project
                    </div>
                </div>
            `,
        });
        if (!process.env.EMAIL_USER) {
            console.log(`📧 RSVP email preview: ${nodemailer.getTestMessageUrl(info)}`);
        }
    } catch (err) {
        console.error('Email send error:', err.message);
    }
};

module.exports = { sendWelcomeEmail, sendMentorshipStatusEmail, sendEventRsvpEmail };
