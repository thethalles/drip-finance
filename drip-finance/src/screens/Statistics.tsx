import { useState, useEffect, useMemo, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Search, Wallet, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

type TransactionType = 'receita' | 'despesa';
type ViewMode = 'Detalhado' | 'Resumo';

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

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{ dataKey?: string; value?: number }>;
}

type TypeFilter = 'Todos' | 'Receitas' | 'Despesas';
interface SummaryItem {
  name: string;
  income: number;
  expense: number;
  total: number;
}

const DETAIL_WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function startOfWeek(date: Date) {
  const result = startOfDay(date);
  const offset = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - offset);
  return result;
}

function startOfMonth(date: Date) {
  const result = startOfDay(date);
  result.setDate(1);
  return result;
}

function parseDateInput(value: string, endOfRange = false) {
  const suffix = endOfRange ? 'T23:59:59' : 'T00:00:00';
  return new Date(`${value}${suffix}`);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' }).format(date).replace('.', '');
}

function formatPeriodLabel(start: Date, end: Date) {
  if (start.toDateString() === end.toDateString()) {
    return formatShortDate(start);
  }

  return `${formatShortDate(start)} - ${formatShortDate(end)}`;
}

function isSameDay(left: Date, right: Date) {
  return left.toDateString() === right.toDateString();
}

