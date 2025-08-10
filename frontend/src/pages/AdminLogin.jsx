import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post('/auth/login', { email, password });

      const data = res.data;

      if (res.status !== 200) {
        setError(data.error || 'Login failed');
        return;
      }

      localStorage.setItem('token', data.token);

      const decoded = JSON.parse(atob(data.token.split('.')[1]));

      if (decoded.role === 'ADMIN') {
        navigate('/admin');
      } else {
        setError('Access Denied: Not an admin');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#2a2a2a',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '400px',
        border: '2px solid #3b82f6'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '30px',
          textAlign: 'center',
          color: 'white'
        }}>🔐 Admin Login</h2>
        
        <form onSubmit={handleAdminLogin} style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
          <input
            type="email"
            placeholder="Admin Email (try: admin@zylike.com)"
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: '5px',
              backgroundColor: '#404040',
              border: '1px solid #666',
              color: 'white',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password (try: admin123456)"
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: '5px',
              backgroundColor: '#404040',
              border: '1px solid #666',
              color: 'white',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <div style={{
              color: '#ff6b6b',
              fontSize: '14px',
              backgroundColor: '#2d1f1f',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ff6b6b'
            }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            style={{
              width: '100%',
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '15px',
              borderRadius: '5px',
              border: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            Login as Admin
          </button>
        </form>
        
        <div style={{
          marginTop: '30px',
          padding: '15px',
          backgroundColor: '#1a3a1a',
          borderRadius: '5px',
          border: '1px solid #22c55e',
          fontSize: '14px'
        }}>
          <h3 style={{color: '#22c55e', marginBottom: '10px'}}>🔧 First Time Setup:</h3>
          <p style={{marginBottom: '10px'}}>Need to create admin account? Open Console (F12) and run:</p>
          <code style={{
            backgroundColor: '#000',
            padding: '10px',
            borderRadius: '3px',
            display: 'block',
            fontSize: '12px',
            overflowX: 'auto'
          }}>
            fetch('https://zylike-creator-platform-production.up.railway.app/api/auth/create-admin', {'{'}
              method: 'POST',
              headers: {'{'} 'Content-Type': 'application/json' {'}'},
              body: JSON.stringify({'{'}
                name: 'Admin User',
                email: 'admin@zylike.com',
                password: 'admin123456',
                secretKey: 'admin-setup-2024'
              {'}'})
            {'}'}).then(r => r.json()).then(console.log)
          </code>
        </div>
      </div>
    </div>
  );
}
