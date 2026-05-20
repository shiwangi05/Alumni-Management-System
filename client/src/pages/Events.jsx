import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const EVENT_TYPES = {
    reunion: { label: 'Reunion', icon: '🎉' },
    webinar: { label: 'Webinar', icon: '💻' },
    career_fair: { label: 'Career Fair', icon: '💼' },
    workshop: { label: 'Workshop', icon: '🛠️' },
    other: { label: 'Other', icon: '📅' },
};

const Events = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [filter, setFilter] = useState('upcoming');
    const [loading, setLoading] = useState(true);
    const [rsvpLoading, setRsvpLoading] = useState({});
    const [toast, setToast] = useState('');

    useEffect(() => {
        fetchEvents();
    }, [filter]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/events?filter=${filter}`);
            setEvents(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const handleRsvp = async (eventId) => {
        setRsvpLoading((prev) => ({ ...prev, [eventId]: true }));
        try {
            const res = await api.post(`/events/${eventId}/rsvp`);
            setEvents((prev) =>
                prev.map((ev) =>
                    ev._id === eventId
                        ? { ...ev, hasRsvped: res.data.hasRsvped, rsvpCount: res.data.rsvpCount }
                        : ev
                )
            );
            showToast(res.data.hasRsvped ? '✅ RSVP confirmed! Check your email.' : 'RSVP cancelled.');
        } catch (err) {
            showToast('❌ Failed. Please try again.');
        } finally {
            setRsvpLoading((prev) => ({ ...prev, [eventId]: false }));
        }
    };

    const handleDelete = async (eventId) => {
        if (!confirm('Delete this event?')) return;
        try {
            await api.delete(`/events/${eventId}`);
            setEvents((prev) => prev.filter((ev) => ev._id !== eventId));
            showToast('Event deleted.');
        } catch {
            showToast('❌ Failed to delete.');
        }
    };

    const formatDate = (d) =>
        new Date(d).toLocaleDateString('en-IN', {
            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
        });

    const isPast = (d) => new Date(d) < new Date();

    return (
        <div className="events-page">
            {toast && <div className="toast-notification">{toast}</div>}

            <div className="page-hero">
                <h1>📅 Events</h1>
                <p>Reunions, webinars, career fairs — stay connected with the AlumniConnect community.</p>
                {user?.role === 'admin' && (
                    <Link to="/events/create" className="btn btn-primary">+ Create Event</Link>
                )}
            </div>

            <div className="filter-tabs">
                {['upcoming', 'past', ''].map((f) => (
                    <button
                        key={f}
                        className={`filter-tab ${filter === f ? 'active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f === '' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading-spinner"><div className="spinner"></div></div>
            ) : events.length === 0 ? (
                <div className="empty-state">
                    <span style={{ fontSize: '3rem' }}>📭</span>
                    <p>No {filter} events found.</p>
                    {user?.role === 'admin' && (
                        <Link to="/events/create" className="btn btn-primary">Create the first one</Link>
                    )}
                </div>
            ) : (
                <div className="events-grid">
                    {events.map((ev) => {
                        const type = EVENT_TYPES[ev.type] || EVENT_TYPES.other;
                        const past = isPast(ev.date);
                        return (
                            <div key={ev._id} className={`event-card ${past ? 'event-past' : ''} ${ev.hasRsvped ? 'event-rsvped' : ''}`}>
                                <div className="event-card-header">
                                    <span className="event-type-badge">
                                        {type.icon} {type.label}
                                    </span>
                                    {ev.isFeatured && <span className="featured-badge">⭐ Featured</span>}
                                    {ev.hasRsvped && !past && <span className="going-badge">✓ Going</span>}
                                </div>

                                <h3 className="event-title">{ev.title}</h3>
                                <p className="event-description">{ev.description}</p>

                                <div className="event-meta">
                                    <div className="event-meta-item">
                                        <span>📅</span>
                                        <span>{formatDate(ev.date)}{ev.time ? ` · ${ev.time}` : ''}</span>
                                    </div>
                                    {ev.venue && (
                                        <div className="event-meta-item">
                                            <span>📍</span><span>{ev.venue}</span>
                                        </div>
                                    )}
                                    {ev.link && (
                                        <div className="event-meta-item">
                                            <span>🔗</span>
                                            <a href={ev.link} target="_blank" rel="noopener noreferrer" className="event-link">
                                                Join Online
                                            </a>
                                        </div>
                                    )}
                                    <div className="event-meta-item">
                                        <span>👥</span><span>{ev.rsvpCount || 0} attending</span>
                                    </div>
                                </div>

                                <div className="event-card-footer">
                                    {!past && (
                                        <button
                                            id={`rsvp-btn-${ev._id}`}
                                            className={`btn btn-sm ${ev.hasRsvped ? 'btn-outline' : 'btn-primary'}`}
                                            onClick={() => handleRsvp(ev._id)}
                                            disabled={rsvpLoading[ev._id]}
                                        >
                                            {rsvpLoading[ev._id]
                                                ? '...'
                                                : ev.hasRsvped
                                                    ? 'Cancel RSVP'
                                                    : 'RSVP Now'}
                                        </button>
                                    )}
                                    {past && <span className="past-label">Event Ended</span>}
                                    {user?.role === 'admin' && (
                                        <div className="admin-actions">
                                            <Link to={`/events/edit/${ev._id}`} className="btn btn-outline btn-sm">Edit</Link>
                                            <button onClick={() => handleDelete(ev._id)} className="btn btn-danger btn-sm">Delete</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Events;
