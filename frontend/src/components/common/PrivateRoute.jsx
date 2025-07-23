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
    }, 2000); 

    return () => clearTimeout(timer);
  }, [authChecked]);

  if (!authChecked) {
    return <div className="text-center mt-10 text-gray-500">Checking authentication...</div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

export default PrivateRoute;
