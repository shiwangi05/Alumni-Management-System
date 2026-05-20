import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['all', 'career', 'achievement', 'entrepreneurship', 'education', 'general'];
const CAT_COLORS = { career: '#667eea', achievement: '#f59e0b', entrepreneurship: '#10b981', education: '#3b82f6', general: '#8b5cf6' };
const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const Stories = () => {
    const { user } = useAuth();
    const [stories, setStories] = useState([]);
    const [category, setCategory] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [likeLoading, setLikeLoading] = useState({});
    const [commentTexts, setCommentTexts] = useState({});
    const [commentLoading, setCommentLoading] = useState({});
    const [openComments, setOpenComments] = useState({});
    const [toast, setToast] = useState('');

    useEffect(() => { fetchStories(); }, [category, page]);

    const fetchStories = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 8 });
            if (category !== 'all') params.set('category', category);
            const res = await api.get(`/stories?${params}`);
            setStories(res.data.stories);
            setTotalPages(res.data.totalPages);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const handleLike = async (storyId) => {
        setLikeLoading(p => ({ ...p, [storyId]: true }));
        try {
            const res = await api.post(`/stories/${storyId}/like`);
            setStories(prev => prev.map(s => s._id === storyId ? { ...s, likeCount: res.data.likeCount, hasLiked: res.data.hasLiked } : s));
        } finally { setLikeLoading(p => ({ ...p, [storyId]: false })); }
    };

    const handleComment = async (storyId) => {
        const text = (commentTexts[storyId] || '').trim();
        if (!text) return;
        setCommentLoading(p => ({ ...p, [storyId]: true }));
        try {
            const res = await api.post(`/stories/${storyId}/comment`, { text });
            setStories(prev => prev.map(s => s._id === storyId ? { ...s, comments: [...(s.comments || []), res.data] } : s));
            setCommentTexts(p => ({ ...p, [storyId]: '' }));
        } catch { showToast('Failed to comment.'); }
        finally { setCommentLoading(p => ({ ...p, [storyId]: false })); }
    };

    const handleDeleteComment = async (storyId, commentId) => {
        try {
            await api.delete(`/stories/${storyId}/comment/${commentId}`);
            setStories(prev => prev.map(s => s._id === storyId ? { ...s, comments: s.comments.filter(c => c._id !== commentId) } : s));
        } catch { showToast('Failed to delete.'); }
    };

    const handleFeature = async (storyId, isFeatured) => {
        try {
            await api.put(`/stories/${storyId}/feature`);
            setStories(prev => prev.map(s => s._id === storyId ? { ...s, isFeatured: !isFeatured } : s));
            showToast(isFeatured ? 'Removed from featured.' : '⭐ Story featured!');
        } catch { showToast('Failed.'); }
    };

    const handleDelete = async (storyId) => {
        if (!confirm('Delete this story?')) return;
        try {
            await api.delete(`/stories/${storyId}`);
            setStories(prev => prev.filter(s => s._id !== storyId));
            showToast('Story deleted.');
        } catch { showToast('Failed.'); }
    };

    return (
        <div className="stories-page">
            {toast && <div className="toast-notification">{toast}</div>}

            <div className="page-hero">
                <h1>🌟 Success Stories</h1>
                <p>Real journeys. Real inspiration. Shared by your alumni community.</p>
                {user?.role === 'alumni' && (
                    <Link to="/stories/post" id="post-story-btn" className="btn btn-primary">✍️ Share Your Story</Link>
                )}
            </div>

            <div className="filter-tabs">
                {CATEGORIES.map(cat => (
                    <button key={cat}
                        className={`filter-tab ${category === cat ? 'active' : ''}`}
                        onClick={() => { setCategory(cat); setPage(1); }}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading-spinner"><div className="spinner"></div></div>
            ) : stories.length === 0 ? (
                <div className="empty-state">
                    <span style={{ fontSize: '3rem' }}>📝</span>
                    <p>No stories yet in this category.</p>
                    {user?.role === 'alumni' && <Link to="/stories/post" className="btn btn-primary">Be the first!</Link>}
                </div>
            ) : (
                <div className="stories-feed">
                    {stories.map(story => (
                        <div key={story._id} className={`story-card ${story.isFeatured ? 'story-featured' : ''}`}>
                            {story.isFeatured && <div className="featured-ribbon">⭐ Featured</div>}

                            <div className="story-author">
                                <div className="author-avatar">
                                    {story.author?.avatar ? <img src={story.author.avatar} alt={story.author.name} /> : <span>{getInitials(story.author?.name)}</span>}
                                </div>
                                <div className="author-info">
                                    <strong>{story.author?.name}</strong>
                                    <span className="author-meta">
                                        {story.author?.jobTitle}{story.author?.company && ` @ ${story.author.company}`}
                                        {story.author?.graduationYear && ` · Batch ${story.author.graduationYear}`}
                                    </span>
                                </div>
                                <span className="story-category-tag" style={{ background: `${CAT_COLORS[story.category]}22`, color: CAT_COLORS[story.category] }}>
                                    {story.category}
                                </span>
                            </div>

                            <h3 className="story-title">{story.title}</h3>
                            <p className="story-content">{story.content}</p>
                            <span className="story-date">{formatDate(story.createdAt)}</span>

                            <div className="story-actions">
                                <button id={`like-btn-${story._id}`}
                                    className={`story-action-btn ${story.hasLiked ? 'liked' : ''}`}
                                    onClick={() => handleLike(story._id)} disabled={likeLoading[story._id]}>
                                    {story.hasLiked ? '❤️' : '🤍'} {story.likeCount || 0}
                                </button>
                                <button className="story-action-btn" onClick={() => setOpenComments(p => ({ ...p, [story._id]: !p[story._id] }))}>
                                    💬 {story.comments?.length || 0}
                                </button>
                                {user?.role === 'admin' && (
                                    <>
                                        <button className={`story-action-btn ${story.isFeatured ? 'featured' : ''}`} onClick={() => handleFeature(story._id, story.isFeatured)}>
                                            {story.isFeatured ? '⭐ Unfeature' : '☆ Feature'}
                                        </button>
                                        <button className="story-action-btn danger" onClick={() => handleDelete(story._id)}>🗑️</button>
                                    </>
                                )}
                                {user?._id === story.author?._id && user?.role !== 'admin' && (
                                    <button className="story-action-btn danger" onClick={() => handleDelete(story._id)}>🗑️ Delete</button>
                                )}
                            </div>

                            {openComments[story._id] && (
                                <div className="comments-section">
                                    {story.comments?.map(c => (
                                        <div key={c._id} className="comment-item">
                                            <div className="comment-avatar">
                                                {c.user?.avatar ? <img src={c.user.avatar} alt="" /> : <span>{getInitials(c.user?.name)}</span>}
                                            </div>
                                            <div className="comment-body">
                                                <strong>{c.user?.name}</strong>
                                                <p>{c.text}</p>
                                            </div>
                                            {(user?._id === c.user?._id || user?.role === 'admin') && (
                                                <button className="comment-delete" onClick={() => handleDeleteComment(story._id, c._id)}>×</button>
                                            )}
                                        </div>
                                    ))}
                                    {(!story.comments || story.comments.length === 0) && (
                                        <p className="no-comments">No comments yet.</p>
                                    )}
                                    <div className="comment-input-row">
                                        <input type="text" placeholder="Write a comment..."
                                            value={commentTexts[story._id] || ''}
                                            onChange={e => setCommentTexts(p => ({ ...p, [story._id]: e.target.value }))}
                                            onKeyDown={e => e.key === 'Enter' && handleComment(story._id)} />
                                        <button className="btn btn-primary btn-sm" onClick={() => handleComment(story._id)} disabled={commentLoading[story._id]}>
                                            {commentLoading[story._id] ? '...' : 'Post'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="pagination">
                    <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                    <span className="page-info">Page {page} of {totalPages}</span>
                    <button className="btn btn-outline btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                </div>
            )}
        </div>
    );
};

export default Stories;
