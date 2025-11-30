import { useEffect, useState } from 'react';
import axios from 'axios';
import MapTracking from './components/MapTracking';
import Login from './components/Login';
import RoutesManager from './components/RoutesManager';
import StudentManager from './components/StudentManager';
import BusManager from './components/BusManager';
import DriverManager from './components/DriverManager';
import ParentManager from './components/ParentManager';
import ScheduleManager from './components/ScheduleManager';
import NotificationManager from './components/NotificationManager'; 

function App() {
  // 1. Khởi tạo State
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dữ liệu Dashboard
  const [schedules, setSchedules] = useState([]); 
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [error, setError] = useState(null);

  // 2. Gọi API Dashboard
  useEffect(() => {
    if (token && activeTab === 'dashboard') {
      axios.get('http://localhost:3000/api/schedules', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        const data = res.data?.data;
        if(Array.isArray(data)) {
          setSchedules(data);
          if(data.length > 0 && !selectedTrip) setSelectedTrip(data[0].schedule_id);
        } else {
          setSchedules([]);
        }
      })
      .catch(err => {
        console.error("Lỗi API:", err);
        if(err.response?.status === 401) handleLogout();
        else setError("Lỗi kết nối Server.");
      });
    }
  }, [token, activeTab]);

  // 3. Xuất Excel
  const handleExport = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/reports/attendance', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
      link.setAttribute('download', `BaoCao_DiemDanh_${dateStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) { alert("Lỗi tải báo cáo."); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
  };

  if (!token) return <div className="login-container"><div className="login-box"><Login onLoginSuccess={setToken} /></div></div>;

  return (
    <div className="app-container">
      
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="brand">🚍 SSB Admin</div>
        
        <div className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          📊 Giám sát (Live)
        </div>

        <div className={`menu-item ${activeTab === 'schedule_create' ? 'active' : ''}`} onClick={() => setActiveTab('schedule_create')}>
          📅 Phân công Lịch
        </div>

        <div className={`menu-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
          🔔 Gửi Thông báo
        </div>
        
        <div style={{height: 1, background: '#334155', margin: '10px 0'}}></div>

        <div className={`menu-item ${activeTab === 'routes' ? 'active' : ''}`} onClick={() => setActiveTab('routes')}>🛣️ Tuyến đường</div>
        <div className={`menu-item ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>🎓 Học sinh</div>
        <div className={`menu-item ${activeTab === 'buses' ? 'active' : ''}`} onClick={() => setActiveTab('buses')}>🚌 Quản lý Xe</div>
        <div className={`menu-item ${activeTab === 'drivers' ? 'active' : ''}`} onClick={() => setActiveTab('drivers')}>👨‍✈️ Tài xế</div>
        <div className={`menu-item ${activeTab === 'parents' ? 'active' : ''}`} onClick={() => setActiveTab('parents')}>👨‍👩‍👧 Phụ huynh</div>
        
        <button className="logout-btn" onClick={handleLogout}>Đăng xuất</button>
      </div>

      {/* CONTENT */}
      <div className="main-content">
        <div className="top-bar">
          <h2>
            {activeTab === 'dashboard' && 'Dashboard Giám Sát'}
            {activeTab === 'schedule_create' && 'Phân công Lịch trình'}
            {activeTab === 'notifications' && 'Gửi Thông báo'}
            {activeTab === 'routes' && 'Quản lý Tuyến đường'}
            {activeTab === 'students' && 'Quản lý Học sinh'}
            {activeTab === 'buses' && 'Quản lý Đội Xe'}
            {activeTab === 'drivers' && 'Quản lý Tài Xế'}
            {activeTab === 'parents' && 'Quản lý Phụ Huynh'}
          </h2>
          {error && <span style={{color:'red', marginLeft: 10}}>⚠️ {error}</span>}
          <div style={{color: '#64748b'}}>Xin chào, Admin</div>
        </div>

        {/* --- ROUTER NỘI DUNG --- */}
        {activeTab === 'schedule_create' && <div style={{ padding: 20, overflowY: 'auto' }}><ScheduleManager /></div>}
        {activeTab === 'notifications' && <div style={{ padding: 20, overflowY: 'auto' }}><NotificationManager /></div>}
        {activeTab === 'students' && <div style={{ padding: 20, overflowY: 'auto' }}><StudentManager /></div>}
        {activeTab === 'routes' && <div style={{ padding: 20, overflowY: 'auto' }}><RoutesManager /></div>}
        {activeTab === 'buses' && <div style={{ padding: 20, overflowY: 'auto' }}><BusManager /></div>}
        {activeTab === 'drivers' && <div style={{ padding: 20, overflowY: 'auto' }}><DriverManager /></div>}
        {activeTab === 'parents' && <div style={{ padding: 20, overflowY: 'auto' }}><ParentManager /></div>}

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <>
            <div className="stats-grid">
              <div className="stat-card"><div><div className="stat-number">{schedules.length}</div><div className="stat-label">Tổng chuyến</div></div><div style={{fontSize: 30}}>🚌</div></div>
              <div className="stat-card"><div><div className="stat-number" style={{color: '#10b981'}}>{schedules.filter(s => s.status === 'running').length}</div><div className="stat-label">Đang chạy</div></div><div style={{fontSize: 30}}>📡</div></div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginLeft: 'auto' }}>
                  <button onClick={handleExport} style={{ background: '#10b981', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>📥 Xuất Báo Cáo</button>
               </div>
            </div>

            <div className="dashboard-view">
              <div className="list-panel">
                <div className="table-container">
                  {schedules.length === 0 ? <p style={{padding:20}}>Chưa có dữ liệu.</p> : (
                    <table>
                      <thead><tr><th>Tuyến</th><th>Biển số</th><th>TT</th></tr></thead>
                      <tbody>{schedules.map(item => (<tr key={item.schedule_id} className={selectedTrip === item.schedule_id ? 'selected' : ''} onClick={() => setSelectedTrip(item.schedule_id)}><td>{item.route_name}</td><td>{item.license_plate}</td><td><span className={`badge ${item.status}`}>{item.status}</span></td></tr>))}</tbody>
                    </table>
                  )}
                </div>
              </div>
              <div className="map-panel">
                {selectedTrip ? <MapTracking key={selectedTrip} scheduleId={selectedTrip} /> : <p style={{textAlign:'center', marginTop:50}}>Chọn một chuyến xe</p>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;