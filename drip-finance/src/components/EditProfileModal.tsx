import React, { useState, useEffect } from 'react';
import { X, Camera } from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { useAuth } from '../AuthContext';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, userData } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userData) {
      setName(userData.nome);
    }
  }, [userData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name) return;

    setLoading(true);
    try {
      // Update Auth Profile
      await updateProfile(user, { displayName: name });
      
      // Update Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        nome: name,
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
      <div className="w-full max-w-md bg-surface rounded-t-[40px] p-8 pb-12 animate-in slide-in-from-bottom duration-300">
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
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-white text-4xl font-bold">{name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <button type="button" className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white border-4 border-surface">
                <Camera size={20} />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-text-muted text-sm font-medium">Nome Completo</label>
            <input
              type="text"
              className="w-full h-12 bg-transparent border border-text-muted rounded-lg px-4 text-white focus:outline-none focus:border-primary"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
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
