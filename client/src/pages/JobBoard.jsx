import { useEffect, useState } from 'react';
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
    const [applyJob, setApplyJob] = useState(null);
    const [coverNote, setCoverNote] = useState('');
    const [applicantsJob, setApplicantsJob] = useState(null);
    const [applicants, setApplicants] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);

    useEffect(() => {
        fetchJobs();
    }, [page, type]);

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
            showToast(error.response?.data?.message || 'Failed to load jobs');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const isPostedByUser = (job) => job.postedBy?._id === user?._id;

    const hasApplied = (job) => {
        return job.applicants?.some((applicant) => {
            const applicantUser = applicant.user?._id || applicant.user || applicant._id || applicant;
            return applicantUser?.toString() === user?._id;
        });
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
            showToast(error.response?.data?.message || 'Failed to delete job');
        }
    };

    const handleApply = async () => {
        if (!applyJob) return;
        setModalLoading(true);
        try {
            const res = await api.post(`/jobs/${applyJob._id}/apply`, { coverNote });
            setJobs((prev) => prev.map((job) => (
                job._id === applyJob._id ? { ...job, applicants: res.data.applicants } : job
            )));
            setApplyJob(null);
            setCoverNote('');
            showToast('Application submitted');
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to apply');
        } finally {
            setModalLoading(false);
        }
    };

    const handleStatusUpdate = async (jobId, status) => {
        try {
            await api.put(`/jobs/${jobId}/status`, { status });
            setJobs((prev) => prev.map((job) => (job._id === jobId ? { ...job, status } : job)));
            showToast(`Job ${status} successfully`);
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to update status');
        }
    };

    const openApplicants = async (job) => {
        setApplicantsJob(job);
        setApplicants([]);
        setModalLoading(true);
        try {
            const res = await api.get(`/jobs/${job._id}/applicants`);
            setApplicants(res.data.applicants);
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to load applicants');
            setApplicantsJob(null);
        } finally {
            setModalLoading(false);
        }
    };

    return (
        <div className="jobs-page">
            {toast && <div className="toast-notification">{toast}</div>}

            <div className="page-hero">
                <h1>Job & Internship Board</h1>
                <p>Discover opportunities shared by the alumni network.</p>
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
                <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="filter-input">
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
                <div className="empty-state"><p>No jobs found. Try adjusting your filters.</p></div>
            ) : (
                <div className="jobs-list" style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {jobs.map((job) => {
                        const canViewApplicants = user?.role === 'admin' || isPostedByUser(job);
                        const applicantCount = job.applicants?.length || 0;
                        return (
                            <div key={job._id} className="job-card" style={{ background: '#0f0c29', color: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid rgba(167,139,250,0.25)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div>
                                        <h3 style={{ margin: 0, color: '#fff' }}>{job.title}</h3>
                                        <p style={{ color: '#a78bfa', margin: '0.5rem 0' }}>{job.company} - {job.location} - {job.type}</p>
                                    </div>
                                    <span style={{ color: '#c4b5fd' }}>Posted {formatDate(job.createdAt)}</span>
                                </div>

                                {(user?.role === 'admin' || isPostedByUser(job)) && job.status && (
                                    <span style={{ display: 'inline-block', margin: '0.5rem 0 1rem', padding: '0.25rem 0.6rem', borderRadius: '6px', background: job.status === 'approved' ? '#10b981' : job.status === 'rejected' ? '#ef4444' : '#f59e0b', color: 'white', fontSize: '0.75rem', fontWeight: 700 }}>
                                        {job.status.toUpperCase()}
                                    </span>
                                )}

                                <p style={{ whiteSpace: 'pre-wrap', color: '#e5e7eb' }}>{job.description}</p>
                                <strong>Requirements</strong>
                                <p style={{ whiteSpace: 'pre-wrap', color: '#d1d5db' }}>{job.requirements}</p>

                                {user?.role === 'admin' && job.status === 'pending' && (
                                    <div style={{ display: 'flex', gap: '0.75rem', margin: '1rem 0' }}>
                                        <button onClick={() => handleStatusUpdate(job._id, 'approved')} className="btn btn-success btn-sm">Approve</button>
                                        <button onClick={() => handleStatusUpdate(job._id, 'rejected')} className="btn btn-danger btn-sm">Reject</button>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 700 }}>{job.salary ? `Salary: ${job.salary}` : 'Salary: Not specified'}</span>
                                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        {job.link && <a href={job.link} target="_blank" rel="noopener noreferrer" className="btn btn-outline">External Link</a>}
                                        {user?.role === 'student' && job.status === 'approved' && !isPostedByUser(job) && (
                                            <button
                                                onClick={() => setApplyJob(job)}
                                                disabled={hasApplied(job)}
                                                className="btn btn-primary"
                                                style={{ opacity: hasApplied(job) ? 0.6 : 1 }}
                                            >
                                                {hasApplied(job) ? 'Applied' : 'Apply'}
                                            </button>
                                        )}
                                        {canViewApplicants && (
                                            <button onClick={() => openApplicants(job)} className="btn btn-outline">
                                                Applicants ({applicantCount})
                                            </button>
                                        )}
                                        {canViewApplicants && (
                                            <button onClick={() => handleDelete(job._id)} className="btn btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {totalPages > 1 && (
                        <div className="pagination" style={{ marginTop: '2rem' }}>
                            <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
                            <span className="page-info">Page {page} of {totalPages}</span>
                            <button className="btn btn-outline btn-sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
                        </div>
                    )}
                </div>
            )}

            {applyJob && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15,12,41,0.78)', zIndex: 2000, display: 'grid', placeItems: 'center', padding: '1rem' }}>
                    <div style={{ width: 'min(520px, 100%)', background: '#0f0c29', color: 'white', border: '1px solid rgba(167,139,250,0.35)', borderRadius: '0.75rem', padding: '1.5rem' }}>
                        <h3 style={{ marginTop: 0 }}>Apply to {applyJob.title}</h3>
                        <label htmlFor="coverNote">Cover note (optional)</label>
                        <textarea id="coverNote" rows="5" maxLength="500" value={coverNote} onChange={(e) => setCoverNote(e.target.value)} style={{ width: '100%', marginTop: '0.5rem' }} />
                        <p style={{ color: '#a78bfa', fontSize: '0.85rem' }}>{coverNote.length}/500</p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button className="btn btn-outline" onClick={() => setApplyJob(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleApply} disabled={modalLoading}>{modalLoading ? 'Applying...' : 'Confirm Apply'}</button>
                        </div>
                    </div>
                </div>
            )}

            {applicantsJob && (
                <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15,12,41,0.78)', zIndex: 2000, display: 'grid', placeItems: 'center', padding: '1rem' }}>
                    <div style={{ width: 'min(640px, 100%)', maxHeight: '80vh', overflowY: 'auto', background: '#0f0c29', color: 'white', border: '1px solid rgba(167,139,250,0.35)', borderRadius: '0.75rem', padding: '1.5rem' }}>
                        <h3 style={{ marginTop: 0 }}>Applicants for {applicantsJob.title}</h3>
                        {modalLoading ? (
                            <p>Loading applicants...</p>
                        ) : applicants.length === 0 ? (
                            <p style={{ color: '#a78bfa' }}>No applicants yet.</p>
                        ) : (
                            applicants.map((applicant) => (
                                <div key={applicant.user?._id || applicant.appliedAt} style={{ borderTop: '1px solid rgba(167,139,250,0.25)', padding: '1rem 0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        {applicant.user?.avatar && <img src={applicant.user.avatar} alt={applicant.user.name} style={{ width: 40, height: 40, borderRadius: '50%' }} />}
                                        <div>
                                            <strong>{applicant.user?.name}</strong>
                                            <p style={{ margin: 0, color: '#a78bfa' }}>{applicant.user?.course || 'Course not provided'} - {applicant.user?.email}</p>
                                        </div>
                                    </div>
                                    <p style={{ color: '#d1d5db' }}>{applicant.coverNote || 'No cover note provided.'}</p>
                                    <span style={{ color: '#a78bfa', fontSize: '0.85rem' }}>Applied {formatDate(applicant.appliedAt)}</span>
                                </div>
                            ))
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-primary" onClick={() => setApplicantsJob(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobBoard;
