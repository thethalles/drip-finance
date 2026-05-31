import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import logoDripFinance from '../assets/LogoDripFinance.png';
import TermsModal from '../components/TermsModal';
import { Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const navigate = useNavigate();

  const validatePassword = () => {
    const hasUppercase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password !== confirmPassword) {
      return 'As senhas não coincidem.';
    }

    if (password.length < 8) {
      return 'A senha deve ter no mínimo 8 caracteres.';
    }

    if (!hasUppercase || !hasSpecialChar) {
      return 'A senha deve conter pelo menos 1 letra maiúscula e 1 caractere especial.';
    }

    return '';
  };

  const validateName = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return 'O nome é obrigatório.';
    }

    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(trimmedName)) {
      return 'O nome deve conter apenas letras e espaços.';
    }

    return '';
  };

  const handleOpenTerms = (e: React.FormEvent) => {
    e.preventDefault();

    const nameError = validateName();
    if (nameError) {
      setError(nameError);
      return;
    }

    const passwordError = validatePassword();
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setError('');
    setIsTermsModalOpen(true);
  };

  const handleRegister = async () => {
    const nameError = validateName();
    if (nameError) {
      setError(nameError);
      setIsTermsModalOpen(false);
      return;
    }

    const trimmedName = name.trim();

    setLoading(true);
    setError('');
    setIsTermsModalOpen(false);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: trimmedName });
      
      await setDoc(doc(db, 'users', user.uid), {
        nome: trimmedName,
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
      <img
        src={logoDripFinance}
        alt="Logo Drip Finance"
        className="h-36 w-36 object-contain sm:h-44 sm:w-44 md:h-60 md:w-60"
      />
      
      <h2 className="text-white text-2xl font-semibold mb-2">Faça seu cadastro:</h2>
      <p className="text-primary text-xs mb-8">Todos os campos abaixo são obrigatórios</p>
      
      <form onSubmit={handleOpenTerms} className="w-full space-y-4">
        <input
          type="text"
          placeholder="Insira seu nome"
          className="w-full h-12 bg-transparent border border-text-muted rounded-full px-6 text-white focus:outline-none focus:border-primary"
          value={name}
          onChange={(e) => setName(e.target.value)}
          pattern="[A-Za-zÀ-ÖØ-öø-ÿ\s]+"
          title="Use apenas letras e espaços"
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
          <div className="relative">
            <input
              type={isPasswordVisible ? 'text' : 'password'}
              placeholder="Insira sua senha"
              className="w-full h-12 bg-transparent border border-text-muted rounded-full px-6 pr-14 text-white focus:outline-none focus:border-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
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
          <p className="text-[10px] text-text-muted px-4">Sua senha deve possuir no mínimo 8 caracteres, sendo 1 maiúscula e 1 especial.</p>
        </div>
        <div className="relative">
          <input
            type={isConfirmPasswordVisible ? 'text' : 'password'}
            placeholder="Confirme sua senha"
            className="w-full h-12 bg-transparent border border-text-muted rounded-full px-6 pr-14 text-white focus:outline-none focus:border-primary"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            onClick={() => setIsConfirmPasswordVisible((current) => !current)}
            className="absolute inset-y-0 right-0 flex items-center justify-center px-4 text-text-muted transition-colors hover:text-white"
            aria-label={isConfirmPasswordVisible ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
            aria-pressed={isConfirmPasswordVisible}
          >
              {isConfirmPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        
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
            Ao tocar em “Cadastrar”, você poderá revisar e aceitar a Política de Privacidade e os Termos de Uso antes de concluir o cadastro.
          </p>
        </div>
      </form>

      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        onAccept={handleRegister}
        showAcceptAction
        acceptLabel={loading ? 'Cadastrando...' : 'Eu aceito'}
      />
      
      <div className="mt-8 text-center">
        <p className="text-white text-sm">
          Já tem uma conta? <Link to="/login" className="text-primary font-semibold">Clique aqui</Link>
        </p>
      </div>
    </div>
  );
}