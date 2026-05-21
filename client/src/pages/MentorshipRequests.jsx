import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Link } from 'react-router-dom';

const MentorshipRequests = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [endingRequest, setEndingRequest] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/mentorship/my-requests');
            setRequests(res.data);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, status) => {
        try {
            await api.put(`/mentorship/${id}`, { status });
            fetchRequests();
        } catch (error) {
            alert(error.response?.data?.message || 'Action failed');
        }
    };

    const handleEndMentorship = async () => {
        if (!endingRequest) return;
        try {
            await api.delete(`/mentorship/${endingRequest._id}`);
            setEndingRequest(null);
            fetchRequests();
        } catch (error) {
            alert(error.response?.data?.message || 'Could not end mentorship');
        }
    };

    const getOtherPersonName = (req) => {
        return user?.role === 'student' ? req.alumni?.name : req.student?.name;
    };

    const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

    return (
        <div className="mentorship-page">
            <div className="page-header">
                <h1>{user?.role === 'student' ? 'My Mentorship Requests' : 'Mentorship Requests'}</h1>
                <p>{user?.role === 'student' ? 'Track your mentorship requests' : 'Manage incoming mentorship requests'}</p>
            </div>

            <div className="filter-tabs">
                {['all', 'pending', 'accepted', 'rejected'].map((f) => (
                    <button
                        key={f}
                        className={`tab ${filter === f ? 'tab-active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                        <span className="tab-count">
                            {f === 'all' ? requests.length : requests.filter((r) => r.status === f).length}
                        </span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading-spinner"><div className="spinner"></div></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <p>No {filter === 'all' ? '' : filter} requests found.</p>
                    {user?.role === 'student' && (
                        <Link to="/directory" className="btn btn-primary">Browse Alumni</Link>
                    )}
                </div>
            ) : (
                <div className="request-list">
                    {filtered.map((req) => (
                        <div key={req._id} className="request-card request-card-full">
                            <div className="request-info">
                                <h3>
                                    {user?.role === 'student' ? req.alumni?.name : req.student?.name}
                                </h3>
                                <p className="request-meta">
                                    {user?.role === 'student'
                                        ? `${req.alumni?.jobTitle || ''} at ${req.alumni?.company || 'N/A'}`
                                        : `${req.student?.course || 'N/A'} • Enrolled ${req.student?.enrollmentYear || 'N/A'}`}
                                </p>
                                <p className="request-message">"{req.message}"</p>
                                <p className="request-date">
                                    {new Date(req.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric', month: 'long', day: 'numeric',
                                    })}
                                </p>
                            </div>
                            <div className="request-status-wrap">
                                <span className={`status-badge status-${req.status}`}>{req.status}</span>
                                {req.status === 'pending' && user?.role === 'alumni' && (
                                    <div className="request-actions">
                                        <button onClick={() => handleAction(req._id, 'accepted')} className="btn btn-success btn-sm">
                                            Accept
                                        </button>
                                        <button onClick={() => handleAction(req._id, 'rejected')} className="btn btn-danger btn-sm">
                                            Reject
                                        </button>
                                    </div>
                                )}
                                {req.status === 'accepted' && (
                                    <div className="request-actions">
                                        <Link to={`/chat/${req._id}`} className="btn btn-primary btn-sm">Chat</Link>
                                        <button onClick={() => setEndingRequest(req)} className="btn btn-danger btn-sm">
                                            End
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {endingRequest && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,12,41,0.78)', zIndex: 2000, display: 'grid', placeItems: 'center', padding: '1rem' }}>
                    <div style={{ width: 'min(520px, 100%)', background: '#0f0c29', color: 'white', border: '1px solid rgba(167,139,250,0.35)', borderRadius: '0.75rem', padding: '1.5rem' }}>
                        <h3 style={{ marginTop: 0 }}>End Mentorship?</h3>
                        <p style={{ color: '#d1d5db', lineHeight: 1.6 }}>
                            This will permanently delete your entire conversation history with {getOtherPersonName(endingRequest)}. This cannot be undone.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button className="btn btn-outline" onClick={() => setEndingRequest(null)}>Cancel</button>
                            <button className="btn btn-danger" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={handleEndMentorship}>
                                End Mentorship
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MentorshipRequests;
