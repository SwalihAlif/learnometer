import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});



let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/token/refresh/') &&
      !originalRequest.url.includes('/token/')
    ) {
      originalRequest._retry = true;
      
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
        .then(() => axiosInstance(originalRequest))
        .catch(Promise.reject);
      }
      
      isRefreshing = true;
      
      try {
        await axiosInstance.post('users/token/refresh/');
        isRefreshing = false;
        processQueue(null);
        return axiosInstance(originalRequest); // retry original
      } catch (err) {
        isRefreshing = false;
        processQueue(err, null);
        return Promise.reject(err);
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;

