import { GoogleLogin } from '@react-oauth/google';
import axiosInstance from '../../axios'; 
import { useNavigate } from 'react-router-dom';

const GoogleLoginButton = () => {
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    const token = credentialResponse.credential;

    if (!token) {
      console.error("❌ No token received from Google");
      alert("Google login failed. Try again.");
      return;
    }

    try {
      const response = await axiosInstance.post('users/login/google/', { token });

      console.log('✅ SSO login success:', response.data);

      localStorage.setItem('access', response.data.access);
      localStorage.setItem('refresh', response.data.refresh);
      localStorage.setItem('email', response.data.email);
      localStorage.setItem('role', response.data.role);

      const role = response.data.role;
      if (role === 'Learner') navigate('/learner');
      else if (role === 'Mentor') navigate('/mentor');
      else if (role === 'Admin') navigate('/admin');
      else navigate('/login');

    } catch (err) {
      console.error('❌ Google SSO login failed:', err.response?.data || err.message);
      alert("Google SSO login failed. Please try again.");
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleGoogleSuccess}
      onError={() => {
        console.log("❌ Google login failed");
        alert("Google login failed. Try again.");
      }}
    />
  );
};

export default GoogleLoginButton;
