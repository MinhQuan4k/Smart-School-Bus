import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import io from 'socket.io-client';
import axios from 'axios';

// --- 1. CẤU HÌNH ICON ---

// Icon Trạm Dừng (Chấm đỏ gọn gàng)
const StopIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="
    background-color: #ef4444; width: 14px; height: 14px;
    border-radius: 50%; border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10]
});

// Hàm tạo Icon Xe Buýt có thể XOAY được (Dùng CSS Transform)
const createRotatedBusIcon = (rotationAngle) => {
  return L.divIcon({
    className: 'rotated-bus-icon',
    html: `<div style="
      width: 45px; height: 45px;
      background-image: url('https://cdn-icons-png.flaticon.com/512/3448/3448339.png');
      background-size: cover;
      transform: rotate(${rotationAngle - 90}deg); /* -90 để chỉnh đúng hướng mũi xe nếu icon gốc hướng lên */
      transition: transform 0.5s linear; /* Hiệu ứng xoay mượt */
    "></div>`,
    iconSize: [45, 45],
    iconAnchor: [22, 22], // Tâm xoay ở giữa
    popupAnchor: [0, -20]
  });
};

// --- 2. HÀM TÍNH TOÁN ---

// Tính góc quay (Bearing) giữa 2 tọa độ GPS
const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

const getBearing = (startLat, startLng, destLat, destLng) => {
  const startLatRad = toRad(startLat);
  const startLngRad = toRad(startLng);
  const destLatRad = toRad(destLat);
  const destLngRad = toRad(destLng);

  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x = Math.cos(startLatRad) * Math.sin(destLatRad) -
            Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);
            
  const brng = Math.atan2(y, x);
  const deg = toDeg(brng);
  return (deg + 360) % 360; // Trả về góc 0-360 độ
};

// Kết nối Socket (1 lần duy nhất ngoài component)
const socket = io('http://localhost:3000');

// Component phụ: Tự động Zoom
function ChangeView({ center, bounds }) {
  const map = useMap();
  if (bounds && bounds.length > 0) {
    try { 
        const latLngBounds = L.latLngBounds(bounds);
        map.fitBounds(latLngBounds, { padding: [50, 50] }); 
    } catch(e){}
  } else if (center && Array.isArray(center)) {
    map.setView(center);
  }
  return null;
}

const MapTracking = ({ scheduleId, routeId }) => {
  const [busPos, setBusPos] = useState(null);
  const [rotation, setRotation] = useState(0); // Góc quay của xe
  const [speed, setSpeed] = useState(0);
  
  const [stops, setStops] = useState([]);     
  const [routePath, setRoutePath] = useState([]); 
  const [loadingRoute, setLoadingRoute] = useState(false);
  
  const token = localStorage.getItem('token');
  const prevPosRef = useRef(null); // Lưu vị trí cũ để tính góc

  // 1. Tải Lộ Trình (Polyline + Stops)
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
          const path = stopList.map(s => [parseFloat(s.latitude), parseFloat(s.longitude)]);
          setRoutePath(path);
        }
      })
      .catch(err => console.error("Lỗi tải lộ trình"))
      .finally(() => setLoadingRoute(false));
    } else {
      setStops([]); setRoutePath([]);
    }
  }, [routeId, token]);

  // 2. Real-time Tracking (Vị trí + Góc quay)
  useEffect(() => {
    if (!scheduleId) return;

    socket.emit('join_trip', { schedule_id: scheduleId });

    const handleLocationUpdate = (data) => {
      if (data && typeof data.lat === 'number' && typeof data.lng === 'number') {
        
        // Logic tính góc quay
        if (prevPosRef.current) {
            const prev = prevPosRef.current;
            // Chỉ tính góc nếu xe di chuyển một khoảng đáng kể (tránh rung lắc khi đứng yên)
            if (Math.abs(data.lat - prev[0]) > 0.00001 || Math.abs(data.lng - prev[1]) > 0.00001) {
                const angle = getBearing(prev[0], prev[1], data.lat, data.lng);
                setRotation(angle);
            }
        }
        
        // Cập nhật vị trí mới
        setBusPos([data.lat, data.lng]);
        setSpeed(data.speed || 0);
        
        // Lưu vị trí hiện tại làm vị trí cũ cho lần sau
        prevPosRef.current = [data.lat, data.lng];
      }
    };

    const handleIncident = (data) => alert(`🚨 SỰ CỐ: ${data.message}`);

    socket.on('update_location', handleLocationUpdate);
    socket.on('incident_alert', handleIncident);

    return () => {
      socket.off('update_location', handleLocationUpdate);
      socket.off('incident_alert', handleIncident);
    };
  }, [scheduleId]);

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #ddd' }}>
      
      <MapContainer center={[10.762622, 106.660172]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
        
        {/* LỘ TRÌNH (Đường xanh) */}
        {routePath.length > 0 && <Polyline positions={routePath} color="#3b82f6" weight={6} opacity={0.6} dashArray="10, 10" />}

        {/* CÁC TRẠM DỪNG */}
        {stops.map((s, index) => (
          <Marker key={s.stop_id} position={[s.latitude, s.longitude]} icon={StopIcon}>
            <Popup><div style={{textAlign: 'center'}}><b style={{color: '#ef4444'}}>🚏 Trạm {index + 1}</b><br/>{s.name}</div></Popup>
          </Marker>
        ))}

        {/* XE BUÝT (Xoay theo hướng) */}
        {busPos && (
          <Marker position={busPos} icon={createRotatedBusIcon(rotation)} zIndexOffset={1000}>
            <Popup>
              <div style={{textAlign:'center'}}>
                <b style={{color: '#2563eb'}}>🚌 Đang chạy</b><br/>
                Vận tốc: {speed} km/h
              </div>
            </Popup>
          </Marker>
        )}

        <ChangeView center={busPos} bounds={routePath.length > 0 ? routePath : null} />
      </MapContainer>
      
      {/* LEGEND */}
      <div style={{
        position: 'absolute', top: 10, right: 10, 
        background: 'rgba(255, 255, 255, 0.95)', padding: '10px', borderRadius: '8px', 
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)', zIndex: 999, fontSize: '12px', border: '1px solid #eee'
      }}>
        <div style={{fontWeight:'bold', marginBottom:5}}>🗺️ Chú thích</div>
        <div style={{display:'flex', gap:5, marginBottom:3}}><span style={{color:'#3b82f6'}}>➖</span> Lộ trình ({stops.length} trạm)</div>
        <div style={{display:'flex', gap:5, marginBottom:3}}>🔴 Trạm dừng</div>
        <div style={{display:'flex', gap:5}}>🚌 Vị trí xe</div>
      </div>

      {/* WAITING STATUS */}
      {!busPos && (
        <div style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.7)', color: 'white', padding: '8px 15px', borderRadius: '20px', fontSize: '12px', zIndex: 1000
        }}>
          📡 Đang chờ tín hiệu GPS...
        </div>
      )}
    </div>
  );
};

export default MapTracking;