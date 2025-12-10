import { useEffect, useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- FIX LỖI ICON LEAFLET ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- COMPONENT CON: BẮT SỰ KIỆN CLICK TRÊN BẢN ĐỒ ---
const LocationMarker = ({ setForm, position }) => {
  useMapEvents({
    click(e) {
      // Khi click vào bản đồ, cập nhật form
      setForm(prev => ({
        ...prev,
        latitude: e.latlng.lat.toFixed(6), // Lấy 6 số thập phân
        longitude: e.latlng.lng.toFixed(6)
      }));
    },
  });

  // Nếu có tọa độ thì hiện marker, không thì thôi
  return position ? <Marker position={position} /> : null;
};

// --- COMPONENT CHÍNH ---
const StopManager = () => {
  const [stops, setStops] = useState([]);
  const [form, setForm] = useState({ name: '', address: '', latitude: '', longitude: '' });
  const token = localStorage.getItem('token');

  const fetchStops = () => {
    axios.get('http://localhost:3000/api/stops', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setStops(res.data.data)).catch(console.error);
  };

  useEffect(() => { fetchStops(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!form.name || !form.latitude || !form.longitude) return alert("Vui lòng chọn vị trí trên bản đồ!");

    try {
      await axios.post('http://localhost:3000/api/stops', form, { headers: { Authorization: `Bearer ${token}` } });
      alert("✅ Đã tạo trạm mới!");
      setForm({ name: '', address: '', latitude: '', longitude: '' }); // Reset
      fetchStops();
    } catch (err) { alert("Lỗi: " + err.message); }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Xóa trạm này?")) {
      await axios.delete(`http://localhost:3000/api/stops/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchStops();
    }
  };

  // Xác định vị trí marker hiện tại để hiển thị trên bản đồ
  const currentPosition = (form.latitude && form.longitude) 
    ? [parseFloat(form.latitude), parseFloat(form.longitude)] 
    : null;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: 50 }}>
      
      {/* FORM THÊM TRẠM */}
      <div style={{ padding: 20, background: 'white', borderRadius: 12, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: 15, color: '#2563eb' }}>🚏 Quản lý Trạm Dừng</h2>

        <div style={{ display: 'flex', gap: 20 }}>
          
          {/* CỘT TRÁI: INPUT */}
          <div style={{ flex: 1 }}>
            <div style={{ background: '#f8fafc', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <h4 style={{marginTop:0}}>Thông tin Trạm</h4>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <div>
                    <label style={labelStyle}>Tên Trạm (*)</label>
                    <input placeholder="VD: Cổng Siêu Thị Go" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={inputStyle} />
                </div>
                <div>
                    <label style={labelStyle}>Địa chỉ mô tả</label>
                    <input placeholder="Số nhà, đường..." value={form.address} onChange={e => setForm({...form, address: e.target.value})} style={inputStyle} />
                </div>
                <div style={{display:'flex', gap: 10}}>
                    <div style={{flex:1}}>
                        <label style={labelStyle}>Vĩ độ (Lat)</label>
                        <input value={form.latitude} readOnly style={{...inputStyle, background:'#e2e8f0'}} />
                    </div>
                    <div style={{flex:1}}>
                        <label style={labelStyle}>Kinh độ (Lng)</label>
                        <input value={form.longitude} readOnly style={{...inputStyle, background:'#e2e8f0'}} />
                    </div>
                </div>
                <p style={{fontSize: 12, color: '#ef4444', fontStyle:'italic'}}>* Click vào bản đồ bên phải để lấy tọa độ tự động.</p>
                
                <button type="submit" style={{ padding: 12, background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}>+ Lưu Trạm</button>
              </form>
            </div>
          </div>

          {/* CỘT PHẢI: BẢN ĐỒ CHỌN VỊ TRÍ */}
          <div style={{ flex: 1, height: '400px', borderRadius: 12, overflow: 'hidden', border: '2px solid #2563eb' }}>
            <MapContainer center={[10.762622, 106.660172]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                <LocationMarker setForm={setForm} position={currentPosition} />
            </MapContainer>
          </div>

        </div>
      </div>

      {/* DANH SÁCH TRẠM */}
      <div style={{ marginTop: 25, background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#334155' }}>Danh sách trạm đã tạo ({stops.length})</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#f1f5f9', textAlign: 'left' }}><th style={{padding:12}}>Tên Trạm</th><th>Địa chỉ</th><th>Tọa độ</th><th>Hành Động</th></tr></thead>
          <tbody>
            {stops.map(s => (
              <tr key={s.stop_id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{padding:12, fontWeight:'bold', color:'#2563eb'}}>{s.name}</td>
                <td>{s.address}</td>
                <td style={{fontSize: 12, fontFamily: 'monospace'}}>{s.latitude}, {s.longitude}</td>
                <td><button onClick={() => handleDelete(s.stop_id)} style={{background: '#fee2e2', color: '#ef4444', border: 'none', padding: '5px 10px', borderRadius: 4, cursor: 'pointer', fontWeight:'bold'}}>Xóa</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

const labelStyle = { display: 'block', marginBottom: 5, fontSize: 12, fontWeight: 'bold', color: '#64748b' };
const inputStyle = { width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6, boxSizing: 'border-box' };

export default StopManager;