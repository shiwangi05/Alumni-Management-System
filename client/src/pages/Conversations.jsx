import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Conversations = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        try {
            const res = await api.get('/messages/conversations');
            setConversations(res.data);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="conversations-page">
            <div className="page-header">
                <h1>Messages</h1>
                <p>Your mentorship conversations</p>
            </div>

            {loading ? (
                <div className="loading-spinner"><div className="spinner"></div></div>
            ) : conversations.length === 0 ? (
                <div className="empty-state">
                    <p>No active conversations yet.</p>
                    <p>Conversations appear after a mentorship request is accepted.</p>
                </div>
            ) : (
                <div className="conversation-list">
                    {conversations.map((conv) => {
                        const other =
                            user?.role === 'student'
                                ? conv.mentorship?.alumni
                                : conv.mentorship?.student;

                        return (
                            <Link
                                key={conv.mentorship?._id}
                                to={`/chat/${conv.mentorship?._id}`}
                                className="conversation-card"
                            >
                                <div className="conv-avatar">{other?.name?.charAt(0).toUpperCase()}</div>
                                <div className="conv-info">
                                    <div className="conv-header">
                                        <h3>{other?.name}</h3>
                                        {conv.lastMessage && (
                                            <span className="conv-time">
                                                {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                    <p className="conv-subtitle">
                                        {user?.role === 'student'
                                            ? `${other?.jobTitle || ''} at ${other?.company || ''}`
                                            : other?.course || ''}
                                    </p>
                                    {conv.lastMessage && (
                                        <p className="conv-last-message">
                                            {conv.lastMessage.content.substring(0, 60)}
                                            {conv.lastMessage.content.length > 60 ? '...' : ''}
                                        </p>
                                    )}
                                </div>
                                {conv.unreadCount > 0 && (
                                    <span className="unread-badge">{conv.unreadCount}</span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Conversations;
