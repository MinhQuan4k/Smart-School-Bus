import { useEffect, useState } from 'react';
import axios from 'axios';
import MapTracking from './MapTracking';

const ParentDashboard = ({ user, onLogout }) => {
  const [tripInfo, setTripInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Giả lập lấy thông tin con (ID=1)
    // Thực tế sẽ gọi API danh sách con cái
    axios.get('http://localhost:3000/api/parent/bus-location/1', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => { 
      if(res.data.success) setTripInfo(res.data.data); 
    })
    .catch(err => console.log("Chưa có thông tin chuyến xe"))
    .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mobile-wrapper" style={{background: '#eef2f6', position: 'relative'}}>
      
      {/* --- HEADER NỔI (FLOATING HEADER) --- */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '15px 20px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
      }}>
        <div style={{color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>
          <div style={{fontSize: 12, opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px'}}>Phụ huynh</div>
          <div style={{fontSize: 18, fontWeight: 'bold'}}>{user.full_name}</div>
        </div>
        
        <button 
          onClick={onLogout} 
          style={{
            background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.3)', color: 'white',
            padding: '6px 12px', borderRadius: '20px', cursor: 'pointer',
            fontSize: 12, fontWeight: '600'
          }}
        >
          Thoát
        </button>
      </div>

      {/* --- KHU VỰC BẢN ĐỒ --- */}
      <div style={{flex: 1, height: '100%', position: 'relative'}}>
        {tripInfo ? (
          <>
            {/* MAP COMPONENT */}
            <MapTracking scheduleId={tripInfo.schedule_id} />
            
            {/* --- BOTTOM SHEET (THÔNG TIN XE) --- */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'white', 
              borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
              padding: '25px 20px 30px 20px',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.15)',
              zIndex: 1000,
              animation: 'slideUp 0.4s ease-out'
            }}>
              {/* Thanh nắm kéo giả lập */}
              <div style={{width: 40, height: 4, background: '#e2e8f0', borderRadius: 2, margin: '-10px auto 20px auto'}}></div>

              {/* Trạng thái Live */}
              <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15}}>
                <span className="live-dot"></span>
                <span style={{color: '#10b981', fontWeight: '800', fontSize: 12, letterSpacing: '0.5px'}}>ĐANG DI CHUYỂN</span>
              </div>

              {/* Tên Tuyến */}
              <h2 style={{margin: '0 0 20px 0', color: '#1e293b', fontSize: 20}}>{tripInfo.route_name}</h2>

              {/* Thông tin Tài xế & Xe */}
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15}}>
                
                {/* Card Tài xế */}
                <div style={{background: '#f8fafc', padding: 12, borderRadius: 16, border: '1px solid #f1f5f9'}}>
                  <div style={{fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 4}}>Tài xế</div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                    <div style={{width: 32, height: 32, background: '#dbeafe', color: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'}}>
                      {tripInfo.driver_name.charAt(0)}
                    </div>
                    <div style={{overflow: 'hidden'}}>
                      <div style={{fontWeight: '700', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{tripInfo.driver_name}</div>
                      <div style={{fontSize: 11, color: '#3b82f6'}}>{tripInfo.driver_phone}</div>
                    </div>
                  </div>
                </div>

                {/* Card Xe */}
                <div style={{background: '#f8fafc', padding: 12, borderRadius: 16, border: '1px solid #f1f5f9'}}>
                  <div style={{fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 4}}>Phương tiện</div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                    <div style={{fontSize: 20}}>🚌</div>
                    <div>
                      <div style={{fontWeight: '700', fontSize: 14, color: '#1e293b'}}>{tripInfo.license_plate}</div>
                      <div style={{fontSize: 11, color: '#64748b'}}>{tripInfo.brand}</div>
                    </div>
                  </div>
                </div>

              </div>
              
              {/* Nút gọi (Giả lập) */}
              <button style={{
                marginTop: 20, width: '100%', padding: 14, border: 'none',
                background: '#2563eb', color: 'white', borderRadius: 12,
                fontWeight: 'bold', fontSize: 15, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
              }}>
                📞 Gọi cho Tài xế
              </button>

            </div>
          </>
        ) : (
          // Màn hình chờ (Khi chưa có xe)
          <div style={{height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', background: 'white'}}>
            <div style={{fontSize: 60, marginBottom: 15, opacity: 0.5, animation: 'pulse 2s infinite'}}>😴</div>
            <div style={{fontWeight: '600', fontSize: 16, color: '#334155'}}>Xe chưa hoạt động</div>
            <div style={{fontSize: 13, marginTop: 5, maxWidth: '200px', textAlign: 'center'}}>Vui lòng quay lại vào khung giờ đưa đón học sinh.</div>
          </div>
        )}
      </div>

      {/* CSS ANIMATIONS RIÊNG CHO TRANG NÀY */}
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes pulse-green { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
        .live-dot { width: 8px; height: 8px; background: #10b981; borderRadius: 50%; display: inline-block; animation: pulse-green 1.5s infinite; }
      `}</style>
    </div>
  );
};

export default ParentDashboard;