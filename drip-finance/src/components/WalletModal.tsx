import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { formatCurrencyInput, parseCurrencyInput } from '../lib/utils';

const walletEmojiOptions = ['💼', '💸', '🪙', '🏦', '📈', '🧾', '🏠', '🚗', '🛒', '💳'];

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets?: any[];
}

function normalizeWalletName(value: string) {
  return value.trim().toLocaleLowerCase('pt-BR');
}

export default function WalletModal({ isOpen, onClose, wallets = [] }: WalletModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [type, setType] = useState('Conta Corrente');
  const [icon, setIcon] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !initialBalance) return;

    const trimmedName = name.trim();
    const normalizedName = normalizeWalletName(trimmedName);
    const alreadyExists = wallets.some((wallet) => normalizeWalletName(wallet.nome || '') === normalizedName);

    if (alreadyExists) {
      setError('Já existe uma carteira com esse nome.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const walletsRef = collection(db, 'users', user.uid, 'wallets');
      await addDoc(walletsRef, {
        nome: trimmedName,
        saldo_inicial: parseCurrencyInput(initialBalance),
        tipo: type,
        icon,
        data_criacao: serverTimestamp()
      });
      onClose();
      setName('');
      setInitialBalance('');
      setIcon('');
    } catch (error) {
      console.error("Error adding wallet: ", error);
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
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              required
            />
            {error && <p className="text-danger text-sm mt-2">{error}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-text-muted text-sm font-medium">Valor Inicial (R$):</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0,00"
              className="w-full h-12 bg-transparent border border-text-muted rounded-lg px-4 text-white focus:outline-none focus:border-primary"
              value={initialBalance}
              onChange={(e) => setInitialBalance(formatCurrencyInput(e.target.value))}
              required
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-text-muted text-sm font-medium">Ícone da Carteira</label>
              <button
                type="button"
                onClick={() => setIcon('')}
                className="text-xs text-text-muted hover:text-white transition-colors"
              >
                Nenhum
              </button>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {walletEmojiOptions.map((emoji) => {
                const isSelected = icon === emoji;
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={`h-14 rounded-2xl flex items-center justify-center text-2xl border transition-all ${
                      isSelected
                        ? 'bg-primary/20 border-primary scale-105'
                        : 'bg-white/5 border-white/10 hover:border-white/40'
                    }`}
                    aria-label={`Selecionar ícone ${emoji}`}
                    aria-pressed={isSelected}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
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
