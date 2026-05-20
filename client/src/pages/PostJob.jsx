import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const PostJob = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        company: '',
        location: '',
        type: 'Full-time',
        description: '',
        requirements: '',
        salary: '',
        link: ''
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            await api.post('/jobs', formData);
            navigate('/jobs');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post job');
            setSaving(false);
        }
    };

    return (
        <div className="profile-page">
            <div className="profile-container">
                <h1>Post a Job</h1>
                <p className="profile-subtitle">Share an opportunity with the AlumniConnect network.</p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-group">
                        <label>Job Title *</label>
                        <input type="text" name="title" required value={formData.title} onChange={handleChange} placeholder="e.g. Frontend Developer" />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Company *</label>
                            <input type="text" name="company" required value={formData.company} onChange={handleChange} placeholder="e.g. Google" />
                        </div>
                        <div className="form-group">
                            <label>Location *</label>
                            <input type="text" name="location" required value={formData.location} onChange={handleChange} placeholder="e.g. Remote, Mumbai, etc." />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Job Type *</label>
                            <select name="type" required value={formData.type} onChange={handleChange}>
                                <option value="Full-time">Full-time</option>
                                <option value="Part-time">Part-time</option>
                                <option value="Internship">Internship</option>
                                <option value="Contract">Contract</option>
                                <option value="Freelance">Freelance</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Salary Range (Optional)</label>
                            <input type="text" name="salary" value={formData.salary} onChange={handleChange} placeholder="e.g. ₹10L - ₹15L PA" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Job Description *</label>
                        <textarea name="description" required rows="5" value={formData.description} onChange={handleChange} placeholder="Describe the role and responsibilities..." />
                    </div>

                    <div className="form-group">
                        <label>Requirements *</label>
                        <textarea name="requirements" required rows="4" value={formData.requirements} onChange={handleChange} placeholder="List required skills, experience, etc..." />
                    </div>

                    <div className="form-group">
                        <label>Application Link (Optional)</label>
                        <input type="url" name="link" value={formData.link} onChange={handleChange} placeholder="https://company.com/apply" />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-outline" onClick={() => navigate('/jobs')}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Posting...' : 'Post Job'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PostJob;
