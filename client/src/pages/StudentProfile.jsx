import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const StudentProfile = () => {
    const { user, loadUser } = useAuth();
    const [formData, setFormData] = useState({
        name: '', bio: '', phone: '', enrollmentYear: '', course: '', interests: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [avatarPreview, setAvatarPreview] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/auth/me');
            const data = res.data;
            setFormData({
                name: data.name || '', bio: data.bio || '', phone: data.phone || '',
                enrollmentYear: data.enrollmentYear || '', course: data.course || '',
                interests: data.interests?.join(', ') || '',
            });
            setAvatarPreview(data.avatar || '');
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setAvatarPreview(URL.createObjectURL(file));
        setUploading(true);
        setMessage('');
        try {
            const fd = new FormData();
            fd.append('avatar', file);
            const res = await api.post('/upload/avatar', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setAvatarPreview(res.data.avatarUrl);
            await loadUser();
            setMessage('✅ Profile photo updated!');
        } catch (err) {
            setMessage(err.response?.data?.message || '❌ Photo upload failed. Configure Cloudinary in server/.env');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            const updateData = {
                ...formData,
                enrollmentYear: formData.enrollmentYear ? Number(formData.enrollmentYear) : undefined,
                interests: formData.interests ? formData.interests.split(',').map(s => s.trim()).filter(Boolean) : [],
            };
            await api.put('/student/profile', updateData);
            await loadUser();
            setMessage('✅ Profile updated successfully!');
        } catch {
            setMessage('❌ Error updating profile');
        } finally {
            setSaving(false);
        }
    };

    const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

    if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

    return (
        <div className="profile-page">
            <div className="profile-container">
                <h1>My Profile</h1>
                <p className="profile-subtitle">Complete your profile to help mentors know you better.</p>

                {message && (
                    <div className={`alert ${message.includes('❌') ? 'alert-error' : 'alert-success'}`}>
                        {message}
                    </div>
                )}

                {/* Avatar Upload */}
                <div className="avatar-upload-section">
                    <div className="avatar-preview" onClick={() => fileInputRef.current?.click()}>
                        {avatarPreview
                            ? <img src={avatarPreview} alt="Profile" className="avatar-img" />
                            : <span className="avatar-initials">{getInitials(formData.name)}</span>
                        }
                        <div className="avatar-overlay">
                            {uploading ? '⏳' : '📷 Change'}
                        </div>
                    </div>
                    <input
                        ref={fileInputRef} type="file" accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleAvatarChange}
                        id="student-avatar-upload"
                    />
                    <div className="avatar-upload-hint">
                        {uploading ? 'Uploading...' : 'Click photo to change'}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="phone">Phone</label>
                            <input type="text" id="phone" name="phone" value={formData.phone} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="course">Course / Program</label>
                            <input type="text" id="course" name="course" value={formData.course} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="enrollmentYear">Enrollment Year</label>
                            <input type="number" id="enrollmentYear" name="enrollmentYear" value={formData.enrollmentYear} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="interests">Interests (comma separated)</label>
                        <input type="text" id="interests" name="interests" value={formData.interests} onChange={handleChange} placeholder="AI, Web Dev, Data Science" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="bio">Bio</label>
                        <textarea id="bio" name="bio" rows="4" value={formData.bio} onChange={handleChange} maxLength={500} placeholder="Tell mentors about yourself..." />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default StudentProfile;
