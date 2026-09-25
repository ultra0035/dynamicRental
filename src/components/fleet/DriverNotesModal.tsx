import React, { useState, useEffect, useMemo } from 'react';
import { 
  Driver, 
  DriverNote, 
  DriverNoteCategory, 
  DriverNotePriority 
} from '../../types';
import { 
  fetchDriverNotes, 
  saveDriverNote, 
  deleteDriverNote, 
  togglePinDriverNote, 
  resolveDriverNoteAction,
  saveDriver
} from '../../lib/supabase';
import { 
  StickyNote, 
  X, 
  Plus, 
  Search, 
  Filter, 
  Pin, 
  PinOff, 
  CheckSquare, 
  Square, 
  Trash2, 
  Clock, 
  Calendar, 
  User, 
  Tag, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  MessageCircle, 
  Send, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  Share2,
  FileText,
  DollarSign,
  ShieldAlert,
  Wrench,
  Info
} from 'lucide-react';

interface DriverNotesModalProps {
  isOpen: boolean;
  driver: Driver | null;
  onClose: () => void;
  onUpdateDriver?: (driver: Driver) => void;
  onNotesCountUpdate?: (driverId: string, count: number) => void;
}

const CATEGORY_CONFIG: Record<DriverNoteCategory, { label: string; icon: any; color: string; badgeClass: string; borderClass: string }> = {
  payment_followup: {
    label: 'Payment Follow-up / Promise',
    icon: DollarSign,
    color: 'emerald',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    borderClass: 'border-l-emerald-500',
  },
  maintenance: {
    label: 'Bike Maintenance & Inspection',
    icon: Wrench,
    color: 'sky',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    borderClass: 'border-l-sky-500',
  },
  conduct_warning: {
    label: 'Behavior & Conduct Warning',
    icon: ShieldAlert,
    color: 'rose',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    borderClass: 'border-l-rose-500',
  },
  compliance_kyc: {
    label: 'Compliance & KYC Documents',
    icon: FileText,
    color: 'purple',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    borderClass: 'border-l-purple-500',
  },
  general: {
    label: 'General Operational Remark',
    icon: Info,
    color: 'slate',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    borderClass: 'border-l-slate-400',
  },
};

