import { useEffect, useState } from 'react';
import axios from 'axios';
import MapTracking from './MapTracking'; 

const ParentDashboard = ({ user, onLogout }) => {
  const [tripInfo, setTripInfo] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Lấy thông tin chuyến xe của con (Giả sử con ID = 1 để demo)
    // Trong thực tế sẽ gọi API lấy danh sách con của user.id
    axios.get('http://localhost:3000/api/parent/bus-location/1', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      if(res.data.success) setTripInfo(res.data.data);
    })
    .catch(err => console.log("Chưa có thông tin xe"));
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '15px 20px', background: 'white', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 24 }}>👨‍👩‍👧</div>
          <div>
            <div style={{ fontWeight: 'bold', color: '#2563eb' }}>Phụ huynh: {user.full_name}</div>
            <div style={{ fontSize: 12, color: '#666' }}>Theo dõi đưa đón học sinh</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Đăng xuất</button>
      </div>

      {/* Map Content */}
      <div style={{ flex: 1, position: 'relative' }}>
        {tripInfo ? (
          <>
            <MapTracking scheduleId={tripInfo.schedule_id} />
            
            {/* Thẻ thông tin nổi */}
            <div style={{ position: 'absolute', bottom: 20, left: 20, background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 5px 15px rgba(0,0,0,0.2)', zIndex: 1000, width: '300px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#10b981' }}>● ĐANG TRỰC TUYẾN</h4>
              <div style={{ marginBottom: 5 }}><b>Tuyến:</b> {tripInfo.route_name}</div>
              <div style={{ marginBottom: 5 }}><b>Tài xế:</b> {tripInfo.driver_name}</div>
              <div style={{ marginBottom: 5 }}><b>Xe:</b> {tripInfo.license_plate}</div>
              <div style={{ marginTop: 10, fontSize: 12, color: '#666', fontStyle: 'italic' }}>
                Hệ thống tự động cập nhật vị trí mỗi 2 giây.
              </div>
            </div>
          </>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40 }}>😴</div>
              <h3>Hiện tại xe chưa hoạt động</h3>
              <p>Vui lòng quay lại vào giờ đưa đón.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;