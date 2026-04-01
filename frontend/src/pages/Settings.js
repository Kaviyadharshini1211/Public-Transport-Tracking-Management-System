import React, { useState } from 'react';
import '../styles/DashboardPages.css';

const Settings = () => {
    const [settings, setSettings] = useState({
        emailNotifications: true,
        pushNotifications: false,
        darkMode: localStorage.getItem("darkMode") === "true",
        twoFactorAuth: false
    });

    const handleToggle = (key) => {
        const newValue = !settings[key];
        setSettings({ ...settings, [key]: newValue });
        
        if (key === "darkMode") {
            localStorage.setItem("darkMode", newValue);
            document.documentElement.setAttribute("data-theme", newValue ? "dark" : "light");
            // Dispatch event to sync with Navbar
            window.dispatchEvent(new Event("storage"));
        }
    };

    return (
        <div className="dash-page-container">
            <div className="dash-content-wrapper">
                <div className="page-header">
                    <h1 className="page-title">Settings</h1>
                    <p className="page-subtitle">Personalize your account and preferences.</p>
                </div>

                <div className="glass-card">
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--text-color, #1e293b)' }}>
                        General Preferences
                    </h2>
                    
                    <div className="list-container">
                        <div className="list-item">
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>Dark Mode</h3>
                                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0' }}>Adjust the interface for lower light environments.</p>
                            </div>
                            <label className="switch">
                                <input 
                                    type="checkbox" 
                                    checked={settings.darkMode} 
                                    onChange={() => handleToggle("darkMode")}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        <div className="list-item">
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>Email Notifications</h3>
                                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0' }}>Receive updates about your bookings via email.</p>
                            </div>
                            <label className="switch">
                                <input 
                                    type="checkbox" 
                                    checked={settings.emailNotifications} 
                                    onChange={() => handleToggle("emailNotifications")}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        <div className="list-item">
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>Push Notifications</h3>
                                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0' }}>Get real-time alerts on your browser.</p>
                            </div>
                            <label className="switch">
                                <input 
                                    type="checkbox" 
                                    checked={settings.pushNotifications} 
                                    onChange={() => handleToggle("pushNotifications")}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    </div>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '2.5rem', marginBottom: '1.5rem', color: 'var(--text-color, #1e293b)' }}>
                        Security
                    </h2>

                    <div className="list-container">
                        <div className="list-item">
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>Two-Factor Authentication</h3>
                                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0' }}>Add an extra layer of security to your account.</p>
                            </div>
                            <button 
                                className="btn-primary" 
                                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                onClick={() => alert("Security settings would be here.")}
                            >
                                Enable
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 44px;
                    height: 24px;
                }
                .switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #e2e8f0;
                    transition: .4s;
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    transition: .4s;
                }
                input:checked + .slider {
                    background-color: #d84e55;
                }
                input:focus + .slider {
                    box-shadow: 0 0 1px #d84e55;
                }
                input:checked + .slider:before {
                    transform: translateX(20px);
                }
                .slider.round {
                    border-radius: 34px;
                }
                .slider.round:before {
                    border-radius: 50%;
                }
                [data-theme="dark"] .slider {
                    background-color: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    );
};

export default Settings;
