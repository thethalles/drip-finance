import { useAuth } from '../AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { User, Shield, LogOut, ChevronRight, Edit2 } from 'lucide-react';
import { useState } from 'react';
import EditProfileModal from '../components/EditProfileModal';

export default function Profile() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/splash');
  };

  return (
    <div className="px-6 pt-12 flex flex-col items-center">
      <h1 className="text-white text-2xl font-bold mb-10">Meu Perfil</h1>

      <div className="relative mb-6">
        <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center overflow-hidden">
          {userData?.photoURL ? (
            <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <User size={64} className="text-white" />
          )}
        </div>
        <button 
          onClick={() => setIsEditModalOpen(true)}
          className="absolute bottom-0 right-0 w-10 h-10 bg-surface border-2 border-secondary rounded-full flex items-center justify-center text-white shadow-lg"
        >
          <Edit2 size={18} />
        </button>
      </div>

      <div className="text-center mb-12">
        <h2 className="text-white text-2xl font-bold">{userData?.nome || 'Nome do Usuário'}</h2>
        <p className="text-text-muted">{userData?.email || 'usuario@email.com'}</p>
      </div>

      <div className="w-full space-y-4">
        <button 
          onClick={() => setIsEditModalOpen(true)}
          className="w-full flex items-center justify-between p-4 bg-transparent border-b border-text-muted/30 group"
        >
          <div className="flex items-center gap-4">
            <User className="text-white" size={24} />
            <span className="text-white font-medium text-lg">Editar Perfil</span>
          </div>
          <ChevronRight className="text-text-muted group-hover:text-white transition-colors" size={24} />
        </button>

        <button className="w-full flex items-center justify-between p-4 bg-transparent border-b border-text-muted/30 group">
          <div className="flex items-center gap-4">
            <Shield className="text-white" size={24} />
            <span className="text-white font-medium text-lg">Política de Privacidade</span>
          </div>
          <ChevronRight className="text-text-muted group-hover:text-white transition-colors" size={24} />
        </button>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-4 bg-transparent group"
        >
          <div className="flex items-center gap-4">
            <LogOut className="text-white" size={24} />
            <span className="text-white font-medium text-lg">Sair</span>
          </div>
          <ChevronRight className="text-text-muted group-hover:text-white transition-colors" size={24} />
        </button>
      </div>

      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
    </div>
  );
}
