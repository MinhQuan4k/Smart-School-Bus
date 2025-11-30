import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, SafeAreaView, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import api, { SOCKET_URL } from '../utils/api';

export default function DriverHomeScreen({ navigation }) {
  const [schedules, setSchedules] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // State giả lập lái xe
  const [isDriving, setIsDriving] = useState(false);
  
  // Dùng useRef để giữ kết nối socket không bị reset khi render lại
  const socketRef = useRef(null);

  // 1. Kết nối Socket khi vào màn hình
  useEffect(() => {
    socketRef.current = io(SOCKET_URL);
    
    // Lấy lịch trình ngay khi vào
    fetchSchedules();

    return () => {
      if(socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // API: Lấy lịch trình hôm nay
  const fetchSchedules = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const res = await api.get('/driver/schedules/today', { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if(res.data.success) {
        setSchedules(res.data.data);
      }
    } catch(e) { 
      console.error("Lỗi lấy lịch:", e);
    }
  };

  // 2. Chọn chuyến xe để xem chi tiết
  const handleSelectTrip = async (trip) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const res = await api.get(`/driver/schedules/${trip.schedule_id}/students`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      setStudents(res.data.data);
      setSelectedTrip(trip);
      setModalVisible(true);
      
      // Join room socket để bắt đầu phiên làm việc
      socketRef.current.emit('join_trip', { schedule_id: trip.schedule_id });
      
    } catch(e) { 
      Alert.alert("Lỗi", "Không tải được danh sách học sinh"); 
    }
  };

  // 3. Logic giả lập lái xe (Gửi GPS tự động mỗi 2s)
  useEffect(() => {
    let interval;
    if (isDriving && selectedTrip && socketRef.current) {
      // Tọa độ giả lập (Khu vực Q1 - TP.HCM)
      let lat = 10.762622;
      let lng = 106.660172;
      
      interval = setInterval(() => {
        // Nhích tọa độ đi một chút để tạo hiệu ứng di chuyển
        lat += 0.00015; 
        lng += 0.00015;
        
        socketRef.current.emit('driver_send_location', {
          schedule_id: selectedTrip.schedule_id,
          lat: lat,
          lng: lng,
          speed: Math.floor(Math.random() * 20) + 20 // Tốc độ ngẫu nhiên 20-40km/h
        });
        console.log("📍 Driver sent GPS:", lat, lng);
      }, 2000); 
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isDriving, selectedTrip]);

  // 4. Xử lý Điểm danh (Đón/Trả)
  const handleAttendance = async (studentId, status) => {
    const token = await AsyncStorage.getItem('token');
    try {
      await api.put('/driver/attendance', 
        { schedule_id: selectedTrip.schedule_id, student_id: studentId, status }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Cập nhật giao diện ngay lập tức (Optimistic UI)
      setStudents(prev => prev.map(s => 
        s.student_id === studentId ? { ...s, status } : s
      ));
      
      Alert.alert("Thành công", status === 'picked_up' ? "Đã đón bé lên xe!" : "Đã trả bé an toàn!");
    } catch(e) { 
      Alert.alert("Lỗi", "Không cập nhật được trạng thái."); 
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📅 Lịch trình hôm nay</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      <FlatList 
        data={schedules}
        keyExtractor={item => item.schedule_id.toString()}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Hôm nay bạn không có lịch chạy.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => handleSelectTrip(item)}>
            <View style={{flexDirection:'row', justifyContent:'space-between'}}>
              <Text style={styles.route}>{item.route_name}</Text>
              <Text style={{fontWeight:'bold', color: item.status==='running'?'green':'orange'}}>{item.status.toUpperCase()}</Text>
            </View>
            <Text style={styles.info}>🕒 Xuất phát: {item.start_time}</Text>
            <Text style={styles.info}>🚌 Xe: {item.license_plate}</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>CHẠM ĐỂ BẮT ĐẦU 👉</Text></View>
          </TouchableOpacity>
        )}
      />

      {/* --- MODAL CHI TIẾT CHUYẾN XE --- */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={{flex:1, backgroundColor:'#fff'}}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setModalVisible(false); setIsDriving(false); }}>
              <Text style={styles.backText}>Quay lại</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>{selectedTrip?.route_name}</Text>
            <View style={{width:50}} />
          </View>

          {/* KHU VỰC ĐIỀU KHIỂN XE */}
          <View style={styles.controlPanel}>
            <Text style={styles.controlTitle}>Trạng thái lái xe</Text>
            <TouchableOpacity 
              style={[styles.driveBtn, {backgroundColor: isDriving ? '#dc3545' : '#28a745'}]}
              onPress={() => setIsDriving(!isDriving)}
            >
              <Text style={styles.driveBtnText}>
                {isDriving ? "🛑 DỪNG XE (Stop GPS)" : "▶️ BẮT ĐẦU CHẠY (Send GPS)"}
              </Text>
            </TouchableOpacity>
            {isDriving && <Text style={styles.drivingStatus}>📡 Đang gửi tín hiệu về trung tâm...</Text>}
          </View>

          {/* DANH SÁCH HỌC SINH */}
          <FlatList 
            data={students}
            keyExtractor={item => item.student_id.toString()}
            contentContainerStyle={{paddingBottom: 20}}
            renderItem={({ item }) => (
              <View style={styles.studentRow}>
                <View style={{flex:1}}>
                  <Text style={styles.studentName}>{item.full_name}</Text>
                  <Text style={styles.studentAddress}>{item.pickup_address}</Text>
                  <Text style={styles.studentClass}>Lớp: {item.class_name}</Text>
                </View>
                
                <View style={{flexDirection:'row', gap:8}}>
                  {/* Nút Đón */}
                  <TouchableOpacity onPress={() => handleAttendance(item.student_id, 'picked_up')} 
                    style={[styles.btnAtt, {backgroundColor: item.status === 'picked_up' ? '#28a745' : '#e0e0e0'}]}>
                    <Text style={{color: item.status === 'picked_up' ? 'white' : 'black', fontWeight:'600'}}>Đón</Text>
                  </TouchableOpacity>
                  
                  {/* Nút Trả */}
                  <TouchableOpacity onPress={() => handleAttendance(item.student_id, 'dropped_off')} 
                    style={[styles.btnAtt, {backgroundColor: item.status === 'dropped_off' ? '#007bff' : '#e0e0e0'}]}>
                    <Text style={{color: item.status === 'dropped_off' ? 'white' : 'black', fontWeight:'600'}}>Trả</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2', padding: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color:'#333' },
  logoutBtn: { backgroundColor: '#ffebee', padding: 8, borderRadius: 8 },
  logoutText: { color: '#d32f2f', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888', fontSize: 16 },
  
  card: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 15, elevation: 3, shadowColor:'#000', shadowOpacity:0.1, shadowRadius:4 },
  route: { fontSize: 18, fontWeight: 'bold', color: '#007bff', marginBottom: 5, flex: 1 },
  info: { fontSize: 15, color: '#555', marginTop: 4 },
  badge: { backgroundColor: '#007bff', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5, marginTop: 12 },
  badgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  
  // Modal Styles
  modalHeader: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee', backgroundColor:'white' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', maxWidth: '60%' },
  backText: { color: '#007bff', fontSize: 16 },
  
  controlPanel: { padding: 20, backgroundColor: '#f8f9fa', borderBottomWidth:1, borderColor:'#ddd', alignItems: 'center' },
  controlTitle: { fontSize: 14, color: '#666', marginBottom: 10, textTransform: 'uppercase' },
  driveBtn: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, elevation: 2, width: '100%', alignItems: 'center' },
  driveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  drivingStatus: { marginTop: 10, color: '#28a745', fontStyle: 'italic', fontWeight: '500' },
  
  studentRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, marginHorizontal: 15, marginTop: 10, borderRadius: 10, alignItems: 'center', backgroundColor: 'white', elevation: 1, borderWidth: 1, borderColor: '#f0f0f0' },
  studentName: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  studentAddress: { color: '#666', fontSize: 13, marginTop: 2 },
  studentClass: { color: '#999', fontSize: 12, marginTop: 2 },
  btnAtt: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, alignItems: 'center', justifyContent:'center', minWidth: 60 }
});