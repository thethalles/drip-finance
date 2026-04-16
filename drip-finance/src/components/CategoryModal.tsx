import React, { useState } from 'react';
import { X } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'receita' | 'despesa';
}

export default function CategoryModal({ isOpen, onClose, type }: CategoryModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name) return;

    setLoading(true);
    try {
      const categoriesRef = collection(db, 'users', user.uid, 'categories');
      await addDoc(categoriesRef, {
        nome: name,
        tipo: type,
        cor: '#0B770B',
        criado_em: serverTimestamp(),
        atualizado_em: serverTimestamp()
      });
      onClose();
      setName('');
    } catch (error) {
      console.error("Error adding category: ", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm px-6">
      <div className="w-full max-w-sm bg-surface rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <h3 className="text-white text-xl font-bold mb-6 text-center">Nova Categoria</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-text-muted text-sm font-medium">Nome da Categoria</label>
            <input
              type="text"
              placeholder="Ex: Salário, Alimentação..."
              className="w-full h-12 bg-transparent border border-text-muted rounded-lg px-4 text-white focus:outline-none focus:border-primary"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 bg-text-muted text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-10 bg-primary text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? '...' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
