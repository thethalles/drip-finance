import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, userData: null });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Gerencia o estado de Autenticação
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Gerencia os dados do Firestore de forma independente
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    
    const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        // Atualização instantânea do estado global
        setUserData(docSnap.data());
        setLoading(false);
      } else {
        // Inicialização se o documento não existir (ex: logo após o registro)
        const initialData = {
          nome: user.displayName || 'Usuário',
          email: user.email,
          data_criacao: new Date(),
          photoURL: user.photoURL || '',
          preferences: {
            moeda: 'BRL',
            tema: 'dark',
            notificacoes: true
          }
        };
        setDoc(userDocRef, initialData).then(() => {
          setUserData(initialData);
          setLoading(false);
        });
      }
    }, (error) => {
      console.error("Erro no listener do Firestore:", error);
      setLoading(false);
    });

    return () => unsubscribeDoc();
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);