import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const AlumniProfile = () => {
    const { user, loadUser } = useAuth();
    const [formData, setFormData] = useState({
        name: '', bio: '', phone: '', graduationYear: '',
        company: '', jobTitle: '', industry: '', skills: '', linkedin: '',
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
                graduationYear: data.graduationYear || '', company: data.company || '',
                jobTitle: data.jobTitle || '', industry: data.industry || '',
                skills: data.skills?.join(', ') || '', linkedin: data.linkedin || '',
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
        // Show local preview immediately
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
            setMessage(err.response?.data?.message || '❌ Photo upload failed. Please configure Cloudinary in server/.env');
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
                graduationYear: formData.graduationYear ? Number(formData.graduationYear) : undefined,
                skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
            };
            await api.put('/alumni/profile', updateData);
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
                <p className="profile-subtitle">Keep your profile updated to connect with students.</p>

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
                        id="avatar-upload-input"
                    />
                    <div className="avatar-upload-hint">
                        {uploading ? 'Uploading...' : 'Click photo to change'}
                        <span style={{ color: '#f59e0b', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                            (Requires Cloudinary set up in server/.env)
                        </span>
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
                            <label htmlFor="company">Company</label>
                            <input type="text" id="company" name="company" value={formData.company} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="jobTitle">Job Title</label>
                            <input type="text" id="jobTitle" name="jobTitle" value={formData.jobTitle} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="industry">Industry</label>
                            <input type="text" id="industry" name="industry" value={formData.industry} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="graduationYear">Graduation Year</label>
                            <input type="number" id="graduationYear" name="graduationYear" value={formData.graduationYear} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="skills">Skills (comma separated)</label>
                        <input type="text" id="skills" name="skills" value={formData.skills} onChange={handleChange} placeholder="React, Node.js, Python" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="linkedin">LinkedIn URL</label>
                        <input type="text" id="linkedin" name="linkedin" value={formData.linkedin} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="bio">Bio</label>
                        <textarea id="bio" name="bio" rows="4" value={formData.bio} onChange={handleChange} maxLength={500} placeholder="Tell students about yourself..." />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AlumniProfile;
