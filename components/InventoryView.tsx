
import React, { useState, useMemo } from 'react';
import { 
  Search, PlusCircle, Filter, MapPin, PackagePlus, 
  Minus, Plus, Hash, Pencil 
} from 'lucide-react';
import { StockItem, Theme, ViewMode } from '../types';
import { ItemModal } from './ItemModal';

// --- COPIED STOCK CARD COMPONENT (ISOLATED) ---
// This ensures changes to the dashboard card don't break the inventory view and vice versa.

interface StockCardProps {
  item: StockItem;
  onUpdate: (id: string, newLevel: number) => void;
  onAddStock: () => void;
  onLogStock: (itemId: string, itemName: string, action: 'add' | 'remove', quantity: number, source?: string, context?: 'normal' | 'project' | 'manual' | 'po-normal' | 'po-project') => void;
  onClick: (item: StockItem) => void;
  viewMode: 'grid' | 'list';
  theme: Theme;
}

const InventoryProductCard: React.FC<StockCardProps> = ({ item, onUpdate, onAddStock, onLogStock, onClick, viewMode, theme }) => {
  const [bulkInput, setBulkInput] = useState('');
  const isDark = theme === 'dark';

  const handleAdjust = (amount: number) => {
    const currentLevel = item.stockLevel;
    const newLevel = Math.max(0, currentLevel + amount);
    const diff = newLevel - currentLevel;

    if (diff !== 0) {
      const action = diff > 0 ? 'add' : 'remove';
      const absQty = Math.abs(diff);
      onLogStock(item.id, item.name, action, absQty, 'Manuell (Bestand)', 'manual');
      onUpdate(item.id, newLevel);
    }
  };

  const handleClick = (e: React.MouseEvent, sign: number) => {
    e.stopPropagation();
    const val = parseInt(bulkInput);
    const qty = (!isNaN(val) && val > 0) ? val : 1;
    handleAdjust(qty * sign);
    setBulkInput('');
  };

  const handleBulkAdjust = (e: React.MouseEvent, sign: number) => {
    e.stopPropagation();
    const val = parseInt(bulkInput);
    if (!isNaN(val) && val > 0) {
      handleAdjust(val * sign);
      setBulkInput('');
    }
  };

  const getStockStatus = () => {
    if (item.stockLevel <= 0) return { bg: 'bg-red-500/20', text: 'text-red-500', label: 'Out of Stock' };
    if (item.stockLevel < item.minStock) return { bg: 'bg-amber-500/20', text: 'text-amber-600', label: 'Low Stock' };
    return { bg: 'bg-emerald-500/20', text: 'text-emerald-600', label: 'In Stock' };
  };

  const status = getStockStatus();

  if (viewMode === 'list') {
    return (
      <div 
        className={`flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 p-3 border rounded-lg transition-all group backdrop-blur-sm cursor-pointer ${
            isDark 
            ? 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600' 
            : 'bg-white/70 border-[#CACCCE]/50 hover:border-[#0077B5] shadow-sm'
        }`}
        onClick={() => onClick(item)}
      >
        <div className={`hidden sm:block w-2 h-10 rounded-full shrink-0 ${status.bg.replace('/20', '')}`} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1 sm:mb-0">
            <h3 className={`text-sm font-semibold truncate transition-colors group-hover:text-[#0077B5] ${isDark ? 'text-slate-100' : 'text-[#313335]'}`}>
              {item.name}
            </h3>
            <div className={`sm:hidden w-2 h-2 rounded-full ${status.bg.replace('/20', '')}`} />
          </div>
          <p className={`text-xs truncate ${isDark ? 'text-slate-500' : 'text-[#86888A]'}`}>SKU: {item.sku} • {item.system}</p>
          <div className={`flex items-center gap-1.5 mt-1 text-[11px] font-medium truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <MapPin size={12} className="opacity-70 shrink-0" />
            <span className="truncate">{item.warehouseLocation || 'Kein Lagerort'}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-500/10">
           <div className={`w-24 py-1 rounded-full ${status.bg} ${status.text} text-[10px] font-bold uppercase tracking-wider shrink-0 text-center`}>
            {item.stockLevel} STÜCK
          </div>

          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => onClick(item)}
              className={`p-1.5 rounded-md transition-colors ${isDark ? 'bg-slate-700 hover:bg-[#0077B5] text-slate-300' : 'bg-[#CACCCE]/30 hover:bg-[#0077B5] hover:text-white text-[#313335]'}`}
              title="Details ansehen"
            >
              <Pencil size={14} />
            </button>
            <button 
              onClick={onAddStock}
              className={`p-1.5 rounded-md transition-colors ${isDark ? 'bg-slate-700 hover:bg-[#0077B5] text-slate-300' : 'bg-[#CACCCE]/30 hover:bg-[#0077B5] hover:text-white text-[#313335]'}`}
              title="Bestand hinzufügen"
            >
              <PackagePlus size={14} />
            </button>
            <button 
              onClick={(e) => handleClick(e, -1)}
              className={`p-1.5 rounded-md transition-colors ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-[#CACCCE]/30 hover:bg-[#CACCCE]/50 text-[#313335]'}`}
            >
              <Minus size={14} />
            </button>
            <button 
              onClick={(e) => handleClick(e, 1)}
              className={`p-1.5 rounded-md transition-colors ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-[#CACCCE]/30 hover:bg-[#CACCCE]/50 text-[#313335]'}`}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
        className={`border rounded-xl p-4 flex flex-col gap-4 transition-all duration-300 group backdrop-blur-md cursor-pointer ${
            isDark 
            ? 'bg-slate-800/40 border-slate-700/50 hover:shadow-xl hover:shadow-black/20 hover:border-slate-600' 
            : 'bg-white/70 border-[#CACCCE]/40 hover:shadow-lg hover:border-[#0077B5]/40 shadow-sm'
        }`}
        onClick={() => onClick(item)}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <h3 className={`text-[15px] font-semibold leading-tight group-hover:text-[#0077B5] transition-colors line-clamp-2 min-h-[40px] ${
            isDark ? 'text-slate-100' : 'text-[#313335]'
          }`}>
            {item.name}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-[11px] font-medium">
            <span className={`px-1.5 py-0.5 rounded border transition-colors ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-500' : 'bg-[#CACCCE]/20 border-[#CACCCE] text-[#86888A]'
            }`}>#{item.sku}</span>
            <span className="text-[#86888A]">•</span>
            <span className={`uppercase ${isDark ? 'text-slate-500' : 'text-[#86888A]'}`}>{item.system}</span>
          </div>
        </div>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
           <button onClick={() => onClick(item)} className="text-[#86888A] hover:text-[#0077B5] transition-colors p-1" title="Details ansehen">
               <Pencil size={18} />
           </button>
           <button onClick={onAddStock} className="text-[#86888A] hover:text-[#0077B5] transition-colors p-1" title="Wareneingang">
              <PackagePlus size={18} />
           </button>
        </div>
      </div>

      <div className="flex items-center justify-between py-2">
        <div className={`px-4 py-1.5 rounded-full ${status.bg} flex items-center gap-2 transition-all duration-500`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${status.bg.replace('/20', '')}`} />
          <span className={`text-xs font-bold ${status.text} tracking-wide`}>
            Bestand: {item.stockLevel}
          </span>
        </div>
        <span className={`text-[10px] italic uppercase tracking-tighter text-right ${isDark ? 'text-slate-500' : 'text-[#86888A]'}`}>
          {item.warehouseLocation || '—'}
        </span>
      </div>

      <div className={`mt-auto pt-4 border-t transition-colors ${isDark ? 'border-slate-700/50' : 'border-[#CACCCE]/40'}`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button 
              onClick={(e) => handleClick(e, -1)}
              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all active:scale-90 ${
                isDark ? 'bg-slate-700/50 text-slate-300 hover:bg-red-500/20 hover:text-red-400' : 'bg-[#CACCCE]/30 text-[#313335] hover:bg-red-50 hover:text-red-600'
              }`}
            >
              <Minus size={18} />
            </button>
            <button 
              onClick={(e) => handleClick(e, 1)}
              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all active:scale-90 ${
                isDark ? 'bg-slate-700/50 text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-400' : 'bg-[#CACCCE]/30 text-[#313335] hover:bg-emerald-50 hover:text-emerald-600'
              }`}
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="flex-1 flex items-center gap-1">
            <div className="relative flex-1">
              <input 
                type="number"
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                onClick={e => e.stopPropagation()}
                placeholder="Menge"
                className={`w-full border rounded-lg pl-8 pr-2 py-2 text-base md:text-sm transition-all focus:outline-none focus:ring-2 ${
                  isDark 
                    ? 'bg-slate-900/50 border-slate-700 text-slate-200 focus:ring-blue-500/30 placeholder:text-slate-600' 
                    : 'bg-white/50 border-[#CACCCE] text-[#000000] focus:ring-[#0077B5]/20 placeholder:text-[#86888A]'
                }`}
              />
              <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#86888A]" size={14} />
            </div>
            <div className="flex flex-col gap-1">
               <button 
                onClick={(e) => handleBulkAdjust(e, 1)}
                className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase transition-colors ${
                  isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-[#0077B5] hover:bg-[#00A0DC] text-white'
                }`}
               >
                Add
               </button>
               <button 
                onClick={(e) => handleBulkAdjust(e, -1)}
                className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase transition-colors ${
                  isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-[#313335] hover:bg-[#000000] text-white'
                }`}
               >
                Rem
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN INVENTORY VIEW COMPONENT ---

interface InventoryViewProps {
  inventory: StockItem[];
  theme: Theme;
  viewMode: ViewMode;
  onUpdate: (id: string, newLevel: number) => void;
  onUpdateItem: (item: StockItem) => void;
  onCreateItem: (item: StockItem) => void;
  onAddStock: () => void;
  onLogStock: (itemId: string, itemName: string, action: 'add' | 'remove', quantity: number, source?: string, context?: 'normal' | 'project' | 'manual' | 'po-normal' | 'po-project') => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  theme,
  viewMode,
  onUpdate,
  onUpdateItem,
  onCreateItem,
  onAddStock,
  onLogStock
}) => {
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState('');
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  // Filter Logic
  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return inventory.filter(i => 
      i.name.toLowerCase().includes(term) || 
      i.sku.toLowerCase().includes(term) ||
      (i.system && i.system.toLowerCase().includes(term))
    );
  }, [inventory, searchTerm]);

  // Handlers
  const handleOpenNewItem = () => {
    setEditingItem(null);
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: StockItem) => {
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = (item: StockItem) => {
    if (editingItem) {
      onUpdateItem(item);
    } else {
      onCreateItem(item);
    }
    setIsItemModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-8 duration-300">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-6">
        <div>
           <h2 className="text-2xl font-bold mb-1">Artikel & Bestand</h2>
           <p className="text-slate-500 text-sm">Verwalten Sie Ihr gesamtes Inventar an einem Ort.</p>
        </div>
        <div className="flex items-center gap-2">
            <button
                onClick={handleOpenNewItem}
                className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ${
                    isDark 
                     ? 'bg-[#0077B5] hover:bg-[#00A0DC] text-white shadow-blue-500/20' 
                     : 'bg-[#0077B5] hover:bg-[#00A0DC] text-white shadow-blue-500/20'
                }`}
            >
                <PlusCircle size={20} /> Neuen Artikel
            </button>
        </div>
      </div>

      {/* Large Search Bar */}
      <div className="mb-6 flex gap-4">
        <div className="relative flex-1 group">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-500 group-focus-within:text-blue-400' : 'text-slate-400 group-focus-within:text-[#0077B5]'}`} size={20} />
            <input 
              type="text"
              placeholder="Suchen nach Name, SKU oder System..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full border rounded-2xl pl-12 pr-4 py-4 text-lg transition-all focus:outline-none focus:ring-2 ${
                isDark 
                  ? 'bg-slate-900/50 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:ring-blue-500/30' 
                  : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-[#0077B5]/20 shadow-sm'
              }`}
            />
        </div>
        <button 
            className={`hidden md:flex px-6 rounded-2xl border items-center justify-center gap-2 font-bold transition-all ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
        >
            <Filter size={20} /> Filter
        </button>
      </div>

      {/* Content Grid */}
      <div className={`flex-1 overflow-y-auto min-h-0 pb-20 ${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'flex flex-col gap-2'}`}>
          {filteredItems.map(item => (
             <InventoryProductCard 
                key={item.id} 
                item={item} 
                onUpdate={onUpdate} 
                onAddStock={onAddStock}
                onLogStock={onLogStock}
                onClick={handleOpenEditItem}
                viewMode={viewMode}
                theme={theme}
             />
          ))}
          {filteredItems.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500 opacity-60">
                  <PackagePlus size={64} className="mb-4 opacity-50" />
                  <p className="text-lg font-medium">Keine Artikel gefunden.</p>
                  <p className="text-sm">Passen Sie Ihre Suche an oder erstellen Sie einen neuen Artikel.</p>
              </div>
          )}
      </div>

      {/* Shared Item Modal */}
      <ItemModal 
         isOpen={isItemModalOpen}
         onClose={() => setIsItemModalOpen(false)}
         onSave={handleSaveItem}
         initialData={editingItem}
      />
    </div>
  );
};
