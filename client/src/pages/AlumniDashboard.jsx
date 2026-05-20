import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Link } from 'react-router-dom';

const AlumniDashboard = () => {
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

    const handleRequestAction = async (id, status) => {
        try {
            await api.put(`/mentorship/${id}`, { status });
            fetchRequests();
        } catch (error) {
            console.error('Error updating request:', error);
        }
    };

    const pendingRequests = requests.filter((r) => r.status === 'pending');
    const acceptedRequests = requests.filter((r) => r.status === 'accepted');

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Welcome back, {user?.name}! 👋</h1>
                <p>Manage your mentorship connections and profile.</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card stat-purple">
                    <div className="stat-number">{requests.length}</div>
                    <div className="stat-label">Total Requests</div>
                </div>
                <div className="stat-card stat-amber">
                    <div className="stat-number">{pendingRequests.length}</div>
                    <div className="stat-label">Pending</div>
                </div>
                <div className="stat-card stat-green">
                    <div className="stat-number">{acceptedRequests.length}</div>
                    <div className="stat-label">Active Mentees</div>
                </div>
            </div>

            <div className="dashboard-section">
                <h2>Pending Mentorship Requests</h2>
                {loading ? (
                    <div className="loading-spinner"><div className="spinner"></div></div>
                ) : pendingRequests.length === 0 ? (
                    <div className="empty-state">
                        <p>No pending requests at the moment.</p>
                    </div>
                ) : (
                    <div className="request-list">
                        {pendingRequests.map((req) => (
                            <div key={req._id} className="request-card">
                                <div className="request-info">
                                    <h3>{req.student?.name}</h3>
                                    <p className="request-meta">
                                        {req.student?.course} • Enrolled {req.student?.enrollmentYear}
                                    </p>
                                    <p className="request-message">"{req.message}"</p>
                                </div>
                                <div className="request-actions">
                                    <button
                                        onClick={() => handleRequestAction(req._id, 'accepted')}
                                        className="btn btn-success btn-sm"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => handleRequestAction(req._id, 'rejected')}
                                        className="btn btn-danger btn-sm"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="dashboard-section">
                <h2>Active Mentees</h2>
                {acceptedRequests.length === 0 ? (
                    <div className="empty-state">
                        <p>No active mentees yet.</p>
                    </div>
                ) : (
                    <div className="request-list">
                        {acceptedRequests.map((req) => (
                            <div key={req._id} className="request-card">
                                <div className="request-info">
                                    <h3>{req.student?.name}</h3>
                                    <p className="request-meta">{req.student?.course}</p>
                                </div>
                                <Link to={`/chat/${req._id}`} className="btn btn-primary btn-sm">
                                    Chat
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AlumniDashboard;
