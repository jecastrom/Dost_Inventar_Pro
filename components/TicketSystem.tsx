
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, Send, User, X, AlertCircle, CheckCircle2, ChevronRight, Unlock, Lock, MessageSquare, ArrowLeft, MoreVertical, Calendar 
} from 'lucide-react';
import { Ticket, TicketPriority, Theme, TicketMessage } from '../types';

// --- Helper: New Ticket Modal ---
const NewTicketModal = ({ isOpen, onClose, onSave, theme }: { isOpen: boolean, onClose: () => void, onSave: (subject: string, priority: TicketPriority, description: string) => void, theme: Theme }) => {
    const [subject, setSubject] = useState('');
    const [priority, setPriority] = useState<TicketPriority>('Normal');
    const [description, setDescription] = useState('');
    const isDark = theme === 'dark';

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!subject || !description) return;
        onSave(subject, priority, description);
        setSubject('');
        setPriority('Normal');
        setDescription('');
    };

    const getPriorityStyles = (p: TicketPriority) => {
        if (p === 'Urgent') return isDark ? 'border-red-500 bg-red-500/10 text-red-400 focus:ring-red-500/30' : 'border-red-500 bg-red-50 text-red-700 focus:ring-red-500/30';
        if (p === 'High') return isDark ? 'border-orange-500 bg-orange-500/10 text-orange-400 focus:ring-orange-500/30' : 'border-orange-500 bg-orange-50 text-orange-700 focus:ring-orange-500/30';
        return isDark ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500/30' : 'bg-white border-slate-200 text-slate-900 focus:ring-blue-500/30';
    };

    return createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
            <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                <div className={`p-5 border-b flex justify-between items-center ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <h3 className={`font-bold text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <AlertCircle size={20} className="text-[#0077B5]" /> Neuen Fall melden
                    </h3>
                    <button onClick={onClose} className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 space-y-5">
                    <div className="space-y-1.5">
                        <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Betreff <span className="text-red-500">*</span></label>
                        <input 
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="z.B. Ware beschädigt, Falsche Menge..."
                            className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Priorität</label>
                        <select 
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as TicketPriority)}
                            className={`w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all font-medium ${getPriorityStyles(priority)}`}
                        >
                            <option value="Normal">Normal</option>
                            <option value="High">Hoch (High)</option>
                            <option value="Urgent">Dringend (Urgent)</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Beschreibung <span className="text-red-500">*</span></label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Bitte beschreiben Sie das Problem detailliert..."
                            className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500/30 min-h-[120px] resize-none transition-all ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        />
                    </div>
                </div>

                <div className={`p-5 border-t flex justify-end gap-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <button 
                        onClick={onClose}
                        className={`px-5 py-2.5 rounded-xl font-bold transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                    >
                        Abbrechen
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={!subject || !description}
                        className="px-5 py-2.5 bg-[#0077B5] hover:bg-[#00A0DC] text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
                    >
                        <CheckCircle2 size={18} /> Fall erstellen
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

interface TicketSystemProps {
  receiptId: string;
  tickets: Ticket[];
  onAddTicket: (ticket: Ticket) => void;
  onUpdateTicket: (ticket: Ticket) => void;
  theme: Theme;
}

export const TicketSystem: React.FC<TicketSystemProps> = ({ 
  receiptId, 
  tickets, 
  onAddTicket, 
  onUpdateTicket, 
  theme 
}) => {
  const isDark = theme === 'dark';
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Responsive: Auto-select first ticket ONLY on desktop
  useEffect(() => {
    if (!expandedTicketId && tickets.length > 0 && window.innerWidth >= 768) {
        setExpandedTicketId(tickets[0].id);
    }
  }, [tickets]); 

  // Reset reply text when switching tickets
  useEffect(() => {
      setReplyText('');
  }, [expandedTicketId]);

  // Scroll to bottom on new message
  const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const selectedTicket = useMemo(() => tickets.find(t => t.id === expandedTicketId), [tickets, expandedTicketId]);

  useEffect(() => {
      if(selectedTicket) scrollToBottom();
  }, [selectedTicket?.messages]);

  const handleSaveNewTicket = (subject: string, priority: TicketPriority, description: string) => {
      const newTicket: Ticket = {
          id: crypto.randomUUID(),
          receiptId: receiptId,
          subject,
          priority,
          status: 'Open',
          messages: [{
              id: crypto.randomUUID(),
              author: 'Admin User',
              text: description,
              timestamp: Date.now(),
              type: 'user'
          }]
      };
      
      onAddTicket(newTicket);
      setShowNewTicketModal(false);
      setExpandedTicketId(newTicket.id);
  };

  const handleReopenTicket = (ticket: Ticket) => {
      onUpdateTicket({
          ...ticket,
          status: 'Open',
          messages: [...ticket.messages, {
              id: crypto.randomUUID(),
              author: 'System',
              text: 'Ticket wurde wiedereröffnet.',
              timestamp: Date.now(),
              type: 'system'
          }]
      });
  };

  const handleReplyTicket = (ticket: Ticket, shouldClose: boolean) => {
      const text = replyText.trim();
      
      if (!shouldClose && !text) return;
      
      let messages = [...ticket.messages];

      if (text) {
          messages.push({
              id: crypto.randomUUID(),
              author: 'Admin User',
              text: text,
              timestamp: Date.now(),
              type: 'user'
          });
      }

      if (shouldClose) {
          messages.push({
              id: crypto.randomUUID(),
              author: 'System',
              text: 'Ticket wurde geschlossen.',
              timestamp: Date.now() + (text ? 1 : 0),
              type: 'system'
          });
      }

      const updatedTicket: Ticket = {
          ...ticket,
          messages,
          status: shouldClose ? 'Closed' : ticket.status
      };

      onUpdateTicket(updatedTicket);
      setReplyText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && e.shiftKey) {
          e.preventDefault();
          if (replyText.trim() && selectedTicket) {
              handleReplyTicket(selectedTicket, false);
          }
      }
  };

  const containerClass = `flex h-[600px] w-full border border-gray-700 rounded-xl overflow-hidden bg-[#0b1120] relative shadow-lg`;
  
  const listColumnClass = `w-full md:w-1/3 flex flex-col border-r border-gray-700 bg-[#0b1120] ${
      selectedTicket ? 'hidden md:flex' : 'flex'
  }`;

  const chatColumnClass = `w-full md:w-2/3 flex flex-col bg-gray-900/50 ${
      selectedTicket ? 'flex' : 'hidden md:flex'
  }`;

  return (
    <div className={containerClass}>
        
        {/* 1. Left Sidebar (Ticket List) */}
        <div className={listColumnClass}>
            <div className={`flex-none p-4 border-b border-gray-700 flex justify-between items-center bg-[#0b1120]`}>
                <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2 text-gray-300">
                    <AlertCircle size={16} className="text-[#0077B5]" /> Fälle
                </h3>
                <button 
                    onClick={() => setShowNewTicketModal(true)}
                    className="p-1.5 rounded-lg bg-[#0077B5] text-white hover:bg-[#00A0DC] transition-colors"
                    title="Neuer Fall"
                >
                    <Plus size={16} />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {tickets.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 opacity-50">
                        <CheckCircle2 size={32} className="mb-2 text-gray-600" />
                        <span className="text-xs font-medium text-gray-500">Keine Fälle</span>
                    </div>
                ) : (
                    tickets.map(ticket => (
                        <button
                            key={ticket.id}
                            onClick={() => setExpandedTicketId(ticket.id)}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                                expandedTicketId === ticket.id 
                                ? 'bg-gray-800 border-blue-500 ring-1 ring-blue-500' 
                                : 'bg-gray-900/50 border-gray-800 hover:border-gray-600 hover:bg-gray-800'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`font-bold text-sm truncate pr-2 text-gray-200`}>
                                    {ticket.subject}
                                </span>
                                {ticket.status === 'Closed' ? (
                                    <span className="shrink-0 text-[10px] uppercase font-bold text-gray-500 bg-gray-500/10 px-1.5 py-0.5 rounded border border-gray-500/20">Closed</span>
                                ) : (
                                    <span className="shrink-0 text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Open</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${
                                    ticket.priority === 'Urgent' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                                    ticket.priority === 'High' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
                                    'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                }`}>
                                    {ticket.priority}
                                </span>
                                <span className="text-[10px] text-gray-500 font-mono">
                                    {new Date(ticket.messages[0].timestamp).toLocaleDateString()}
                                </span>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>

        {/* 2. Right Area (Chat) */}
        <div className={chatColumnClass}>
            {selectedTicket ? (
                <>
                    {/* Header: Gmail-Style Refined Layout */}
                    <div className="flex-none p-6 border-b border-gray-800 bg-[#111827] flex justify-between items-start gap-4">
                        
                        {/* Left Side: Subject & Meta */}
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3 md:hidden mb-2">
                                <button 
                                    onClick={() => setExpandedTicketId(null)}
                                    className="p-1 rounded-lg hover:bg-gray-800 text-gray-400"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                            </div>
                            
                            <h3 className="text-xl font-semibold text-white leading-snug break-words">
                                {selectedTicket.subject}
                            </h3>
                            
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                                <span className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
                                    <span className="opacity-50">ID:</span> {selectedTicket.id.slice(0, 8)}
                                </span>
                                <span className="text-gray-700 text-xs">•</span>
                                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <Calendar size={12} className="opacity-70" />
                                    {new Date(selectedTicket.messages[0].timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 mt-3">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                                    selectedTicket.priority === 'Urgent' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                                    selectedTicket.priority === 'High' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
                                    'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                }`}>
                                    {selectedTicket.priority} Priority
                                </span>
                                
                                {selectedTicket.status === 'Closed' ? (
                                    <span className="text-xs font-bold px-2 py-0.5 rounded border uppercase tracking-wider bg-gray-500/10 text-gray-500 border-gray-500/20">
                                        Geschlossen
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold px-2 py-0.5 rounded border uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                        Offen
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Right Side: Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                            {selectedTicket.status === 'Closed' ? (
                                <button 
                                    onClick={() => handleReopenTicket(selectedTicket)}
                                    className="px-4 py-2 rounded-lg text-sm font-bold border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-2"
                                >
                                    <Unlock size={16} /> <span className="hidden sm:inline">Wiedereröffnen</span>
                                </button>
                            ) : (
                                <button 
                                    onClick={() => handleReplyTicket(selectedTicket, true)}
                                    className="px-4 py-2 rounded-lg text-sm font-bold border border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors flex items-center gap-2"
                                    title="Ticket schließen"
                                >
                                    <Lock size={16} /> <span className="hidden sm:inline">Schließen</span>
                                </button>
                            )}
                            <button className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
                                <MoreVertical size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Message List */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0 bg-[#0f172a]">
                        {selectedTicket.messages.map((msg, index) => {
                            const isSystem = msg.type === 'system' || msg.author === 'System';
                            const isMe = msg.type === 'user' && msg.author !== 'System';
                            
                            // Specific styling for the very first message (Automatic/Description)
                            const isFirstMessage = index === 0;

                            if (isSystem) {
                                return (
                                    <div key={msg.id} className="flex flex-col items-center my-6 space-y-2">
                                        <div className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                                            isFirstMessage 
                                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                                            : 'bg-slate-800 text-slate-500 border-slate-700'
                                        }`}>
                                            {isFirstMessage ? 'Automatische Nachricht' : 'System Status'}
                                        </div>
                                        <div className={`text-center max-w-[80%] text-sm ${isFirstMessage ? 'text-slate-300' : 'text-slate-500'}`}>
                                            {msg.text}
                                        </div>
                                        <div className="text-[10px] text-slate-600 font-mono">
                                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-end gap-2 max-w-[85%]">
                                        {!isMe && (
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 border border-slate-700">
                                                <User size={14} />
                                            </div>
                                        )}
                                        
                                        <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                            isMe 
                                            ? 'bg-[#0077B5] text-white rounded-tr-sm' 
                                            : 'bg-gray-800 text-gray-200 rounded-tl-sm border border-gray-700'
                                        }`}>
                                            <div className="whitespace-pre-wrap">{msg.text}</div>
                                        </div>
                                    </div>
                                    
                                    <div className={`text-[10px] text-gray-500 mt-1.5 px-1 flex items-center gap-1 ${isMe ? 'mr-1' : 'ml-11'}`}>
                                        <span className="font-bold">{msg.author}</span>
                                        <span>•</span>
                                        <span>{new Date(msg.timestamp).toLocaleString()}</span>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Footer (Input Area) */}
                    {selectedTicket.status === 'Open' ? (
                        <div className="flex-none p-4 border-t border-gray-800 bg-[#111827]">
                            <textarea 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Nachricht schreiben... (Shift+Enter zum Senden)"
                                className="w-full h-32 rounded-xl p-4 text-sm resize-none outline-none focus:ring-2 focus:ring-blue-500/50 transition-all bg-gray-800 border border-gray-700 text-white placeholder:text-gray-500"
                            />
                            <div className="flex justify-end gap-3 mt-3">
                                <button 
                                    onClick={() => handleReplyTicket(selectedTicket, false)}
                                    disabled={!replyText.trim()}
                                    className="px-6 py-2.5 rounded-xl bg-[#0077B5] hover:bg-[#00A0DC] text-white text-sm font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
                                >
                                    <Send size={16} /> Senden
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-none p-8 border-t border-gray-800 bg-[#111827] text-center">
                            <div className="inline-flex p-3 rounded-full bg-slate-800/50 text-slate-500 mb-3">
                                <Lock size={24} />
                            </div>
                            <p className="text-sm font-medium text-gray-400">Dieser Fall ist geschlossen. Sie können nicht mehr antworten.</p>
                            <button 
                                onClick={() => handleReopenTicket(selectedTicket)}
                                className="mt-4 text-[#0077B5] text-sm font-bold hover:underline"
                            >
                                Fall wiedereröffnen
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 p-8">
                    <div className="p-6 rounded-full bg-slate-800/50 mb-4">
                        <MessageSquare size={48} className="text-slate-500" />
                    </div>
                    <h3 className="font-bold text-xl text-gray-300">Kein Fall ausgewählt</h3>
                    <p className="text-sm text-gray-500 mt-2 max-w-sm">Wählen Sie einen Fall aus der linken Liste aus oder erstellen Sie einen neuen, um die Details zu sehen.</p>
                </div>
            )}
        </div>

        <NewTicketModal 
            isOpen={showNewTicketModal} 
            onClose={() => setShowNewTicketModal(false)} 
            onSave={handleSaveNewTicket}
            theme={theme}
        />
    </div>
  );
};
