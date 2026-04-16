import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';
import CategoryModal from './CategoryModal';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TransactionModal({ isOpen, onClose }: TransactionModalProps) {
  const { user } = useAuth();
  const [type, setType] = useState<'receita' | 'despesa'>('receita');
  const [walletId, setWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [wallets, setWallets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  useEffect(() => {
    if (!user || !isOpen) return;

    const walletsRef = collection(db, 'users', user.uid, 'wallets');
    const unsubscribeWallets = onSnapshot(walletsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWallets(data);
      if (data.length > 0 && !walletId) setWalletId(data[0].id);
    });

    const categoriesRef = collection(db, 'users', user.uid, 'categories');
    const unsubscribeCategories = onSnapshot(categoriesRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(data);
    });

    return () => {
      unsubscribeWallets();
      unsubscribeCategories();
    };
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !walletId || !categoryId || !value) return;

    setLoading(true);
    try {
      const txValue = parseFloat(value);
      const txRef = collection(db, 'users', user.uid, 'wallets', walletId, 'transactions');
      await addDoc(txRef, {
        tipo: type,
        categoriaId: categoryId,
        categoriaNome: categories.find(c => c.id === categoryId)?.nome || '',
        valor: txValue,
        data: new Date(date),
        descricao: description,
        criado_em: serverTimestamp(),
        atualizado_em: serverTimestamp()
      });

      // Update Wallet Balance
      const walletRef = doc(db, 'users', user.uid, 'wallets', walletId);
      const balanceAdjustment = type === 'receita' ? txValue : -txValue;
      await updateDoc(walletRef, {
        saldo_inicial: increment(balanceAdjustment)
      });

      onClose();
      // Reset form
      setValue('');
      setDescription('');
    } catch (error) {
      console.error("Error adding transaction: ", error);
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
          <h2 className="text-white text-2xl font-bold">Registrar Transação</h2>
          <div className="w-10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-text-muted text-sm font-medium">Tipo</label>
            <div className="flex bg-secondary rounded-lg p-1">
              <button
                type="button"
                onClick={() => setType('receita')}
                className={cn("flex-1 py-2 text-sm font-bold rounded-md transition-colors", type === 'receita' ? "bg-primary text-white" : "text-text-muted")}
              >
                Receita
              </button>
              <button
                type="button"
                onClick={() => setType('despesa')}
                className={cn("flex-1 py-2 text-sm font-bold rounded-md transition-colors", type === 'despesa' ? "bg-danger text-white" : "text-text-muted")}
              >
                Gasto
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-text-muted text-sm font-medium">Carteira</label>
            <select
              className="w-full h-12 bg-transparent border border-text-muted rounded-lg px-4 text-white focus:outline-none focus:border-primary appearance-none"
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              required
            >
              <option value="" disabled className="bg-surface">Selecione uma carteira</option>
              {wallets.map(w => (
                <option key={w.id} value={w.id} className="bg-surface">{w.nome}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-text-muted text-sm font-medium">Categoria</label>
            <div className="flex gap-2">
              <select
                className="flex-1 h-12 bg-transparent border border-text-muted rounded-lg px-4 text-white focus:outline-none focus:border-primary appearance-none"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                <option value="" disabled className="bg-surface">Selecione uma categoria</option>
                {categories.filter(c => c.tipo === type).map(c => (
                  <option key={c.id} value={c.id} className="bg-surface">{c.nome}</option>
                ))}
              </select>
              <button 
                type="button" 
                onClick={() => setIsCategoryModalOpen(true)}
                className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white"
              >
                <Plus size={24} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-text-muted text-sm font-medium">Data</label>
              <input
                type="date"
                className="w-full h-12 bg-transparent border border-text-muted rounded-lg px-4 text-white focus:outline-none focus:border-primary"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-text-muted text-sm font-medium">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                className="w-full h-12 bg-transparent border border-text-muted rounded-lg px-4 text-white focus:outline-none focus:border-primary"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-text-muted text-sm font-medium">Descrição (opcional)</label>
            <textarea
              className="w-full h-24 bg-transparent border border-text-muted rounded-lg p-4 text-white focus:outline-none focus:border-primary resize-none"
              placeholder="Ex: Aluguel, Salário..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-primary text-white font-bold text-lg rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Processando...' : 'Criar Registro'}
          </button>
        </form>
      </div>

      <CategoryModal 
        isOpen={isCategoryModalOpen} 
        onClose={() => setIsCategoryModalOpen(false)} 
        type={type} 
      />
    </div>
  );
}
