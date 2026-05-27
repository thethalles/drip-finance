import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { Plus, Wallet as WalletIcon, Trash2, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import WalletModal from '../components/WalletModal';
import EditWalletModal from '../components/EditWalletModal';

function isImageUrl(value: string) {
  return /^https?:\/\//i.test(value) || /^data:image\//i.test(value);
}

export default function Wallets() {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<any[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const walletsRef = collection(db, 'users', user.uid, 'wallets');
    const unsubscribe = onSnapshot(walletsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWallets(data);
      const total = data.reduce((acc, curr: any) => acc + (curr.saldo_inicial || 0), 0);
      setTotalBalance(total);
    });

    return unsubscribe;
  }, [user]);

  const handleEditWallet = (wallet: any) => {
    setSelectedWallet(wallet);
    setIsEditModalOpen(true);
  };

  return (
    <div className="px-6 pt-8">
      <header className="text-center mb-10">
        <h1 className="text-primary text-4xl font-bold font-roboto-condensed">
          R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </h1>
        <p className="text-text-muted font-medium mt-1">Valor total em carteiras</p>
      </header>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-lg font-semibold">Minhas Carteiras</h3>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary text-white text-xs px-3 py-1.5 rounded-md flex items-center gap-1 font-medium"
          >
            <Plus size={14} />
            Adicionar Carteira
          </button>
        </div>

        <div className="border border-text-muted rounded-2xl p-2 space-y-2">
          {wallets.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              <p>Você ainda não tem carteiras.</p>
            </div>
          ) : (
            wallets.map((wallet) => (
              <div 
                key={wallet.id} 
                onClick={() => handleEditWallet(wallet)}
                className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                    {wallet.icon ? (
                      isImageUrl(wallet.icon) ? (
                        <img src={wallet.icon} alt="Wallet icon" className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-white text-2xl leading-none">{wallet.icon}</span>
                      )
                    ) : (
                      <WalletIcon className="text-white" size={24} />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">{wallet.nome}</p>
                    <p className={cn("font-bold text-sm", wallet.saldo_inicial >= 0 ? "text-primary" : "text-danger")}>
                      R$ {wallet.saldo_inicial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <ChevronRight className="text-text-muted group-hover:text-white transition-colors" size={20} />
              </div>
            ))
          )}
        </div>
      </section>

      <WalletModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <EditWalletModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        wallet={selectedWallet} 
      />
    </div>
  );
}
