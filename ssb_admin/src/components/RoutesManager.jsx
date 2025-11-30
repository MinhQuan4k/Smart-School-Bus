import { useEffect, useState } from 'react';
import axios from 'axios';

const RoutesManager = () => {
  const [routes, setRoutes] = useState([]);
  
  // State quản lý Form
  const [form, setForm] = useState({ 
    route_name: '', 
    start_point: '', 
    end_point: '', 
    estimated_duration: '60' 
  });
  
  // State quản lý chế độ Sửa (Lưu ID của tuyến đang sửa)
  const [editingId, setEditingId] = useState(null);
  
  const token = localStorage.getItem('token');

  // Lấy danh sách tuyến từ API
  const fetchRoutes = () => {
    axios.get('http://localhost:3000/api/routes', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setRoutes(res.data.data))
    .catch(err => console.error("Lỗi tải danh sách tuyến"));
  };

  useEffect(() => { fetchRoutes(); }, []);

  // Xử lý Gửi Form (Thêm mới HOẶC Cập nhật)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!form.route_name || !form.start_point || !form.end_point) return alert("Vui lòng nhập đủ thông tin!");

    try {
      if (editingId) {
        // --- TRƯỜNG HỢP SỬA (UPDATE) ---
        await axios.put(`http://localhost:3000/api/routes/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("✅ Đã cập nhật tuyến đường thành công!");
        setEditingId(null); // Thoát chế độ sửa
      } else {
        // --- TRƯỜNG HỢP THÊM MỚI (CREATE) ---
        await axios.post('http://localhost:3000/api/routes', form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("✅ Thêm tuyến mới thành công!");
      }

      // Reset form về mặc định và tải lại danh sách
      setForm({ route_name: '', start_point: '', end_point: '', estimated_duration: '60' }); 
      fetchRoutes();

    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.error || err.message));
    }
  };

  // Khi bấm nút "Sửa" trên bảng
  const handleEdit = (item) => {
    setEditingId(item.route_id); // Đánh dấu đang sửa ID này
    // Điền thông tin cũ vào form
    setForm({
      route_name: item.route_name,
      start_point: item.start_point,
      end_point: item.end_point,
      estimated_duration: item.estimated_duration
    });
    // Cuộn màn hình lên đầu để thấy form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Khi bấm nút "Hủy" chế độ sửa
  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ route_name: '', start_point: '', end_point: '', estimated_duration: '60' });
  };

  // Xử lý Xóa tuyến
  const handleDelete = async (id) => {
    if(!window.confirm("Bạn có chắc chắn muốn xóa tuyến này không?")) return;
    try {
      await axios.delete(`http://localhost:3000/api/routes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRoutes();
    } catch (err) {
      alert("Không thể xóa tuyến này (Có thể đang có lịch chạy hoạt động).");
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* --- PHẦN 1: FORM NHẬP LIỆU --- */}
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={{ fontSize: '24px' }}>🛣️</div>
          <div>
            <h3 style={{ margin: 0, color: '#1e293b' }}>
              {editingId ? '✏️ Chỉnh Sửa Tuyến Đường' : '✨ Thêm Tuyến Đường Mới'}
            </h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Thiết lập lộ trình và thời gian dự kiến</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {/* Hàng 1: Tên tuyến & Thời gian */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={labelStyle}>Tên Tuyến (*)</label>
              <input 
                placeholder="Ví dụ: Tuyến 01 - Quận 7 đi Quận 1" 
                value={form.route_name}
                onChange={e => setForm({...form, route_name: e.target.value})}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Thời gian dự kiến (phút)</label>
              <input 
                type="number"
                value={form.estimated_duration}
                onChange={e => setForm({...form, estimated_duration: e.target.value})}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Hàng 2: Điểm đầu & Điểm cuối */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>📍 Điểm Bắt Đầu</label>
              <input 
                placeholder="Nhập địa chỉ..." 
                value={form.start_point}
                onChange={e => setForm({...form, start_point: e.target.value})}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>🏁 Điểm Kết Thúc</label>
              <input 
                placeholder="Nhập địa chỉ..." 
                value={form.end_point}
                onChange={e => setForm({...form, end_point: e.target.value})}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Nút bấm */}
          <div style={{display: 'flex', gap: '10px'}}>
            <button type="submit" style={{...btnPrimary, background: editingId ? '#f97316' : '#2563eb'}}>
              {editingId ? '💾 Cập Nhật' : '+ Lưu Tuyến Đường'}
            </button>
            
            {editingId && (
              <button type="button" onClick={handleCancelEdit} style={btnCancel}>
                Hủy bỏ
              </button>
            )}
          </div>
        </form>
      </div>

      {/* --- PHẦN 2: DANH SÁCH TUYẾN --- */}
      <div style={{ ...cardStyle, marginTop: '25px', padding: '0' }}>
        <div style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <h4 style={{ margin: 0, color: '#334155' }}>Danh sách các tuyến hiện có ({routes.length})</h4>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Tên Tuyến</th>
              <th style={thStyle}>Lộ Trình</th>
              <th style={thStyle}>Thời Gian</th>
              <th style={thStyle}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {routes.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign:'center', padding:'20px', color:'#999'}}>Chưa có tuyến đường nào.</td></tr>
            ) : (
              routes.map((r, index) => (
                <tr key={r.route_id} style={{ borderBottom: '1px solid #f1f5f9', background: index % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={tdStyle}>#{r.route_id}</td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: '600', color: '#2563eb' }}>{r.route_name}</div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>A</span>
                      <span>{r.start_point}</span>
                    </div>
                    <div style={{ borderLeft: '2px dashed #cbd5e1', height: '10px', margin: '2px 0 2px 4px' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <span style={{ color: '#ef4444', fontWeight: 'bold' }}>B</span>
                      <span>{r.end_point}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={timeBadge}>
                      ⏱ {r.estimated_duration} phút
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{display: 'flex', gap: '5px'}}>
                      <button onClick={() => handleEdit(r)} style={{...actionBtn, color: '#f59e0b'}}>Sửa</button>
                      <button onClick={() => handleDelete(r.route_id)} style={{...actionBtn, color: '#ef4444'}}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- STYLES (CSS-in-JS) ---
const cardStyle = {
  background: 'white', borderRadius: '12px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  overflow: 'hidden', border: '1px solid #e2e8f0'
};
const headerStyle = {
  background: '#f8fafc', padding: '20px', borderBottom: '1px solid #e2e8f0',
  display: 'flex', alignItems: 'center', gap: '15px'
};
const labelStyle = {
  display: 'block', marginBottom: '6px', fontSize: '13px',
  fontWeight: '600', color: '#475569', textTransform: 'uppercase'
};
const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: '6px',
  border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s',
};
const btnPrimary = {
  width: '100%', padding: '12px', color: 'white', border: 'none',
  borderRadius: '6px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer',
  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)', transition: '0.2s', flex: 1
};
const btnCancel = {
  padding: '12px 20px', background: '#e2e8f0', color: '#475569',
  border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'
};
const actionBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontWeight: 'bold', fontSize: '13px', padding: '5px 10px'
};
const thStyle = { padding: '15px', textAlign: 'left' };
const tdStyle = { padding: '15px' };
const timeBadge = {
  background: '#e0f2fe', color: '#0369a1', padding: '4px 10px',
  borderRadius: '20px', fontSize: '12px', fontWeight: '700'
};

export default RoutesManager;