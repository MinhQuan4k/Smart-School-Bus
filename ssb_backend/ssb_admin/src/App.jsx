import { useEffect, useState } from 'react';
import axios from 'axios';
import MapTracking from './components/MapTracking'; // Import Component Bản đồ

function App() {
  const [schedules, setSchedules] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null); // Lưu chuyến xe đang chọn xem

  useEffect(() => {
    axios.get('http://localhost:3000/api/schedules')
      .then(res => setSchedules(res.data.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', display: 'flex', gap: '20px' }}>
      
      {/* CỘT TRÁI: DANH SÁCH */}
      <div style={{ width: '40%' }}>
        <h1 style={{ color: '#007bff' }}>🚍 ADMIN DASHBOARD</h1>
        <h3>Danh sách chuyến xe</h3>
        
        <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead style={{ background: '#f8f9fa' }}>
            <tr>
              <th>ID</th>
              <th>Tuyến</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map(item => (
              <tr key={item.schedule_id} 
                  style={{ background: selectedTrip === item.schedule_id ? '#e2e6ea' : 'white' }}>
                <td>{item.schedule_id}</td>
                <td>{item.route_name}</td>
                <td>
                  <button 
                    onClick={() => setSelectedTrip(item.schedule_id)}
                    style={{
                      cursor: 'pointer', background: '#28a745', color: 'white', 
                      border: 'none', padding: '5px 10px', borderRadius: '4px'
                    }}
                  >
                    📍 Theo dõi
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CỘT PHẢI: BẢN ĐỒ */}
      <div style={{ width: '60%' }}>
        {selectedTrip ? (
          <>
            <h3>🗺️ Bản đồ trực tuyến - Chuyến số {selectedTrip}</h3>
            {/* Gọi Component MapTracking và truyền ID chuyến xe vào */}
            <MapTracking scheduleId={selectedTrip} />
          </>
        ) : (
          <div style={{ 
            height: '400px', background: '#f8f9fa', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', border: '2px dashed #ccc' 
          }}>
            <p style={{ color: '#888' }}>Chọn một chuyến xe bên trái để xem bản đồ</p>
          </div>
        )}
      </div>

    </div>
  );
}

export default App;