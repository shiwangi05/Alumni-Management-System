import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const CATEGORIES = ['career', 'achievement', 'entrepreneurship', 'education', 'general'];

const PostStory = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ title: '', content: '', category: 'career' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await api.post('/stories', formData);
            navigate('/stories');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post story.');
            setSaving(false);
        }
    };

    return (
        <div className="profile-page">
            <div className="profile-container">
                <h1>✍️ Share Your Story</h1>
                <p className="profile-subtitle">Inspire students and fellow alumni with your journey.</p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-group">
                        <label htmlFor="story-title">Story Title *</label>
                        <input id="story-title" name="title" value={formData.title}
                            onChange={handleChange} required
                            placeholder="How I landed my first tech job..." />
                    </div>

                    <div className="form-group">
                        <label htmlFor="story-category">Category</label>
                        <select id="story-category" name="category" value={formData.category} onChange={handleChange}>
                            {CATEGORIES.map(c => (
                                <option key={c} value={c}>
                                    {c.charAt(0).toUpperCase() + c.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="story-content">Your Story *</label>
                        <textarea id="story-content" name="content" rows="10"
                            value={formData.content} onChange={handleChange}
                            required maxLength={3000}
                            placeholder="Share your experience, what you learned, the challenges you faced, and advice for current students..." />
                        <small style={{ color: '#6b7280' }}>{formData.content.length}/3000 characters</small>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-outline" onClick={() => navigate('/stories')}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Publishing...' : '🚀 Publish Story'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PostStory;
