import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Link } from 'react-router-dom';

const MentorshipRequests = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

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
                                    <Link to={`/chat/${req._id}`} className="btn btn-primary btn-sm">Chat</Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MentorshipRequests;
