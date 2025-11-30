import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const DriverDashboard = ({ user, onLogout }) => {
  const [schedules, setSchedules] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [students, setStudents] = useState([]);
  const [isDriving, setIsDriving] = useState(false);
  
  const token = localStorage.getItem('token');
  const socketRef = useRef(null);

  // 1. Kết nối Socket & Lấy lịch
  useEffect(() => {
    socketRef.current = io('http://localhost:3000');
    fetchSchedules();
    return () => socketRef.current.disconnect();
  }, []);

  const fetchSchedules = () => {
    axios.get('http://localhost:3000/api/schedules/driver/me', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setSchedules(res.data.data))
      .catch(err => alert("Lỗi tải lịch trình"));
  };

  // 2. Chọn chuyến -> Xem danh sách học sinh
  const handleSelectTrip = (trip) => {
    axios.get(`http://localhost:3000/api/schedules/${trip.schedule_id}/students`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setStudents(res.data.data);
      setSelectedTrip(trip);
      // Join room socket
      socketRef.current.emit('join_trip', { schedule_id: trip.schedule_id });
    });
  };

  // 3. Logic Điểm danh
  const handleAttendance = async (studentId, status) => {
    try {
      await axios.put('http://localhost:3000/api/tracking/attendance', {
        schedule_id: selectedTrip.schedule_id,
        student_id: studentId,
        status: status
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      // Cập nhật giao diện (xanh/đỏ)
      setStudents(prev => prev.map(s => s.student_id === studentId ? { ...s, status } : s));
    } catch (err) { alert("Lỗi điểm danh"); }
  };

  // 4. Giả lập xe chạy (Gửi GPS)
  useEffect(() => {
    let interval;
    if (isDriving && selectedTrip) {
      let lat = 10.762622;
      let lng = 106.660172;
      interval = setInterval(() => {
        lat += 0.00015; 
        lng += 0.00015;
        socketRef.current.emit('driver_send_location', {
          schedule_id: selectedTrip.schedule_id,
          lat, lng, speed: 30
        });
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isDriving, selectedTrip]);

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', background: '#f8f9fa', minHeight: '100vh', padding: '20px', boxShadow: '0 0 20px rgba(0,0,0,0.1)' }}>
      {/* HEADER GIẢ LẬP MOBILE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: '#2563eb' }}>📱 App Tài Xế</h2>
        <button onClick={onLogout} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}>Thoát</button>
      </div>

      <div style={{ background: 'white', padding: 15, borderRadius: 10, marginBottom: 20 }}>
        <div>Xin chào, <b>{user.full_name}</b></div>
        <div style={{ fontSize: 12, color: '#666' }}>{user.phone}</div>
      </div>

      {!selectedTrip ? (
        // DANH SÁCH CHUYẾN
        <div>
          <h4>📅 Lịch chạy hôm nay</h4>
          {schedules.map(item => (
            <div key={item.schedule_id} onClick={() => handleSelectTrip(item)} 
                 style={{ background: 'white', padding: 15, borderRadius: 10, marginBottom: 10, cursor: 'pointer', borderLeft: '4px solid #2563eb', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontWeight: 'bold', color: '#2563eb' }}>{item.route_name}</div>
              <div style={{ fontSize: 13, marginTop: 5 }}>🕒 {item.start_time} - 🚌 {item.license_plate}</div>
              <div style={{ fontSize: 12, color: 'green', marginTop: 5, fontWeight: 'bold' }}>Chạm để bắt đầu 👉</div>
            </div>
          ))}
        </div>
      ) : (
        // CHI TIẾT CHUYẾN
        <div>
          <button onClick={() => { setSelectedTrip(null); setIsDriving(false); }} style={{ marginBottom: 10, background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>⬅ Quay lại</button>
          <h3 style={{ margin: '0 0 15px 0' }}>{selectedTrip.route_name}</h3>

          {/* NÚT CHẠY XE */}
          <button 
            onClick={() => setIsDriving(!isDriving)}
            style={{ 
              width: '100%', padding: 15, borderRadius: 8, border: 'none', 
              background: isDriving ? '#ef4444' : '#10b981', color: 'white', fontWeight: 'bold', fontSize: 16, marginBottom: 20 
            }}
          >
            {isDriving ? "🛑 DỪNG XE (Stop GPS)" : "▶️ BẮT ĐẦU CHẠY"}
          </button>

          <h4>Danh sách học sinh ({students.length})</h4>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {students.map(s => (
              <div key={s.student_id} style={{ background: 'white', padding: 10, borderRadius: 8, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{s.full_name}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{s.pickup_address}</div>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button onClick={() => handleAttendance(s.student_id, 'picked_up')} 
                          style={{ background: s.status === 'picked_up' ? '#10b981' : '#e5e7eb', color: s.status === 'picked_up' ? 'white' : 'black', border: 'none', padding: '5px 10px', borderRadius: 4 }}>Đón</button>
                  <button onClick={() => handleAttendance(s.student_id, 'dropped_off')} 
                          style={{ background: s.status === 'dropped_off' ? '#3b82f6' : '#e5e7eb', color: s.status === 'dropped_off' ? 'white' : 'black', border: 'none', padding: '5px 10px', borderRadius: 4 }}>Trả</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;