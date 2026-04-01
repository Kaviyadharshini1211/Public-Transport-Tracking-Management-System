import React from 'react';
import '../styles/DashboardPages.css';

const Favorites = () => {
    const favorites = [
        { id: 1, from: 'Mumbai', to: 'Pune', type: 'Express', frequency: 'Daily', price: '₹450' },
        { id: 2, from: 'Delhi', to: 'Chandigarh', type: 'Sleeper', frequency: 'Wed, Fri, Sun', price: '₹850' },
        { id: 3, from: 'Bangalore', to: 'Mysore', type: 'AC Volva', frequency: 'Daily', price: '₹350' },
    ];

    return (
        <div className="dash-page-container">
            <div className="dash-content-wrapper">
                <div className="page-header">
                    <h1 className="page-title">Favorite Routes</h1>
                    <p className="page-subtitle">Your most traveled paths for quicker bookings.</p>
                </div>

                <div className="glass-card">
                    {favorites.length > 0 ? (
                        <div className="list-container">
                            {favorites.map((route) => (
                                <div key={route.id} className="list-item">
                                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                                        <div style={{
                                            width: '52px',
                                            height: '52px',
                                            borderRadius: '16px',
                                            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.1))',
                                            color: '#22c55e',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.5rem',
                                            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.08)'
                                        }}>
                                            ⭐
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, color: 'var(--text-color, #1e293b)' }}>
                                                {route.from} ↔ {route.to}
                                            </h3>
                                            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '4px 0 0' }}>
                                                {route.type} • {route.frequency}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1rem', fontWeight: '800', color: '#1e293b' }}>{route.price}</div>
                                        <button 
                                            className="btn-primary" 
                                            style={{ padding: '0.4rem 0.9rem', fontSize: '0.75rem', marginTop: '0.5rem', background: '#d84e55' }}
                                            onClick={() => alert("Quick booking for this route would start here.")}
                                        >
                                            Book Now
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⭐</div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>No Favorites Yet</h3>
                            <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>Start marking routes as favorite to see them here!</p>
                        </div>
                    )}

                    <div style={{ marginTop: '2.5rem', textAlign: 'center', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1.5rem' }}>
                        <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                            Saving routes helps you skip the search process next time you travel.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Favorites;
