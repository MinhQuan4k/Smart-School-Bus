import axios from 'axios';

//THAY SỐ NÀY BẰNG IP MÁY TÍNH CỦA BẠN (Giữ nguyên port 3000)
const BASE_URL = 'http://192.168.1.5:3000/api'; 

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 giây timeout
});

export const SOCKET_URL = 'http://192.168.1.5:3000'; // Dùng cho Socket sau này

export default api;