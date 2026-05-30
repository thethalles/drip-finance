import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, ChevronDown, Image as ImageIcon, Trash2, Wallet } from 'lucide-react';
import { db } from '../firebase';
import { collection, doc, onSnapshot, serverTimestamp, increment, writeBatch } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { cn, formatCurrencyInput, formatDateInputValue, parseCalendarDateInput, parseCurrencyInput } from '../lib/utils';
import CategoryModal from './CategoryModal';

interface WalletEntry {
  walletId: string;
  value: string;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TransactionModal({ isOpen, onClose }: TransactionModalProps) {
  const { user } = useAuth();
  const [type, setType] = useState<'receita' | 'despesa'>('receita');
  const [entries, setEntries] = useState<WalletEntry[]>([{ walletId: '', value: '' }]);
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(() => formatDateInputValue(new Date()));
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
      if (data.length > 0 && entries[0].walletId === '') {
        setEntries([{ walletId: data[0].id, value: '' }]);
      }
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

  const addWalletEntry = () => {
    setEntries([...entries, { walletId: '', value: '' }]);
  };

  const removeWalletEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const updateEntry = (index: number, field: keyof WalletEntry, val: string) => {
    const newEntries = [...entries];
    newEntries[index][field] = val;
    setEntries(newEntries);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !categoryId || entries.some(e => !e.walletId || !e.value)) return;

    setLoading(true);
    const batch = writeBatch(db);
    const groupId = crypto.randomUUID();

    try {
      for (const entry of entries) {
        const txValue = parseCurrencyInput(entry.value);
        const txRef = doc(collection(db, 'users', user.uid, 'wallets', entry.walletId, 'transactions'));
        
        batch.set(txRef, {
          groupId,
          tipo: type,
          categoriaId: categoryId,
          categoriaNome: categories.find(c => c.id === categoryId)?.nome || '',
          valor: txValue,
          data: parseCalendarDateInput(date),
          descricao: description,
          criado_em: serverTimestamp(),
          atualizado_em: serverTimestamp()
        });

        const walletRef = doc(db, 'users', user.uid, 'wallets', entry.walletId);
        const balanceAdjustment = type === 'receita' ? txValue : -txValue;
        batch.update(walletRef, {
          saldo_inicial: increment(balanceAdjustment)
        });
      }

      await batch.commit();
      onClose();
      setEntries([{ walletId: wallets[0]?.id || '', value: '' }]);
      setDescription('');
    } catch (error) {
      console.error(error);
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
              <label className="text-text-muted text-sm font-medium">Categoria</label>
              <div className="flex gap-2">
                <select
                  className="flex-1 h-12 bg-transparent border border-text-muted rounded-lg px-2 text-xs text-white focus:outline-none focus:border-primary appearance-none"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="" disabled className="bg-surface">Categoria</option>
                  {categories.filter(c => c.tipo === type).map(c => (
                    <option key={c.id} value={c.id} className="bg-surface">{c.nome}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white">
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-text-muted text-sm font-medium">Carteiras e Valores</label>
              <button type="button" onClick={addWalletEntry} className="text-primary text-xs font-bold flex items-center gap-1">
                <Plus size={14} /> Adicionar Carteira
              </button>
            </div>
            
            {entries.map((entry, index) => (
              <div key={index} className="p-4 bg-secondary/50 rounded-2xl space-y-3 border border-white/5 relative">
                {entries.length > 1 && (
                  <button type="button" onClick={() => removeWalletEntry(index)} className="absolute -top-2 -right-2 bg-danger text-white p-1 rounded-full">
                    <X size={14} />
                  </button>
                )}
                
                <div className="relative">
                  <Wallet size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-text-muted" />
                  <select
                    className="w-full h-10 bg-transparent border-b border-text-muted pl-6 text-sm text-white focus:outline-none focus:border-primary appearance-none"
                    value={entry.walletId}
                    onChange={(e) => updateEntry(index, 'walletId', e.target.value)}
                    required
                  >
                    <option value="" disabled className="bg-surface">Selecione a carteira</option>
                    {wallets.map(w => (
                      <option 
                        key={w.id} 
                        value={w.id} 
                        className={cn("bg-surface", w.saldo_inicial >= 0 ? "text-primary" : "text-danger")}
                      >
                        {w.nome} (R$ {w.saldo_inicial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>

                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-text-muted text-sm">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    className="w-full h-10 bg-transparent border-b border-text-muted pl-6 text-white focus:outline-none focus:border-primary font-roboto-condensed text-lg"
                    value={entry.value}
                    onChange={(e) => updateEntry(index, 'value', formatCurrencyInput(e.target.value))}
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <label className="text-text-muted text-sm font-medium">Descrição (opcional)</label>
            <textarea
              className="w-full h-20 bg-transparent border border-text-muted rounded-lg p-4 text-white focus:outline-none focus:border-primary resize-none"
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
            {loading ? 'Processando...' : 'Finalizar Registro'}
          </button>
        </form>
      </div>

      <CategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} type={type} categories={categories} />
    </div>
  );
}