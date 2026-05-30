import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Wallet, ChevronDown } from 'lucide-react';
import { db } from '../firebase';
import { doc, collection, onSnapshot, serverTimestamp, increment, writeBatch } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { cn, formatCurrencyInput, formatCurrencyValue, formatDateInputValue, parseCalendarDateInput, parseCurrencyInput } from '../lib/utils';
import CategoryModal from './CategoryModal';

interface WalletEntry {
  walletId: string;
  value: string;
  originalTxId?: string;
}

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
}

export default function EditTransactionModal({ isOpen, onClose, transaction }: EditTransactionModalProps) {
  const { user } = useAuth();
  const [type, setType] = useState<'receita' | 'despesa'>('receita');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [entries, setEntries] = useState<WalletEntry[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (transaction) {
      setType(transaction.tipo);
      setCategoryId(transaction.categoriaId);
      setDate(formatDateInputValue(transaction.data));
      setDescription(transaction.descricao || '');
      setEntries(transaction.allEntries.map((e: any) => ({
        walletId: e.walletId,
        value: formatCurrencyValue(e.valor),
        originalTxId: e.id
      })));
      setIsDeleting(false);
    }
  }, [transaction]);

  useEffect(() => {
    if (!user || !isOpen) return;
    const unsubCat = onSnapshot(collection(db, 'users', user.uid, 'categories'), (s) => setCategories(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubWal = onSnapshot(collection(db, 'users', user.uid, 'wallets'), (s) => setWallets(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubCat(); unsubWal(); };
  }, [user, isOpen]);

  const addWalletEntry = () => setEntries([...entries, { walletId: '', value: '' }]);
  const removeWalletEntry = (index: number) => entries.length > 1 && setEntries(entries.filter((_, i) => i !== index));
  const updateEntry = (index: number, field: keyof WalletEntry, val: string) => {
    const newEntries = [...entries];
    (newEntries[index] as any)[field] = val;
    setEntries(newEntries);
  };

  const isFormValid = Boolean(
    date && categoryId && entries.length > 0 &&
    entries.every(en => en.walletId && en.walletId.trim() !== '' && parseCurrencyInput(en.value) > 0)
  );

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !transaction) return;
    if (!isFormValid) return;

    setLoading(true);
    const batch = writeBatch(db);
    const groupId = transaction.groupId || crypto.randomUUID();

    try {
      transaction.allEntries.forEach((oldTx: any) => {
        batch.delete(doc(db, 'users', user.uid, 'wallets', oldTx.walletId, 'transactions', oldTx.id));
        batch.update(doc(db, 'users', user.uid, 'wallets', oldTx.walletId), {
          saldo_inicial: increment(transaction.tipo === 'receita' ? -oldTx.valor : oldTx.valor)
        });
      });

      entries.forEach((entry) => {
        const val = parseCurrencyInput(entry.value);
        const newTxRef = doc(collection(db, 'users', user.uid, 'wallets', entry.walletId, 'transactions'));
        batch.set(newTxRef, {
          groupId,
          tipo: type,
          categoriaId: categoryId,
          categoriaNome: categories.find(c => c.id === categoryId)?.nome || '',
          valor: val,
          data: parseCalendarDateInput(date),
          descricao: description,
          criado_em: transaction.criado_em || serverTimestamp(),
          atualizado_em: serverTimestamp()
        });
        batch.update(doc(db, 'users', user.uid, 'wallets', entry.walletId), {
          saldo_inicial: increment(type === 'receita' ? val : -val)
        });
      });

      await batch.commit();
      onClose();
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!user || !transaction) return;
    if (!isDeleting) { setIsDeleting(true); return; }
    setLoading(true);
    try {
      const batch = writeBatch(db);
      transaction.allEntries.forEach((tx: any) => {
        batch.delete(doc(db, 'users', user.uid, 'wallets', tx.walletId, 'transactions', tx.id));
        batch.update(doc(db, 'users', user.uid, 'wallets', tx.walletId), {
          saldo_inicial: increment(tx.tipo === 'receita' ? -tx.valor : tx.valor)
        });
      });
      await batch.commit();
      onClose();
    } catch (err) { console.error(err); setIsDeleting(false); } finally { setLoading(false); }
  };

  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[calc(100dvh-1rem)] overflow-y-auto overscroll-contain bg-surface rounded-t-[40px] p-8 pb-12 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onClose} className="w-10 h-10 bg-text-muted/20 rounded-lg flex items-center justify-center text-white"><X size={24} /></button>
          <h2 className="text-white text-2xl font-bold">Editar Transação</h2>
          <div className="w-10" />
        </div>
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="space-y-1">
            <label className="text-text-muted text-sm font-medium">Tipo</label>
            <div className="flex bg-secondary rounded-lg p-1">
              <button type="button" onClick={() => setType('receita')} className={cn("flex-1 py-2 text-sm font-bold rounded-md transition-colors", type === 'receita' ? "bg-primary text-white" : "text-text-muted")}>Receita</button>
              <button type="button" onClick={() => setType('despesa')} className={cn("flex-1 py-2 text-sm font-bold rounded-md transition-colors", type === 'despesa' ? "bg-danger text-white" : "text-text-muted")}>Gasto</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-text-muted text-sm font-medium">Data</label>
              <input type="date" className="w-full h-12 bg-transparent border border-text-muted rounded-lg px-4 text-white text-sm" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <label className="text-text-muted text-sm font-medium">Categoria</label>
              <div className="flex gap-2">
                <select className="flex-1 h-12 bg-transparent border border-text-muted rounded-lg px-2 text-white text-xs appearance-none" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                  {categories.filter(c => c.tipo === type).map(c => (<option key={c.id} value={c.id} className="bg-surface">{c.nome}</option>))}
                </select>
                <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white"><Plus size={20} /></button>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center"><label className="text-text-muted text-sm font-medium">Carteiras e Valores</label><button type="button" onClick={addWalletEntry} className="text-primary text-xs font-bold flex items-center gap-1"><Plus size={14} /> Adicionar Carteira</button></div>
            {entries.map((entry, index) => (
              <div key={index} className="p-4 bg-secondary/50 rounded-2xl space-y-3 border border-white/5 relative">
                {entries.length > 1 && (<button type="button" onClick={() => removeWalletEntry(index)} className="absolute -top-2 -right-2 bg-danger text-white p-1 rounded-full"><X size={14} /></button>)}
                
                <div className="relative">
                  <Wallet size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-text-muted" />
                  <select
                    className="w-full h-10 bg-transparent border-b border-text-muted pl-6 text-sm text-white focus:outline-none focus:border-primary appearance-none"
                    value={entry.walletId}
                    onChange={(e) => updateEntry(index, 'walletId', e.target.value)}
                    required
                  >
                    <option value="" disabled className="bg-surface">Selecionar carteira</option>
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

                <div className="relative"><span className="absolute left-0 top-1/2 -translate-y-1/2 text-text-muted text-sm">R$</span><input type="text" inputMode="numeric" placeholder="0,00" className="w-full h-10 bg-transparent border-b border-text-muted pl-6 text-white focus:outline-none focus:border-primary font-roboto-condensed text-lg" value={entry.value} onChange={(e) => updateEntry(index, 'value', formatCurrencyInput(e.target.value))} required /></div>
              </div>
            ))}
            {!isFormValid && (
              <p className="text-danger text-sm">Preencha todas as carteiras com valores maiores que zero.</p>
            )}
          </div>
          <div className="space-y-1"><label className="text-text-muted text-sm font-medium">Descrição (opcional)</label><textarea className="w-full h-20 bg-transparent border border-text-muted rounded-lg p-4 text-white focus:outline-none focus:border-primary resize-none" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="pt-4 flex gap-4">
            <button type="button" onClick={handleDelete} className={cn("h-14 rounded-2xl flex items-center justify-center transition-all duration-200", isDeleting ? "bg-danger w-full text-white font-bold" : "bg-danger/20 w-14 text-danger")}>{isDeleting ? "Confirmar Exclusão" : <Trash2 size={24} />}</button>
            {!isDeleting && (<button type="submit" disabled={loading || !isFormValid} className="flex-1 h-14 bg-primary text-white font-bold text-lg rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50">{loading ? 'Salvando...' : 'Salvar Alterações'}</button>)}
          </div>
        </form>
      </div>
      <CategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} type={type} categories={categories} />
    </div>
  );
}