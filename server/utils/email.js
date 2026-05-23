const nodemailer = require('nodemailer');

// Uses configured SMTP credentials when available, otherwise falls back to Ethereal test mail.
const createTransporter = async () => {
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

const renderShell = ({ title, subtitle, body }) => `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width:600px; margin:0 auto; background:#0f0c29; color:#fff; border-radius:12px; overflow:hidden;">
        <div style="background:linear-gradient(135deg,#667eea,#764ba2); padding:40px 30px; text-align:center;">
            <h1 style="margin:0; font-size:28px;">${title}</h1>
            ${subtitle ? `<p style="margin:8px 0 0; opacity:0.85;">${subtitle}</p>` : ''}
        </div>
        <div style="padding:36px 30px;">
            ${body}
        </div>
        <div style="background:rgba(255,255,255,0.05); padding:20px 30px; text-align:center; color:#9ca3af; font-size:13px;">
            Copyright 2026 AlumniConnect - MCA Project
        </div>
    </div>
`;

const sendWelcomeEmail = async ({ name, email, role }) => {
    try {
        const transporter = await createTransporter();
        const roleLabel = role === 'alumni' ? 'Alumni' : 'Student';
        const actions = role === 'alumni'
            ? ['Complete your professional profile', 'Accept mentorship requests from students', 'Post success stories', 'Browse upcoming events']
            : ['Browse the alumni directory', 'Send mentorship requests to alumni', 'Read success stories', 'Register for events'];

        const info = await transporter.sendMail({
            from: `"AlumniConnect" <no-reply@alumniconnect.com>`,
            to: email,
            subject: `Welcome to AlumniConnect, ${name}!`,
            html: renderShell({
                title: 'AlumniConnect',
                subtitle: 'Connecting Alumni and Students',
                body: `
                    <h2 style="color:#a78bfa;">Welcome, ${name}!</h2>
                    <p style="color:#c4b5fd; line-height:1.7;">
                        Your <strong>${roleLabel}</strong> account has been created successfully.
                        You are now part of a growing community connecting students with experienced professionals.
                    </p>
                    <div style="background:rgba(102,126,234,0.15); border-left:4px solid #667eea; padding:16px; border-radius:8px; margin:20px 0;">
                        <p style="margin:0; color:#c4b5fd;">As a <strong>${roleLabel}</strong>, you can:</p>
                        <ul style="color:#a78bfa; margin:8px 0 0; padding-left:20px;">
                            ${actions.map((action) => `<li>${action}</li>`).join('')}
                        </ul>
                    </div>
                    <p style="color:#a78bfa; margin-top:24px;">Get started by completing your profile.</p>
                `,
            }),
        });

        if (!process.env.EMAIL_USER) {
            console.log(`Welcome email preview: ${nodemailer.getTestMessageUrl(info)}`);
        }
    } catch (err) {
        console.error('Email send error:', err.message);
    }
};

const sendMentorshipStatusEmail = async ({ studentEmail, studentName, alumniName, status }) => {
    try {
        const transporter = await createTransporter();
        const isAccepted = status === 'accepted';
        const info = await transporter.sendMail({
            from: `"AlumniConnect" <no-reply@alumniconnect.com>`,
            to: studentEmail,
            subject: `Mentorship Request ${isAccepted ? 'Accepted' : 'Updated'} - AlumniConnect`,
            html: renderShell({
                title: 'AlumniConnect',
                subtitle: 'Mentorship update',
                body: isAccepted ? `
                    <h2 style="color:#a78bfa;">Hello, ${studentName}!</h2>
                    <div style="background:rgba(16,185,129,0.15); border-left:4px solid #10b981; padding:20px; border-radius:8px; margin:16px 0;">
                        <p style="margin:0; color:#6ee7b7; font-size:18px;"><strong>${alumniName}</strong> accepted your mentorship request.</p>
                    </div>
                    <p style="color:#c4b5fd; line-height:1.7;">You can now start a conversation through the Messages section in AlumniConnect.</p>
                ` : `
                    <h2 style="color:#a78bfa;">Hello, ${studentName}!</h2>
                    <div style="background:rgba(239,68,68,0.1); border-left:4px solid #ef4444; padding:20px; border-radius:8px; margin:16px 0;">
                        <p style="margin:0; color:#fca5a5;">Your mentorship request to <strong>${alumniName}</strong> was not accepted this time.</p>
                    </div>
                    <p style="color:#c4b5fd; line-height:1.7;">Browse the alumni directory to find other mentors who match your interests.</p>
                `,
            }),
        });

        if (!process.env.EMAIL_USER) {
            console.log(`Mentorship email preview: ${nodemailer.getTestMessageUrl(info)}`);
        }
    } catch (err) {
        console.error('Email send error:', err.message);
    }
};

const sendEventRsvpEmail = async ({ userEmail, userName, eventTitle, eventDate, eventVenue }) => {
    try {
        const transporter = await createTransporter();
        const formattedDate = new Date(eventDate).toLocaleDateString('en-IN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });
        const info = await transporter.sendMail({
            from: `"AlumniConnect" <no-reply@alumniconnect.com>`,
            to: userEmail,
            subject: `RSVP Confirmed: ${eventTitle}`,
            html: renderShell({
                title: 'AlumniConnect',
                subtitle: 'Event RSVP confirmed',
                body: `
                    <h2 style="color:#a78bfa;">You are going, ${userName}!</h2>
                    <p style="color:#c4b5fd;">Your RSVP has been confirmed for:</p>
                    <div style="background:rgba(102,126,234,0.15); border:1px solid rgba(102,126,234,0.3); padding:20px; border-radius:10px; margin:16px 0;">
                        <h3 style="margin:0 0 12px; color:#fff; font-size:20px;">${eventTitle}</h3>
                        <p style="margin:4px 0; color:#a78bfa;">Date: ${formattedDate}</p>
                        ${eventVenue ? `<p style="margin:4px 0; color:#a78bfa;">Venue: ${eventVenue}</p>` : ''}
                    </div>
                    <p style="color:#9ca3af; font-size:13px; margin-top:20px;">We look forward to seeing you there.</p>
                `,
            }),
        });

        if (!process.env.EMAIL_USER) {
            console.log(`RSVP email preview: ${nodemailer.getTestMessageUrl(info)}`);
        }
    } catch (err) {
        console.error('Email send error:', err.message);
    }
};

module.exports = { sendWelcomeEmail, sendMentorshipStatusEmail, sendEventRsvpEmail };
