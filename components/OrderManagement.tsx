
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, Filter, Calendar, Truck, ChevronRight, 
  X, FileText, Pencil, ClipboardCheck, Archive, CheckSquare, Square, PackagePlus,
  CheckCircle2, Ban, Briefcase, Lock, Plus, AlertCircle, Box, AlertTriangle, Info, Clock
} from 'lucide-react';
import { PurchaseOrder, Theme, ReceiptMaster, ActiveModule, Ticket } from '../types';
import { LifecycleStepper } from './LifecycleStepper';
import { MOCK_ITEMS } from '../data'; // Import Mock Data for System Lookup

// --- HELPER: MATH LOGIC FOR COMPLETION ---
const isOrderComplete = (order: PurchaseOrder) => {
    if (order.status === 'Storniert') return false; // Cancelled is not "Completed" (Success), it's Voided.
    if (order.isForceClosed) return true; // Force Close = Complete
    
    const totalOrdered = order.items.reduce((sum, i) => sum + i.quantityExpected, 0);
    const totalReceived = order.items.reduce((sum, i) => sum + i.quantityReceived, 0);
    
    return totalOrdered > 0 && totalReceived === totalOrdered;
};

// --- HELPER: ORDER OPEN LOGIC ---
const isOrderOpen = (o: PurchaseOrder) => {
    if (o.isForceClosed) return false;
    if (o.status === 'Storniert') return false;
    
    const totalOrdered = o.items.reduce((s, i) => s + i.quantityExpected, 0);
    const totalReceived = o.items.reduce((s, i) => s + i.quantityReceived, 0);
    
    return totalReceived < totalOrdered;
};

// --- HELPER: DERIVED STATUS FOR STEPPER VISUALS ---
const getVisualLifecycleStatus = (order: PurchaseOrder) => {
    if (order.status === 'Storniert') return 'Storniert';
    if (order.isForceClosed) return 'Abgeschlossen'; 
    if (isOrderComplete(order)) return 'Abgeschlossen';
    
    const totalReceived = order.items.reduce((sum, i) => sum + i.quantityReceived, 0);
    if (totalReceived > 0) return 'Teillieferung'; 
    
    return 'Offen'; 
};

