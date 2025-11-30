import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import api, { SOCKET_URL } from '../utils/api';

export default function ParentHomeScreen({ navigation }) {
  // Vị trí mặc định (Trung tâm Sài Gòn)
  const [region, setRegion] = useState({
    latitude: 10.762622, longitude: 106.660172,
    latitudeDelta: 0.01, longitudeDelta: 0.01,
  });
  
  const [busLocation, setBusLocation] = useState(null);
  const [info, setInfo] = useState(null); // Thông tin chuyến xe
  const [loading, setLoading] = useState(true);
  
  const socketRef = useRef(null);
  const mapRef = useRef(null); // Để điều khiển camera bản đồ

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    const fetchData = async () => {
      const token = await AsyncStorage.getItem('token');
      try {
        // [QUAN TRỌNG] API này lấy vị trí của học sinh đầu tiên (ID cứng = 1 cho Demo)
        // Thực tế cần logic chọn con nếu phụ huynh có nhiều con.
        const res = await api.get('/parent/bus-location/1', { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        
        if(res.data.success) {
          const tripData = res.data.data;
          setInfo(tripData);
          
          // Tham gia vào room của chuyến xe để nhận dữ liệu
          socketRef.current.emit('join_trip', { schedule_id: tripData.schedule_id });
          
          // Nếu đã có vị trí xe lưu trong DB, hiển thị ngay
          if (tripData.lat && tripData.lng) {
             const initLoc = { latitude: tripData.lat, longitude: tripData.lng };
             setBusLocation(initLoc);
             setRegion(prev => ({...prev, ...initLoc}));
          }
        }
      } catch(e) { 
        console.log("Không lấy được thông tin xe hoặc xe chưa chạy"); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchData();

    // Lắng nghe sự kiện di chuyển từ Server
    socketRef.current.on('update_location', (data) => {
      const newLoc = { latitude: data.lat, longitude: data.lng };
      setBusLocation(newLoc);
      
      // Camera đi theo xe một cách mượt mà
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...newLoc,
          latitudeDelta: 0.005, // Zoom gần hơn khi xe chạy
          longitudeDelta: 0.005,
        }, 1000);
      }
    });

    return () => {
      if(socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      {/* BẢN ĐỒ */}
      <MapView 
        ref={mapRef}
        style={styles.map} 
        initialRegion={region}
      >
        {busLocation && (
          <Marker 
            coordinate={busLocation} 
            title="Xe Buýt Học Sinh"
            description={`Tốc độ: 30 km/h`}
            pinColor="blue" // Màu ghim
          />
        )}
      </MapView>

      {/* THẺ THÔNG TIN NỔI (Floating Card) */}
      <View style={styles.infoCard}>
        {loading ? <ActivityIndicator color="#007bff" /> : (
          info ? (
            <>
              <View style={styles.cardHeader}>
                <Text style={styles.statusBadge}>TRỰC TUYẾN</Text>
                <Text style={styles.routeText}>{info.route_name}</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.row}>
                <Text style={{fontSize: 20}}>👨‍✈️</Text>
                <View style={{marginLeft: 10}}>
                  <Text style={styles.label}>Tài xế</Text>
                  <Text style={styles.value}>{info.driver_name}</Text>
                  <Text style={styles.subValue}>{info.driver_phone}</Text>
                </View>
              </View>

              <View style={[styles.row, {marginTop:15}]}>
                <Text style={{fontSize: 20}}>🚌</Text>
                <View style={{marginLeft: 10}}>
                  <Text style={styles.label}>Xe Buýt</Text>
                  <Text style={styles.value}>{info.license_plate}</Text>
                  <Text style={styles.subValue}>{info.brand}</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={{alignItems:'center'}}>
              <Text style={{fontSize:30, marginBottom:10}}>😴</Text>
              <Text style={{textAlign:'center', color:'#666'}}>
                Hiện tại xe chưa hoạt động hoặc con bạn không có lịch trình hôm nay.
              </Text>
            </View>
          )
        )}
        
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={{color:'white', fontWeight:'bold'}}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: Dimensions.get('window').width, height: '100%' },
  
  infoCard: {
    position: 'absolute', bottom: 30, left: 20, right: 20,
    backgroundColor: 'white', padding: 20, borderRadius: 20,
    elevation: 10, // Bóng đổ Android
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: {width:0, height:5} // Bóng đổ iOS
  },
  cardHeader: { marginBottom: 10 },
  statusBadge: { color: 'green', fontSize: 12, fontWeight:'bold', letterSpacing: 1, marginBottom: 5 },
  routeText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  
  divider: { height:1, backgroundColor:'#eee', marginVertical:10 },
  
  row: { flexDirection:'row', alignItems:'center' },
  label: { color: '#888', fontSize: 12, textTransform: 'uppercase' },
  value: { fontWeight:'bold', fontSize:16, color:'#333' },
  subValue: { color:'#666', fontSize:14 },
  
  logoutBtn: { 
    marginTop: 20, backgroundColor: '#ff4757', padding: 12, borderRadius: 12, alignItems: 'center' 
  }
});