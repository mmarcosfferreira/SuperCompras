import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  MoreVertical, 
  Check, 
  Share2, 
  ChevronLeft,
  Circle,
  CheckCircle2,
  Edit2,
  DollarSign,
  ShoppingBasket,
  Camera,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import { ShoppingList as ListType, ShoppingItem, CategoryType, CATEGORIES, Unit } from '../types';
import { CATEGORY_ICONS, UNIT_LABELS } from '../constants';
import { categorizeItemWithAI } from '../services/geminiService';
import { ProductScanner } from './ProductScanner';

interface Props {
  list: ListType;
  onUpdateList: (updatedList: ListType) => void;
  onBack: () => void;
}

export const ShoppingList: React.FC<Props> = ({ list, onUpdateList, onBack }) => {
  const [newItemName, setNewItemName] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // New Item State
  const [newItemDetails, setNewItemDetails] = useState<{
    quantity: number;
    unit: Unit;
    category: CategoryType;
    price: string;
    notes: string;
  }>({
    quantity: 1,
    unit: Unit.UN,
    category: 'Outros',
    price: '',
    notes: ''
  });

  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Focus ref
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showAddItem && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showAddItem]);

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;

    let finalCategory = newItemDetails.category;
    
    // Simple optimistic UI
    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name: newItemName,
      quantity: newItemDetails.quantity,
      unit: newItemDetails.unit,
      category: finalCategory,
      price: newItemDetails.price ? parseFloat(newItemDetails.price) : undefined,
      notes: newItemDetails.notes,
      checked: false,
    };

    const updatedItems = [...list.items, newItem];
    onUpdateList({ ...list, items: updatedItems });

    // Reset Form
    setNewItemName('');
    setNewItemDetails({
      quantity: 1,
      unit: Unit.UN,
      category: 'Outros',
      price: '',
      notes: ''
    });
    // Keep adding mode open for rapid entry
    if (inputRef.current) inputRef.current.focus();

    // AI Categorization in background
    if (finalCategory === 'Outros') {
      const aiCategory = await categorizeItemWithAI(newItem.name);
      if (aiCategory && aiCategory !== 'Outros') {
         // Update the item in the list asynchronously
         onUpdateList({
           ...list,
           items: [...list.items, { ...newItem, category: aiCategory }]
         });
      }
    }
  };

  const handleScanComplete = async (data: { name: string; price?: number }) => {
    setShowScanner(false);

    if (data.name && data.price) {
      // --- FLUXO AUTOMÁTICO ---
      // Se detectou preço, adiciona direto e fecha o modal
      
      const newItem: ShoppingItem = {
        id: Date.now().toString(),
        name: data.name,
        quantity: 1,
        unit: Unit.UN,
        category: 'Outros', // Será atualizado pela IA em background
        price: data.price,
        notes: '',
        checked: false,
      };

      // 1. Atualiza a lista imediatamente
      const updatedItems = [...list.items, newItem];
      onUpdateList({ ...list, items: updatedItems });

      // 2. Fecha o formulário e limpa estados (para garantir UX fluida)
      setShowAddItem(false);
      setNewItemName('');
      setNewItemDetails({ quantity: 1, unit: Unit.UN, category: 'Outros', price: '', notes: '' });

      // 3. Categorização em Background
      const aiCategory = await categorizeItemWithAI(newItem.name);
      if (aiCategory && aiCategory !== 'Outros') {
         // Atualiza a categoria do item recém criado
         const itemsWithCategory = updatedItems.map(i => 
           i.id === newItem.id ? { ...i, category: aiCategory } : i
         );
         onUpdateList({ ...list, items: itemsWithCategory });
      }

    } else {
      // --- FLUXO MANUAL ---
      // Se NÃO tem preço, preenche o nome e abre o formulário para o usuário completar
      setNewItemName(data.name);
      setNewItemDetails(prev => ({ 
        ...prev, 
        price: '' // Garante que está vazio para o usuário digitar
      }));
      setShowAddItem(true);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    const updatedItems = list.items.filter(i => i.id !== itemId);
    onUpdateList({ ...list, items: updatedItems });
  };

  const handleToggleCheck = (itemId: string) => {
    const updatedItems = list.items.map(i => 
      i.id === itemId ? { ...i, checked: !i.checked } : i
    );
    onUpdateList({ ...list, items: updatedItems });
  };

  const handleEditItem = (item: ShoppingItem) => {
    setNewItemName(item.name);
    setNewItemDetails({
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      price: item.price ? item.price.toString() : '',
      notes: item.notes || ''
    });
    setEditingItemId(item.id);
    setShowAddItem(true);
  };

  const handleUpdateItem = () => {
    if (!editingItemId) return;
    const updatedItems = list.items.map(i => 
      i.id === editingItemId ? {
        ...i,
        name: newItemName,
        quantity: newItemDetails.quantity,
        unit: newItemDetails.unit,
        category: newItemDetails.category,
        price: newItemDetails.price ? parseFloat(newItemDetails.price) : undefined,
        notes: newItemDetails.notes
      } : i
    );
    onUpdateList({ ...list, items: updatedItems });
    setEditingItemId(null);
    setShowAddItem(false);
    setNewItemName('');
    setNewItemDetails({ quantity: 1, unit: Unit.UN, category: 'Outros', price: '', notes: '' });
  };

  const handleShare = async () => {
    const text = `Lista: ${list.name}\n\n` + list.items.map(i => 
      `[${i.checked ? 'x' : ' '}] ${i.name} - ${i.quantity}${UNIT_LABELS[i.unit]}`
    ).join('\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: list.name,
          text: text,
        });
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      await navigator.clipboard.writeText(text);
      alert('Lista copiada para a área de transferência!');
    }
  };

  const totalEstimate = list.items.reduce((acc, item) => {
    if (item.price) {
      return acc + (item.price * item.quantity);
    }
    return acc;
  }, 0);

  // Group items
  const groupedItems = CATEGORIES.reduce((acc, cat) => {
    const items = list.items.filter(i => i.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {} as Record<CategoryType, ShoppingItem[]>);

  if (showScanner) {
    return <ProductScanner onScanComplete={handleScanComplete} onClose={() => setShowScanner(false)} />;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      {/* Header */}
      <div className="bg-white px-4 py-3 shadow-sm flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft className="text-gray-600" />
          </button>
          <div className="overflow-hidden">
            <h1 className="text-xl font-bold text-gray-800 truncate">{list.name}</h1>
            <p className="text-xs text-gray-500">{list.items.length} itens • {list.items.filter(i => i.checked).length} ok</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setViewMode(prev => prev === 'list' ? 'grid' : 'list')} 
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
            title="Alternar Visualização"
          >
            {viewMode === 'list' ? <LayoutGrid size={20} /> : <ListIcon size={20} />}
          </button>
          <button onClick={handleShare} className="p-2 text-brand-600 bg-brand-50 rounded-full hover:bg-brand-100">
            <Share2 size={20} />
          </button>
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-40 no-scrollbar">
        {list.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <ShoppingBasket size={48} className="mb-4 opacity-50" />
            <p>Sua lista está vazia.</p>
            <p className="text-sm">Toque em + para adicionar itens.</p>
          </div>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => {
            const Icon = CATEGORY_ICONS[category];
            return (
              <div key={category} className="mb-6">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="p-1.5 bg-brand-100 rounded-lg text-brand-700">
                    <Icon size={16} />
                  </div>
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">{category}</h2>
                </div>
                
                <div className={`${viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100'}`}>
                  {items.map((item, idx) => (
                    viewMode === 'list' ? (
                      // LIST VIEW ITEM
                      <div key={item.id} className={`flex items-start p-4 gap-3 ${idx !== items.length -1 ? 'border-b border-gray-50' : ''} ${item.checked ? 'bg-gray-50' : ''}`}>
                        <button 
                          onClick={() => handleToggleCheck(item.id)}
                          className={`mt-1 flex-shrink-0 transition-colors ${item.checked ? 'text-brand-500' : 'text-gray-300'}`}
                        >
                          {item.checked ? <CheckCircle2 size={24} className="fill-brand-100" /> : <Circle size={24} />}
                        </button>
                        
                        <div className="flex-1 min-w-0" onClick={() => handleEditItem(item)}>
                          <div className="flex justify-between items-start">
                            <span className={`font-medium text-lg leading-tight ${item.checked ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                              {item.name}
                            </span>
                            <span className="text-gray-500 font-medium text-sm whitespace-nowrap ml-2 bg-gray-100 px-2 py-0.5 rounded-md">
                              {item.quantity} {UNIT_LABELS[item.unit]}
                            </span>
                          </div>
                          {item.notes && (
                            <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
                          )}
                          {item.price && (
                            <p className="text-sm text-brand-600 font-semibold mt-1">
                              R$ {(item.price * item.quantity).toFixed(2)}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 ml-2 justify-center">
                          <button onClick={() => handleEditItem(item)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      // GRID VIEW ITEM (CARD)
                      <div 
                        key={item.id} 
                        className={`bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between relative ${item.checked ? 'opacity-60 bg-gray-50' : ''}`}
                      >
                         <div className="absolute top-2 right-2">
                            <button 
                              onClick={() => handleToggleCheck(item.id)}
                              className={`transition-colors ${item.checked ? 'text-brand-500' : 'text-gray-200'}`}
                            >
                              {item.checked ? <CheckCircle2 size={20} className="fill-brand-100" /> : <Circle size={20} />}
                            </button>
                         </div>
                         
                         <div onClick={() => handleEditItem(item)} className="mt-1">
                            <div className="text-brand-600 font-bold text-xs mb-1 bg-brand-50 inline-block px-1.5 py-0.5 rounded">
                              {item.quantity} {UNIT_LABELS[item.unit]}
                            </div>
                            <h3 className={`font-medium text-sm leading-tight mb-1 ${item.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                              {item.name}
                            </h3>
                            {item.price && (
                              <p className="text-xs font-semibold text-gray-500">
                                R$ {(item.price * item.quantity).toFixed(2)}
                              </p>
                            )}
                         </div>

                         <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-50">
                            <button onClick={() => handleEditItem(item)} className="p-1.5 text-blue-400 bg-blue-50 rounded-md">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 text-red-400 bg-red-50 rounded-md">
                              <Trash2 size={14} />
                            </button>
                         </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Total Bar */}
      {totalEstimate > 0 && !showAddItem && (
        <div className="absolute bottom-24 left-4 right-4 bg-gray-900 text-white p-4 rounded-2xl shadow-lg flex justify-between items-center z-20">
          <div>
            <p className="text-xs text-gray-400">Total Estimado</p>
            <p className="text-xl font-bold">R$ {totalEstimate.toFixed(2)}</p>
          </div>
          <div className="h-8 w-px bg-gray-700 mx-2"></div>
          <div className="text-right">
             <p className="text-xs text-gray-400">Itens</p>
             <p className="font-semibold">{list.items.length}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!showAddItem && (
        <div className="absolute bottom-6 right-6 flex flex-col gap-4 z-30">
          
          {/* Add Item Button */}
          <button 
            onClick={() => setShowAddItem(true)}
            className="w-14 h-14 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95"
            title="Adicionar Manualmente"
          >
            <Plus size={32} />
          </button>
        </div>
      )}

      {/* Add/Edit Overlay */}
      {showAddItem && (
        <div className="absolute inset-0 bg-black/50 z-40 flex items-end sm:items-center justify-center backdrop-blur-sm">
          <div className="bg-white w-full sm:w-96 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">{editingItemId ? 'Editar Item' : 'Novo Produto'}</h2>
              <button onClick={() => { setShowAddItem(false); setEditingItemId(null); }} className="text-gray-500 p-2">Fechar</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Produto</label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Ex: Arroz, Leite..."
                    className="w-full text-lg border-b-2 border-brand-200 focus:border-brand-500 outline-none py-2 pr-12 bg-transparent placeholder-gray-300"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') editingItemId ? handleUpdateItem() : handleAddItem();
                    }}
                  />
                  {/* Camera Icon Inside Input */}
                  <button 
                    onClick={() => setShowScanner(true)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-brand-600"
                    title="Escanear Produto"
                  >
                    <Camera size={22} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quantidade</label>
                  <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white">
                    <button 
                      onClick={() => setNewItemDetails(p => ({...p, quantity: Math.max(0.1, p.quantity - (p.unit === Unit.KG ? 0.5 : 1))}))}
                      className="px-3 py-3 bg-gray-50 hover:bg-gray-100 font-bold text-gray-600 border-r border-gray-200"
                    >-</button>
                    <input 
                      type="number" 
                      value={newItemDetails.quantity}
                      onChange={(e) => setNewItemDetails({...newItemDetails, quantity: parseFloat(e.target.value)})}
                      className="w-full text-center outline-none py-2 bg-white text-gray-900"
                    />
                    <button 
                       onClick={() => setNewItemDetails(p => ({...p, quantity: p.quantity + (p.unit === Unit.KG ? 0.5 : 1)}))}
                       className="px-3 py-3 bg-gray-50 hover:bg-gray-100 font-bold text-gray-600 border-l border-gray-200"
                    >+</button>
                  </div>
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Unidade</label>
                   <select 
                    value={newItemDetails.unit}
                    onChange={(e) => setNewItemDetails({...newItemDetails, unit: e.target.value as Unit})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 outline-none"
                   >
                     {Object.entries(UNIT_LABELS).map(([key, label]) => (
                       <option key={key} value={key}>{label}</option>
                     ))}
                   </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Preço Unitário (R$)</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                      type="number"
                      placeholder="0.00"
                      value={newItemDetails.price}
                      onChange={(e) => setNewItemDetails({...newItemDetails, price: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-3 outline-none"
                    />
                  </div>
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoria</label>
                   <select 
                    value={newItemDetails.category}
                    onChange={(e) => setNewItemDetails({...newItemDetails, category: e.target.value as CategoryType})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-3 outline-none text-sm"
                   >
                     {CATEGORIES.map((cat) => (
                       <option key={cat} value={cat}>{cat}</option>
                     ))}
                   </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Observações</label>
                <input
                  value={newItemDetails.notes}
                  onChange={(e) => setNewItemDetails({...newItemDetails, notes: e.target.value})}
                  placeholder="Ex: Marca X, sem glúten..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 outline-none text-sm"
                />
              </div>

              <button 
                onClick={editingItemId ? handleUpdateItem : handleAddItem}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl shadow-lg mt-4 flex items-center justify-center gap-2"
              >
                {editingItemId ? <Edit2 size={20} /> : <Plus size={20} />}
                {editingItemId ? 'Atualizar Item' : 'Adicionar à Lista'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};