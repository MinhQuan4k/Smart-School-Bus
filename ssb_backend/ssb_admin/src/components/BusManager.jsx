import { useEffect, useState } from 'react';
import axios from 'axios';

const BusManager = () => {
  const [buses, setBuses] = useState([]);
  const [form, setForm] = useState({ license_plate: '', brand: '', capacity: '16' });
  const token = localStorage.getItem('token');

  // Lấy danh sách xe
  const fetchBuses = () => {
    axios.get('http://localhost:3000/api/buses', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setBuses(res.data.data))
    .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchBuses();
  }, []);

  // Thêm xe mới
  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!form.license_plate) return alert("Biển số xe là bắt buộc!");

    try {
      await axios.post('http://localhost:3000/api/buses', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("✅ Thêm xe thành công!");
      setForm({ license_plate: '', brand: '', capacity: '16' });
      fetchBuses();
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.error || err.message));
    }
  };

  // Xóa xe
  const handleDelete = async (id) => {
    if(!window.confirm("Xóa xe này?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/buses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBuses();
    } catch (err) {
      alert("Lỗi khi xóa (Có thể xe đang được phân công chạy).");
    }
  };

  return (
    <div style={{ padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', color: '#2563eb' }}>🚌 Quản lý Xe Buýt</h2>

      {/* FORM */}
      <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #e2e8f0' }}>
        <h4 style={{ marginTop: 0 }}>Thêm xe mới</h4>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input 
            placeholder="Biển số (VD: 59B-123.45)" 
            value={form.license_plate}
            onChange={e => setForm({...form, license_plate: e.target.value})}
            style={inputStyle}
          />
          <input 
            placeholder="Hiệu xe (Ford, Hyundai...)" 
            value={form.brand}
            onChange={e => setForm({...form, brand: e.target.value})}
            style={inputStyle}
          />
          <select 
            value={form.capacity}
            onChange={e => setForm({...form, capacity: e.target.value})}
            style={inputStyle}
          >
            <option value="16">16 Chỗ</option>
            <option value="29">29 Chỗ</option>
            <option value="45">45 Chỗ</option>
          </select>
          <button type="submit" style={btnStyle}>+ Lưu Xe</button>
        </form>
      </div>

      {/* DANH SÁCH */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#475569' }}>
            <th style={{ padding: '12px' }}>ID</th>
            <th>Biển số</th>
            <th>Hiệu xe</th>
            <th>Số chỗ</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {buses.map(b => (
            <tr key={b.bus_id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '12px' }}>{b.bus_id}</td>
              <td style={{ fontWeight: 'bold', color: '#2563eb' }}>{b.license_plate}</td>
              <td>{b.brand}</td>
              <td>{b.capacity}</td>
              <td><span style={{ color: 'green', fontWeight: 'bold' }}>{b.status}</span></td>
              <td>
                <button onClick={() => handleDelete(b.bus_id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Xóa</button>
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

export default BusManager;