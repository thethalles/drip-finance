import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, collectionGroup, where } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Plus, ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react';
import { cn } from '../lib/utils';
import TransactionModal from '../components/TransactionModal';
import EditTransactionModal from '../components/EditTransactionModal';

export default function Home() {
  const { user, userData } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const walletsRef = collection(db, 'users', user.uid, 'wallets');
    const unsubscribeWallets = onSnapshot(walletsRef, (snapshot) => {
      const walletsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWallets(walletsData);
      
      const balance = walletsData.reduce((acc, curr: any) => acc + (curr.saldo_inicial || 0), 0);
      setTotalBalance(balance);

      // For simplicity, we'll fetch transactions from all wallets and merge them
      // In a real app, use collectionGroup with an index
      const allTx: any[] = [];
      walletsData.forEach(wallet => {
        const txRef = collection(db, 'users', user.uid, 'wallets', wallet.id, 'transactions');
        onSnapshot(txRef, (txSnapshot) => {
          const txData = txSnapshot.docs.map(doc => ({ id: doc.id, walletId: wallet.id, ...doc.data() }));
          // This is a bit naive but works for small amounts of data in this preview
          setTransactions(prev => {
            const otherTx = prev.filter(t => t.walletId !== wallet.id);
            const merged = [...otherTx, ...txData].sort((a, b) => (b.data?.seconds || 0) - (a.data?.seconds || 0));
            
            // Calculate totals
            const income = merged.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + t.valor, 0);
            const expense = merged.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + t.valor, 0);
            setTotalIncome(income);
            setTotalExpense(expense);
            
            return merged.slice(0, 10); // Limit to 10
          });
        });
      });
    });

    return () => {
      unsubscribeWallets();
    };
  }, [user]);

  const handleEditTransaction = (tx: any) => {
    setSelectedTransaction(tx);
    setSelectedWalletId(tx.walletId);
    setIsEditModalOpen(true);
  };

  return (
    <div className="px-6 pt-8">
      <header className="mb-8">
        <p className="text-text-muted font-semibold">Olá,</p>
        <h1 className="text-white text-2xl font-bold">{userData?.nome || 'Usuário'}</h1>
      </header>

      {/* Balance Card */}
      <div className="relative h-48 mb-12">
        <div className="absolute inset-x-4 top-4 h-full bg-white/10 rounded-3xl -z-10" />
        <div className="absolute inset-x-2 top-2 h-full bg-white/20 rounded-3xl -z-10" />
        <div className="h-full bg-[#D9D9D9] rounded-3xl p-6 text-secondary flex flex-col justify-between">
          <div>
            <p className="font-semibold text-sm">Saldo Total</p>
            <h2 className="text-4xl font-bold font-roboto-condensed mt-1">
              R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h2>
          </div>
          
          <div className="flex justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold">Receita</span>
              <div className="flex items-center gap-1 text-primary font-bold">
                <ArrowUpCircle size={16} />
                <span>R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold">Gastos</span>
              <div className="flex items-center gap-1 text-danger font-bold">
                <ArrowDownCircle size={16} />
                <span>R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-lg font-semibold">Transações Recentes</h3>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary text-white text-xs px-3 py-1.5 rounded-md flex items-center gap-1 font-medium"
          >
            <Plus size={14} />
            Adicionar Transação
          </button>
        </div>

        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="bg-surface rounded-2xl p-8 text-center text-text-muted">
              <p>Nenhuma transação recente.</p>
            </div>
          ) : (
            transactions.map((tx) => (
              <div 
                key={tx.id} 
                onClick={() => handleEditTransaction(tx)}
                className="bg-surface rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                    <Wallet className="text-white" size={24} />
                  </div>
                  <div>
                    <p className="text-white font-medium">{tx.categoriaNome || 'Geral'}</p>
                    <p className="text-text-muted text-xs">{tx.descricao || tx.tipo}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("font-bold font-roboto-condensed", tx.tipo === 'receita' ? "text-primary" : "text-danger")}>
                    {tx.tipo === 'receita' ? '+' : '-'} R$ {tx.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-text-muted text-[10px]">{tx.data?.seconds ? new Date(tx.data.seconds * 1000).toLocaleDateString('pt-BR') : '...'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <TransactionModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <EditTransactionModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        transaction={selectedTransaction}
        walletId={selectedWalletId}
      />
    </div>
  );
}
