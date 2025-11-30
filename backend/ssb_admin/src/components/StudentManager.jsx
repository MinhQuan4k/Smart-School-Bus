import { useEffect, useState } from 'react';
import axios from 'axios';

const StudentManager = () => {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ 
    full_name: '', 
    parent_id: '', 
    class_name: '', 
    pickup_address: '' 
  });
  
  const token = localStorage.getItem('token');

  // Lấy danh sách học sinh
  const fetchStudents = () => {
    axios.get('http://localhost:3000/api/students', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setStudents(res.data.data))
    .catch(err => console.error("Lỗi tải danh sách học sinh"));
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Xử lý Thêm mới
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate cơ bản
    if(!form.full_name || !form.parent_id) return alert("Tên và ID Phụ huynh là bắt buộc!");

    try {
      await axios.post('http://localhost:3000/api/students', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("✅ Thêm học sinh thành công!");
      setForm({ full_name: '', parent_id: '', class_name: '', pickup_address: '' }); // Reset
      fetchStudents(); // Load lại
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.error || err.message));
    }
  };

  // Xử lý Xóa
  const handleDelete = async (id) => {
    if(!window.confirm("Xóa học sinh này?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchStudents();
    } catch (err) {
      alert("Lỗi khi xóa.");
    }
  };

  return (
    <div style={{ padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', color: '#2563eb' }}>🎓 Quản lý Học sinh</h2>

      {/* FORM NHẬP LIỆU */}
      <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #e2e8f0' }}>
        <h4 style={{ marginTop: 0 }}>Thêm học sinh mới</h4>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          
          <input 
            placeholder="Họ và Tên (*)" 
            value={form.full_name}
            onChange={e => setForm({...form, full_name: e.target.value})}
            style={inputStyle}
          />
          
          <input 
            type="number"
            placeholder="ID Phụ huynh (VD: 4)" 
            value={form.parent_id}
            onChange={e => setForm({...form, parent_id: e.target.value})}
            style={inputStyle}
          />

          <input 
            placeholder="Lớp (VD: 1A)" 
            value={form.class_name}
            onChange={e => setForm({...form, class_name: e.target.value})}
            style={inputStyle}
          />

          <input 
            placeholder="Địa chỉ đón" 
            value={form.pickup_address}
            onChange={e => setForm({...form, pickup_address: e.target.value})}
            style={inputStyle}
          />

          <button type="submit" style={{ gridColumn: 'span 2', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            + Lưu Học Sinh
          </button>
        </form>
        <p style={{fontSize: '12px', color: '#64748b', marginTop: '10px'}}>* Lưu ý: ID Phụ huynh phải là ID của User có role 'parent' trong bảng Users.</p>
      </div>

      {/* BẢNG DANH SÁCH */}
      <div className="table-container">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#475569' }}>
              <th style={{ padding: '12px' }}>ID</th>
              <th>Họ Tên</th>
              <th>Lớp</th>
              <th>Phụ Huynh (SĐT)</th>
              <th>Địa chỉ đón</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.student_id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{s.student_id}</td>
                <td style={{ color: '#2563eb', fontWeight: '600' }}>{s.full_name}</td>
                <td><span className="badge pending" style={{color: '#333'}}>{s.class_name}</span></td>
                <td>
                  <div>{s.parent_name}</div>
                  <div style={{fontSize: '12px', color: '#64748b'}}>{s.parent_phone}</div>
                </td>
                <td style={{ maxWidth: '200px', fontSize: '13px' }}>{s.pickup_address}</td>
                <td>
                  <button 
                    onClick={() => handleDelete(s.student_id)}
                    style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const inputStyle = {
  padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none'
};

export default StudentManager;