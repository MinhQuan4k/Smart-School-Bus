import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import các màn hình chức năng
import LoginScreen from './src/screens/LoginScreen';
import DriverHomeScreen from './src/screens/DriverHomeScreen';
import ParentHomeScreen from './src/screens/ParentHomeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        
        {/* Màn hình Đăng nhập (Ẩn thanh tiêu đề mặc định) */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        
        {/* Màn hình Tài xế */}
        <Stack.Screen 
          name="DriverHome" 
          component={DriverHomeScreen} 
          options={{ headerShown: false }} 
        />
        
        {/* Màn hình Phụ huynh */}
        <Stack.Screen 
          name="ParentHome" 
          component={ParentHomeScreen} 
          options={{ headerShown: false }} 
        />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}