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

  // --- LOGIC KẾT NỐI ---
  useEffect(() => {
    socketRef.current = io('http://localhost:3000');
    fetchSchedules();
    return () => socketRef.current.disconnect();
  }, []);

  const fetchSchedules = () => {
    axios.get('http://localhost:3000/api/schedules/driver/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setSchedules(res.data.data || [])).catch(console.error);
  };

  const handleSelectTrip = (trip) => {
    axios.get(`http://localhost:3000/api/schedules/${trip.schedule_id}/students`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setStudents(res.data.data);
        setSelectedTrip(trip);
        socketRef.current.emit('join_trip', { schedule_id: trip.schedule_id });
      });
  };

  // Điểm danh 1 bé
  const handleAttendance = async (studentId, status) => {
    try {
      // Cập nhật UI trước cho mượt (Optimistic Update)
      setStudents(prev => prev.map(s => s.student_id === studentId ? { ...s, status } : s));
      
      await axios.put('http://localhost:3000/api/tracking/attendance', {
        schedule_id: selectedTrip.schedule_id, student_id: studentId, status
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) { alert("Lỗi kết nối server"); }
  };

  // --- TÍNH NĂNG MỚI: ĐIỂM DANH HÀNG LOẠT (BATCH) ---
  const handleBatchAttendance = async (studentsInStop, status) => {
    if (!confirm(`Xác nhận ${status === 'picked_up' ? 'ĐÓN' : 'TRẢ'} tất cả ${studentsInStop.length} học sinh tại trạm này?`)) return;

    // Lặp qua danh sách và gọi API (Trong thực tế nên viết 1 API bulk-update riêng để tối ưu)
    for (const s of studentsInStop) {
        if (s.status !== status) { // Chỉ update những bé chưa đúng trạng thái
            handleAttendance(s.student_id, status);
            // Delay nhẹ để tránh spam socket quá nhanh
            await new Promise(r => setTimeout(r, 100)); 
        }
    }
  };

  const handleReport = (type) => {
    socketRef.current.emit('driver_report_incident', {
      schedule_id: selectedTrip.schedule_id,
      type, description: type === 'traffic' ? 'Kẹt xe nghiêm trọng' : 'Xe gặp sự cố kỹ thuật'
    });
    alert("🚨 Đã gửi báo cáo sự cố về trung tâm!");
  };

  // Logic lái xe giả lập
  useEffect(() => {
    let interval;
    if (isDriving && selectedTrip && socketRef.current) {
      let lat = 10.762622; let lng = 106.660172;
      interval = setInterval(() => {
        lat += 0.00015; lng += 0.00015;
        socketRef.current.emit('driver_send_location', {
          schedule_id: selectedTrip.schedule_id, lat, lng, speed: Math.floor(Math.random()*20 + 20)
        });
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isDriving, selectedTrip]);

  // Gom nhóm học sinh
  const groupStudentsByStop = () => {
    const groups = {};
    students.forEach(s => {
      const stopName = s.stop_name || 'Chưa gán trạm';
      if (!groups[stopName]) groups[stopName] = [];
      groups[stopName].push(s);
    });
    return groups;
  };
  const groupedStudents = groupStudentsByStop();

  return (
    <div className="mobile-wrapper" style={{background: '#f8fafc'}}>
      
      {/* HEADER */}
      <div className="mobile-header" style={{padding: '20px 25px', background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', color: 'white'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <div style={{width: 45, height: 45, borderRadius: '50%', background: 'white', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 18}}>
              {user.full_name ? user.full_name.charAt(0) : 'T'}
            </div>
            <div>
              <div style={{fontSize: 11, opacity: 0.8, textTransform: 'uppercase'}}>Tài xế</div>
              <div style={{fontSize: 16, fontWeight: '700'}}>{user.full_name}</div>
            </div>
          </div>
          <button onClick={onLogout} style={{background:'rgba(255,255,255,0.2)', border:'none', color:'white', padding:'8px 16px', borderRadius:20, cursor:'pointer', fontSize:12, fontWeight:'600'}}>Thoát</button>
        </div>
      </div>

      <div className="mobile-content" style={{padding: '20px'}}>
        {!selectedTrip ? (
          // DANH SÁCH LỊCH
          <>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
              <h4 style={{margin: 0, color: '#64748b', fontSize: 13, fontWeight: '700'}}>LỊCH CHẠY HÔM NAY</h4>
              <span style={{background: '#e2e8f0', color: '#475569', padding: '4px 8px', borderRadius: '4px', fontSize: 11, fontWeight: 'bold'}}>{new Date().toLocaleDateString('vi-VN')}</span>
            </div>

            {schedules.length === 0 ? <p style={{textAlign:'center', color:'#999', marginTop: 50}}>Không có lịch chạy</p> : 
              schedules.map(item => (
                <div key={item.schedule_id} className="mobile-card" onClick={() => handleSelectTrip(item)} style={{cursor:'pointer', borderLeft: '5px solid #2563eb', padding: 15, marginBottom: 15, background: 'white', borderRadius: 12, boxShadow: '0 2px 5px rgba(0,0,0,0.05)'}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:12}}>
                    <span style={{background:'#dbeafe', color:'#1e40af', padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:'bold'}}>{item.route_name}</span>
                    <span style={{fontSize:12, fontWeight:'bold', color: item.status==='running'?'#16a34a':'#d97706'}}>
                      {item.status === 'running' ? '● ĐANG CHẠY' : '● CHỜ'}
                    </span>
                  </div>
                  <div style={{fontSize:14, color:'#334155'}}>
                     🕒 {item.start_time} <br/> 🚌 {item.license_plate}
                  </div>
                  <div style={{marginTop: 15, textAlign: 'right', color: '#2563eb', fontWeight: '700', fontSize: 13}}>BẮT ĐẦU 👉</div>
                </div>
              ))
            }
          </>
        ) : (
          // CHI TIẾT CHUYẾN
          <div style={{animation: 'fadeIn 0.3s'}}>
            <button onClick={() => {setSelectedTrip(null); setIsDriving(false);}} style={{background:'none', border:'none', color:'#64748b', marginBottom:15, cursor:'pointer', fontWeight:'600'}}>← Quay lại</button>
            
            {/* ĐIỀU KHIỂN */}
            <div style={{background:'white', borderRadius:16, padding:20, boxShadow:'0 4px 10px rgba(0,0,0,0.05)', textAlign:'center', marginBottom:20}}>
              <h3 style={{margin:'0 0 10px 0', color:'#1e293b'}}>{selectedTrip.route_name}</h3>
              
              <button 
                className={`mobile-btn ${isDriving ? 'btn-danger' : 'btn-start'}`}
                style={{
                    padding: 15, width: '100%', borderRadius: 12, border: 'none', color: 'white', fontWeight: 'bold', fontSize: 16, cursor: 'pointer',
                    background: isDriving ? '#ef4444' : '#10b981', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}
                onClick={() => setIsDriving(!isDriving)}
              >
                {isDriving ? "🛑 DỪNG XE" : "▶️ BẮT ĐẦU CHẠY"}
              </button>

              {isDriving && (
                <div style={{marginTop: 15, display:'flex', gap: 10}}>
                   <button onClick={() => handleReport('traffic')} style={{flex: 1, border:'1px solid #fbbf24', background:'#fffbeb', color:'#d97706', padding:'10px', borderRadius:8, cursor:'pointer', fontWeight:'bold'}}>Kẹt Xe</button>
                   <button onClick={() => handleReport('breakdown')} style={{flex: 1, border:'1px solid #f87171', background:'#fef2f2', color:'#dc2626', padding:'10px', borderRadius:8, cursor:'pointer', fontWeight:'bold'}}>Hỏng Xe</button>
                </div>
              )}
            </div>

            {/* DANH SÁCH GOM NHÓM THEO TRẠM */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
                <h4 style={{margin: 0, color: '#64748b', fontSize: 13, fontWeight: '700'}}>DANH SÁCH ĐIỂM DANH</h4>
                <span style={{background: '#f1f5f9', padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 'bold'}}>{students.length} bé</span>
            </div>
            
            {Object.keys(groupedStudents).map((stopName, idx) => (
              <div key={idx} style={{marginBottom: 20, background: 'white', borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0'}}>
                
                {/* Header của Trạm + Nút Đón Tất Cả */}
                <div style={{background: '#f8fafc', padding: '10px 15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div style={{fontWeight:'bold', color:'#334155', fontSize: 13}}>
                        <span style={{color: '#2563eb', marginRight: 5}}>#{idx+1}</span> {stopName}
                    </div>
                    {/* NÚT ĐÓN NHANH */}
                    <button 
                        onClick={() => handleBatchAttendance(groupedStudents[stopName], 'picked_up')}
                        style={{padding: '4px 8px', fontSize: 11, background: '#dcfce7', color: '#166534', border: '1px solid #86efac', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold'}}
                    >
                        ✅ Đón Hết ({groupedStudents[stopName].length})
                    </button>
                </div>

                {groupedStudents[stopName].map(s => (
                  <div key={s.student_id} className="student-item" style={{display:'flex', alignItems:'center', padding: '12px 15px', borderBottom: '1px solid #f1f5f9'}}>
                    <div className="student-avatar" style={{
                        width: 36, height: 36, borderRadius: '50%', background: s.status==='picked_up'?'#dcfce7':'#f1f5f9', 
                        color: s.status==='picked_up'?'#16a34a':'#64748b', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', marginRight: 12
                    }}>
                        {s.full_name.charAt(0)}
                    </div>
                    <div style={{flex: 1}}>
                      <div style={{fontWeight:'600', fontSize:14, color: '#334155'}}>{s.full_name}</div>
                      <div style={{fontSize:11, color: s.status === 'picked_up' ? 'green' : (s.status === 'dropped_off' ? 'blue' : '#94a3b8')}}>
                        {s.status === 'not_picked' ? 'Chưa đón' : (s.status === 'picked_up' ? 'Đã lên xe' : 'Đã trả')}
                      </div>
                    </div>
                    
                    <div style={{display:'flex', gap: 5}}>
                      <button onClick={() => handleAttendance(s.student_id, 'picked_up')} 
                        style={{width:32, height:32, borderRadius:'50%', border:'1px solid #eee', background: s.status==='picked_up'?'#10b981':'white', color: s.status==='picked_up'?'white':'#cbd5e1', cursor:'pointer'}}>⬆</button>
                      <button onClick={() => handleAttendance(s.student_id, 'dropped_off')} 
                        style={{width:32, height:32, borderRadius:'50%', border:'1px solid #eee', background: s.status==='dropped_off'?'#3b82f6':'white', color: s.status==='dropped_off'?'white':'#cbd5e1', cursor:'pointer'}}>⬇</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;