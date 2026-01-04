import React, { useState, useEffect } from 'react';
import { Calculator } from './components/Calculator';
import { ShoppingList } from './components/ShoppingList';
import { ListsOverview } from './components/ListsOverview';
import { ShoppingList as ShoppingListType, ViewState } from './types';
import { List, Calculator as CalcIcon, Home } from 'lucide-react';

const App: React.FC = () => {
  const [lists, setLists] = useState<ShoppingListType[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>(ViewState.LISTS);

  // Load from local storage on mount
  useEffect(() => {
    const savedLists = localStorage.getItem('shopping_lists');
    if (savedLists) {
      try {
        setLists(JSON.parse(savedLists));
      } catch (e) {
        console.error("Failed to parse lists", e);
      }
    } else {
        // Default initial list
        const initialList: ShoppingListType = {
            id: 'default-1',
            name: 'Compras da Semana',
            items: [],
            createdAt: Date.now()
        };
        setLists([initialList]);
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (lists.length > 0) {
        localStorage.setItem('shopping_lists', JSON.stringify(lists));
    }
  }, [lists]);

  const handleCreateList = (name: string) => {
    const newList: ShoppingListType = {
      id: Date.now().toString(),
      name,
      items: [],
      createdAt: Date.now(),
    };
    setLists(prev => [newList, ...prev]);
    setActiveListId(newList.id);
    setView(ViewState.CURRENT_LIST);
  };

  const handleDeleteList = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta lista?")) {
        setLists(prev => prev.filter(l => l.id !== id));
        if (activeListId === id) {
            setActiveListId(null);
            setView(ViewState.LISTS);
        }
    }
  };

  const handleUpdateList = (updatedList: ShoppingListType) => {
    setLists(prev => prev.map(l => l.id === updatedList.id ? updatedList : l));
  };

  const handleSelectList = (id: string) => {
    setActiveListId(id);
    setView(ViewState.CURRENT_LIST);
  };

  // Navigation Logic
  const renderContent = () => {
    switch (view) {
      case ViewState.LISTS:
        return (
          <ListsOverview 
            lists={lists} 
            onCreate={handleCreateList} 
            onSelect={handleSelectList}
            onDelete={handleDeleteList}
          />
        );
      case ViewState.CURRENT_LIST:
        const activeList = lists.find(l => l.id === activeListId);
        if (!activeList) {
            setView(ViewState.LISTS);
            return null;
        }
        return (
          <ShoppingList 
            list={activeList} 
            onUpdateList={handleUpdateList} 
            onBack={() => setView(ViewState.LISTS)}
          />
        );
      case ViewState.CALCULATOR:
        return <Calculator />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 max-w-md mx-auto shadow-2xl overflow-hidden relative">
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-100 flex justify-around items-center p-2 pb-safe z-50">
        <button 
          onClick={() => setView(ViewState.LISTS)}
          className={`flex flex-col items-center p-2 rounded-xl transition-colors ${view === ViewState.LISTS ? 'text-brand-600 bg-brand-50' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Home size={24} strokeWidth={view === ViewState.LISTS ? 2.5 : 2} />
          <span className="text-[10px] font-medium mt-1">Início</span>
        </button>

        <button 
          onClick={() => {
              if (activeListId) {
                  setView(ViewState.CURRENT_LIST);
              } else if (lists.length > 0) {
                  setActiveListId(lists[0].id);
                  setView(ViewState.CURRENT_LIST);
              } else {
                  // If no list exists, user stays on Create List (Home) but visual feedback is good
                  alert("Crie uma lista primeiro!");
              }
          }}
          className={`flex flex-col items-center p-2 rounded-xl transition-colors ${view === ViewState.CURRENT_LIST ? 'text-brand-600 bg-brand-50' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <List size={24} strokeWidth={view === ViewState.CURRENT_LIST ? 2.5 : 2} />
          <span className="text-[10px] font-medium mt-1">Lista Atual</span>
        </button>

        <button 
          onClick={() => setView(ViewState.CALCULATOR)}
          className={`flex flex-col items-center p-2 rounded-xl transition-colors ${view === ViewState.CALCULATOR ? 'text-brand-600 bg-brand-50' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <CalcIcon size={24} strokeWidth={view === ViewState.CALCULATOR ? 2.5 : 2} />
          <span className="text-[10px] font-medium mt-1">Calculadora</span>
        </button>
      </nav>
    </div>
  );
};

export default App;