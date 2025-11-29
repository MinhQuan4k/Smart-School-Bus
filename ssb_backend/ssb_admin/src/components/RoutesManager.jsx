import { useEffect, useState } from 'react';
import axios from 'axios';

const RoutesManager = () => {
  const [routes, setRoutes] = useState([]);
  const [form, setForm] = useState({ route_name: '', start_point: '', end_point: '' });
  const token = localStorage.getItem('token');

  // Lấy danh sách tuyến
  const fetchRoutes = () => {
    axios.get('http://localhost:3000/api/routes', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setRoutes(res.data.data))
    .catch(err => console.error("Lỗi tải danh sách tuyến"));
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  // Xử lý Thêm mới
  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!form.route_name || !form.start_point || !form.end_point) return alert("Vui lòng nhập đủ thông tin!");

    try {
      await axios.post('http://localhost:3000/api/routes', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("✅ Thêm tuyến thành công!");
      setForm({ route_name: '', start_point: '', end_point: '' }); // Reset form
      fetchRoutes(); // Load lại danh sách
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.error || err.message));
    }
  };

  // Xử lý Xóa
  const handleDelete = async (id) => {
    if(!window.confirm("Bạn chắc chắn muốn xóa tuyến này?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/routes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRoutes();
    } catch (err) {
      alert("Không thể xóa tuyến này (có thể đang có lịch chạy).");
    }
  };

  return (
    <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
      <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', color: '#2563eb' }}>🛣️ Quản lý Tuyến đường</h2>

      {/* FORM THÊM MỚI */}
      <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h4>Thêm tuyến mới</h4>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input 
            placeholder="Tên tuyến (VD: Tuyến 01)" 
            value={form.route_name}
            onChange={e => setForm({...form, route_name: e.target.value})}
            style={{ padding: '8px', flex: 1, border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <input 
            placeholder="Điểm đầu" 
            value={form.start_point}
            onChange={e => setForm({...form, start_point: e.target.value})}
            style={{ padding: '8px', flex: 1, border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <input 
            placeholder="Điểm cuối" 
            value={form.end_point}
            onChange={e => setForm({...form, end_point: e.target.value})}
            style={{ padding: '8px', flex: 1, border: '1px solid #ddd', borderRadius: '4px' }}
          />
          <button type="submit" style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>
            + Lưu
          </button>
        </form>
      </div>

      {/* DANH SÁCH */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#eee', textAlign: 'left' }}>
            <th style={{ padding: '10px' }}>ID</th>
            <th>Tên tuyến</th>
            <th>Điểm đầu</th>
            <th>Điểm cuối</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {routes.map(r => (
            <tr key={r.route_id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>{r.route_id}</td>
              <td style={{ fontWeight: 'bold', color: '#2563eb' }}>{r.route_name}</td>
              <td>{r.start_point}</td>
              <td>{r.end_point}</td>
              <td>
                <button 
                  onClick={() => handleDelete(r.route_id)}
                  style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RoutesManager;