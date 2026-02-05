
import React from 'react';
import { ArrowLeft, Code, Database, AlertCircle, Briefcase } from 'lucide-react';
import { PurchaseOrder, ReceiptMaster, Theme } from '../types';

interface LogicInspectorProps {
  orders: PurchaseOrder[];
  receiptMasters: ReceiptMaster[];
  onBack: () => void;
  theme: Theme;
}

export const LogicInspector: React.FC<LogicInspectorProps> = ({ orders, receiptMasters, onBack, theme }) => {
  const isDark = theme === 'dark';

  // --- Logic Mirror (Copied from OrderManagement for Simulation) ---
  const renderPreviewBadges = (order: PurchaseOrder, linkedReceipt?: ReceiptMaster) => {
    const badges: React.ReactNode[] = [];
    
    // 1. Archiviert
    if (order.isArchived) {
        badges.push(
            <span key="archived" className="px-2 py-0.5 rounded text-[10px] font-bold border border-slate-500 bg-slate-500/10 text-slate-500">
                Archiviert
            </span>
        );
    }

    // 2. Offen
    if (!order.isArchived && order.status !== 'Abgeschlossen') {
         badges.push(
            <span key="offen" className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                Offen
            </span>
        );
    }

    // 3. Projekt
    if (order.status === 'Projekt') {
        badges.push(
            <span key="projekt" className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 w-fit ${isDark ? 'bg-blue-900/30 text-blue-400 border-blue-900' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                <Briefcase size={10} /> Projekt
            </span>
        );
    }

    // 4. In Prüfung (The Critical Logic being tested)
    const isReceiptChecking = linkedReceipt && (linkedReceipt.status === 'In Prüfung' || (linkedReceipt.status as any) === 'Wartet auf Prüfung');
    const isLinkedButWaiting = !linkedReceipt && order.linkedReceiptId;
    // Processed check: If order has moved to partial or closed, we hide "In Prüfung"
    const isProcessed = order.status === 'Teilweise geliefert' || order.status === 'Abgeschlossen';

    if ((isReceiptChecking || isLinkedButWaiting) && !isProcessed) {
        badges.push(
            <span key="checking" className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${isDark ? 'bg-[#6264A7]/20 text-[#9ea0e6] border-[#6264A7]/40' : 'bg-[#6264A7]/10 text-[#6264A7] border-[#6264A7]/20'}`}>
                In Prüfung
            </span>
        );
    }

    // 5. Teilweise
    if (order.status === 'Teilweise geliefert') {
         badges.push(
            <span key="partial" className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                Teillieferung
            </span>
        );
    }

    // 6. Übermenge & 7. Schaden (Check Receipt Master Deliveries)
    if (linkedReceipt) {
        const hasOverDelivery = linkedReceipt.deliveries.some(d => d.items.some(i => (i.zuViel || 0) > 0));
        const isFullyReceived = order.items.every(i => i.quantityReceived >= i.quantityExpected);
        
        if (hasOverDelivery && isFullyReceived) {
             badges.push(
                <span key="over" className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isDark ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                    Übermenge
                </span>
            );
        }

        const hasDamage = linkedReceipt.deliveries.some(d => d.items.some(i => i.damageFlag));
        if (hasDamage) {
             badges.push(
                <span key="damage" className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isDark ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-100 text-red-700 border-red-200'}`}>
                    Schaden
                </span>
            );
        }
    }

    // 8. Geschlossen
    if (order.status === 'Abgeschlossen') {
         badges.push(
            <span key="closed" className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                Geschlossen
            </span>
        );
    }

    return <div className="flex flex-wrap gap-2">{badges}</div>;
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 animate-in fade-in slide-in-from-right-8 duration-300 pb-20">
      
      {/* Header */}
      <div className="mb-8">
        <button 
            onClick={onBack} 
            className="flex items-center gap-2 text-slate-500 hover:text-[#0077B5] mb-4 text-sm font-bold transition-colors"
        >
            <ArrowLeft size={16}/> Zurück
        </button>
        <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                <Code size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-bold">System-Logik & Status Map</h2>
                <p className="text-slate-500 text-sm">Entwickler-Ansicht zur Prüfung von Status-Abhängigkeiten.</p>
            </div>
        </div>
      </div>

      {/* Main Table */}
      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className={`border-b ${isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                    <tr>
                        <th className="p-4 w-48 font-mono">PO ID</th>
                        <th className="p-4 w-40">PO Status (Raw)</th>
                        <th className="p-4 w-48">Linked Receipt ID</th>
                        <th className="p-4 w-40">Receipt Status (Raw)</th>
                        <th className="p-4">Visual Result (Live Preview)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-500/10">
                    {orders.map(order => {
                        const linkedReceipt = receiptMasters.find(r => r.poId === order.id);
                        return (
                            <tr key={order.id} className={isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}>
                                <td className="p-4 font-mono font-bold text-slate-500">{order.id}</td>
                                <td className="p-4">
                                    <span className={`font-mono text-xs px-2 py-1 rounded border ${isDark ? 'bg-slate-950 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {linkedReceipt ? (
                                        <div className="flex items-center gap-2 text-indigo-500">
                                            <Database size={14} />
                                            <span className="font-mono text-xs">{linkedReceipt.id}</span>
                                        </div>
                                    ) : order.linkedReceiptId ? (
                                        <div className="flex items-center gap-2 text-amber-500">
                                            <AlertCircle size={14} />
                                            <span className="font-mono text-xs">Pending ({order.linkedReceiptId})</span>
                                        </div>
                                    ) : (
                                        <span className="opacity-30">-</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    {linkedReceipt ? (
                                        <span className={`font-mono text-xs px-2 py-1 rounded border ${isDark ? 'bg-slate-950 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                                            {linkedReceipt.status}
                                        </span>
                                    ) : (
                                        <span className="opacity-30">-</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    {renderPreviewBadges(order, linkedReceipt)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      </div>

    </div>
  );
};
