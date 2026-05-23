import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationPage, setNotificationPage] = useState(1);
    const [notificationTotalPages, setNotificationTotalPages] = useState(1);
    const [loadingMoreNotifications, setLoadingMoreNotifications] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const socket = useSocket();
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (user) {
            fetchNotifications(1);
        }
    }, [user]);

    useEffect(() => {
        if (socket) {
            socket.on('new_notification', (newNotif) => {
                setNotifications(prev => [newNotif, ...prev.filter((n) => n._id !== newNotif._id)]);
                setUnreadCount(prev => prev + 1);
            });
        }
        return () => {
            if (socket) socket.off('new_notification');
        };
    }, [socket]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async (pageToLoad = 1) => {
        try {
            setLoadingMoreNotifications(pageToLoad > 1);
            const res = await api.get(`/notifications?page=${pageToLoad}&limit=20`);
            setNotifications(prev => (
                pageToLoad === 1
                    ? res.data.notifications
                    : [...prev, ...res.data.notifications.filter((n) => !prev.some((existing) => existing._id === n._id))]
            ));
            setUnreadCount(res.data.unreadCount);
            setNotificationPage(res.data.page);
            setNotificationTotalPages(res.data.totalPages);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoadingMoreNotifications(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark read', error);
        }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all read', error);
        }
    };

    if (!user) return null;

    const getDashboardLink = () => {
        switch (user.role) {
            case 'admin': return '/admin/dashboard';
            case 'alumni': return '/alumni/dashboard';
            case 'student': return '/student/dashboard';
            default: return '/';
        }
    };

    const isActive = (path) => location.pathname.startsWith(path) ? 'nav-link active' : 'nav-link';

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to={getDashboardLink()}>
                    <span className="brand-icon">AC</span>
                    <span className="brand-text">AlumniConnect</span>
                </Link>
            </div>

            <button
                className="mobile-menu-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', display: 'none' }}
                aria-label="Toggle navigation"
            >
                {mobileMenuOpen ? 'Close' : 'Menu'}
            </button>

            <div className={`navbar-links ${mobileMenuOpen ? 'mobile-active' : ''}`}>
                <Link to={getDashboardLink()} className={isActive(getDashboardLink())} onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                <Link to="/directory" className={isActive('/directory')} onClick={() => setMobileMenuOpen(false)}>Directory</Link>
                <Link to="/events" className={isActive('/events')} onClick={() => setMobileMenuOpen(false)}>Events</Link>
                <Link to="/stories" className={isActive('/stories')} onClick={() => setMobileMenuOpen(false)}>Stories</Link>
                <Link to="/jobs" className={isActive('/jobs')} onClick={() => setMobileMenuOpen(false)}>Jobs</Link>

                {(user.role === 'student' || user.role === 'alumni') && (
                    <>
                        <Link to="/mentorship" className={isActive('/mentorship')} onClick={() => setMobileMenuOpen(false)}>Mentorship</Link>
                        <Link to="/conversations" className={isActive('/conversations')} onClick={() => setMobileMenuOpen(false)}>Messages</Link>
                    </>
                )}

                {user.role === 'admin' && (
                    <>
                        <Link to="/admin/users" className={isActive('/admin/users')} onClick={() => setMobileMenuOpen(false)}>Manage Users</Link>
                        <Link to="/admin/analytics" className={isActive('/admin/analytics')} onClick={() => setMobileMenuOpen(false)}>Analytics</Link>
                    </>
                )}

                {user.role === 'alumni' && (
                    <Link to="/alumni/profile" className={isActive('/alumni/profile')} onClick={() => setMobileMenuOpen(false)}>My Profile</Link>
                )}
                {user.role === 'student' && (
                    <Link to="/student/profile" className={isActive('/student/profile')} onClick={() => setMobileMenuOpen(false)}>My Profile</Link>
                )}
            </div>

            <div className="navbar-user" style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        style={{ background: 'none', border: 'none', fontSize: '0.9rem', cursor: 'pointer', position: 'relative', fontWeight: 700 }}
                        aria-label="Notifications"
                    >
                        Alerts
                        {unreadCount > 0 && (
                            <span style={{ position: 'absolute', top: '-8px', right: '-12px', background: 'var(--danger)', color: 'white', borderRadius: '50%', padding: '0.1rem 0.4rem', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {showDropdown && (
                        <div style={{ position: 'absolute', top: '100%', right: '0', marginTop: '0.5rem', width: '320px', background: 'white', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', zIndex: 1000, overflow: 'hidden' }}>
                            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4 style={{ margin: 0, fontSize: '1rem' }}>Notifications</h4>
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', cursor: 'pointer' }}>Mark all read</button>
                                )}
                            </div>
                            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                {notifications.length === 0 ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No notifications</div>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n._id}
                                            onClick={() => !n.isRead && markAsRead(n._id)}
                                            style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)', background: n.isRead ? 'white' : 'var(--bg-body)', cursor: 'pointer', transition: 'background 0.2s' }}>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)' }}>{n.content}</p>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {new Date(n.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))
                                )}
                                {notificationPage < notificationTotalPages && (
                                    <div style={{ padding: '0.75rem', textAlign: 'center' }}>
                                        <button
                                            onClick={() => fetchNotifications(notificationPage + 1)}
                                            disabled={loadingMoreNotifications}
                                            className="btn btn-outline btn-sm"
                                        >
                                            {loadingMoreNotifications ? 'Loading...' : 'Load more'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <span className="user-badge">{user.role}</span>
                {user.avatar && (
                    <img src={user.avatar} alt={user.name} className="navbar-avatar" />
                )}
                <span className="user-name">{user.name}</span>
                <button onClick={handleLogout} className="btn-logout">Logout</button>
            </div>
        </nav>
    );
};

export default Navbar;
