import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { motion } from 'framer-motion';
import logoDripFinance from '../assets/LogoDripFinance.png';

export default function Splash() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        if (user) {
          navigate('/');
        } else {
          navigate('/login');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, loading, navigate]);

  return (
    <div className="h-screen w-full bg-primary flex flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <img
          src={logoDripFinance}
          alt="Logo Drip Finance"
          className="h-36 w-36 object-contain sm:h-44 sm:w-44 md:h-60 md:w-60"
        />
      </motion.div>
      
      <div className="absolute bottom-10 text-white font-semibold">
        Desenvolvido por Drip Company
      </div>
    </div>
  );
}
