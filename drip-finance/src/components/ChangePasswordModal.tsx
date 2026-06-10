import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { auth } from '../firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { useAuth } from '../AuthContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCurrentVisible, setIsCurrentVisible] = useState(false);
  const [isNewVisible, setIsNewVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!user || !user.email) {
      setError('Usuário não autenticado.');
      return;
    }
    if (!currentPassword) {
      setError('Digite a senha atual.');
      return;
    }

    setLoading(true);

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser as any, credential);
    } catch (err: any) {
      console.error('Error reauthenticating:', err);
      setLoading(false);
      if (err && err.code === 'auth/wrong-password') {
        setError('Senha atual incorreta.');
      } else {
        setError('Erro ao verificar a senha atual. Tente novamente.');
      }
      return;
    }

    if (newPassword === currentPassword) {
      setLoading(false);
      setError('A nova senha deve ser diferente da senha atual.');
      return;
    }

    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (newPassword.length < 8) {
      setLoading(false);
      setError('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }

    if (!hasUppercase || !hasSpecialChar) {
      setLoading(false);
      setError('A senha deve conter pelo menos 1 letra maiúscula e 1 caractere especial.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setLoading(false);
      setError('A confirmação da nova senha não confere.');
      return;
    }

    try {
      await updatePassword(auth.currentUser as any, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err: any) {
      console.error('Error updating password:', err);
      if (err && err.code === 'auth/weak-password') {
        setError('A nova senha é muito fraca.');
      } else {
        setError('Erro ao alterar a senha. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[calc(100dvh-1rem)] overflow-y-auto overscroll-contain bg-surface rounded-t-[28px] p-6 pb-8 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="w-9 h-9 bg-text-muted/20 rounded-lg flex items-center justify-center text-white">
            <X size={20} />
          </button>
          <h3 className="text-white text-lg font-semibold">Alterar Senha</h3>
          <div className="w-9" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-text-muted text-sm">Senha Atual</label>
            <div className="relative">
              <input
                type={isCurrentVisible ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full h-12 bg-transparent border border-text-muted rounded-lg px-4 pr-14 text-white focus:outline-none focus:border-primary"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setIsCurrentVisible((s) => !s)}
                className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center px-3 text-text-muted transition-colors hover:text-white"
                aria-label={isCurrentVisible ? 'Ocultar senha atual' : 'Mostrar senha atual'}
                aria-pressed={isCurrentVisible}
              >
                {isCurrentVisible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-text-muted text-sm">Nova senha</label>
            <div className="relative">
              <input
                type={isNewVisible ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-12 bg-transparent border border-text-muted rounded-lg px-4 pr-14 text-white focus:outline-none focus:border-primary"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setIsNewVisible((s) => !s)}
                className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center px-3 text-text-muted transition-colors hover:text-white"
                aria-label={isNewVisible ? 'Ocultar nova senha' : 'Mostrar nova senha'}
                aria-pressed={isNewVisible}
              >
                {isNewVisible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-[10px] text-text-muted px-1">Sua senha deve possuir no mínimo 8 caracteres, sendo 1 maiúscula e 1 especial.</p>
          </div>

          <div className="space-y-1">
            <label className="text-text-muted text-sm">Confirmar nova senha</label>
            <div className="relative">
              <input
                type={isConfirmVisible ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-12 bg-transparent border border-text-muted rounded-lg px-4 pr-14 text-white focus:outline-none focus:border-primary"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setIsConfirmVisible((s) => !s)}
                className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center px-3 text-text-muted transition-colors hover:text-white"
                aria-label={isConfirmVisible ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
                aria-pressed={isConfirmVisible}
              >
                {isConfirmVisible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="text-danger text-sm">{error}</p>}

          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 bg-white/5 text-white rounded-2xl hover:opacity-90 transition-opacity"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 bg-primary text-white font-semibold rounded-2xl disabled:opacity-50"
            >
              {loading ? 'Alterando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
