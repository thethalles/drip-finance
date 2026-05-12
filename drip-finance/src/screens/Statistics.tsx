import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, Wallet } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

type TransactionType = 'receita' | 'despesa';

interface Transaction {
  id: string;
  walletId: string;
  groupId?: string;
  tipo?: TransactionType | string;
  valor?: number;
  data?: any;
  criado_em?: any;
  categoriaNome?: string;
  descricao?: string;
  allEntries?: any[];
}

interface ChartDataPoint {
  name: string;
  income: number;
  expense: number;
}

type PeriodFilter = 'Semanal' | 'Mensal' | 'Anual';
type TypeFilter = 'Todos' | 'Receitas' | 'Despesas';

function getTransactionDate(tx: Transaction): Date | null {
  if (!tx.data) return null;
  if (tx.data instanceof Date) return tx.data;
  if (typeof tx.data.toDate === 'function') return tx.data.toDate();
  if (typeof tx.data.seconds === 'number') return new Date(tx.data.seconds * 1000);
  const parsed = new Date(tx.data);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeTransactionType(tx: Transaction): TransactionType {
  const raw = (tx.tipo || '').toString().trim().toLowerCase();
  return raw === 'receita' ? 'receita' : 'despesa';
}

export default function Statistics() {
  const { user } = useAuth();
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('Semanal');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('Todos');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [walletFilter, setWalletFilter] = useState('Todas');
  const [walletDataMap, setWalletDataMap] = useState<Record<string, Transaction[]>>({});
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const walletsRef = collection(db, 'users', user.uid, 'wallets');
    const unsubscribeWallets = onSnapshot(walletsRef, (snapshot) => {
      const walletsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWallets(walletsData);
      
      walletsData.forEach((wallet) => {
        const txRef = collection(db, 'users', user.uid, 'wallets', wallet.id, 'transactions');
        onSnapshot(txRef, (txSnapshot) => {
          const txData = txSnapshot.docs.map((doc) => ({
            id: doc.id,
            walletId: wallet.id,
            ...doc.data(),
          })) as Transaction[];

          setWalletDataMap((prev: Record<string, Transaction[]>) => ({ ...prev, [wallet.id]: txData }));
        });
      });
    });

    return () => unsubscribeWallets();
  }, [user]);

  const allProcessedTransactions = useMemo(() => {
    const rawMerged = Object.values(walletDataMap).flat();
    
    const grouped = rawMerged.reduce((acc: any[], current) => {
      const existingIndex = current.groupId 
        ? acc.findIndex((t: any) => t.groupId === current.groupId) 
        : -1;

      if (existingIndex > -1) {
        acc[existingIndex].valor += (current.valor || 0);
        acc[existingIndex].allEntries = [...(acc[existingIndex].allEntries || []), current];
        
        const currentCreated = current.criado_em?.toMillis?.() || current.criado_em?.seconds * 1000 || Date.now();
        const existingCreated = acc[existingIndex].criado_em?.toMillis?.() || acc[existingIndex].criado_em?.seconds * 1000 || Date.now();
        if (currentCreated > existingCreated) acc[existingIndex].criado_em = current.criado_em;
      } else {
        acc.push({ ...current, allEntries: [current] });
      }
      return acc;
    }, []);

    return grouped.sort((a, b) => {
      const dateA = getTransactionDate(a)?.getTime() || 0;
      const dateB = getTransactionDate(b)?.getTime() || 0;
      if (dateB !== dateA) return dateB - dateA;

      const createdA = a.criado_em?.toMillis?.() || a.criado_em?.seconds * 1000 || Date.now();
      const createdB = b.criado_em?.toMillis?.() || b.criado_em?.seconds * 1000 || Date.now();
      return createdB - createdA;
    });
  }, [walletDataMap]);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    allProcessedTransactions.forEach((tx) => {
      const name = (tx.categoriaNome || '').trim();
      if (name) unique.add(name);
    });
    return ['Todas', ...Array.from(unique).sort((a, b) => a.localeCompare(b, 'pt-BR'))];
  }, [allProcessedTransactions]);

  const filteredTransactions = useMemo(() => {
    const now = new Date();

    return allProcessedTransactions.filter((tx) => {
      const txDate = getTransactionDate(tx);
      if (!txDate) return false;
      const txType = normalizeTransactionType(tx);

      if (periodFilter === 'Semanal') {
        const weekStart = new Date(now);
        weekStart.setHours(0, 0, 0, 0);
        weekStart.setDate(now.getDate() - 6);
        if (txDate < weekStart || txDate > now) return false;
      }

      if (periodFilter === 'Mensal') {
        if (txDate.getMonth() !== now.getMonth() || txDate.getFullYear() !== now.getFullYear()) return false;
      }

      if (periodFilter === 'Anual') {
        if (txDate.getFullYear() !== now.getFullYear()) return false;
      }

      if (startDate) {
        const start = new Date(`${startDate}T00:00:00`);
        if (txDate < start) return false;
      }

      if (endDate) {
        const end = new Date(`${endDate}T23:59:59`);
        if (txDate > end) return false;
      }

      if (typeFilter === 'Receitas' && txType !== 'receita') return false;
      if (typeFilter === 'Despesas' && txType !== 'despesa') return false;
      if (categoryFilter !== 'Todas' && (tx.categoriaNome || '').trim() !== categoryFilter) return false;
      
      if (walletFilter !== 'Todas') {
        if (tx.allEntries && tx.allEntries.length > 1) {
          if (!tx.allEntries.some((e: any) => e.walletId === walletFilter)) return false;
        } else if (tx.walletId !== walletFilter) {
          return false;
        }
      }

      return true;
    });
  }, [allProcessedTransactions, periodFilter, startDate, endDate, typeFilter, categoryFilter, walletFilter]);

  useEffect(() => {
    let grouped: ChartDataPoint[] = [];

    if (periodFilter === 'Semanal') {
      const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      grouped = weekDays.map((day) => ({ name: day, income: 0, expense: 0 }));
      filteredTransactions.forEach((tx) => {
        const date = getTransactionDate(tx);
        if (!date) return;
        const index = date.getDay();
        const txType = normalizeTransactionType(tx);
        
        let val = tx.valor || 0;
        if (walletFilter !== 'Todas' && tx.allEntries && tx.allEntries.length > 1) {
          val = tx.allEntries
            .filter((e: any) => e.walletId === walletFilter)
            .reduce((sum: number, e: any) => sum + e.valor, 0);
        }

        if (txType === 'receita') grouped[index].income += val;
        if (txType === 'despesa') grouped[index].expense += val;
      });
    }

    if (periodFilter === 'Mensal') {
      const reference = endDate ? new Date(`${endDate}T12:00:00`) : new Date();
      const daysInMonth = new Date(reference.getFullYear(), reference.getMonth() + 1, 0).getDate();
      grouped = Array.from({ length: daysInMonth }, (_, i) => ({ name: String(i + 1), income: 0, expense: 0 }));
      filteredTransactions.forEach((tx) => {
        const date = getTransactionDate(tx);
        if (!date) return;
        const index = date.getDate() - 1;
        if (grouped[index]) {
          const txType = normalizeTransactionType(tx);
          let val = tx.valor || 0;
          if (walletFilter !== 'Todas' && tx.allEntries && tx.allEntries.length > 1) {
            val = tx.allEntries
              .filter((e: any) => e.walletId === walletFilter)
              .reduce((sum: number, e: any) => sum + e.valor, 0);
          }
          if (txType === 'receita') grouped[index].income += val;
          if (txType === 'despesa') grouped[index].expense += val;
        }
      });
    }

    if (periodFilter === 'Anual') {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      grouped = months.map((month) => ({ name: month, income: 0, expense: 0 }));
      filteredTransactions.forEach((tx) => {
        const date = getTransactionDate(tx);
        if (!date) return;
        const index = date.getMonth();
        const txType = normalizeTransactionType(tx);
        let val = tx.valor || 0;
        if (walletFilter !== 'Todas' && tx.allEntries && tx.allEntries.length > 1) {
          val = tx.allEntries
            .filter((e: any) => e.walletId === walletFilter)
            .reduce((sum: number, e: any) => sum + e.valor, 0);
        }
        if (txType === 'receita') grouped[index].income += val;
        if (txType === 'despesa') grouped[index].expense += val;
      });
    }

    setChartData(grouped);
  }, [filteredTransactions, periodFilter, endDate, walletFilter]);

  const getWalletDisplayName = (tx: Transaction) => {
    if (tx.allEntries && tx.allEntries.length > 1) return 'Múltiplas';
    return wallets.find(w => w.id === tx.walletId)?.nome || 'Carteira';
  };

  return (
    <div className="px-6 pt-8 pb-24">
      <header className="flex justify-between items-center mb-8">
        <div className="w-10" />
        <h1 className="text-white text-2xl font-bold">Estatísticas</h1>
        <button className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white">
          <Search size={20} />
        </button>
      </header>

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

      <div className="flex bg-surface rounded-lg p-1 mb-10">
        {['Semanal', 'Mensal', 'Anual'].map((tab) => (
          <button
            key={tab}
            onClick={() => setPeriodFilter(tab as PeriodFilter)}
            className={cn(
              "flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors",
              periodFilter === tab ? "bg-text-muted text-white" : "text-text-muted"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-6 mb-10">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-text-muted text-xs font-semibold">Desde</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-10 w-full border border-text-muted rounded-lg px-3 text-sm bg-transparent text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-text-muted text-xs font-semibold">Até</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-10 w-full border border-text-muted rounded-lg px-3 text-sm bg-transparent text-white" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-text-muted text-xs font-semibold">Tipo</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TypeFilter)} className="h-10 w-full border border-text-muted rounded-lg px-3 text-sm bg-surface text-white">
              <option value="Todos">Todos</option>
              <option value="Receitas">Receitas</option>
              <option value="Despesas">Despesas</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-text-muted text-xs font-semibold">Carteira</label>
            <select value={walletFilter} onChange={(e) => setWalletFilter(e.target.value)} className="h-10 w-full border border-text-muted rounded-lg px-3 text-sm bg-surface text-white">
              <option value="Todas">Todas</option>
              {wallets.map(w => (
                <option key={w.id} value={w.id}>{w.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-text-muted text-xs font-semibold">Categoria</label>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-10 w-full border border-text-muted rounded-lg px-3 text-sm bg-surface text-white">
            {categories.map((category) => (<option key={category} value={category}>{category}</option>))}
          </select>
        </div>
      </div>

      <section>
        <h3 className="text-white text-lg font-semibold mb-4">Histórico de Transações</h3>
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <p className="text-text-muted text-center py-4">Nenhuma transação encontrada.</p>
          ) : (
            filteredTransactions.map((tx) => {
              const txType = normalizeTransactionType(tx);
              const txDate = getTransactionDate(tx);
              
              let displayValue = tx.valor || 0;
              if (walletFilter !== 'Todas' && tx.allEntries && tx.allEntries.length > 1) {
                displayValue = tx.allEntries
                  .filter((e: any) => e.walletId === walletFilter)
                  .reduce((sum: number, e: any) => sum + e.valor, 0);
              }

              return (
                <div key={tx.id} className="bg-surface rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center"><Wallet className="text-white" size={24} /></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{tx.categoriaNome || 'Geral'}</p>
                        {tx.allEntries && tx.allEntries.length > 1 && (
                          <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                            Dividido
                          </span>
                        )}
                      </div>
                      <p className="text-text-muted text-xs">{tx.descricao || tx.tipo}</p>
                      <div className="flex items-center gap-1 text-white text-[10px] font-medium mt-1 opacity-80">
                        <Wallet size={10} />
                        <span>Carteira: {getWalletDisplayName(tx)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-bold font-roboto-condensed", txType === 'receita' ? "text-primary" : "text-danger")}>
                      {txType === 'receita' ? '+' : '-'} R$ {displayValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-text-muted text-[10px]">{txDate ? txDate.toLocaleDateString('pt-BR') : '...'}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}