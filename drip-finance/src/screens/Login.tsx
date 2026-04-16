import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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
      <div className="w-40 h-40 bg-white/10 rounded-3xl flex items-center justify-center mb-12">
         <span className="text-white font-bold text-3xl">DF</span>
      </div>
      
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
        <input
          type="password"
          placeholder="Insira sua senha"
          className="w-full h-12 bg-transparent border border-text-muted rounded-full px-6 text-white focus:outline-none focus:border-primary"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
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
        <Link to="/forgot-password" size="sm" className="text-primary text-sm underline block">
          Esqueci a minha senha
        </Link>
      </div>
    </div>
  );
}
