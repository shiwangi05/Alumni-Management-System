import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';

const Chat = () => {
    const { requestId } = useParams();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [mentorship, setMentorship] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const socket = useSocket();
    const navigate = useNavigate();

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [requestId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!socket) return;
        
        const handleNewMessage = (msg) => {
            if (msg.mentorshipRequest === requestId) {
                setMessages(prev => [...prev, msg]);
            }
        };

        const handleMessageDeleted = (msgId) => {
            setMessages(prev => prev.filter(m => m._id !== msgId));
        };

        socket.on('new_message', handleNewMessage);
        socket.on('message_deleted', handleMessageDeleted);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('message_deleted', handleMessageDeleted);
        };
    }, [socket, requestId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = async () => {
        try {
            const [msgRes, reqRes] = await Promise.all([
                api.get(`/messages/${requestId}`),
                api.get('/mentorship/my-requests'),
            ]);
            setMessages(msgRes.data);
            const currentMentorship = reqRes.data.find((r) => r._id === requestId);
            setMentorship(currentMentorship);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        setSending(true);

        try {
            await api.post('/messages', {
                mentorshipRequestId: requestId,
                content: newMessage,
            });
            setNewMessage('');
            await fetchMessages();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (msgId) => {
        if (!confirm('Are you sure you want to delete this message?')) return;
        try {
            await api.delete(`/messages/${msgId}`);
            setMessages((prev) => prev.filter((m) => m._id !== msgId));
        } catch (error) {
            alert('Failed to delete message');
        }
    };

    const handleEndMentorship = async () => {
        if (!confirm('Are you sure you want to end this mentorship? This will permanently delete the chat history for both users.')) return;
        try {
            await api.delete(`/mentorship/${requestId}`);
            navigate('/conversations');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to end mentorship');
        }
    };

    const otherPerson = user?.role === 'student' ? mentorship?.alumni : mentorship?.student;

    if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

    return (
        <div className="chat-page">
            <div className="chat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link to="/conversations" className="btn-back">← Back</Link>
                    <div className="chat-header-info">
                        <div className="chat-avatar">{otherPerson?.name?.charAt(0).toUpperCase()}</div>
                        <div>
                            <h2>{otherPerson?.name || 'Unknown'}</h2>
                            <p className="chat-subtitle">
                                {user?.role === 'student'
                                    ? `${otherPerson?.jobTitle || ''} at ${otherPerson?.company || ''}`
                                    : otherPerson?.course || ''}
                            </p>
                        </div>
                    </div>
                </div>
                <button onClick={handleEndMentorship} className="btn btn-danger btn-sm" style={{ opacity: 0.8 }}>
                    End Mentorship & Clear Chat
                </button>
            </div>

            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="chat-empty">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg._id}
                            className={`message ${msg.sender?._id === user?._id ? 'message-sent' : 'message-received'}`}
                        >
                            <div className="message-bubble">
                                <p>{msg.content}</p>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                    <span className="message-time">
                                        {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                    {msg.sender?._id === user?._id && (
                                        <button 
                                            onClick={() => handleDelete(msg._id)}
                                            title="Delete Message"
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', padding: 0, opacity: 0.7 }}
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input" onSubmit={handleSend}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    maxLength={2000}
                />
                <button type="submit" className="btn btn-primary" disabled={sending}>
                    {sending ? '...' : 'Send'}
                </button>
            </form>
        </div>
    );
};

export default Chat;
