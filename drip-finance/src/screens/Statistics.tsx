import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Search, ChevronDown, Wallet } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function Statistics() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('Semanal');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const walletsRef = collection(db, 'users', user.uid, 'wallets');
    const unsubscribeWallets = onSnapshot(walletsRef, (snapshot) => {
      const walletsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      walletsData.forEach(wallet => {
        const txRef = collection(db, 'users', user.uid, 'wallets', wallet.id, 'transactions');
        onSnapshot(txRef, (txSnapshot) => {
          const txData = txSnapshot.docs.map(doc => ({ id: doc.id, walletId: wallet.id, ...doc.data() }));
          setTransactions(prev => {
            const otherTx = prev.filter(t => t.walletId !== wallet.id);
            return [...otherTx, ...txData].sort((a, b) => (b.data?.seconds || 0) - (a.data?.seconds || 0));
          });
        });
      });
    });

    return () => unsubscribeWallets();
  }, [user]);

  useEffect(() => {
    // Process chart data based on transactions and filter
    // For now, let's group by day of week for 'Semanal'
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const grouped = days.map(day => ({ name: day, income: 0, expense: 0 }));

    transactions.forEach(tx => {
      if (!tx.data) return;
      const date = new Date(tx.data.seconds * 1000);
      const dayIndex = date.getDay();
      if (tx.tipo === 'receita') {
        grouped[dayIndex].income += tx.valor;
      } else {
        grouped[dayIndex].expense += tx.valor;
      }
    });

    setChartData(grouped);
  }, [transactions, filter]);

  return (
    <div className="px-6 pt-8 pb-24">
      <header className="flex justify-between items-center mb-8">
        <div className="w-10" /> {/* Spacer */}
        <h1 className="text-white text-2xl font-bold">Estatísticas</h1>
        <button className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white">
          <Search size={20} />
        </button>
      </header>

      {/* Chart Section */}
      <div className="h-48 w-full mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#696969', fontSize: 12 }} />
            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#222', border: 'none', borderRadius: '8px', color: '#fff' }} />
            <Bar dataKey="income" fill="#34C759" radius={[10, 10, 10, 10]} barSize={12} />
            <Bar dataKey="expense" fill="#FF383C" radius={[10, 10, 10, 10]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-surface rounded-lg p-1 mb-10">
        {['Semanal', 'Mensal', 'Anual'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              "flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors",
              filter === tab ? "bg-text-muted text-white" : "text-text-muted"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filters Section */}
      <div className="space-y-6 mb-10">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-text-muted text-xs font-semibold">Desde</label>
            <div className="h-10 border border-text-muted rounded-lg flex items-center justify-between px-3 text-sm">
              <span>01/01/2025</span>
              <ChevronDown size={16} className="text-text-muted" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-text-muted text-xs font-semibold">Até</label>
            <div className="h-10 border border-text-muted rounded-lg flex items-center justify-between px-3 text-sm">
              <span>04/11/2025</span>
              <ChevronDown size={16} className="text-text-muted" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-text-muted text-xs font-semibold">Tipo</label>
            <div className="h-10 border border-text-muted rounded-lg flex items-center justify-between px-3 text-sm">
              <span>Todos</span>
              <ChevronDown size={16} className="text-text-muted" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-text-muted text-xs font-semibold">Categoria</label>
            <div className="h-10 border border-text-muted rounded-lg flex items-center justify-between px-3 text-sm">
              <span>Todas</span>
              <ChevronDown size={16} className="text-text-muted" />
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <section>
        <h3 className="text-white text-lg font-semibold mb-4">Histórico de Transações</h3>
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <p className="text-text-muted text-center py-4">Nenhuma transação encontrada.</p>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="bg-surface rounded-2xl p-4 flex items-center justify-between">
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
    </div>
  );
}
