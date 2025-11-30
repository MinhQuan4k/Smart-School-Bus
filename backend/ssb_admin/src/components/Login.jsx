import { useState } from 'react';
import axios from 'axios';

const Login = ({ onLoginSuccess }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault(); // Chặn web reload
    setError('');

    try {
      const res = await axios.post('http://localhost:3000/api/auth/login', {
        phone,
        password
      });

      if (res.data.success) {
        // 1. Lưu Token vào bộ nhớ trình duyệt (để F5 không bị mất)
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        // 2. Báo cho App cha biết là đã login xong
        onLoginSuccess(res.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Đăng nhập thất bại!");
    }
  };

  return (
    <div style={{ 
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', 
      background: 'linear-gradient(to right, #4facfe, #00f2fe)' 
    }}>
      <div style={{ 
        background: 'white', padding: '40px', borderRadius: '10px', 
        boxShadow: '0 4px 10px rgba(0,0,0,0.2)', width: '350px' 
      }}>
        <h2 style={{ textAlign: 'center', color: '#333' }}>🚍 SSB ADMIN</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>Đăng nhập quản trị viên</p>
        
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '15px' }}>
            <label>Số điện thoại:</label>
            <input 
              type="text" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
              placeholder="Nhập SĐT Admin"
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label>Mật khẩu:</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
              placeholder="Nhập mật khẩu"
            />
          </div>

          <button type="submit" style={{ 
            width: '100%', padding: '12px', background: '#007bff', color: 'white', 
            border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' 
          }}>
            ĐĂNG NHẬP
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;