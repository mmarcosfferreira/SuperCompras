import React, { useState, useEffect } from 'react';
import { Plus, ShoppingCart, Calendar, ArrowRight, Trash2, X, Download } from 'lucide-react';
import { ShoppingList } from '../types';

interface Props {
  lists: ShoppingList[];
  onSelect: (listId: string) => void;
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
}

export const ListsOverview: React.FC<Props> = ({ lists, onSelect, onCreate, onDelete }) => {
  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    // Show the install prompt
    installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const handleCreate = () => {
    if (newListName.trim()) {
      onCreate(newListName);
      setNewListName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="mb-6 mt-2 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Minhas Listas</h1>
            <p className="text-gray-500">Organize suas compras</p>
          </div>
          
          {/* Install PWA Button */}
          {installPrompt && (
            <button 
              onClick={handleInstallClick}
              className="bg-brand-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-md hover:bg-brand-700 transition-colors animate-pulse"
            >
              <Download size={14} />
              Instalar App
            </button>
          )}
        </div>

        <div className="grid gap-4">
          {lists.map(list => {
            const itemCount = list.items.length;
            const checkedCount = list.items.filter(i => i.checked).length;
            const percentage = itemCount > 0 ? Math.round((checkedCount / itemCount) * 100) : 0;
            const totalValue = list.items.reduce((acc, i) => acc + ((i.price || 0) * i.quantity), 0);

            return (
              <div 
                key={list.id} 
                onClick={() => onSelect(list.id)}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 active:scale-98 transition-transform cursor-pointer relative group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <ShoppingCart size={24} />
                  </div>
                  {/* Delete Button - Enhanced Visibility */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(list.id); }}
                    className="p-2.5 bg-white border border-red-100 text-red-500 rounded-xl shadow-sm hover:bg-red-50 active:bg-red-100 transition-all z-10"
                    title="Excluir Lista"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                
                <h3 className="text-lg font-bold text-gray-800 mb-1">{list.name}</h3>
                <div className="flex items-center text-xs text-gray-500 gap-2 mb-4">
                  <Calendar size={12} />
                  <span>{new Date(list.createdAt).toLocaleDateString()}</span>
                  {totalValue > 0 && (
                     <span className="font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
                       R$ {totalValue.toFixed(2)}
                     </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-bold text-gray-600">{checkedCount}/{itemCount}</span>
                </div>
              </div>
            );
          })}

          {/* Create New List Button */}
          <button 
            onClick={() => setIsCreating(true)}
            className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-brand-400 hover:text-brand-500 transition-colors gap-2 min-h-[160px]"
          >
            <Plus size={32} />
            <span className="font-semibold">Criar Nova Lista</span>
          </button>
        </div>
      </div>

      {/* Creation Modal */}
      {isCreating && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsCreating(false)}>
          <div 
            className="bg-white w-[90%] max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-xl text-gray-800">Nova Lista</h3>
               <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600 p-2">
                 <X size={24} />
               </button>
            </div>
            
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nome da lista</label>
            <div className="relative mb-6">
                <input 
                  autoFocus
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Ex: Churrasco, Farmácia..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 pr-10 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all text-lg"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
                {newListName && (
                    <button 
                        onClick={() => setNewListName('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsCreating(false)}
                className="flex-1 py-3.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreate}
                disabled={!newListName.trim()}
                className="flex-1 py-3.5 bg-brand-600 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-brand-200 hover:bg-brand-700 active:scale-95 transition-all"
              >
                Criar <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};