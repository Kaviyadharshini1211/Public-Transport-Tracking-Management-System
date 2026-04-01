import React from 'react';
import '../styles/DashboardPages.css';

const Notifications = () => {
    const notifications = [
        { id: 1, type: 'booking', icon: '🎫', title: 'Booking Confirmed!', message: 'Your seat for Mumbai to Pune has been confirmed.', time: '2 mins ago', read: false },
        { id: 2, type: 'payment', icon: '💳', title: 'Payment Successful', message: 'Transaction ID #RZP00192 has been processed.', time: '1 hour ago', read: true },
        { id: 3, type: 'alert', icon: '📢', title: 'Route Update', message: 'The Delhi - Noida bus is now tracking live.', time: '3 hours ago', read: true },
        { id: 4, type: 'system', icon: '✨', title: 'Welcome to PT Tracker', message: 'Check out the new features on your dashboard!', time: '1 day ago', read: true },
    ];

    return (
        <>
            <div className="dash-page-container">
            <div className="dash-content-wrapper">
                <div className="page-header">
                    <h1 className="page-title">Notifications</h1>
                    <p className="page-subtitle">Stay updated with your travel alerts and account activity.</p>
                </div>

                <div className="glass-card">
                    <div className="list-container">
                        {notifications.map((notif) => (
                            <div key={notif.id} className={`list-item ${notif.read ? 'read' : 'unread'}`} style={{
                                position: 'relative',
                                background: notif.read ? 'transparent' : 'rgba(216, 78, 85, 0.04)',
                                borderLeft: notif.read ? 'none' : '4px solid #d84e55'
                            }}>
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
                                        {notif.icon}
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: 0, color: 'var(--text-color, #1e293b)' }}>
                                            {notif.title}
                                        </h3>
                                        <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '4px 0 0' }}>
                                            {notif.message}
                                        </p>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                                            {notif.time}
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

                    <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
                        <button style={{
                            background: 'none',
                            border: '1px solid #cbd5e1',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '12px',
                            color: '#64748b',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}>
                            Clear All Notifications
                        </button>
                    </div>
                </div>
                </div>
            </div>

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
