import axios from 'axios';

// 创建axios实例
const request = axios.create({
  baseURL: 'http://localhost:3001/api', // 后端接口基础路径
  timeout: 5000
});

// 请求拦截器（添加token）
request.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 如果是认证错误，清除本地存储并跳转到登录页
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 如果当前不在登录页，则跳转到登录页
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    alert(error.response?.data?.error || '请求失败');
    return Promise.reject(error);
  }
);

export default request;