import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

const EVENT_TYPES = ['reunion', 'webinar', 'career_fair', 'workshop', 'other'];

const CreateEvent = () => {
    const { id } = useParams(); // if editing
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '', description: '', date: '', time: '',
        venue: '', link: '', type: 'other',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) fetchEvent();
    }, [id]);

    const fetchEvent = async () => {
        try {
            const res = await api.get(`/events/${id}`);
            const ev = res.data;
            setFormData({
                title: ev.title || '',
                description: ev.description || '',
                date: ev.date ? ev.date.slice(0, 10) : '',
                time: ev.time || '',
                venue: ev.venue || '',
                link: ev.link || '',
                type: ev.type || 'other',
            });
        } catch {
            setError('Failed to load event.');
        }
    };

    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            if (id) {
                await api.put(`/events/${id}`, formData);
            } else {
                await api.post('/events', formData);
            }
            navigate('/events');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save event.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="profile-page">
            <div className="profile-container">
                <h1>{id ? 'Edit Event' : 'Create Event'}</h1>
                <p className="profile-subtitle">
                    {id ? 'Update event details.' : 'Add a new event for the community.'}
                </p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-group">
                        <label htmlFor="title">Event Title *</label>
                        <input id="title" name="title" value={formData.title}
                            onChange={handleChange} required placeholder="Annual Alumni Reunion 2026" />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description *</label>
                        <textarea id="description" name="description" rows="4"
                            value={formData.description} onChange={handleChange}
                            required placeholder="What's this event about?" />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="date">Date *</label>
                            <input id="date" name="date" type="date"
                                value={formData.date} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="time">Time</label>
                            <input id="time" name="time" type="text"
                                value={formData.time} onChange={handleChange} placeholder="10:00 AM IST" />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="type">Event Type</label>
                            <select id="type" name="type" value={formData.type} onChange={handleChange}>
                                {EVENT_TYPES.map((t) => (
                                    <option key={t} value={t}>
                                        {t.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="venue">Venue / Location</label>
                            <input id="venue" name="venue" value={formData.venue}
                                onChange={handleChange} placeholder="Auditorium, City, or Online" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="link">Online Join Link (optional)</label>
                        <input id="link" name="link" type="url"
                            value={formData.link} onChange={handleChange}
                            placeholder="https://meet.google.com/..." />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-outline"
                            onClick={() => navigate('/events')}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : id ? 'Update Event' : 'Create Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateEvent;
