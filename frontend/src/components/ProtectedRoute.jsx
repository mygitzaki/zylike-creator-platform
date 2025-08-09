// src/components/ProtectedRoute.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Small delay to ensure token is properly set
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      console.log('🔐 ProtectedRoute checking token:', token ? 'Present' : 'Missing');
      
      if (!token) {
        console.log('🔄 No token found, redirecting to login');
        navigate('/login');
      } else {
        console.log('✅ Token found, allowing access');
      }
      setIsChecking(false);
    };

    // Small delay to ensure localStorage is updated
    setTimeout(checkAuth, 100);
  }, [navigate]);

  // Show loading while checking
  if (isChecking) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    </div>;
  }

  return children;
};

export default ProtectedRoute;
