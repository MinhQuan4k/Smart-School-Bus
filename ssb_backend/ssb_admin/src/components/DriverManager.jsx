import { useEffect, useState } from 'react';
import axios from 'axios';

const DriverManager = () => {
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState({ full_name: '', phone: '', password: '123' });
  const token = localStorage.getItem('token');

  // Lấy danh sách tài xế
  const fetchDrivers = () => {
    axios.get('http://localhost:3000/api/users/drivers', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setDrivers(res.data.data))
    .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  // Tạo tài xế mới
  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!form.full_name || !form.phone) return alert("Nhập đủ thông tin!");

    try {
      await axios.post('http://localhost:3000/api/users/drivers', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("✅ Tạo tài xế thành công! Mật khẩu mặc định: 123");
      setForm({ full_name: '', phone: '', password: '123' });
      fetchDrivers();
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.error || err.message));
    }
  };

  // Xóa tài xế
  const handleDelete = async (id) => {
    if(!window.confirm("Bạn muốn xóa tài khoản này?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDrivers();
    } catch (err) {
      alert("Lỗi khi xóa.");
    }
  };

  return (
    <div style={{ padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', color: '#2563eb' }}>👨‍✈️ Quản lý Tài xế</h2>

      <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #e2e8f0' }}>
        <h4 style={{ marginTop: 0 }}>Tạo tài khoản Tài xế</h4>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input 
            placeholder="Họ tên tài xế" 
            value={form.full_name}
            onChange={e => setForm({...form, full_name: e.target.value})}
            style={inputStyle}
          />
          <input 
            placeholder="Số điện thoại (Login ID)" 
            value={form.phone}
            onChange={e => setForm({...form, phone: e.target.value})}
            style={inputStyle}
          />
          <input 
            placeholder="Mật khẩu (Mặc định 123)" 
            value={form.password}
            onChange={e => setForm({...form, password: e.target.value})}
            style={inputStyle}
          />
          <button type="submit" style={btnStyle}>+ Tạo mới</button>
        </form>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#475569' }}>
            <th style={{ padding: '12px' }}>ID</th>
            <th>Họ Tên</th>
            <th>Số điện thoại</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {drivers.map(d => (
            <tr key={d.user_id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px' }}>{d.user_id}</td>
              <td style={{ fontWeight: 'bold' }}>{d.full_name}</td>
              <td>{d.phone}</td>
              <td>
                <button onClick={() => handleDelete(d.user_id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const inputStyle = { padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' };
const btnStyle = { padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' };

export default DriverManager;