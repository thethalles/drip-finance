import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc, deleteDoc, collection, onSnapshot, serverTimestamp, increment } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';
import CategoryModal from './CategoryModal';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  walletId: string;
}

export default function EditTransactionModal({ isOpen, onClose, transaction, walletId }: EditTransactionModalProps) {
  const { user } = useAuth();
  const [type, setType] = useState<'receita' | 'despesa'>('receita');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState('');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (transaction) {
      setType(transaction.tipo);
      setCategoryId(transaction.categoriaId);
      setDate(new Date(transaction.data?.seconds * 1000).toISOString().split('T')[0]);
      setValue(transaction.valor.toString());
      setDescription(transaction.descricao || '');
      setIsDeleting(false);
    }
  }, [transaction]);

  useEffect(() => {
    if (!user || !isOpen) return;

    const categoriesRef = collection(db, 'users', user.uid, 'categories');
    const unsubscribe = onSnapshot(categoriesRef, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return unsubscribe;
  }, [user, isOpen]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !transaction || !walletId || !categoryId || !value) return;

    setLoading(true);
    try {
      const newValue = parseFloat(value);
      const txRef = doc(db, 'users', user.uid, 'wallets', walletId, 'transactions', transaction.id);
      
      // Calculate balance adjustment
      const oldImpact = transaction.tipo === 'receita' ? transaction.valor : -transaction.valor;
      const newImpact = type === 'receita' ? newValue : -newValue;
      const balanceAdjustment = newImpact - oldImpact;

      await updateDoc(txRef, {
        tipo: type,
        categoriaId: categoryId,
        categoriaNome: categories.find(c => c.id === categoryId)?.nome || '',
        valor: newValue,
        data: new Date(date),
        descricao: description,
        atualizado_em: serverTimestamp()
      });

      // Update Wallet Balance
      if (balanceAdjustment !== 0) {
        const walletRef = doc(db, 'users', user.uid, 'wallets', walletId);
        await updateDoc(walletRef, {
          saldo_inicial: increment(balanceAdjustment)
        });
      }

      onClose();
    } catch (error) {
      console.error("Error updating transaction: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !transaction || !walletId) return;
    
    if (!isDeleting) {
      setIsDeleting(true);
      return;
    }

    setLoading(true);
    try {
      const txRef = doc(db, 'users', user.uid, 'wallets', walletId, 'transactions', transaction.id);
      
      // Reverse balance impact
      const balanceAdjustment = transaction.tipo === 'receita' ? -transaction.valor : transaction.valor;
      
      await deleteDoc(txRef);

      // Update Wallet Balance
      const walletRef = doc(db, 'users', user.uid, 'wallets', walletId);
      await updateDoc(walletRef, {
        saldo_inicial: increment(balanceAdjustment)
      });

      onClose();
    } catch (error) {
      console.error("Error deleting transaction: ", error);
      setIsDeleting(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface rounded-t-[40px] p-8 pb-12 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onClose} className="w-10 h-10 bg-text-muted/20 rounded-lg flex items-center justify-center text-white">
            <X size={24} />
          </button>
          <h2 className="text-white text-2xl font-bold">Editar Transação</h2>
          <div className="w-10" />
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
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
            <label className="text-text-muted text-sm font-medium">Categoria</label>
            <div className="flex gap-2">
              <select
                className="flex-1 h-12 bg-transparent border border-text-muted rounded-lg px-4 text-white focus:outline-none focus:border-primary appearance-none"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                {categories.filter(c => c.tipo === type).map(c => (
                  <option key={c.id} value={c.id} className="bg-surface">{c.nome}</option>
                ))}
              </select>
              <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white">
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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

      <CategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} type={type} />
    </div>
  );
}
