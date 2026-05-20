import { useState, useEffect } from 'react';
import api from '../utils/api';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/stats');
            setStats(res.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Admin Dashboard 🛡️</h1>
                <p>Monitor and manage the entire platform.</p>
            </div>

            <div className="stats-grid stats-grid-4">
                <div className="stat-card stat-blue">
                    <div className="stat-number">{stats?.totalUsers || 0}</div>
                    <div className="stat-label">Total Users</div>
                </div>
                <div className="stat-card stat-purple">
                    <div className="stat-number">{stats?.totalAlumni || 0}</div>
                    <div className="stat-label">Alumni</div>
                </div>
                <div className="stat-card stat-green">
                    <div className="stat-number">{stats?.totalStudents || 0}</div>
                    <div className="stat-label">Students</div>
                </div>
                <div className="stat-card stat-amber">
                    <div className="stat-number">{stats?.recentRegistrations || 0}</div>
                    <div className="stat-label">New (30 days)</div>
                </div>
            </div>

            <h2 className="section-title">Mentorship Overview</h2>
            <div className="stats-grid">
                <div className="stat-card stat-blue">
                    <div className="stat-number">{stats?.totalMentorships || 0}</div>
                    <div className="stat-label">Total Requests</div>
                </div>
                <div className="stat-card stat-amber">
                    <div className="stat-number">{stats?.pendingMentorships || 0}</div>
                    <div className="stat-label">Pending</div>
                </div>
                <div className="stat-card stat-green">
                    <div className="stat-number">{stats?.acceptedMentorships || 0}</div>
                    <div className="stat-label">Accepted</div>
                </div>
                <div className="stat-card stat-red">
                    <div className="stat-number">{stats?.rejectedMentorships || 0}</div>
                    <div className="stat-label">Rejected</div>
                </div>
            </div>

            <div className="stats-grid" style={{ marginTop: '1.5rem' }}>
                <div className="stat-card stat-purple">
                    <div className="stat-number">{stats?.totalMessages || 0}</div>
                    <div className="stat-label">Total Messages</div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