function getTransactionEntries(tx: Transaction) {
  return Array.isArray(tx.allEntries) && tx.allEntries.length > 0 ? tx.allEntries : [tx];
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ChartTooltip({ active, label, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const receipt = payload.find((entry) => entry.dataKey === 'income')?.value || 0;
  const expense = payload.find((entry) => entry.dataKey === 'expense')?.value || 0;

  return (
    <div className="rounded-xl border border-white/10 bg-[#222] px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-white/80">{label}</p>
      <div className="mt-2 space-y-1 text-xs">
        <p className="text-primary font-medium">Entradas: R$ {formatCurrency(receipt)}</p>
        <p className="text-danger font-medium">Saídas: R$ {formatCurrency(expense)}</p>
      </div>
    </div>
  );
}

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
  const [viewMode, setViewMode] = useState<ViewMode>('Detalhado');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailAnchor, setDetailAnchor] = useState(() => startOfDay(new Date()));
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('Todos');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [walletFilter, setWalletFilter] = useState('Todas');
  const [walletDataMap, setWalletDataMap] = useState<Record<string, Transaction[]>>({});
  const [wallets, setWallets] = useState<any[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    if (viewMode === 'Resumo' && searchOpen) {
      setSearchOpen(false);
    }
  }, [viewMode, searchOpen]);

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
      const txType = normalizeTransactionType(tx);
      if (typeFilter === 'Receitas' && txType !== 'receita') return;
      if (typeFilter === 'Despesas' && txType !== 'despesa') return;

      const name = (tx.categoriaNome || '').trim();
      if (name) unique.add(name);
    });
    return ['Todas', ...Array.from(unique).sort((a, b) => a.localeCompare(b, 'pt-BR'))];
  }, [allProcessedTransactions, typeFilter]);

  useEffect(() => {
    if (categoryFilter !== 'Todas' && !categories.includes(categoryFilter)) {
      setCategoryFilter('Todas');
    }
  }, [categoryFilter, categories]);

  const currentWindow = useMemo(() => {
    if (startDate || endDate) {
      const start = startDate
        ? startOfDay(parseDateInput(startDate))
        : endDate
          ? addDays(startOfDay(parseDateInput(endDate)), -(DETAIL_WINDOW_DAYS - 1))
          : startOfDay(detailAnchor);

      const end = endDate
        ? endOfDay(parseDateInput(endDate, true))
        : addDays(startOfDay(start), DETAIL_WINDOW_DAYS - 1);

      return { start, end, fixed: true };
    }

    const start = startOfDay(detailAnchor);
    const end = endOfDay(detailAnchor);
    return { start, end, fixed: false };
  }, [startDate, endDate, detailAnchor]);

  const filteredTransactions = useMemo(() => {
    const normalizedSearchQuery = normalizeSearchText(searchQuery);

    return allProcessedTransactions.filter((tx) => {
      const txDate = getTransactionDate(tx);
      if (!txDate) return false;
      const txType = normalizeTransactionType(tx);

      if (txDate < currentWindow.start || txDate > currentWindow.end) return false;

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

      if (normalizedSearchQuery) {
        const walletName = wallets.find((wallet) => wallet.id === tx.walletId)?.nome || '';
        const searchableText = normalizeSearchText(
          [tx.categoriaNome, tx.descricao, tx.tipo, walletName]
            .filter(Boolean)
            .join(' ')
        );

        if (!searchableText.includes(normalizedSearchQuery)) return false;
      }

      return true;
    });
  }, [allProcessedTransactions, currentWindow.start, currentWindow.end, typeFilter, categoryFilter, walletFilter, searchQuery, wallets]);

  const getTransactionValueForFilters = (tx: Transaction) => {
    if (walletFilter !== 'Todas' && tx.allEntries && tx.allEntries.length > 1) {
      return tx.allEntries
        .filter((e: any) => e.walletId === walletFilter)
        .reduce((sum: number, e: any) => sum + (e.valor || 0), 0);
    }

    return tx.valor || 0;
  };

  const getSignedTransactionValueForFilters = (tx: Transaction, value = getTransactionValueForFilters(tx)) => {
    const normalizedValue = Math.abs(value);
    return normalizeTransactionType(tx) === 'despesa' ? -normalizedValue : normalizedValue;
  };

  const chartData = useMemo<ChartDataPoint[]>(() => {
    const windowDays = Math.max(1, Math.ceil((currentWindow.end.getTime() - currentWindow.start.getTime()) / DAY_MS) + 1);
    const grouping = windowDays <= 45 ? 'day' : windowDays <= 365 ? 'week' : 'month';
    const buckets: Record<string, ChartDataPoint> = {};
    const orderedKeys: string[] = [];

    const addBucket = (key: string, label: string) => {
      if (!buckets[key]) {
        buckets[key] = { name: label, income: 0, expense: 0 };
        orderedKeys.push(key);
      }
      return buckets[key];
    };

    if (grouping === 'day') {
      let cursor = startOfDay(currentWindow.start);
      while (cursor <= currentWindow.end) {
        addBucket(cursor.toISOString(), formatShortDate(cursor));
        cursor = addDays(cursor, 1);
      }

      filteredTransactions.forEach((tx) => {
        const date = getTransactionDate(tx);
        if (!date) return;
        const bucketKey = startOfDay(date).toISOString();
        const bucket = buckets[bucketKey];
        if (!bucket) return;

        const txType = normalizeTransactionType(tx);
        const value = getTransactionValueForFilters(tx);
        if (txType === 'receita') bucket.income += value;
        if (txType === 'despesa') bucket.expense += value;
      });
    }

    if (grouping === 'week') {
      let cursor = startOfWeek(currentWindow.start);
      while (cursor <= currentWindow.end) {
        const bucketKey = cursor.toISOString();
        addBucket(bucketKey, `${formatShortDate(cursor)} - ${formatShortDate(addDays(cursor, 6))}`);
        cursor = addDays(cursor, 7);
      }

      filteredTransactions.forEach((tx) => {
        const date = getTransactionDate(tx);
        if (!date) return;
        const bucketKey = startOfWeek(date).toISOString();
        const bucket = buckets[bucketKey];
        if (!bucket) return;

        const txType = normalizeTransactionType(tx);
        const value = getTransactionValueForFilters(tx);
        if (txType === 'receita') bucket.income += value;
        if (txType === 'despesa') bucket.expense += value;
      });
    }

    if (grouping === 'month') {
      let cursor = startOfMonth(currentWindow.start);
      while (cursor <= currentWindow.end) {
        const bucketKey = `${cursor.getFullYear()}-${cursor.getMonth()}`;
        addBucket(bucketKey, formatMonthLabel(cursor));
        cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      }

      filteredTransactions.forEach((tx) => {
        const date = getTransactionDate(tx);
        if (!date) return;
        const bucketKey = `${date.getFullYear()}-${date.getMonth()}`;
        const bucket = buckets[bucketKey];
        if (!bucket) return;

        const txType = normalizeTransactionType(tx);
        const value = getTransactionValueForFilters(tx);
        if (txType === 'receita') bucket.income += value;
        if (txType === 'despesa') bucket.expense += value;
      });
    }

    return orderedKeys.map((key) => buckets[key]);
  }, [filteredTransactions, currentWindow.start, currentWindow.end, walletFilter]);

  const categorySummary = useMemo<SummaryItem[]>(() => {
    const summary = new Map<string, SummaryItem>();

    filteredTransactions.forEach((tx) => {
      const name = (tx.categoriaNome || 'Geral').trim() || 'Geral';
      const current = summary.get(name) || { name, income: 0, expense: 0, total: 0 };
      const value = getTransactionValueForFilters(tx);
      const txType = normalizeTransactionType(tx);
      const signedValue = getSignedTransactionValueForFilters(tx, value);

      if (txType === 'receita') current.income += value;
      if (txType === 'despesa') current.expense += value;
      current.total += signedValue;
      summary.set(name, current);
    });

    return Array.from(summary.values()).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'pt-BR'));
  }, [filteredTransactions, walletFilter]);

  const walletSummary = useMemo<SummaryItem[]>(() => {
    const summary = new Map<string, SummaryItem>();

    filteredTransactions.forEach((tx) => {
      const entries = getTransactionEntries(tx);
      if (entries.length > 1) {
        entries.forEach((entry: any) => {
          const walletId = entry.walletId || tx.walletId;
          const walletName = wallets.find((wallet) => wallet.id === walletId)?.nome || 'Carteira';
          const value = entry.valor || 0;
          const txType = normalizeTransactionType(entry as Transaction);
          const current = summary.get(walletName) || { name: walletName, income: 0, expense: 0, total: 0 };
          const signedValue = txType === 'despesa' ? -Math.abs(value) : Math.abs(value);

          if (txType === 'receita') current.income += value;
          if (txType === 'despesa') current.expense += value;
          current.total += signedValue;
          summary.set(walletName, current);
        });
        return;
      }

      const walletName = wallets.find((wallet) => wallet.id === tx.walletId)?.nome || 'Carteira';
      const value = getTransactionValueForFilters(tx);
      const txType = normalizeTransactionType(tx);
      const current = summary.get(walletName) || { name: walletName, income: 0, expense: 0, total: 0 };
      const signedValue = getSignedTransactionValueForFilters(tx, value);

      if (txType === 'receita') current.income += value;
      if (txType === 'despesa') current.expense += value;
      current.total += signedValue;
      summary.set(walletName, current);
    });

    return Array.from(summary.values()).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'pt-BR'));
  }, [filteredTransactions, wallets, walletFilter]);

  const detailNavigationLabel = useMemo(() => {
    const today = startOfDay(new Date());

    if (isSameDay(currentWindow.start, today) && isSameDay(currentWindow.end, today)) {
      return 'Hoje';
    }

    return formatPeriodLabel(currentWindow.start, currentWindow.end);
  }, [currentWindow.start, currentWindow.end]);

  const useBarChart = isSameDay(currentWindow.start, currentWindow.end);

  const getWalletDisplayName = (tx: Transaction) => {
    if (tx.allEntries && tx.allEntries.length > 1) return 'Múltiplas';
    return wallets.find(w => w.id === tx.walletId)?.nome || 'Carteira';
  };

  return (
    <div className="px-6 pt-8 pb-24">
      <header className="flex justify-between items-center mb-8">
        <div className="w-10" />
        <h1 className="text-white text-2xl font-bold">Estatísticas</h1>
        <button
          type="button"
          onClick={() => setSearchOpen((current) => !current)}
          disabled={viewMode === 'Resumo'}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            searchOpen ? "bg-white text-surface" : "bg-white/10 text-white"
          )}
          aria-label={viewMode === 'Resumo' ? 'Pesquisa indisponível no modo resumo' : searchOpen ? 'Fechar pesquisa' : 'Abrir pesquisa'}
        >
          {searchOpen ? <X size={20} /> : <Search size={20} />}
        </button>
      </header>

      {searchOpen && (
        <div className="mb-6 rounded-2xl bg-surface/70 px-4 py-3">
          <label className="text-text-muted text-xs font-semibold">Pesquisar transação</label>
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-text-muted/50 bg-transparent px-3">
            <Search size={18} className="text-text-muted shrink-0" />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Digite nome, categoria ou descrição"
              className="h-11 w-full bg-transparent text-sm text-white placeholder:text-text-muted focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="rounded-full p-1 text-text-muted transition-colors hover:text-white"
                aria-label="Limpar pesquisa"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex bg-surface rounded-2xl p-1 mb-6">
        {['Detalhado', 'Resumo'].map((tab) => (
          <button
            key={tab}
            onClick={() => setViewMode(tab as ViewMode)}
            className={cn(
              "flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors",
              viewMode === tab ? "bg-text-muted text-white" : "text-text-muted"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {viewMode === 'Detalhado' && (
        <div className="h-56 sm:h-64 w-full rounded-2xl bg-surface/70 p-3 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            {useBarChart ? (
              <BarChart data={chartData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#A3A3A3', fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.08)' }}
                  content={<ChartTooltip />}
                />
                <Bar dataKey="income" name="Entrada" fill="#34C759" radius={[8, 8, 0, 0]} barSize={18} />
                <Bar dataKey="expense" name="Saída" fill="#FF383C" radius={[8, 8, 0, 0]} barSize={18} />
              </BarChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#A3A3A3', fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis hide />
                <Tooltip
                  cursor={{ stroke: 'rgba(255,255,255,0.15)' }}
                  content={<ChartTooltip />}
                />
                <Line type="monotone" dataKey="income" name="Entrada" stroke="#34C759" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="expense" name="Saída" stroke="#FF383C" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      <div className="space-y-6 mb-10">
        {viewMode === 'Detalhado' && (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface/70 px-4 py-3">
            <button
              type="button"
              onClick={() => setDetailAnchor((current) => addDays(current, -1))}
              disabled={currentWindow.fixed}
              className="h-10 w-10 rounded-full bg-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Período anterior"
            >
              ‹
            </button>
            <div className="text-center">
              <p className="text-[11px] uppercase tracking-[0.2em] text-text-muted">Período em foco</p>
              <p className="text-sm font-semibold text-white">{detailNavigationLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => setDetailAnchor((current) => addDays(current, 1))}
              disabled={currentWindow.fixed}
              className="h-10 w-10 rounded-full bg-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Próximo período"
            >
              ›
            </button>
          </div>
        )}

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

      {viewMode === 'Detalhado' ? (
        <section className="space-y-6">
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Histórico de Transações</h3>
            <div className="space-y-3">
              {filteredTransactions.length === 0 ? (
                <p className="text-text-muted text-center py-4">Nenhuma transação encontrada.</p>
              ) : (
                filteredTransactions.map((tx) => {
                  const txType = normalizeTransactionType(tx);
                  const txDate = getTransactionDate(tx);
                  const displayValue = getTransactionValueForFilters(tx);

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
          </div>
        </section>
      ) : (
        <section className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-lg font-semibold">Total por Categoria</h3>
              <span className="text-xs text-text-muted">{categorySummary.length} itens</span>
            </div>
            {categorySummary.length === 0 ? (
              <p className="text-text-muted text-center py-4 bg-surface rounded-2xl">Nenhuma categoria encontrada.</p>
            ) : (
              <div className="space-y-3">
                {categorySummary.map((item) => (
                  <div key={item.name} className="bg-surface rounded-2xl p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-white font-medium truncate">{item.name}</p>
                        {item.income > 0 && item.expense === 0 ? (
                          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                            Receita
                          </span>
                        ) : item.expense > 0 && item.income === 0 ? (
                          <span className="rounded-full bg-danger/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-danger">
                            Despesa
                          </span>
                        ) : (
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                            Misto
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={cn("mt-3 grid gap-3 text-sm", item.income > 0 && item.expense > 0 ? "grid-cols-2" : "grid-cols-1")}>
                      {(item.income > 0 || item.expense === 0) && (
                        <div className="rounded-xl bg-white/5 p-3">
                          <p className="text-text-muted text-[10px] uppercase tracking-[0.12em]">Total</p>
                          <p className="text-primary font-semibold mt-1">R$ {item.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      )}
                      {(item.expense > 0 || item.income === 0) && (
                        <div className="rounded-xl bg-white/5 p-3">
                          <p className="text-text-muted text-[10px] uppercase tracking-[0.12em]">Total</p>
                          <p className="text-danger font-semibold mt-1">R$ {item.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-lg font-semibold">Total por Carteira</h3>
              <span className="text-xs text-text-muted">{walletSummary.length} itens</span>
            </div>
            {walletSummary.length === 0 ? (
              <p className="text-text-muted text-center py-4 bg-surface rounded-2xl">Nenhuma carteira encontrada.</p>
            ) : (
              <div className="space-y-3">
                {walletSummary.map((item) => (
                  <div key={item.name} className="bg-surface rounded-2xl p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                          <Wallet size={18} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{item.name}</p>
                          <p className="text-text-muted text-xs">Total no período</p>
                        </div>
                      </div>
                      <p className={cn("font-bold font-roboto-condensed", item.total < 0 ? "text-danger" : "text-white")}>R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-white/5 p-3">
                        <p className="text-text-muted text-[10px] uppercase tracking-[0.12em]">Receitas</p>
                        <p className="text-primary font-semibold mt-1">R$ {item.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="rounded-xl bg-white/5 p-3">
                        <p className="text-text-muted text-[10px] uppercase tracking-[0.12em]">Despesas</p>
                        <p className="text-danger font-semibold mt-1">R$ {item.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}