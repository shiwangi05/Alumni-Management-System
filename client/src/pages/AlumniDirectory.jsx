import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const AlumniDirectory = () => {
    const { user } = useAuth();
    const [alumni, setAlumni] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [industry, setIndustry] = useState('');
    const [graduationYear, setGraduationYear] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [requestModal, setRequestModal] = useState(null);
    const [requestMessage, setRequestMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchAlumni();
    }, [page]);

    const fetchAlumni = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 12 });
            if (search) params.append('search', search);
            if (industry) params.append('industry', industry);
            if (graduationYear) params.append('graduationYear', graduationYear);

            const res = await api.get(`/alumni/directory?${params}`);
            setAlumni(res.data.alumni);
            setTotalPages(res.data.totalPages);
        } catch (error) {
            console.error('Error fetching alumni:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchAlumni();
    };

    const handleSendRequest = async () => {
        if (!requestMessage.trim()) return;
        setSending(true);
        try {
            await api.post('/mentorship/request', {
                alumniId: requestModal._id,
                message: requestMessage,
            });
            setRequestModal(null);
            setRequestMessage('');
            alert('Mentorship request sent successfully!');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to send request');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="directory-page">
            <div className="directory-header">
                <h1>Alumni Directory</h1>
                <p>Connect with alumni mentors across industries.</p>
            </div>

            <form className="search-bar" onSubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="Search by name, company, or title..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="search-input"
                />
                <input
                    type="text"
                    placeholder="Industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="filter-input"
                />
                <input
                    type="number"
                    placeholder="Grad Year"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    className="filter-input filter-small"
                />
                <button type="submit" className="btn btn-primary">Search</button>
            </form>

            {loading ? (
                <div className="loading-spinner"><div className="spinner"></div></div>
            ) : alumni.length === 0 ? (
                <div className="empty-state">
                    <p>No alumni found. Try adjusting your search.</p>
                </div>
            ) : (
                <>
                    <div className="alumni-grid">
                        {alumni.map((a) => (
                            <div key={a._id} className="alumni-card">
                                <div className="alumni-avatar">
                                    {a.name?.charAt(0).toUpperCase()}
                                </div>
                                <h3>{a.name}</h3>
                                <p className="alumni-title">{a.jobTitle || 'Not specified'}</p>
                                <p className="alumni-company">{a.company || 'Not specified'}</p>
                                {a.industry && <span className="industry-tag">{a.industry}</span>}
                                {a.graduationYear && (
                                    <p className="alumni-year">Class of {a.graduationYear}</p>
                                )}
                                {a.skills && a.skills.length > 0 && (
                                    <div className="skill-tags">
                                        {a.skills.slice(0, 3).map((skill, i) => (
                                            <span key={i} className="skill-tag">{skill}</span>
                                        ))}
                                        {a.skills.length > 3 && <span className="skill-tag">+{a.skills.length - 3}</span>}
                                    </div>
                                )}
                                {user?.role === 'student' && (
                                    <button
                                        onClick={() => setRequestModal(a)}
                                        className="btn btn-primary btn-sm btn-full"
                                    >
                                        Request Mentorship
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="btn btn-outline"
                            >
                                Previous
                            </button>
                            <span className="page-info">Page {page} of {totalPages}</span>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="btn btn-outline"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Mentorship Request Modal */}
            {requestModal && (
                <div className="modal-overlay" onClick={() => setRequestModal(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Request Mentorship</h2>
                        <p>Send a request to <strong>{requestModal.name}</strong></p>
                        <div className="form-group">
                            <label>Your Message</label>
                            <textarea
                                rows="4"
                                value={requestMessage}
                                onChange={(e) => setRequestMessage(e.target.value)}
                                placeholder="Introduce yourself and explain why you'd like mentorship..."
                                maxLength={1000}
                            />
                        </div>
                        <div className="modal-actions">
                            <button onClick={() => setRequestModal(null)} className="btn btn-outline">Cancel</button>
                            <button onClick={handleSendRequest} className="btn btn-primary" disabled={sending}>
                                {sending ? 'Sending...' : 'Send Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlumniDirectory;
