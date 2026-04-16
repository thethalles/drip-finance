import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { motion } from 'motion/react';

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
        <div className="w-48 h-48 bg-white/20 rounded-3xl flex items-center justify-center mb-4">
          {/* Placeholder for Logo */}
          <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center">
             <span className="text-primary font-bold text-4xl">DF</span>
          </div>
        </div>
        <h1 className="text-white text-4xl font-bold font-roboto">Drip Finance</h1>
      </motion.div>
      
      <div className="absolute bottom-10 text-white font-semibold">
        Powered By Drip Company
      </div>
    </div>
  );
}
