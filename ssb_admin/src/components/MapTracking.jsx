import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import io from 'socket.io-client';
import axios from 'axios';

// --- CONFIG ICONS ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// 1. Icon Xe Buýt (Hình ảnh sinh động)
const BusIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
    iconSize: [45, 45],
    iconAnchor: [22, 45],
    popupAnchor: [0, -40]
});

// 2. Icon Trạm Dừng (Chấm tròn đỏ css thuần - load nhanh)
const StopIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="
    background-color: #ef4444;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10]
});

// 3. Fix lỗi icon mặc định của Leaflet trong React
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Kết nối Socket (1 lần duy nhất)
const socket = io('http://localhost:3000');

// Component phụ: Tự động zoom bản đồ
function ChangeView({ center, bounds }) {
  const map = useMap();
  
  // Ưu tiên 1: Nếu có bounds (danh sách trạm), zoom bao quát toàn bộ lộ trình
  if (bounds && bounds.length > 0) {
    try {
      // Chỉ zoom 1 lần đầu khi mới load trạm để tránh giật khi xe chạy
      // (Logic này có thể tùy chỉnh nếu muốn camera luôn bám theo xe)
      const latLngBounds = L.latLngBounds(bounds);
      map.fitBounds(latLngBounds, { padding: [50, 50] }); 
    } catch (e) { /* Bỏ qua lỗi nếu bounds chưa chuẩn */ }
  } 
  // Ưu tiên 2: Nếu chưa có lộ trình mà có xe, pan camera tới xe
  else if (center && Array.isArray(center) && center.length === 2) {
    map.setView(center);
  }
  return null;
}

const MapTracking = ({ scheduleId, routeId }) => {
  const [busPos, setBusPos] = useState(null); // Vị trí xe (null = chưa có tín hiệu)
  const [speed, setSpeed] = useState(0);
  const [stops, setStops] = useState([]);     // Danh sách trạm
  const [routePath, setRoutePath] = useState([]); // Đường vẽ nối các trạm
  const [loadingRoute, setLoadingRoute] = useState(false);
  
  const token = localStorage.getItem('token');

  // 1. Lấy dữ liệu TRẠM & LỘ TRÌNH (Chạy khi routeId thay đổi)
  useEffect(() => {
    if (routeId) {
      setLoadingRoute(true);
      axios.get(`http://localhost:3000/api/routes/${routeId}/stops`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (res.data.success) {
          const stopList = res.data.data;
          setStops(stopList);
          // Tạo mảng tọa độ [lat, lng] để vẽ đường Polyline
          const path = stopList.map(s => [parseFloat(s.latitude), parseFloat(s.longitude)]);
          setRoutePath(path);
        }
      })
      .catch(err => console.error("Lỗi tải lộ trình:", err))
      .finally(() => setLoadingRoute(false));
    } else {
      // Nếu không có routeId (xe chưa gán tuyến), reset trạm
      setStops([]);
      setRoutePath([]);
    }
  }, [routeId, token]);

  // 2. Real-time Tracking Xe (Chạy khi scheduleId thay đổi)
  useEffect(() => {
    if (!scheduleId) return;

    // Tham gia phòng Socket
    socket.emit('join_trip', { schedule_id: scheduleId });

    // Hàm xử lý khi nhận tọa độ mới
    const handleLocationUpdate = (data) => {
      if (data && typeof data.lat === 'number' && typeof data.lng === 'number') {
        setBusPos([data.lat, data.lng]);
        setSpeed(data.speed || 0);
      }
    };

    // Hàm xử lý khi có báo cáo sự cố
    const handleIncident = (data) => {
      // Hiển thị thông báo trình duyệt (Browser Alert) hoặc Toast
      alert(`🚨 CẢNH BÁO TỪ TÀI XẾ:\n${data.message}`);
    };

    // Đăng ký sự kiện
    socket.on('update_location', handleLocationUpdate);
    socket.on('incident_alert', handleIncident);

    // Dọn dẹp khi thoát
    return () => {
      socket.off('update_location', handleLocationUpdate);
      socket.off('incident_alert', handleIncident);
    };
  }, [scheduleId]);

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #ddd' }}>
      
      {/* MAP CONTAINER */}
      <MapContainer 
        center={[10.762622, 106.660172]} // Tọa độ mặc định HCM
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        
        {/* LỚP 1: VẼ LỘ TRÌNH (Đường nối các trạm) */}
        {routePath.length > 0 && (
          <Polyline 
            positions={routePath} 
            color="#3b82f6" // Màu xanh dương hiện đại
            weight={6}      // Độ dày nét
            opacity={0.6}   // Độ mờ
            dashArray="10, 10" // Nét đứt
          />
        )}

        {/* LỚP 2: CÁC TRẠM DỪNG */}
        {stops.map((s, index) => (
          <Marker key={s.stop_id} position={[s.latitude, s.longitude]} icon={StopIcon}>
            <Popup>
              <div style={{textAlign: 'center'}}>
                <b style={{color: '#ef4444'}}>🚏 Trạm số {index + 1}</b><br/>
                {s.name}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* LỚP 3: XE BUÝT (Chỉ hiện khi có tín hiệu) */}
        {busPos && (
          <Marker position={busPos} icon={BusIcon} zIndexOffset={1000}>
            <Popup>
              <div style={{textAlign:'center'}}>
                <b style={{color: '#2563eb', fontSize: '14px'}}>🚌 Đang di chuyển</b>
                <div style={{marginTop: '5px'}}>
                  Vận tốc: <b>{speed} km/h</b>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Tự động điều chỉnh khung nhìn */}
        <ChangeView center={busPos} bounds={routePath.length > 0 ? routePath : null} />
      
      </MapContainer>
      
      {/* BẢNG CHÚ THÍCH (LEGEND) */}
      <div style={{
        position: 'absolute', top: 10, right: 10, 
        background: 'rgba(255, 255, 255, 0.95)', padding: '12px', 
        borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', 
        zIndex: 999, fontSize: '12px', border: '1px solid #e2e8f0'
      }}>
        <div style={{fontWeight: 'bold', marginBottom: '8px', color: '#334155'}}>🗺️ Chú thích</div>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px'}}>
          <div style={{width: 20, height: 4, background: '#3b82f6', borderRadius: 2}}></div>
          <span>Lộ trình ({loadingRoute ? 'Đang tải...' : `${stops.length} trạm`})</span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px'}}>
          <div style={{width: 10, height: 10, background: '#ef4444', borderRadius: '50%', border: '1px solid white', boxShadow: '0 0 2px black'}}></div>
          <span>Điểm dừng đón/trả</span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <span style={{fontSize: '16px'}}>🚌</span>
          <span>Vị trí xe hiện tại</span>
        </div>
      </div>

      {/* TRẠNG THÁI KẾT NỐI */}
      {!busPos && (
        <div style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.7)', color: 'white', padding: '8px 16px', borderRadius: '20px',
          fontSize: '12px', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '5px'
        }}>
          <div className="spinner" style={{width: 10, height: 10, border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
          <span>Đang chờ tín hiệu GPS từ xe...</span>
        </div>
      )}

      {/* CSS Animation cho Spinner */}
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>

    </div>
  );
};

export default MapTracking;