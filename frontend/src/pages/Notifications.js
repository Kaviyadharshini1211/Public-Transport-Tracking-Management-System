import React, { useState, useEffect } from 'react';
import API from '../api/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmationModal from '../components/ConfirmationModal';
import '../styles/DashboardPages.css';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [clearing, setClearing] = useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await API.get('/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markRead = async (id = null) => {
        try {
            await API.put('/notifications/read', { id });
            if (id) {
                setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
            } else {
                setNotifications(notifications.map(n => ({ ...n, read: true })));
                toast.success("All marked as read");
            }
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    const handleClearConfirm = async () => {
        setClearing(true);
        try {
            await API.delete('/notifications/clear');
            setNotifications([]);
            toast.success("Notifications cleared");
        } catch (err) {
            toast.error("Failed to clear notifications");
        } finally {
            setClearing(false);
            setIsModalOpen(false);
        }
    };


    if (loading) return <div className="dash-page-container"><LoadingSpinner fullscreen={true} /></div>;

    const getIcon = (type) => {
        switch(type) {
            case 'emergency': case 'SOS': return '🚨';
            case 'route_change': return '🚌';
            case 'earnings': return '💰';
            case 'system': return '✨';
            default: return '📢';
        }
    };

    return (
        <>
            <div className="dash-page-container">

            <div className="dash-content-wrapper">
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 className="page-title">Notifications</h1>
                        <p className="page-subtitle">Stay updated with your travel alerts and account activity.</p>
                    </div>
                    {notifications.some(n => !n.read) && (
                        <button 
                            className="btn-text" 
                            style={{ color: '#d84e55', fontWeight: '600', fontSize: '0.875rem' }}
                            onClick={() => markRead()}
                        >
                            Mark all as read
                        </button>
                    )}
                </div>

                <div className="glass-card">
                    {notifications.length > 0 ? (
                        <div className="list-container">
                            {notifications.map((notif) => (
                                <div 
                                    key={notif._id} 
                                    className={`list-item ${notif.read ? 'read' : 'unread'}`} 
                                    onClick={() => !notif.read && markRead(notif._id)}
                                    style={{
                                        position: 'relative',
                                        background: notif.read ? 'transparent' : 'rgba(216, 78, 85, 0.04)',
                                        borderLeft: notif.read ? 'none' : '4px solid #d84e55',
                                        cursor: notif.read ? 'default' : 'pointer'
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '12px',
                                            background: notif.read ? 'rgba(0,0,0,0.05)' : 'rgba(216, 78, 85, 0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.25rem'
                                        }}>
                                            {getIcon(notif.type)}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0, color: 'var(--text-color, #1e293b)' }}>
                                                {notif.title}
                                            </h3>
                                            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '4px 0 0' }}>
                                                {notif.message}
                                            </p>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                                                {new Date(notif.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    {!notif.read && (
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: '#d84e55',
                                            marginRight: '1rem'
                                        }}></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>All caught up!</h3>
                            <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>You have no new notifications.</p>
                        </div>
                    )}

                    {notifications.length > 0 && (
                        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                style={{
                                    background: 'none',
                                    border: '1px solid #cbd5e1',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '12px',
                                    color: '#64748b',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Clear All Notifications
                            </button>
                        </div>
                    )}
                </div>
                </div>
            </div>

            <ConfirmationModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleClearConfirm}
                title="Clear Notifications?"
                message="Are you sure you want to delete all notifications? This cannot be undone."
                confirmText="Clear All"
                loading={clearing}
            />


            <style>{`
                [data-theme="dark"] .list-item.read {
                    background: transparent;
                }
                [data-theme="dark"] .list-item.unread {
                    background: rgba(216, 78, 85, 0.08);
                }
            `}</style>
        </>
    );
};

export default Notifications;
