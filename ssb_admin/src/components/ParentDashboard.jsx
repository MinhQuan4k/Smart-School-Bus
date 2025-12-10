import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import MapTracking from './MapTracking';
import io from 'socket.io-client';

// Hàm tính khoảng cách (Km)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function deg2rad(deg) { return deg * (Math.PI / 180); }

const ParentDashboard = ({ user, onLogout }) => {
  const [tripInfo, setTripInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  
  const token = localStorage.getItem('token');
  const socketRef = useRef(null);

  // Hàm tải dữ liệu (Tách ra để dùng lại cho nút Retry)
  const fetchChildTrip = async () => {
    setLoading(true);
    setErrorMsg('');
    setTripInfo(null);
    setEta(null);
    
    if (!user || !user.id || !token) {
      setLoading(false);
      return;
    }

    try {
      // 1. Lấy danh sách học sinh để tìm con của mình
      const studentsRes = await axios.get('http://localhost:3000/api/students', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (studentsRes.data.success && Array.isArray(studentsRes.data.data)) {
        // Tìm bé có parent_id trùng với ID của user đang đăng nhập
        const myChild = studentsRes.data.data.find(s => String(s.parent_id) === String(user.id));

        if (myChild) {
          console.log(">> Đang theo dõi bé:", myChild.full_name);
          
          // 2. Gọi API lấy vị trí xe cho bé đó
          const res = await axios.get(`http://localhost:3000/api/parent/bus-location/${myChild.student_id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (res.data.success) {
            setTripInfo(res.data.data);
          } else {
            setErrorMsg(res.data.message || "Không tìm thấy thông tin chuyến xe.");
          }
        } else {
          setErrorMsg("Tài khoản này chưa được liên kết với hồ sơ học sinh nào.");
        }
      }
    } catch (err) {
      console.error("Lỗi:", err);
      if (err.response?.status === 403) setErrorMsg("Bạn không có quyền truy cập dữ liệu này.");
      else setErrorMsg("Hiện tại xe chưa hoạt động hoặc lỗi kết nối.");
    } finally {
      setLoading(false);
    }
  };

  // Gọi lần đầu khi component load
  useEffect(() => {
    fetchChildTrip();
  }, [user]);

  // Kết nối Socket để tính ETA
  useEffect(() => {
    if (!tripInfo?.schedule_id) return;

    socketRef.current = io('http://localhost:3000');
    socketRef.current.emit('join_trip', { schedule_id: tripInfo.schedule_id });

    socketRef.current.on('update_location', (data) => {
      if (tripInfo.stop_lat && tripInfo.stop_lng && data.lat && data.lng) {
        const distKm = getDistanceFromLatLonInKm(data.lat, data.lng, tripInfo.stop_lat, tripInfo.stop_lng);
        setDistance(distKm.toFixed(1));

        const currentSpeed = data.speed > 5 ? data.speed : 20; 
        const timeMinutes = (distKm / currentSpeed) * 60;
        setEta(Math.ceil(timeMinutes));
      }
    });

    return () => {
      if(socketRef.current) socketRef.current.disconnect();
    };
  }, [tripInfo]);

  return (
    <div className="mobile-wrapper" style={{background: '#eef2f6', position: 'relative'}}>
      
      {/* HEADER */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '15px 20px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
      }}>
        <div style={{color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.8)'}}>
          <div style={{fontSize: 12, opacity: 0.9, textTransform: 'uppercase'}}>Phụ huynh</div>
          <div style={{fontSize: 18, fontWeight: 'bold'}}>{user?.full_name || 'Khách'}</div>
        </div>
        <button onClick={onLogout} style={{background:'rgba(255,255,255,0.25)', border:'1px solid white', color:'white', padding:'6px 12px', borderRadius:20, cursor:'pointer', fontWeight:'bold', fontSize: 12}}>Thoát</button>
      </div>

      {/* CONTENT */}
      <div style={{flex: 1, height: '100%', position: 'relative'}}>
        {loading ? (
          <div style={{height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b'}}>
            <div className="spinner" style={{width: 30, height: 30, border: '3px solid #ccc', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s infinite', marginBottom: 15}}></div>
            Đang tải dữ liệu xe...
          </div>
        ) : tripInfo ? (
          <>
            <MapTracking scheduleId={tripInfo?.schedule_id} routeId={null} />
            
            {/* THẺ THÔNG TIN */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: '25px 20px 30px 20px',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.15)',
              zIndex: 1000,
              animation: 'slideUp 0.4s ease-out'
            }}>
              
              {eta !== null && (
                <div style={{
                  background: eta < 5 ? '#dcfce7' : '#e0f2fe', 
                  color: eta < 5 ? '#166534' : '#0369a1',
                  padding: '12px 15px', borderRadius: 12, marginBottom: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  border: `1px solid ${eta < 5 ? '#86efac' : '#bae6fd'}`
                }}>
                  <div style={{display:'flex', alignItems:'center', gap: 10}}>
                    <span style={{fontSize: 20}}>{eta < 5 ? '🏃' : '⏱️'}</span>
                    <div>
                      <div style={{fontWeight: '800', fontSize: 14}}>{eta <= 1 ? 'XE SẮP ĐẾN NƠI!' : `Dự kiến: ${eta} phút`}</div>
                      <div style={{fontSize: 12, opacity: 0.8}}>Cách trạm: <b>{distance} km</b></div>
                    </div>
                  </div>
                  <div style={{fontWeight: '900', fontSize: 20}}>{eta}'</div>
                </div>
              )}

              <h2 style={{margin: '0 0 15px 0', color: '#1e293b', fontSize: 18, display:'flex', alignItems:'center', gap:8}}>
                <span style={{fontSize:14, background:'#f3f4f6', padding:'4px 8px', borderRadius:6}}>🚌</span>
                {tripInfo?.route_name || 'Tuyến xe'}
              </h2>
              
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15}}>
                 <div style={{background: '#f8fafc', padding: 12, borderRadius: 12, border: '1px solid #f1f5f9'}}>
                    <div style={{fontSize: 11, color: '#64748b', textTransform: 'uppercase'}}>TRẠM ĐÓN</div>
                    <div style={{fontWeight: 'bold', color: '#2563eb', marginTop: 4}}>{tripInfo.stop_name || 'Chưa rõ'}</div>
                 </div>
                 <div style={{background: '#f8fafc', padding: 12, borderRadius: 12, border: '1px solid #f1f5f9'}}>
                    <div style={{fontSize: 11, color: '#64748b', textTransform: 'uppercase'}}>BIỂN SỐ XE</div>
                    <div style={{fontWeight: 'bold', color: '#334155', marginTop: 4}}>{tripInfo.license_plate}</div>
                 </div>
              </div>

              <div style={{marginTop: 15, fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5}}>
                 <span>👨‍✈️ Tài xế: <b>{tripInfo.driver_name}</b></span> • <span>📞 {tripInfo.driver_phone}</span>
              </div>
            </div>
          </>
        ) : (
          <div style={{height:'100%', display:'flex', justifyContent:'center', alignItems:'center', color:'#94a3b8', flexDirection:'column', padding: 30, textAlign: 'center'}}>
             <div style={{fontSize: 60, marginBottom: 15, opacity: 0.5}}>😴</div>
             <h3 style={{margin: 0, color: '#475569'}}>Xe chưa hoạt động</h3>
             <p style={{fontSize: 14, marginTop: 5, color: '#ef4444'}}>{errorMsg}</p>
             
             <button 
                onClick={fetchChildTrip}
                style={{marginTop: 20, padding: '10px 25px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)'}}
             >
                🔄 Thử lại ngay
             </button>
          </div>
        )}
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ParentDashboard;