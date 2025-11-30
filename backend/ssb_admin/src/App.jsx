import { useEffect, useState } from 'react';
import axios from 'axios';
import MapTracking from './components/MapTracking';
import Login from './components/Login';
import RoutesManager from './components/RoutesManager';
import StudentManager from './components/StudentManager';
import BusManager from './components/BusManager';
import DriverManager from './components/DriverManager';
import ParentManager from './components/ParentManager'; // <--- Module Phụ Huynh

function App() {
  // 1. Khởi tạo State
  // Lấy token từ bộ nhớ trình duyệt để giữ đăng nhập khi F5
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  
  // Quản lý Tab đang chọn (Mặc định là dashboard)
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dữ liệu cho Dashboard
  const [schedules, setSchedules] = useState([]); 
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [error, setError] = useState(null);

  // 2. Gọi API lấy dữ liệu Dashboard (Chỉ chạy khi ở tab Dashboard & có Token)
  useEffect(() => {
    if (token && activeTab === 'dashboard') {
      axios.get('http://localhost:3000/api/schedules', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        // --- LỚP BẢO VỆ: Kiểm tra dữ liệu an toàn ---
        const data = res.data?.data;
        if(Array.isArray(data)) {
          setSchedules(data);
          // Tự động chọn chuyến đầu tiên để hiển thị map ngay
          if(data.length > 0 && !selectedTrip) setSelectedTrip(data[0].schedule_id);
        } else {
          setSchedules([]); // Trả về mảng rỗng để an toàn
        }
      })
      .catch(err => {
        console.error("Lỗi API Dashboard:", err);
        // Nếu lỗi 401 (Hết hạn Token) -> Tự động đăng xuất
        if(err.response?.status === 401) handleLogout();
        else setError("Không kết nối được Server (Port 3000).");
      });
    }
  }, [token, activeTab]);

  // 3. Hàm Xuất Báo Cáo Excel
  const handleExport = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/reports/attendance', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob', // Quan trọng: Báo cho axios biết đây là file binary
      });

      // Tạo link ảo để tải xuống
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
      link.setAttribute('download', `BaoCao_DiemDanh_${dateStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Lỗi tải báo cáo: " + (err.message || "Server error"));
    }
  };

  // 4. Hàm Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
  };

  // --- MÀN HÌNH LOGIN (Nếu chưa có Token) ---
  if (!token) return (
    <div className="login-container">
      <div className="login-box">
        <Login onLoginSuccess={setToken} />
      </div>
    </div>
  );

  // --- GIAO DIỆN CHÍNH (Admin Dashboard) ---
  return (
    <div className="app-container">
      
      {/* CỘT TRÁI: MENU ĐIỀU HƯỚNG */}
      <div className="sidebar">
        <div className="brand">🚍 SSB Admin</div>
        
        <div 
          className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Giám sát (Live)
        </div>
        
        <div 
          className={`menu-item ${activeTab === 'routes' ? 'active' : ''}`}
          onClick={() => setActiveTab('routes')}
        >
          🛣️ Tuyến đường
        </div>

        <div 
          className={`menu-item ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          🎓 Học sinh
        </div>

        <div 
          className={`menu-item ${activeTab === 'buses' ? 'active' : ''}`}
          onClick={() => setActiveTab('buses')}
        >
          🚌 Quản lý Xe
        </div>

        <div 
          className={`menu-item ${activeTab === 'drivers' ? 'active' : ''}`}
          onClick={() => setActiveTab('drivers')}
        >
          👨‍✈️ Tài xế
        </div>

        <div 
          className={`menu-item ${activeTab === 'parents' ? 'active' : ''}`}
          onClick={() => setActiveTab('parents')}
        >
          👨‍👩‍👧 Phụ huynh
        </div>
        
        <button className="logout-btn" onClick={handleLogout}>Đăng xuất</button>
      </div>

      {/* CỘT PHẢI: NỘI DUNG CHÍNH */}
      <div className="main-content">
        <div className="top-bar">
          <h2>
            {activeTab === 'dashboard' && 'Dashboard Giám Sát'}
            {activeTab === 'routes' && 'Quản lý Tuyến đường'}
            {activeTab === 'students' && 'Quản lý Học sinh'}
            {activeTab === 'buses' && 'Quản lý Đội Xe'}
            {activeTab === 'drivers' && 'Quản lý Tài Xế'}
            {activeTab === 'parents' && 'Quản lý Phụ Huynh'}
          </h2>
          {error && <span style={{color:'red', marginLeft: 10, fontSize: 14}}>⚠️ {error}</span>}
          <div style={{color: '#64748b'}}>Xin chào, Admin</div>
        </div>

        {/* --- KHU VỰC HIỂN THỊ NỘI DUNG THEO TAB --- */}

        {activeTab === 'students' && <div style={{ padding: '20px', overflowY: 'auto' }}><StudentManager /></div>}
        {activeTab === 'routes' && <div style={{ padding: '20px', overflowY: 'auto' }}><RoutesManager /></div>}
        {activeTab === 'buses' && <div style={{ padding: '20px', overflowY: 'auto' }}><BusManager /></div>}
        {activeTab === 'drivers' && <div style={{ padding: '20px', overflowY: 'auto' }}><DriverManager /></div>}
        {activeTab === 'parents' && <div style={{ padding: '20px', overflowY: 'auto' }}><ParentManager /></div>}

        {/* TAB DASHBOARD */}
        {activeTab === 'dashboard' && (
          <>
            {/* Thẻ thống kê nhanh */}
            <div className="stats-grid">
              <div className="stat-card">
                <div>
                  <div className="stat-number">{schedules.length}</div>
                  <div className="stat-label">Tổng chuyến hôm nay</div>
                </div>
                <div style={{fontSize: '30px'}}>🚌</div>
              </div>
              <div className="stat-card">
                <div>
                  <div className="stat-number" style={{color: '#10b981'}}>
                    {schedules.filter(s => s.status === 'running').length}
                  </div>
                  <div className="stat-label">Đang chạy</div>
                </div>
                <div style={{fontSize: '30px'}}>📡</div>
              </div>
              
              {/* Nút Xuất Báo Cáo */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginLeft: 'auto' }}>
                  <button 
                    onClick={handleExport}
                    style={{
                      background: '#10b981', color: 'white', padding: '12px 24px', 
                      border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  >
                    📥 Xuất Báo Cáo
                  </button>
               </div>
            </div>

            {/* Khu vực Bản đồ & Danh sách xe */}
            <div className="dashboard-view">
              
              {/* Danh sách xe bên trái */}
              <div className="list-panel">
                <div className="table-container">
                  {schedules.length === 0 ? (
                    <div style={{padding:20, textAlign: 'center', color: '#999'}}>
                      Chưa có chuyến xe nào được tạo hôm nay.
                    </div>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>Tuyến</th>
                          <th>Biển số</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedules.map(item => (
                          <tr 
                            key={item.schedule_id} 
                            className={selectedTrip === item.schedule_id ? 'selected' : ''} 
                            onClick={() => setSelectedTrip(item.schedule_id)}
                          >
                            <td>
                              <div style={{fontWeight: '600'}}>{item.route_name || 'Chưa đặt tên'}</div>
                              <div style={{fontSize: '12px', color: '#888'}}>{item.driver_name}</div>
                            </td>
                            <td>{item.license_plate}</td>
                            <td>
                              <span className={`badge ${item.status}`}>
                                {item.status === 'running' ? 'Running' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Bản đồ Real-time bên phải */}
              <div className="map-panel">
                {selectedTrip ? (
                   // Dùng key để reset map hoàn toàn khi người dùng đổi chuyến xe khác
                   <MapTracking key={selectedTrip} scheduleId={selectedTrip} />
                ) : (
                  <div style={{display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#999'}}>
                    <p>👈 Chọn một chuyến xe bên trái để xem vị trí</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;