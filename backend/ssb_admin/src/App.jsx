import { useEffect, useState } from 'react';
import axios from 'axios';
import MapTracking from './components/MapTracking';
import Login from './components/Login';
import RoutesManager from './components/RoutesManager';
import StudentManager from './components/StudentManager';
import BusManager from './components/BusManager';       // <--- Mới
import DriverManager from './components/DriverManager'; // <--- Mới

function App() {
  // 1. Khởi tạo State
  // Lấy token từ bộ nhớ trình duyệt (nếu có) để giữ đăng nhập khi F5
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  
  // State quản lý Tab đang chọn (Mặc định là dashboard)
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // State dữ liệu cho Dashboard
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
        // --- LỚP BẢO VỆ: Kiểm tra dữ liệu an toàn trước khi dùng ---
        const data = res.data?.data;
        if(Array.isArray(data)) {
          setSchedules(data);
          // Tự động chọn chuyến đầu tiên để hiển thị map ngay
          if(data.length > 0 && !selectedTrip) setSelectedTrip(data[0].schedule_id);
        } else {
          setSchedules([]); // Trả về mảng rỗng để an toàn, tránh lỗi .map()
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

  // 3. Hàm Xử lý Đăng xuất
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
          </h2>
          {error && <span style={{color:'red', marginLeft: 10, fontSize: 14}}>⚠️ {error}</span>}
          <div style={{color: '#64748b'}}>Xin chào, Admin</div>
        </div>

        {/* --- KHU VỰC HIỂN THỊ NỘI DUNG THEO TAB --- */}

        {/* TAB 1: QUẢN LÝ HỌC SINH */}
        {activeTab === 'students' && (
          <div style={{ padding: '20px', overflowY: 'auto', height: 'calc(100vh - 80px)' }}>
            <StudentManager />
          </div>
        )}

        {/* TAB 2: QUẢN LÝ TUYẾN ĐƯỜNG */}
        {activeTab === 'routes' && (
          <div style={{ padding: '20px', overflowY: 'auto', height: 'calc(100vh - 80px)' }}>
            <RoutesManager />
          </div>
        )}

        {/* TAB 3: QUẢN LÝ XE (MỚI) */}
        {activeTab === 'buses' && (
          <div style={{ padding: '20px', overflowY: 'auto', height: 'calc(100vh - 80px)' }}>
            <BusManager />
          </div>
        )}

        {/* TAB 4: QUẢN LÝ TÀI XẾ (MỚI) */}
        {activeTab === 'drivers' && (
          <div style={{ padding: '20px', overflowY: 'auto', height: 'calc(100vh - 80px)' }}>
            <DriverManager />
          </div>
        )}

        {/* TAB 5: DASHBOARD GIÁM SÁT */}
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