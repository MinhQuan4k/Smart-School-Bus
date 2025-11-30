import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import màn hình
import LoginScreen from './src/screens/LoginScreen';

// Tạo 2 màn hình tạm (Placeholder) để test chuyển trang
import { View, Text } from 'react-native';
const DriverHomeScreen = () => <View><Text style={{marginTop:50, fontSize:20}}>🚗 Chào bác tài!</Text></View>;
const ParentHomeScreen = () => <View><Text style={{marginTop:50, fontSize:20}}>👨‍👩‍👧 Chào phụ huynh!</Text></View>;

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DriverHome" component={DriverHomeScreen} options={{ title: 'Tài xế' }} />
        <Stack.Screen name="ParentHome" component={ParentHomeScreen} options={{ title: 'Phụ huynh' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}