export const DriverNotesModal: React.FC<DriverNotesModalProps> = ({
  isOpen,
  driver,
  onClose,
  onUpdateDriver,
  onNotesCountUpdate,
}) => {
  const [notes, setNotes] = useState<DriverNote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [actionOnlyFilter, setActionOnlyFilter] = useState<boolean>(false);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // New Note Form State
  const [isComposerOpen, setIsComposerOpen] = useState<boolean>(true);
  const [newAuthor, setNewAuthor] = useState<string>('Operations Admin');
  const [newCategory, setNewCategory] = useState<DriverNoteCategory>('payment_followup');
  const [newPriority, setNewPriority] = useState<DriverNotePriority>('normal');
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [newActionRequired, setNewActionRequired] = useState<boolean>(false);
  const [newActionDueDate, setNewActionDueDate] = useState<string>('');
  const [newIsPinned, setNewIsPinned] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Load Notes from Database / Local Storage
  const loadNotesForDriver = async (driverId: string) => {
    setIsLoading(true);
    try {
      const fetched = await fetchDriverNotes(driverId);
      setNotes(fetched);
      if (onNotesCountUpdate) {
        onNotesCountUpdate(driverId, fetched.length);
      }
    } catch (err) {
      console.warn('Error loading driver notes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && driver?.id) {
      loadNotesForDriver(driver.id);
      setSearchQuery('');
      setCategoryFilter('all');
      setPriorityFilter('all');
      setActionOnlyFilter(false);
      setSaveSuccessMsg(null);
    }
  }, [isOpen, driver?.id]);

  // Handle Note Save
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driver || !newNoteText.trim()) return;

    setIsSaving(true);
    setSaveSuccessMsg(null);

    const noteId = `note-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newNote: DriverNote = {
      id: noteId,
      driverId: driver.id,
      driverName: driver.fullName,
      author: newAuthor.trim() || 'Operations Admin',
      category: newCategory,
      noteText: newNoteText.trim(),
      priority: newPriority,
      isPinned: newIsPinned,
      actionRequired: newActionRequired,
      actionDueDate: newActionRequired && newActionDueDate ? newActionDueDate : undefined,
      actionResolved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // 1. Persist directly to Supabase driver_notes table and local cache
      const res = await saveDriverNote(newNote);
      
      // 2. Update local state
      const updatedNotes = [newNote, ...notes];
      setNotes(updatedNotes);

      // 3. Keep legacy driver.notes in sync for compatibility
      const categoryLabel = CATEGORY_CONFIG[newCategory]?.label || newCategory;
      const timestamp = new Date().toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' });
      const auditLine = `[${timestamp} | ${categoryLabel} by ${newAuthor}]: ${newNoteText.trim()}`;
      const concatenatedNotes = driver.notes ? `${driver.notes}\n\n${auditLine}` : auditLine;
      
      const updatedDriver: Driver = {
        ...driver,
        notes: concatenatedNotes,
      };

      if (onUpdateDriver) {
        onUpdateDriver(updatedDriver);
      }
      saveDriver(updatedDriver).catch(() => {});

      if (onNotesCountUpdate) {
        onNotesCountUpdate(driver.id, updatedNotes.length);
      }

      // Reset form
      setNewNoteText('');
      setNewActionRequired(false);
      setNewActionDueDate('');
      setNewIsPinned(false);
      setNewPriority('normal');
      setSaveSuccessMsg('Note saved and synced to database table successfully!');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    } catch (err: any) {
      console.warn('Error saving driver note:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Pin
  const handleTogglePin = async (noteId: string, currentPinned: boolean) => {
    const nextPinned = !currentPinned;
    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, isPinned: nextPinned } : n)));
    await togglePinDriverNote(noteId, nextPinned);
  };

  // Toggle Action Resolved
  const handleToggleActionResolved = async (noteId: string, currentResolved: boolean) => {
    const nextResolved = !currentResolved;
    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, actionResolved: nextResolved } : n)));
    await resolveDriverNoteAction(noteId, nextResolved);
  };

  // Delete Note
  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('Are you sure you want to delete this driver note from the database?')) {
      return;
    }
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    await deleteDriverNote(noteId);
    if (driver && onNotesCountUpdate) {
      onNotesCountUpdate(driver.id, notes.length - 1);
    }
  };

  // Copy Note Text
  const handleCopyNote = (note: DriverNote) => {
    const textToCopy = `[${new Date(note.createdAt).toLocaleDateString('en-ZA')}] ${CATEGORY_CONFIG[note.category]?.label || note.category} (${note.author}): ${note.noteText}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedNoteId(note.id);
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  // Send WhatsApp to Driver
  const handleSendWhatsApp = (note: DriverNote) => {
    if (!driver?.phone && !driver?.whatsappNumber) return;
    const phone = (driver.whatsappNumber || driver.phone).replace(/[^0-9]/g, '');
    const message = `Hi ${driver.fullName},\n\n*Dynamic Rental Operations Notice:*\n\n${note.noteText}\n\nAssigned Vehicle: ${driver.assignedBikeVinOrPlate || 'Fleet Bike'}\nShowroom & Hub: 304 Tungsten Rd, Strijdom Park, Randburg\nContact: 011 789 1234`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Filtered & Sorted Notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        const q = searchQuery.toLowerCase().trim();
        const matchSearch =
          !q ||
          n.noteText.toLowerCase().includes(q) ||
          n.author.toLowerCase().includes(q) ||
          (n.category && n.category.toLowerCase().includes(q));

        const matchCat = categoryFilter === 'all' || n.category === categoryFilter;
        const matchPriority = priorityFilter === 'all' || n.priority === priorityFilter;
        const matchAction = !actionOnlyFilter || (n.actionRequired && !n.actionResolved);

        return matchSearch && matchCat && matchPriority && matchAction;
      })
      .sort((a, b) => {
        // Pinned notes come first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        // Then by creation date descending
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [notes, searchQuery, categoryFilter, priorityFilter, actionOnlyFilter]);

  const pinnedCount = notes.filter((n) => n.isPinned).length;
  const pendingActionCount = notes.filter((n) => n.actionRequired && !n.actionResolved).length;

  if (!isOpen || !driver) return null;

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 my-4 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        
        {/* ========================================================= */}
        {/* MODAL HEADER */}
        {/* ========================================================= */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <StickyNote className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black tracking-tight text-white">
                  Driver Notes & Operations Log
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {driver.fullName}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  {driver.refNumber}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-3 flex-wrap">
                <span>Phone: <strong className="text-white font-mono">{driver.phone}</strong></span>
                <span>• Assigned Bike: <strong className="text-white">{driver.assignedBikeVinOrPlate || driver.assignedBikeName || 'Unassigned'}</strong></span>
                <span>• Weekly Rent: <strong className="text-amber-300">R{driver.weeklyRate}/wk</strong></span>
                {driver.balanceDue > 0 ? (
                  <span className="text-rose-400 font-bold">• Arrears: R{driver.balanceDue.toFixed(2)}</span>
                ) : (
                  <span className="text-emerald-400 font-bold">• Up to Date</span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* STATS & QUICK METRICS BAR */}
        {/* ========================================================= */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-4 text-slate-600">
            <span className="flex items-center gap-1.5 font-bold">
              <StickyNote className="w-3.5 h-3.5 text-slate-500" />
              Total Logged: <strong className="text-slate-900">{notes.length}</strong>
            </span>
            <span className="flex items-center gap-1.5 font-bold">
              <Pin className="w-3.5 h-3.5 text-amber-500" />
              Pinned: <strong className="text-amber-700">{pinnedCount}</strong>
            </span>
            <span className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              Pending Action Items: <strong className="text-rose-700">{pendingActionCount}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsComposerOpen(!isComposerOpen)}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1 shadow-xs cursor-pointer transition-all"
            >
              {isComposerOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{isComposerOpen ? 'Hide Composer' : 'Write New Note'}</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MODAL MAIN CONTENT */}
        {/* ========================================================= */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-4 text-xs">
          
          {/* COMPOSER SECTION */}
          {isComposerOpen && (
            <div className="bg-slate-50 rounded-2xl border border-amber-200 p-4 shadow-sm animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                <div className="flex items-center gap-2 text-slate-800 font-black text-xs uppercase tracking-wider">
                  <Plus className="w-4 h-4 text-amber-600" />
                  <span>Compose Administrative Note / Inspection Remark</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Auto-persisted to <code className="text-slate-700 bg-slate-200 px-1 py-0.5 rounded font-mono">driver_notes</code> table
                </span>
              </div>

              {/* NOTE FORM */}
              <form onSubmit={handleSaveNote} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Category Selector */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Note Category *
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as DriverNoteCategory)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    >
                      <option value="payment_followup">💳 Payment Follow-up / Promise</option>
                      <option value="maintenance">🛵 Bike Maintenance & Inspection</option>
                      <option value="conduct_warning">⚠️ Behavior & Conduct Warning</option>
                      <option value="compliance_kyc">📄 Compliance & KYC Documents</option>
                      <option value="general">💬 General Operational Remark</option>
                    </select>
                  </div>

                  {/* Priority Selector */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Priority Level
                    </label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as DriverNotePriority)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    >
                      <option value="normal">Normal Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">🚨 Urgent / Action Required</option>
                    </select>
                  </div>

                  {/* Author Name */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Staff / Author
                    </label>
                    <input
                      type="text"
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      placeholder="e.g. Operations Admin"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Note Textarea */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Note Details & Instructions *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Enter detailed administrative remarks, payment agreements, phone call records, bike condition comments, or instructions for other staff..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 placeholder:text-slate-400 leading-relaxed font-sans"
                  />
                </div>

                {/* Action Required & Pin Toggles */}
                <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Action Required Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newActionRequired}
                        onChange={(e) => setNewActionRequired(e.target.checked)}
                        className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
                        Requires Staff Follow-up
                      </span>
                    </label>

                    {newActionRequired && (
                      <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[11px] text-slate-500">Due Date:</span>
                        <input
                          type="date"
                          value={newActionDueDate}
                          onChange={(e) => setNewActionDueDate(e.target.value)}
                          className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                        />
                      </div>
                    )}

                    {/* Pin to Top Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newIsPinned}
                        onChange={(e) => setNewIsPinned(e.target.checked)}
                        className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Pin className="w-3.5 h-3.5 text-amber-600" />
                        Pin to Top of Dossier
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center gap-2">
                    {saveSuccessMsg && (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {saveSuccessMsg}
                      </span>
                    )}
                    <button
                      type="submit"
                      disabled={isSaving || !newNoteText.trim()}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer transition-all active:scale-98"
                    >
                      {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Save Note to Database</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* SEARCH & FILTERS ROW */}
          <div className="flex items-center justify-between flex-wrap gap-2.5 pt-1">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes by keyword, author, or content..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white"
            >
              <option value="all">All Categories ({notes.length})</option>
              <option value="payment_followup">💳 Payment Follow-up</option>
              <option value="maintenance">🛵 Bike Maintenance</option>
              <option value="conduct_warning">⚠️ Conduct & Warnings</option>
              <option value="compliance_kyc">📄 KYC & Compliance</option>
              <option value="general">💬 General Remarks</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">🚨 Urgent</option>
              <option value="high">High Priority</option>
              <option value="normal">Normal</option>
            </select>

            {/* Action Only Toggle Button */}
            <button
              type="button"
              onClick={() => setActionOnlyFilter(!actionOnlyFilter)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                actionOnlyFilter
                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Pending Action ({pendingActionCount})</span>
            </button>
          </div>

          {/* ========================================================= */}
          {/* NOTES FEED LIST */}
          {/* ========================================================= */}
          <div className="space-y-3 pt-1">
            {isLoading ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
                <p className="text-xs text-slate-500 font-semibold">Loading notes from database...</p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                <StickyNote className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-700 text-sm">No notes found</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {searchQuery || categoryFilter !== 'all' || actionOnlyFilter
                    ? 'No notes matched the active filters. Try clearing your search or filters.'
                    : 'There are no administrative notes recorded yet for this driver. Use the composer above to log inspection results, payment arrangements, or operational remarks.'}
                </p>
              </div>
            ) : (
              filteredNotes.map((note) => {
                const catInfo = CATEGORY_CONFIG[note.category] || CATEGORY_CONFIG.general;
                const CatIcon = catInfo.icon;
                const isUrgent = note.priority === 'urgent';
                const isHigh = note.priority === 'high';

                return (
                  <div
                    key={note.id}
                    className={`bg-white rounded-2xl border p-4 shadow-2xs transition-all relative border-l-4 ${catInfo.borderClass} ${
                      note.isPinned ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Note Top Bar */}
                    <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Pinned Badge */}
                        {note.isPinned && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                            <Pin className="w-3 h-3 fill-amber-600 text-amber-600" />
                            PINNED
                          </span>
                        )}

                        {/* Category Badge */}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black border ${catInfo.badgeClass}`}>
                          <CatIcon className="w-3 h-3" />
                          {catInfo.label}
                        </span>

                        {/* Priority Badge */}
                        {isUrgent ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                            <AlertCircle className="w-3 h-3" />
                            URGENT
                          </span>
                        ) : isHigh ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                            HIGH PRIORITY
                          </span>
                        ) : null}

                        {/* Author & Timestamp */}
                        <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <strong>{note.author}</strong>
                          <span>•</span>
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{new Date(note.createdAt).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1">
                        {/* Pin Button */}
                        <button
                          type="button"
                          onClick={() => handleTogglePin(note.id, note.isPinned)}
                          title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
                          className={`p-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                            note.isPinned
                              ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {note.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                        </button>

                        {/* WhatsApp Button */}
                        <button
                          type="button"
                          onClick={() => handleSendWhatsApp(note)}
                          title="Share / Send note summary to Driver via WhatsApp"
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>

                        {/* Copy Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyNote(note)}
                          title="Copy note text to clipboard"
                          className="p-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                        >
                          {copiedNoteId === note.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(note.id)}
                          title="Delete note permanently"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Note Content */}
                    <div className="text-slate-900 text-xs leading-relaxed font-sans whitespace-pre-wrap py-1">
                      {note.noteText}
                    </div>

                    {/* Action Item Box (if actionRequired) */}
                    {note.actionRequired && (
                      <div className={`mt-3 p-2.5 rounded-xl border flex items-center justify-between flex-wrap gap-2 text-xs ${
                        note.actionResolved
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : 'bg-amber-50/70 border-amber-200 text-amber-900'
                      }`}>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleActionResolved(note.id, note.actionResolved)}
                            className="cursor-pointer"
                          >
                            {note.actionResolved ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4 text-amber-600" />
                            )}
                          </button>
                          <div>
                            <span className={`font-bold ${note.actionResolved ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                              {note.actionResolved ? 'Action Followed Up & Completed' : 'Pending Follow-up Action Required'}
                            </span>
                            {note.actionDueDate && (
                              <span className="text-[11px] text-slate-500 block">
                                Target Date: <strong className="text-slate-700">{note.actionDueDate}</strong>
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleActionResolved(note.id, note.actionResolved)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                            note.actionResolved
                              ? 'bg-emerald-200 text-emerald-900 hover:bg-emerald-300'
                              : 'bg-amber-200 text-amber-900 hover:bg-amber-300'
                          }`}
                        >
                          {note.actionResolved ? 'Mark Pending' : 'Mark as Resolved ✓'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* MODAL FOOTER */}
        {/* ========================================================= */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500">
            Database Table: <code className="font-mono text-slate-700 bg-slate-200 px-1 py-0.5 rounded">public.driver_notes</code> • Live Supabase RLS Synced
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
          >
            Close Notes
          </button>
        </div>

      </div>
    </div>
  );
};
