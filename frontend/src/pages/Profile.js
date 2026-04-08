import React, { useState } from 'react';
import API from '../api/api';
import toast from 'react-hot-toast';
import '../styles/DashboardPages.css';

const Profile = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const [formData, setFormData] = useState({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || ""
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const toastId = toast.loading("Updating profile...");

        try {
            const res = await API.put('/users/profile', formData);
            
            // Update local storage
            const updatedUser = { ...user, ...res.data };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            
            toast.success("Profile updated successfully!", { id: toastId });
        } catch (err) {
            console.error("Profile update error:", err);
            toast.error(err.response?.data?.message || "Failed to update profile", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dash-page-container">
            <div className="dash-content-wrapper">
                <div className="page-header">
                    <h1 className="page-title">Personal Profile</h1>
                    <p className="page-subtitle">Manage your personal information and preferences.</p>
                </div>

                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '24px',
                            background: 'linear-gradient(135deg, #d84e55, #e8636a)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem',
                            fontWeight: '800',
                            boxShadow: '0 8px 24px rgba(216, 78, 85, 0.25)'
                        }}>
                            {formData.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-color, #1e293b)', margin: 0 }}>
                                {formData.name}
                            </h2>
                            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Passenger • Membership: Gold</span>
                        </div>
                    </div>

                    <form className="dashboard-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input 
                                type="text" 
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="form-input" 
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input 
                                type="email" 
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="form-input" 
                                placeholder="Enter your email"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input 
                                type="tel" 
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="form-input" 
                                placeholder="Enter your phone number"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Location / Address</label>
                            <input 
                                type="text" 
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="form-input" 
                                placeholder="Enter your location"
                            />
                        </div>

                        <div style={{ marginTop: '1rem' }}>
                            <button 
                                type="submit" 
                                className={`btn-primary ${loading ? 'loading' : ''}`}
                                disabled={loading}
                            >
                                {loading ? 'Saving Changes...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