// --- INTERNAL COMPONENT: STATUS BADGES (SINGLE SOURCE OF TRUTH) ---
const OrderStatusBadges = ({ order, linkedReceipt, theme }: { order: PurchaseOrder, linkedReceipt?: ReceiptMaster, theme: Theme }) => {
    const isDark = theme === 'dark';
    const badges: React.ReactNode[] = [];

    // --- BADGE 1: IDENTITY (ETERNAL) ---
    const isProject = order.status === 'Projekt' || order.id.toLowerCase().includes('projekt');

    if (isProject) {
        badges.push(
            <span key="id-projekt" className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 uppercase tracking-wider ${isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                <Briefcase size={10} /> Projekt
            </span>
        );
    } else {
        badges.push(
            <span key="id-lager" className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 uppercase tracking-wider ${isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                <Box size={10} /> Lager
            </span>
        );
    }

    // --- BADGE 2: LIFECYCLE (CALCULATED MATH) ---
    const totalOrdered = order.items.reduce((sum, i) => sum + i.quantityExpected, 0);
    const totalReceived = order.items.reduce((sum, i) => sum + i.quantityReceived, 0);

    if (order.isArchived) {
        badges.push(
            <span key="life-archived" className="px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                Archiviert
            </span>
        );
    } else if (order.status === 'Storniert') {
        badges.push(
            <span key="life-cancelled" className="px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider bg-slate-100 text-slate-500 border-slate-200 line-through decoration-red-500 decoration-2 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700">
                STORNIERT
            </span>
        );
    } else if (order.isForceClosed) {
        badges.push(
            <span key="life-force-closed" className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
            }`}>
                Erledigt
            </span>
        );
    } else if (totalReceived === 0) {
        badges.push(
            <span key="life-open" className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                isDark ? 'text-slate-400 border-slate-700' : 'text-slate-600 border-slate-300 bg-white'
            }`}>
                Offen
            </span>
        );
    } else if (totalReceived > 0 && totalReceived < totalOrdered) {
        badges.push(
            <span key="life-partial" className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-200'
            }`}>
                Teillieferung
            </span>
        );
    } else if (totalReceived === totalOrdered) {
        badges.push(
            <span key="life-done" className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
            }`}>
                Erledigt
            </span>
        );
    } else if (totalReceived > totalOrdered) {
        badges.push(
            <span key="life-over" className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                isDark ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-orange-50 text-orange-600 border-orange-200'
            }`}>
                Übermenge
            </span>
        );
    }

    // --- BADGE 3: RECEIPT PROCESS ---
    if (linkedReceipt) {
        const s = linkedReceipt.status as string;
        if (s === 'In Prüfung' || s === 'Wartet auf Prüfung') {
            badges.push(
                <span key="proc-check" className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                    isDark ? 'bg-[#6264A7]/20 text-[#9ea0e6] border-[#6264A7]/40' : 'bg-[#6264A7]/10 text-[#6264A7] border-[#6264A7]/20'
                }`}>
                    In Prüfung
                </span>
            );
        } else if (s === 'Schaden' || s === 'Beschädigt') {
            badges.push(
                <span key="proc-damage" className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider flex items-center gap-1 ${
                    isDark ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-200'
                }`}>
                    <AlertCircle size={10} /> Schaden
                </span>
            );
        }
    }

    return <div className="flex flex-wrap gap-2 items-center">{badges}</div>;
};

// Filter Types
type FilterStatus = 'all' | 'open' | 'late' | 'completed';

interface OrderManagementProps {
  orders: PurchaseOrder[];
  theme: Theme;
  onArchive: (id: string) => void;
  onEdit: (order: PurchaseOrder) => void;
  onReceiveGoods: (id: string) => void;
  onQuickReceipt: (id: string) => void;
  onCancelOrder: (id: string) => void; // RENAMED FROM onCancel
  receiptMasters: ReceiptMaster[];
  onNavigate: (module: ActiveModule) => void;
  tickets: Ticket[];
}

export const OrderManagement: React.FC<OrderManagementProps> = ({ orders, theme, onArchive, onEdit, onReceiveGoods, onQuickReceipt, onCancelOrder, receiptMasters, onNavigate, tickets }) => {
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  // -- Confirmation Modal State --
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (confirmModalOpen) {
                setConfirmModalOpen(false);
                setSelectedOrderForReceipt(null);
            } else if (selectedOrder) {
                setSelectedOrder(null);
            }
        }
    };
    if (selectedOrder || confirmModalOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOrder, confirmModalOpen]);

  // -- Helper Logic --
  const isOrderLate = (o: PurchaseOrder) => {
      if (o.isForceClosed || o.status === 'Storniert') return false;
      const totalOrdered = o.items.reduce((s, i) => s + i.quantityExpected, 0);
      const totalReceived = o.items.reduce((s, i) => s + i.quantityReceived, 0);
      if (totalReceived >= totalOrdered) return false;
      
      if (!o.expectedDeliveryDate) return false;
      const today = new Date();
      today.setHours(0,0,0,0);
      const target = new Date(o.expectedDeliveryDate);
      target.setHours(0,0,0,0);
      return target < today;
  };

  // -- Computed Counts --
  const counts = useMemo(() => {
      const c = { all: 0, open: 0, late: 0, completed: 0 };
      orders.forEach(o => {
          if (!showArchived && o.isArchived) return;
          c.all++;
          if (isOrderOpen(o)) c.open++;
          if (isOrderLate(o)) c.late++;
          if (isOrderComplete(o)) c.completed++;
      });
      return c;
  }, [orders, showArchived]);

  // -- Computed Filtered Orders --
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (!showArchived && o.isArchived) return false;
      const term = searchTerm.toLowerCase();
      const matchesSearch = o.id.toLowerCase().includes(term) || o.supplier.toLowerCase().includes(term);
      if (!matchesSearch) return false;

      if (filterStatus === 'open') return isOrderOpen(o);
      if (filterStatus === 'late') return isOrderLate(o);
      if (filterStatus === 'completed') return isOrderComplete(o);

      return true; // 'all'
    }).sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
  }, [orders, searchTerm, showArchived, filterStatus]);

  // -- Lifecycle Logic --
  const hasOpenTickets = useMemo(() => {
      if (!selectedOrder || !selectedOrder.linkedReceiptId) return false;
      return tickets.some(t => t.receiptId === selectedOrder.linkedReceiptId && t.status === 'Open');
  }, [selectedOrder, tickets]);

  const handleArchiveClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    // Direct call, no confirmation
    onArchive(id);
  };

  const handleEditClick = (e: React.MouseEvent, order: PurchaseOrder) => {
    e.stopPropagation(); 
    onEdit(order);
  };

  const handleReceiveClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onReceiveGoods(id);
  };

  const handleQuickReceiptClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedOrderForReceipt(id);
    setConfirmModalOpen(true);
  };

  const handleConfirmQuickReceipt = () => {
    if (selectedOrderForReceipt) onQuickReceipt(selectedOrderForReceipt);
    setConfirmModalOpen(false);
    setSelectedOrderForReceipt(null);
  };

  const handleCancelQuickReceipt = () => {
    setConfirmModalOpen(false);
    setSelectedOrderForReceipt(null);
  };

  // --- UI Component: Filter Chip ---
  const FilterChip = ({ label, count, active, onClick, type }: { label: string, count: number, active: boolean, onClick: () => void, type: 'neutral' | 'pending' | 'issue' | 'success' }) => {
      let activeClass = '';
      if (active) {
          switch (type) {
              case 'neutral': activeClass = 'bg-[#0077B5] text-white border-transparent shadow-md'; break;
              case 'pending': activeClass = 'bg-amber-500 text-white border-transparent shadow-md'; break;
              case 'issue': activeClass = 'bg-red-500 text-white border-transparent shadow-md'; break;
              case 'success': activeClass = 'bg-emerald-600 text-white border-transparent shadow-md'; break;
          }
      } else {
          activeClass = isDark ? 'bg-slate-800 text-slate-400 border-slate-700 hover:border-blue-400' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400';
      }
      return (
          <button onClick={onClick} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border flex items-center gap-2 ${activeClass}`}>
              {label} {count > 0 && <span className={`px-1.5 py-0.5 rounded-full text-[10px] min-w-[20px] text-center ${active ? 'bg-white/20 text-white' : (isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500')}`}>{count}</span>}
          </button>
      );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="text-[#0077B5]" /> Bestellungen
        </h2>
        <button
            onClick={() => onNavigate('create-order')}
            className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ${isDark ? 'bg-[#0077B5] hover:bg-[#00A0DC] text-white shadow-blue-500/20' : 'bg-[#0077B5] hover:bg-[#00A0DC] text-white shadow-blue-500/20'}`}
        >
            <Plus size={20} /> Neue Bestellung
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Suche nach PO Nummer oder Lieferant..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full border rounded-xl pl-11 pr-4 py-3 text-base md:text-sm transition-all focus:outline-none focus:ring-2 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100 focus:ring-blue-500/30' : 'bg-white border-slate-200 text-[#313335] focus:ring-[#0077B5]/20'}`} />
          </div>
          <div className={`flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar p-1 rounded-xl max-w-full ${isDark ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                <FilterChip label="Alle" count={counts.all} active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} type="neutral" />
                <FilterChip label="Offen" count={counts.open} active={filterStatus === 'open'} onClick={() => setFilterStatus('open')} type="pending" />
                <FilterChip label="Verspätet" count={counts.late} active={filterStatus === 'late'} onClick={() => setFilterStatus('late')} type="issue" />
                <FilterChip label="Erledigt" count={counts.completed} active={filterStatus === 'completed'} onClick={() => setFilterStatus('completed')} type="success" />
          </div>
          <button onClick={() => setShowArchived(!showArchived)} className={`px-4 py-3 md:py-0 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all whitespace-nowrap ${isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50'} ${showArchived ? 'text-[#0077B5] border-[#0077B5]/30' : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>
             {showArchived ? <CheckSquare size={18} /> : <Square size={18} />} <span>Archivierte</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
         <div className="overflow-x-auto">
           <table className="w-full text-left text-sm min-w-[800px]">
             <thead className={`border-b ${isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
               <tr>
                 <th className="p-4 font-semibold">Bestell Nummer</th>
                 <th className="p-4 font-semibold">Datum</th>
                 <th className="p-4 font-semibold">Lieferant</th>
                 <th className="p-4 font-semibold w-64">Status</th>
                 <th className="p-4 font-semibold text-center">Bestätigung</th>
                 <th className="p-4 font-semibold text-center">Pos.</th>
                 <th className="p-4 font-semibold text-right">Aktion</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-500/10">
                {filteredOrders.map(order => {
                  const linkedReceipt = receiptMasters.find(r => r.poId === order.id);
                  const isDone = isOrderComplete(order);
                  const totalReceived = order.items.reduce((s, i) => s + i.quantityReceived, 0);

                  return (
                  <tr key={order.id} onClick={() => setSelectedOrder(order)} className={`cursor-pointer transition-colors ${order.isArchived ? (isDark ? 'bg-slate-900/50 text-slate-500 hover:bg-slate-800/50' : 'bg-slate-50 text-slate-400 hover:bg-slate-100') : (isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50')}`}>
                    <td className="p-4 font-mono font-bold text-[#0077B5]">{order.id}</td>
                    <td className="p-4 flex flex-col text-slate-500 text-xs">
                        <span className="flex items-center gap-2 font-bold mb-0.5"><Calendar size={12} /> {new Date(order.dateCreated).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                        {order.expectedDeliveryDate && isOrderLate(order) && (
                            <span className="text-red-500 font-bold flex items-center gap-1"><Clock size={10} /> Fällig: {new Date(order.expectedDeliveryDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}</span>
                        )}
                    </td>
                    <td className="p-4 font-medium"><div className="flex items-center gap-2"><Truck size={14} className="text-slate-400"/> {order.supplier}</div></td>
                    <td className="p-4"><OrderStatusBadges order={order} linkedReceipt={linkedReceipt} theme={theme} /></td>
                    <td className="p-4 text-center">
                        {order.pdfUrl ? <div className="flex justify-center" title="Bestätigung vorhanden"><CheckCircle2 size={18} className="text-emerald-500" /></div> : <div className="flex justify-center opacity-30" title="Keine Bestätigung"><Ban size={18} className="text-slate-500" /></div>}
                    </td>
                    <td className="p-4 text-center"><span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-bold ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{order.items.length}</span></td>
                    <td className="p-4 text-right flex items-center justify-end gap-2">
                        {!order.isArchived && !isDone && !order.linkedReceiptId && order.status !== 'Storniert' && (
                             <button onClick={(e) => handleQuickReceiptClick(e, order.id)} className="p-2 hover:bg-purple-500/10 hover:text-purple-500 text-slate-400 rounded-full transition-colors" title="Wareneingang vorerfassen"><PackagePlus size={18} /></button>
                        )}
                        {!order.isArchived && !isDone && order.status !== 'Storniert' && (
                            <button onClick={(e) => handleReceiveClick(e, order.id)} className="p-2 hover:bg-emerald-500/10 hover:text-emerald-500 text-slate-400 rounded-full transition-colors" title="Wareneingang prüfen"><ClipboardCheck size={18} /></button>
                        )}
                        {!order.isArchived && !isDone && order.status !== 'Storniert' ? (
                            <button onClick={(e) => handleEditClick(e, order)} className="p-2 hover:bg-[#0077B5]/10 hover:text-[#0077B5] text-slate-400 rounded-full transition-colors" title="Bearbeiten"><Pencil size={18} /></button>
                        ) : !order.isArchived && isDone ? (
                            <button disabled className="p-2 opacity-30 cursor-not-allowed text-slate-400" title="Bearbeitung gesperrt"><Lock size={18} /></button>
                        ) : null}

                        {/* CANCEL BUTTON: Only if 0 Received & Not Cancelled */}
                        {!order.isArchived && !isDone && order.status !== 'Storniert' && totalReceived === 0 && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCancelOrder(order.id);
                                }}
                                className="p-2 hover:bg-red-500/10 hover:text-red-500 text-slate-400 rounded-full transition-colors"
                                title="Bestellung stornieren (Void)"
                            >
                                <Ban size={18} />
                            </button>
                        )}

                        {!order.isArchived && (
                            <button onClick={(e) => handleArchiveClick(order.id, e)} className="p-2 hover:bg-amber-500/10 hover:text-amber-500 text-slate-400 rounded-full transition-colors" title="Archivieren"><Archive size={18} /></button>
                        )}
                        <div className="w-px h-4 bg-slate-500/20 mx-1" />
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-full transition-colors"><ChevronRight size={18} /></button>
                    </td>
                  </tr>
                );
                })}
             </tbody>
           </table>
         </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedOrder && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedOrder(null)} />
            <div className={`relative w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                <div className={`p-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div className="flex justify-between items-start mb-6">
                        <h3 className={`font-bold text-2xl ${isDark ? 'text-white' : 'text-slate-900'}`}>Bestell Nummer : {selectedOrder.id}</h3>
                        <div className="flex items-center gap-3">
                            <OrderStatusBadges order={selectedOrder} linkedReceipt={receiptMasters.find(r => r.poId === selectedOrder.id)} theme={theme} />
                            <button onClick={() => setSelectedOrder(null)} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}><X size={20} /></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
                        <div>
                            <div className={`text-[10px] uppercase font-bold tracking-wider opacity-60 mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Lieferant</div>
                            <div className={`font-medium flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}><Truck size={16} className="opacity-70 text-[#0077B5]" /> {selectedOrder.supplier}</div>
                        </div>
                        <div>
                            <div className={`text-[10px] uppercase font-bold tracking-wider opacity-60 mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Bestelldatum</div>
                            <div className={`font-medium flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}><Calendar size={16} className="opacity-70" /> {new Date(selectedOrder.dateCreated).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                        </div>
                        <div>
                            <div className={`text-[10px] uppercase font-bold tracking-wider opacity-60 mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Bestellbestätigung</div>
                            <div>
                                {selectedOrder.pdfUrl ? (
                                    <a href={selectedOrder.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-[#0077B5] hover:underline hover:text-[#00A0DC] flex items-center gap-2 font-bold transition-colors"><FileText size={16} /> PDF anzeigen</a>
                                ) : (
                                    <span className={`italic flex items-center gap-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}><FileText size={16} className="opacity-50" /> Kein Anhang</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`px-6 py-6 border-b ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/50 border-slate-100'}`}>
                    <LifecycleStepper status={getVisualLifecycleStatus(selectedOrder)} hasOpenTickets={hasOpenTickets} theme={theme} />
                </div>
                
                <div className="flex-1 overflow-y-auto p-0">
                    <table className="w-full text-left text-sm">
                        <thead className={`sticky top-0 z-10 ${isDark ? 'bg-slate-950 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                            <tr>
                                <th className="px-6 py-3 font-semibold">Artikel</th>
                                <th className="px-6 py-3 font-semibold w-24 text-center">Bestellt</th>
                                <th className="px-6 py-3 font-semibold w-24 text-center">Geliefert</th>
                                <th className="px-6 py-3 font-semibold w-24 text-center">Offen</th>
                                <th className="px-6 py-3 font-semibold w-20 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                            {selectedOrder.items.map((item, idx) => {
                                const stockItem = MOCK_ITEMS.find(si => si.sku === item.sku);
                                const systemInfo = stockItem?.system || 'Material';
                                const isClosed = selectedOrder.isForceClosed;
                                const isShort = item.quantityReceived < item.quantityExpected;
                                const isPerfect = item.quantityReceived === item.quantityExpected;
                                const isOver = item.quantityReceived > item.quantityExpected;
                                const rawOpen = Math.max(0, item.quantityExpected - item.quantityReceived);

                                return (
                                <tr key={idx} className={isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}>
                                    <td className="px-6 py-4">
                                        <div className={`font-bold text-sm mb-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{item.name}</div>
                                        <div className="flex flex-wrap items-center gap-y-1 gap-x-3">
                                            <div className={`text-xs flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><span className="opacity-70">Artikelnummer:</span><span className="font-mono text-xs">{item.sku}</span></div>
                                            <span className={`px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider border ${isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{systemInfo}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold">{item.quantityExpected}</td>
                                    <td className="px-6 py-4 text-center"><span className={`font-bold ${item.quantityReceived === item.quantityExpected ? 'text-emerald-500' : item.quantityReceived > item.quantityExpected ? 'text-orange-500' : item.quantityReceived > 0 ? 'text-amber-500' : 'text-slate-400'}`}>{item.quantityReceived}</span></td>
                                    <td className="px-6 py-4 text-center font-medium">
                                        {isShort ? (isClosed ? <span className="text-slate-400 decoration-slate-400 line-through" title="Restmenge storniert">{rawOpen}</span> : <span className="text-amber-500 font-bold">{rawOpen}</span>) : "-"}
                                    </td>
                                    <td className="px-6 py-4 text-center flex justify-center items-center">
                                        {isPerfect ? <CheckCircle2 className="text-emerald-500" size={18} /> : isOver ? <Info className="text-orange-500" size={18} /> : isShort ? (isClosed ? <div className="group relative flex justify-center cursor-help" title="Manuell abgeschlossen"><CheckCircle2 className="text-slate-400" size={18} /></div> : <AlertTriangle className="text-amber-500" size={18} />) : <span className="text-slate-300">-</span>}
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>

                <div className={`p-5 border-t flex justify-between items-center gap-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-2">
                        {/* Same logic for modal actions */}
                        {!selectedOrder.isArchived && !isOrderComplete(selectedOrder) && !selectedOrder.linkedReceiptId && selectedOrder.status !== 'Storniert' && (
                             <button onClick={() => { setSelectedOrderForReceipt(selectedOrder.id); setConfirmModalOpen(true); }} className={`px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${isDark ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`} title="Wareneingang vorerfassen"><PackagePlus size={18} /><span className="hidden sm:inline">Erstellen</span></button>
                        )}
                        {!selectedOrder.isArchived && !isOrderComplete(selectedOrder) && selectedOrder.status !== 'Storniert' && (
                            <button onClick={() => onReceiveGoods(selectedOrder.id)} className={`px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${isDark ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`} title="Wareneingang prüfen / buchen"><ClipboardCheck size={18} /><span className="hidden sm:inline">Prüfen</span></button>
                        )}
                        {!selectedOrder.isArchived && !isOrderComplete(selectedOrder) && selectedOrder.status !== 'Storniert' ? (
                            <button onClick={() => onEdit(selectedOrder)} className={`px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${isDark ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`} title="Bestellung bearbeiten"><Pencil size={18} /><span className="hidden sm:inline">Bearbeiten</span></button>
                        ) : !selectedOrder.isArchived && isOrderComplete(selectedOrder) ? (
                            <button disabled className="p-2 opacity-30 cursor-not-allowed text-slate-400" title="Bearbeitung gesperrt"><Lock size={18} /></button>
                        ) : null}
                        
                        {/* CANCEL BUTTON IN MODAL */}
                        {!selectedOrder.isArchived && !isOrderComplete(selectedOrder) && selectedOrder.status !== 'Storniert' && selectedOrder.items.reduce((s, i) => s + i.quantityReceived, 0) === 0 && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCancelOrder(selectedOrder.id);
                                }}
                                className={`px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                title="Bestellung stornieren"
                            >
                                <Ban size={18} />
                                <span className="hidden sm:inline">Stornieren</span>
                            </button>
                        )}

                        {!selectedOrder.isArchived && (
                            <button onClick={() => { onArchive(selectedOrder.id); setSelectedOrder(null); }} className={`px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${isDark ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`} title="Archivieren"><Archive size={18} /></button>
                        )}
                    </div>
                    <button onClick={() => setSelectedOrder(null)} className={`px-6 py-2.5 rounded-xl font-bold transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>Schließen</button>
                </div>
            </div>
        </div>,
        document.body
      )}

      {confirmModalOpen && createPortal(
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={handleCancelQuickReceipt} />
            <div className={`relative w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200 ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full shrink-0 ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}><PackagePlus size={24} /></div>
                    <div><h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Wareneingang erstellen?</h3><p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Status wird auf 'Wartet auf Prüfung' gesetzt.</p></div>
                </div>
                <div className="flex justify-end gap-3 mt-2">
                    <button onClick={handleCancelQuickReceipt} className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>Abbrechen</button>
                    <button onClick={handleConfirmQuickReceipt} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-500/20 transition-all">Ja, erstellen</button>
                </div>
            </div>
        </div>,
        document.body
      )}
    </div>
  );
};
