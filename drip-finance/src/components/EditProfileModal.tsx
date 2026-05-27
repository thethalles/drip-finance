import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { useAuth } from '../AuthContext';

const avatarOptions = ['🤑​','😀', '😎', '🧠', '🚀', '🌈', '🔥', '💎', '🎯', '🪴', '⚡', '⭐​', '❤️​', '🐱​', '🐶​'];

function isImageUrl(value: string) {
  return /^https?:\/\//i.test(value) || /^data:image\//i.test(value);
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, userData } = useAuth();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userData) {
      setName(userData.nome);
      setAvatar(userData.photoURL || '');
    }
  }, [userData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const nameError = (() => {
      const trimmed = name.trim();
      if (!trimmed) return 'O nome é obrigatório.';
      if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(trimmed)) return 'O nome deve conter apenas letras e espaços.';
      return '';
    })();

    if (nameError) {
      setError(nameError);
      return;
    }

    const trimmedName = name.trim();

    setLoading(true);
    setError('');
    try {
      // Update Auth Profile
      await updateProfile(user, { displayName: trimmedName });
      
      // Update Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        nome: trimmedName,
        photoURL: avatar,
        atualizado_em: new Date()
      });
      
      onClose();
    } catch (error) {
      console.error("Error updating profile: ", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[calc(100dvh-1rem)] overflow-y-auto overscroll-contain bg-surface rounded-t-[40px] p-8 pb-12 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onClose} className="w-10 h-10 bg-text-muted/20 rounded-lg flex items-center justify-center text-white">
            <X size={24} />
          </button>
          <h2 className="text-white text-2xl font-bold text-center flex-1">Editar Perfil</h2>
          <div className="w-10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center overflow-hidden border-2 border-primary">
                {avatar ? (
                  isImageUrl(avatar) ? (
                    <img src={avatar} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-white text-5xl leading-none">{avatar}</span>
                  )
                ) : (
                  <span className="text-white text-4xl font-bold">{name.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-text-muted text-sm font-medium">Foto por emoji</label>
              <button
                type="button"
                onClick={() => setAvatar('')}
                className="text-xs text-text-muted hover:text-white transition-colors"
              >
                Sem foto
              </button>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {avatarOptions.map((emoji) => {
                const isSelected = avatar === emoji;
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatar(emoji)}
                    className={`h-14 rounded-2xl flex items-center justify-center text-2xl border transition-all ${
                      isSelected
                        ? 'bg-primary/20 border-primary scale-105'
                        : 'bg-white/5 border-white/10 hover:border-white/40'
                    }`}
                    aria-label={`Selecionar emoji ${emoji}`}
                    aria-pressed={isSelected}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-text-muted text-sm font-medium">Nome</label>
            <input
              type="text"
              className="w-full h-12 bg-transparent border border-text-muted rounded-lg px-4 text-white focus:outline-none focus:border-primary"
              value={name}
              onChange={(e) => setName(e.target.value)}
              pattern="[A-Za-zÀ-ÖØ-öø-ÿ\s]+"
              title="Use apenas letras e espaços"
              required
            />
            {error && <p className="text-danger text-sm mt-2">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-primary text-white font-bold text-lg rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>
    </div>
  );
}
