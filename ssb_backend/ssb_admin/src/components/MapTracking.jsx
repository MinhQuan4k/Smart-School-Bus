import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Bắt buộc phải có dòng này map mới hiện
import L from 'leaflet';
import io from 'socket.io-client';

// Fix lỗi icon mặc định của Leaflet trong React không hiện
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Kết nối Socket tới Backend
const socket = io('http://localhost:3000');

// Component con để cập nhật view bản đồ khi xe di chuyển
function ChangeView({ center }) {
  const map = useMap();
  map.setView(center);
  return null;
}

const MapTracking = ({ scheduleId }) => {
  const [position, setPosition] = useState([10.762622, 106.660172]); // Mặc định HCM
  const [speed, setSpeed] = useState(0);

  useEffect(() => {
    // 1. Tham gia vào phòng của chuyến xe (Ví dụ chuyến số 1)
    console.log(">> Admin đang theo dõi chuyến:", scheduleId);
    socket.emit('join_trip', { schedule_id: scheduleId });

    // 2. Lắng nghe sự kiện cập nhật vị trí
    socket.on('update_location', (data) => {
      console.log("Nhận tọa độ mới:", data);
      setPosition([data.lat, data.lng]);
      setSpeed(data.speed);
    });

    // Cleanup khi tắt component
    return () => {
      socket.off('update_location');
    };
  }, [scheduleId]);

  return (
    <div style={{ height: '400px', width: '100%', border: '2px solid #ddd', marginTop: '20px' }}>
      <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <Marker position={position}>
          <Popup>
            Vận tốc: {speed} km/h <br />
            Chuyến số: {scheduleId}
          </Popup>
        </Marker>
        <ChangeView center={position} />
      </MapContainer>
    </div>
  );
};

export default MapTracking;