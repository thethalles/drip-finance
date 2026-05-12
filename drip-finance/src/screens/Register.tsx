import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hasUppercase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.');
      return;
    }

    if (!hasUppercase || !hasSpecialChar) {
      setError('A senha deve conter pelo menos 1 letra maiúscula e 1 caractere especial.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: name });
      
      await setDoc(doc(db, 'users', user.uid), {
        nome: name,
        email: email,
        data_criacao: new Date(),
        photoURL: '',
        preferences: {
          moeda: 'BRL',
          tema: 'dark',
          notificacoes: true
        }
      });

      const categoriesRef = collection(db, 'users', user.uid, 'categories');
      const defaultCategories = [
        { nome: 'Salário', tipo: 'receita', cor: '#0B770B' },
        { nome: 'Investimentos', tipo: 'receita', cor: '#0B770B' },
        { nome: 'Alimentação', tipo: 'despesa', cor: '#FF383C' },
        { nome: 'Transporte', tipo: 'despesa', cor: '#FF383C' },
        { nome: 'Lazer', tipo: 'despesa', cor: '#FF383C' },
        { nome: 'Saúde', tipo: 'despesa', cor: '#FF383C' },
      ];

      await Promise.all(defaultCategories.map(cat => 
        addDoc(categoriesRef, {
          ...cat,
          criado_em: new Date(),
          atualizado_em: new Date()
        })
      ));
      
      navigate('/');
    } catch (err: any) {
      console.error("Registration error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else if (err.code === 'auth/invalid-email') {
        setError('E-mail inválido.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha é muito fraca.');
      } else {
        setError('Erro ao cadastrar: ' + (err.message || 'Verifique os dados e tente novamente.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-secondary flex flex-col items-center px-8 pt-10 overflow-y-auto pb-10">
      <div className="w-32 h-32 bg-white/10 rounded-3xl flex items-center justify-center mb-8">
         <span className="text-white font-bold text-2xl">DF</span>
      </div>
      
      <h2 className="text-white text-2xl font-semibold mb-2">Faça seu cadastro:</h2>
      <p className="text-primary text-xs mb-8">Todos os campos abaixo são obrigatórios</p>
      
      <form onSubmit={handleRegister} className="w-full space-y-4">
        <input
          type="text"
          placeholder="Insira seu nome"
          className="w-full h-12 bg-transparent border border-text-muted rounded-full px-6 text-white focus:outline-none focus:border-primary"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Insira seu e-mail"
          className="w-full h-12 bg-transparent border border-text-muted rounded-full px-6 text-white focus:outline-none focus:border-primary"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="space-y-1">
          <input
            type="password"
            placeholder="Insira sua senha"
            className="w-full h-12 bg-transparent border border-text-muted rounded-full px-6 text-white focus:outline-none focus:border-primary"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <p className="text-[10px] text-text-muted px-4">Sua senha deve possuir no mínimo 8 caracteres, sendo 1 maiúscula e 1 especial.</p>
        </div>
        <input
          type="password"
          placeholder="Confirme sua senha"
          className="w-full h-12 bg-transparent border border-text-muted rounded-full px-6 text-white focus:outline-none focus:border-primary"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        
        {error && <p className="text-danger text-sm text-center">{error}</p>}
        
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-primary text-white font-bold rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
          <p className="text-[10px] text-text-muted text-center mt-2 px-4">
            Ao clicar em “Cadastrar” você concorda com a nossa Política de Privacidade e Termos de Uso.
          </p>
        </div>
      </form>
      
      <div className="mt-8 text-center">
        <p className="text-white text-sm">
          Já tem uma conta? <Link to="/login" className="text-primary font-semibold">Clique aqui</Link>
        </p>
      </div>
    </div>
  );
}