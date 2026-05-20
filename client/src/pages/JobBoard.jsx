import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const JobBoard = () => {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [type, setType] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [toast, setToast] = useState('');

    useEffect(() => {
        fetchJobs();
    }, [page, type]); // re-fetch when page or type filter changes

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 10 });
            if (search) params.append('search', search);
            if (type) params.append('type', type);

            const res = await api.get(`/jobs?${params}`);
            setJobs(res.data.jobs);
            setTotalPages(res.data.totalPages);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchJobs();
    };

    const handleDelete = async (jobId) => {
        if (!confirm('Are you sure you want to delete this job posting?')) return;
        try {
            await api.delete(`/jobs/${jobId}`);
            setJobs((prev) => prev.filter((j) => j._id !== jobId));
            showToast('Job deleted successfully');
        } catch (error) {
            showToast('Failed to delete job');
        }
    };

    const handleApply = async (jobId) => {
        try {
            const res = await api.post(`/jobs/${jobId}/apply`);
            setJobs(prev => prev.map(j => j._id === jobId ? { ...j, applicants: res.data.applicants } : j));
            showToast('Successfully expressed interest!');
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to apply');
        }
    };

    const handleStatusUpdate = async (jobId, status) => {
        try {
            await api.put(`/jobs/${jobId}/status`, { status });
            setJobs(prev => prev.map(j => j._id === jobId ? { ...j, status } : j));
            showToast(`Job ${status} successfully`);
        } catch (error) {
            showToast('Failed to update status');
        }
    };

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    return (
        <div className="jobs-page">
            {toast && <div className="toast-notification">{toast}</div>}

            <div className="page-hero">
                <h1>💼 Job & Internship Board</h1>
                <p>Discover opportunities shared by our alumni network.</p>
                {(user?.role === 'alumni' || user?.role === 'admin') && (
                    <Link to="/jobs/post" className="btn btn-primary">+ Post a Job</Link>
                )}
            </div>

            <form className="search-bar" onSubmit={handleSearch} style={{ maxWidth: '900px', margin: '0 auto 2rem' }}>
                <input
                    type="text"
                    placeholder="Search jobs by title, company, or location..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="search-input"
                />
                <select 
                    value={type} 
                    onChange={(e) => { setType(e.target.value); setPage(1); }}
                    className="filter-input"
                >
                    <option value="">All Types</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                    <option value="Freelance">Freelance</option>
                </select>
                <button type="submit" className="btn btn-primary">Search</button>
            </form>

            {loading ? (
                <div className="loading-spinner"><div className="spinner"></div></div>
            ) : jobs.length === 0 ? (
                <div className="empty-state">
                    <span style={{ fontSize: '3rem' }}>📭</span>
                    <p>No jobs found. Try adjusting your filters.</p>
                </div>
            ) : (
                <div className="jobs-list" style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {jobs.map((job) => (
                        <div key={job._id} className="job-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                                        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: 0 }}>{job.title}</h3>
                                        {(user?.role === 'admin' || user?._id === job.postedBy?._id) && job.status && (
                                            <span style={{ 
                                                display: 'inline-block', 
                                                padding: '0.15rem 0.5rem', 
                                                borderRadius: '4px', 
                                                fontSize: '0.7rem', 
                                                fontWeight: 'bold',
                                                marginLeft: '0.75rem',
                                                backgroundColor: job.status === 'approved' ? '#d1fae5' : job.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                                                color: job.status === 'approved' ? '#065f46' : job.status === 'rejected' ? '#991b1b' : '#92400e'
                                            }}>
                                                {job.status.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                        <span>🏢 {job.company}</span>
                                        <span>📍 {job.location}</span>
                                        <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{job.type}</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Posted on {formatDate(job.createdAt)}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                                            {job.postedBy?.name?.charAt(0)}
                                        </div>
                                        <span style={{ fontSize: '0.85rem' }}>{job.postedBy?.name}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <p style={{ color: 'var(--text-body)', fontSize: '0.95rem', whiteSpace: 'pre-wrap', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                                {job.description}
                            </p>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Requirements:</strong>
                                <p style={{ color: 'var(--text-body)', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{job.requirements}</p>
                            </div>

                            {user?.role === 'admin' && job.status === 'pending' && (
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <strong style={{ alignSelf: 'center', marginRight: 'auto', fontSize: '0.9rem' }}>Admin Action Required:</strong>
                                    <button onClick={() => handleStatusUpdate(job._id, 'approved')} className="btn btn-success btn-sm">Approve</button>
                                    <button onClick={() => handleStatusUpdate(job._id, 'rejected')} className="btn btn-danger btn-sm">Reject</button>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                                    {job.salary ? `💰 ${job.salary}` : 'Salary: Not specified'}
                                </span>
                                
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    {(user?._id === job.postedBy?._id || user?.role === 'admin') && (
                                        <button onClick={() => handleDelete(job._id)} className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)', padding: '0.5rem 1rem' }}>
                                            Delete
                                        </button>
                                    )}
                                    
                                    {/* Application Actions */}
                                    {job.link && (
                                        <a href={job.link} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ padding: '0.5rem 1.5rem' }}>
                                            External Link
                                        </a>
                                    )}
                                    {user?.role === 'student' && job.status === 'approved' && (
                                        <button 
                                            onClick={() => handleApply(job._id)} 
                                            disabled={job.applicants?.includes(user._id)} 
                                            className="btn btn-primary" 
                                            style={{ padding: '0.5rem 1.5rem', opacity: job.applicants?.includes(user._id) ? 0.6 : 1 }}
                                        >
                                            {job.applicants?.includes(user._id) ? 'Applied ✓' : 'Express Interest'}
                                        </button>
                                    )}
                                    {user?.role === 'alumni' && job.applicants?.length > 0 && user?._id === job.postedBy?._id && (
                                        <div style={{ alignSelf: 'center', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                                            {job.applicants.length} {job.applicants.length === 1 ? 'Applicant' : 'Applicants'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {totalPages > 1 && (
                        <div className="pagination" style={{ marginTop: '2rem' }}>
                            <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                            <span className="page-info">Page {page} of {totalPages}</span>
                            <button className="btn btn-outline btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default JobBoard;
