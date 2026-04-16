import React, { useState, useEffect } from 'react';
import { X, Trash2, Image as ImageIcon } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';

interface EditWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: any;
}

export default function EditWalletModal({ isOpen, onClose, wallet }: EditWalletModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (wallet) {
      setName(wallet.nome);
      setIsDeleting(false);
    }
  }, [wallet]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !wallet || !name) return;

    setLoading(true);
    try {
      const walletRef = doc(db, 'users', user.uid, 'wallets', wallet.id);
      await updateDoc(walletRef, {
        nome: name,
        atualizado_em: serverTimestamp()
      });
      onClose();
    } catch (error) {
      console.error("Error updating wallet: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !wallet) return;
    
    if (!isDeleting) {
      setIsDeleting(true);
      return;
    }

    setLoading(true);
    try {
      const walletRef = doc(db, 'users', user.uid, 'wallets', wallet.id);
      await deleteDoc(walletRef);
      onClose();
    } catch (error) {
      console.error("Error deleting wallet: ", error);
      setIsDeleting(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !wallet) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface rounded-t-[40px] p-8 pb-12 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onClose} className="w-10 h-10 bg-text-muted/20 rounded-lg flex items-center justify-center text-white">
            <X size={24} />
          </button>
          <h2 className="text-white text-2xl font-bold text-center flex-1">Editar Carteira</h2>
          <div className="w-10" />
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="space-y-1">
            <label className="text-text-muted text-sm font-medium">Nome da Carteira</label>
            <input
              type="text"
              className="w-full h-12 bg-transparent border border-text-muted rounded-lg px-4 text-white focus:outline-none focus:border-primary"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-text-muted text-sm font-medium">Ícone da Carteira</label>
            <div className="w-24 h-24 bg-white/10 rounded-xl flex items-center justify-center mb-2">
               <ImageIcon size={40} className="text-white/50" />
            </div>
            <button type="button" className="text-primary text-sm font-semibold">Alterar imagem</button>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={handleDelete}
              className={cn(
                "h-14 rounded-2xl flex items-center justify-center transition-all duration-200",
                isDeleting ? "bg-danger w-full text-white font-bold" : "bg-danger/20 w-14 text-danger"
              )}
            >
              {isDeleting ? "Confirmar Exclusão" : <Trash2 size={24} />}
            </button>
            {!isDeleting && (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-14 bg-primary text-white font-bold text-lg rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
