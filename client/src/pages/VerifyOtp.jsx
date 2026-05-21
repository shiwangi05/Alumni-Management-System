import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const VerifyOtp = () => {
    const { verifyOtp, resendOtp } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const inputsRef = useRef([]);
    const userId = location.state?.userId || sessionStorage.getItem('pendingVerificationUserId');
    const email = location.state?.email || sessionStorage.getItem('pendingVerificationEmail');
    const [digits, setDigits] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendSeconds, setResendSeconds] = useState(60);
    const [expiresSeconds, setExpiresSeconds] = useState(15 * 60);

    useEffect(() => {
        if (!userId) {
            navigate('/register');
            return;
        }
        if (location.state?.userId) sessionStorage.setItem('pendingVerificationUserId', location.state.userId);
        if (location.state?.email) sessionStorage.setItem('pendingVerificationEmail', location.state.email);
        inputsRef.current[0]?.focus();
    }, [userId, location.state, navigate]);

    useEffect(() => {
        const timer = setInterval(() => {
            setResendSeconds((seconds) => Math.max(0, seconds - 1));
            setExpiresSeconds((seconds) => Math.max(0, seconds - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const redirectByRole = (role) => {
        if (role === 'admin') navigate('/admin/dashboard');
        else if (role === 'alumni') navigate('/alumni/dashboard');
        else navigate('/student/dashboard');
    };

    const handleDigitChange = (index, value) => {
        const digit = value.replace(/\D/g, '').slice(-1);
        const next = [...digits];
        next[index] = digit;
        setDigits(next);
        if (digit && index < 5) inputsRef.current[index + 1]?.focus();
    };

    const handleKeyDown = (index, event) => {
        if (event.key === 'Backspace' && !digits[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const handleVerify = async (event) => {
        event.preventDefault();
        setError('');
        setMessage('');
        const otp = digits.join('');
        if (otp.length !== 6) {
            setError('Enter the 6-digit OTP');
            return;
        }

        setLoading(true);
        try {
            const user = await verifyOtp(userId, otp);
            sessionStorage.removeItem('pendingVerificationUserId');
            sessionStorage.removeItem('pendingVerificationEmail');
            redirectByRole(user.role);
        } catch (err) {
            setError(err.response?.data?.message || 'OTP verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendSeconds > 0) return;
        setError('');
        setMessage('');
        try {
            await resendOtp(userId);
            setDigits(['', '', '', '', '', '']);
            setResendSeconds(60);
            setExpiresSeconds(15 * 60);
            setMessage('A new OTP has been sent.');
            inputsRef.current[0]?.focus();
        } catch (err) {
            setError(err.response?.data?.message || 'Could not resend OTP');
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <span className="auth-icon">OTP</span>
                    <h1>Verify Email</h1>
                    <p>Enter the code sent to {email || 'your email'}</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {message && <div className="alert alert-success">{message}</div>}

                <form onSubmit={handleVerify} className="auth-form">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem' }}>
                        {digits.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => { inputsRef.current[index] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength="1"
                                value={digit}
                                onChange={(event) => handleDigitChange(index, event.target.value)}
                                onKeyDown={(event) => handleKeyDown(index, event)}
                                style={{ textAlign: 'center', fontSize: '1.4rem', fontWeight: 700 }}
                            />
                        ))}
                    </div>

                    <p style={{ textAlign: 'center', color: '#a78bfa', margin: '0.25rem 0 0' }}>
                        OTP expires in {formatTime(expiresSeconds)}
                    </p>

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? 'Verifying...' : 'Verify'}
                    </button>
                </form>

                <p className="auth-footer">
                    {resendSeconds > 0 ? (
                        <span>Resend OTP in {resendSeconds}s</span>
                    ) : (
                        <button type="button" onClick={handleResend} style={{ background: 'none', border: 0, color: '#a78bfa', cursor: 'pointer', fontWeight: 700 }}>
                            Resend OTP
                        </button>
                    )}
                </p>
                <p className="auth-footer"><Link to="/login">Back to login</Link></p>
            </div>
        </div>
    );
};

export default VerifyOtp;
