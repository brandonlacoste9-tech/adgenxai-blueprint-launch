import React from 'react';
import GoogleAuth from '@/components/GoogleAuth';
import { useNavigate } from 'react-router-dom';

const Auth: React.FC = () => {
  const navigate = useNavigate();

  const handleAuthSuccess = () => {
    navigate('/studio');
  };

  return <GoogleAuth onAuthSuccess={handleAuthSuccess} />;
};

export default Auth;