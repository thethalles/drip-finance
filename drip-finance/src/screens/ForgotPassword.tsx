import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { Link } from 'react-router-dom';
import logoDripFinance from '../assets/LogoDripFinance.png';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage('Um e-mail de recuperação foi enviado.');
      setError('');
    } catch (err: any) {
      if (err?.code === 'auth/invalid-email') {
        setError('E-mail inválido.');
      } else {
        setError('Não foi possível enviar o e-mail de recuperação.');
      }
      setMessage('');
    }
  };

  return (
    <div className="h-screen w-full bg-secondary flex flex-col items-center px-8 pt-20">
      <img
        src={logoDripFinance}
        alt="Logo Drip Finance"
        className="h-36 w-36 object-contain sm:h-44 sm:w-44 md:h-60 md:w-60"
      />
      
      <h2 className="text-white text-2xl font-semibold mb-8 text-center">Esqueci minha senha</h2>
      
      <form onSubmit={handleReset} className="w-full space-y-6">
        <div className="space-y-1">
          <input
            type="email"
            placeholder="Insira seu e-mail cadastrado"
            className="w-full h-12 bg-transparent border border-text-muted rounded-full px-6 text-white focus:outline-none focus:border-primary"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full h-12 bg-primary text-white font-bold rounded-full hover:opacity-90 transition-opacity"
        >
          Enviar código de verificação
        </button>

        <p className="text-white text-xs text-center px-4">
          Um e-mail de recuperação será enviado ao seu endereço para confirmarmos que é você.
        </p>
      </form>
      
      {message && <p className="mt-4 text-primary text-sm text-center font-bold">{message}</p>}
      {error && <p className="mt-4 text-danger text-sm text-center font-bold">{error}</p>}

      <div className="mt-auto pb-10 text-center space-y-4">
        <p className="text-white text-sm">ou</p>
        <Link to="/login" className="text-primary text-sm underline block font-semibold">
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}
