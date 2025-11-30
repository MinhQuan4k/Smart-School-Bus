import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // 1. Kiểm tra đầu vào
    if (!phone || !password) {
      return Alert.alert("Lỗi", "Vui lòng nhập đủ Số điện thoại và Mật khẩu!");
    }
    
    setLoading(true); // Bật loading xoay xoay

    try {
      // 2. Gọi API đăng nhập lên Server
      const res = await api.post('/auth/login', { phone, password });
      
      if (res.data.success) {
        const { token, user } = res.data;
        
        // 3. Lưu Token và thông tin User vào bộ nhớ máy (AsyncStorage)
        // Để các màn hình sau có thể lấy ra dùng
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));

        Alert.alert("Đăng nhập thành công", `Xin chào ${user.name}`);

        // 4. Chuyển hướng màn hình dựa theo vai trò (Role)
        if (user.role === 'driver') {
          navigation.replace('DriverHome'); // Vào màn hình Tài xế
        } else if (user.role === 'parent') {
          navigation.replace('ParentHome'); // Vào màn hình Phụ huynh
        } else {
          Alert.alert("Thông báo", "Tài khoản Admin vui lòng sử dụng Web Dashboard.");
        }
      }
    } catch (err) {
      console.log("Login Error:", err);
      // Xử lý lỗi hiển thị cho người dùng dễ hiểu
      const message = err.response?.data?.error || "Không kết nối được Server hoặc sai thông tin.";
      Alert.alert("Đăng nhập thất bại", message);
    } finally {
      setLoading(false); // Tắt loading dù thành công hay thất bại
    }
  };

  return (
    <View style={styles.container}>
      {/* Icon hoặc Logo */}
      <Text style={{fontSize: 60, marginBottom: 10}}>🚌</Text>
      
      <Text style={styles.title}>SSB MOBILE</Text>
      <Text style={styles.subtitle}>Hệ thống đưa đón học sinh</Text>

      <View style={styles.form}>
        {/* Ô nhập SĐT */}
        <TextInput 
          style={styles.input} 
          placeholder="Số điện thoại" 
          placeholderTextColor="#999"
          keyboardType="numeric" 
          value={phone} 
          onChangeText={setPhone} 
        />
        
        {/* Ô nhập Mật khẩu */}
        <TextInput 
          style={styles.input} 
          placeholder="Mật khẩu" 
          placeholderTextColor="#999"
          secureTextEntry 
          value={password} 
          onChangeText={setPassword} 
        />
        
        {/* Nút Đăng nhập */}
        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>ĐĂNG NHẬP</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#eef2f3', // Màu nền xám nhẹ
    padding: 20 
  },
  title: { 
    fontSize: 32, 
    fontWeight: '900', 
    color: '#2c3e50',
    marginBottom: 5
  },
  subtitle: { 
    fontSize: 16, 
    color: '#7f8c8d', 
    marginBottom: 40 
  },
  form: { 
    width: '100%' 
  },
  input: { 
    backgroundColor: 'white', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#dfe6e9', 
    fontSize: 16 
  },
  btn: { 
    backgroundColor: '#3498db', // Màu xanh dương chủ đạo
    padding: 15, 
    borderRadius: 12, 
    alignItems: 'center', 
    shadowColor: '#3498db', 
    shadowOpacity: 0.3, 
    shadowRadius: 10, 
    elevation: 5 // Đổ bóng cho Android
  },
  btnText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 16 
  }
});