import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import axiosInstance from '../../axios';

const PrivateRoute = () => {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        await axiosInstance.get('users/check-auth/');
        if (isMounted) setIsAuthenticated(true);
      } catch (error) {
        if (isMounted) setIsAuthenticated(false);
      } finally {
        if (isMounted) setAuthChecked(true);
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);


  useEffect(() => {
    const timer = setTimeout(() => {
      if (!authChecked) {
        setAuthChecked(true); 
      }
    }, 5000); 

    return () => clearTimeout(timer);
  }, [authChecked]);

  if (!authChecked) {
    return (
    <div className="flex justify-center items-center h-screen">
  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
  <span className="ml-4 text-gray-600">Checking authentication...</span>
</div>
)
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

export default PrivateRoute;
