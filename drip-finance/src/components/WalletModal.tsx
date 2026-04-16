import React, { useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../AuthContext';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [type, setType] = useState('Conta Corrente');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !initialBalance) return;

    setLoading(true);
    try {
      const walletsRef = collection(db, 'users', user.uid, 'wallets');
      await addDoc(walletsRef, {
        nome: name,
        saldo_inicial: parseFloat(initialBalance),
        tipo: type,
        data_criacao: serverTimestamp()
      });
      onClose();
      setName('');
      setInitialBalance('');
    } catch (error) {
      console.error("Error adding wallet: ", error);
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
          <h2 className="text-white text-2xl font-bold text-center flex-1">Criar Carteira</h2>
          <div className="w-10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-text-muted text-sm font-medium">Nome da Carteira</label>
            <input
              type="text"
              placeholder="Ex: Reserva de Emergência"
              className="w-full h-12 bg-transparent border border-text-muted rounded-lg px-4 text-white focus:outline-none focus:border-primary"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-text-muted text-sm font-medium">Valor Inicial (R$):</label>
            <input
              type="number"
              step="0.01"
              placeholder="0,00"
              className="w-full h-12 bg-transparent border border-text-muted rounded-lg px-4 text-white focus:outline-none focus:border-primary"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-text-muted text-sm font-medium">Ícone da Carteira</label>
            <button type="button" className="w-full h-12 bg-text-muted/20 border border-primary border-dashed rounded-lg flex items-center justify-center gap-2 text-white">
              <ImageIcon size={20} />
              <span>Carregar imagem</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-primary text-white font-bold text-lg rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Processando...' : 'Criar Carteira'}
          </button>
        </form>
      </div>
    </div>
  );
}
