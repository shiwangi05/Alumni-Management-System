import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Link } from 'react-router-dom';

const StudentDashboard = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const pendingCount = requests.filter((r) => r.status === 'pending').length;
    const acceptedCount = requests.filter((r) => r.status === 'accepted').length;
    const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Welcome, {user?.name}! 📚</h1>
                <p>Find mentors and build your career network.</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card stat-blue">
                    <div className="stat-number">{requests.length}</div>
                    <div className="stat-label">Total Requests</div>
                </div>
                <div className="stat-card stat-amber">
                    <div className="stat-number">{pendingCount}</div>
                    <div className="stat-label">Pending</div>
                </div>
                <div className="stat-card stat-green">
                    <div className="stat-number">{acceptedCount}</div>
                    <div className="stat-label">Accepted</div>
                </div>
                <div className="stat-card stat-red">
                    <div className="stat-number">{rejectedCount}</div>
                    <div className="stat-label">Rejected</div>
                </div>
            </div>

            <div className="dashboard-actions">
                <Link to="/directory" className="action-card">
                    <span className="action-icon">🔍</span>
                    <h3>Browse Alumni</h3>
                    <p>Find and connect with alumni mentors</p>
                </Link>
                <Link to="/mentorship" className="action-card">
                    <span className="action-icon">🤝</span>
                    <h3>My Requests</h3>
                    <p>View your mentorship request status</p>
                </Link>
                <Link to="/conversations" className="action-card">
                    <span className="action-icon">💬</span>
                    <h3>Messages</h3>
                    <p>Chat with accepted mentors</p>
                </Link>
            </div>

            {loading ? (
                <div className="loading-spinner"><div className="spinner"></div></div>
            ) : (
                <div className="dashboard-section">
                    <h2>Recent Requests</h2>
                    {requests.length === 0 ? (
                        <div className="empty-state">
                            <p>You haven't sent any mentorship requests yet.</p>
                            <Link to="/directory" className="btn btn-primary">Browse Alumni Directory</Link>
                        </div>
                    ) : (
                        <div className="request-list">
                            {requests.slice(0, 5).map((req) => (
                                <div key={req._id} className="request-card">
                                    <div className="request-info">
                                        <h3>{req.alumni?.name}</h3>
                                        <p className="request-meta">
                                            {req.alumni?.jobTitle} at {req.alumni?.company}
                                        </p>
                                    </div>
                                    <div className="request-status-wrap">
                                        <span className={`status-badge status-${req.status}`}>{req.status}</span>
                                        {req.status === 'accepted' && (
                                            <Link to={`/chat/${req._id}`} className="btn btn-primary btn-sm">Chat</Link>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
