import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import logoDripFinance from '../assets/LogoDripFinance.png';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      setError('Credenciais inválidas. Tente novamente.');
    }
  };

  return (
    <div className="h-screen w-full bg-secondary flex flex-col items-center px-8 pt-20">
      <img
        src={logoDripFinance}
        alt="Logo Drip Finance"
        className="h-36 w-36 object-contain sm:h-44 sm:w-44 md:h-60 md:w-60"
      />
      <h2 className="text-white text-2xl font-semibold mb-8">Identifique-se:</h2>
      
      <form onSubmit={handleLogin} className="w-full space-y-4">
        <input
          type="email"
          placeholder="Insira seu e-mail"
          className="w-full h-12 bg-transparent border border-text-muted rounded-full px-6 text-white focus:outline-none focus:border-primary"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="relative">
          <input
            type={isPasswordVisible ? 'text' : 'password'}
            placeholder="Insira sua senha"
            className="w-full h-12 bg-transparent border border-text-muted rounded-full px-6 pr-14 text-white focus:outline-none focus:border-primary"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setIsPasswordVisible((current) => !current)}
            className="absolute inset-y-0 right-0 flex items-center justify-center px-4 text-text-muted transition-colors hover:text-white"
            aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={isPasswordVisible}
          >
            {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        
        {error && <p className="text-danger text-sm text-center">{error}</p>}
        
        <button
          type="submit"
          className="w-full h-12 bg-primary text-white font-bold rounded-full mt-4 hover:opacity-90 transition-opacity"
        >
          Entrar
        </button>
      </form>
      
      <div className="mt-8 text-center space-y-4">
        <p className="text-white text-sm">
          Não tem uma conta? <Link to="/register" className="text-primary font-semibold">Cadastre-se</Link>
        </p>
        <Link to="/forgot-password" className="text-primary text-sm underline block">
          Esqueci a minha senha
        </Link>
      </div>
    </div>
  );
}
