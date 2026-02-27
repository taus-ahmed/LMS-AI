import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  Search,
  Trash2,
  RotateCcw,
  ArrowRight,
  Archive,
  CheckCircle2,
  Clock,
  Plus,
  StickyNote,
  FileText,
  X,
  Trash,
  Download,
  ChevronDown,
  Ban,
  Undo2,
} from 'lucide-react';
import { useStudentStore, getEffectiveStatus } from '../store/studentStore';
import { type ProjectRecord, type ProjectStatus } from '../services/database';
import { exportProjectToPdf, exportProjectToDoc } from '../utils/exporters';
import clsx from 'clsx';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FilterTab = 'All' | ProjectStatus;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_LABEL: Record<ProjectStatus, string> = {
  NotStarted: 'Not Started',
  Started: 'Started',
  InProgress: 'In Progress',
  Finished: 'Finished',
  Dropped: 'Dropped',
  Archived: 'Archived',
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
  NotStarted: 'bg-slate-100 text-slate-600',
  Started: 'bg-blue-100 text-blue-700',
  InProgress: 'bg-indigo-100 text-indigo-700',
  Finished: 'bg-emerald-100 text-emerald-700',
  Dropped: 'bg-rose-100 text-rose-600',
  Archived: 'bg-amber-100 text-amber-700',
};

function milestoneProgress(project: ProjectRecord): { completed: number; total: number } {
  const milestones = project.brief?.milestones ?? [];
  return {
    completed: milestones.filter((m) => m.status === 'completed').length,
    total: milestones.length,
  };
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const cardItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const FILTER_TABS: FilterTab[] = ['All', 'NotStarted', 'InProgress', 'Finished', 'Dropped', 'Archived'];


// ---------------------------------------------------------------------------
// Export menu component
// ---------------------------------------------------------------------------

interface ExportMenuProps {
  project: ProjectRecord;
  small?: boolean;
}

function ExportMenu({ project, small = false }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const pick = (fn: () => void) => {
    fn();
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Export"
        className={clsx(
          'inline-flex items-center gap-1 rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors',
          small ? 'px-2 py-1.5 text-xs' : 'p-2'
        )}
      >
        <Download className="w-3.5 h-3.5" />
        {small && <span className="text-xs font-medium">Export</span>}
        <ChevronDown className={clsx('w-3 h-3 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-100 z-20 overflow-hidden">
          <button
            onClick={() => pick(() => exportProjectToPdf(project))}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            Export as PDF
          </button>
          <button
            onClick={() => pick(() => exportProjectToDoc(project))}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Export as Word
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notes Modal component
// ---------------------------------------------------------------------------

interface NotesModalProps {
  project: ProjectRecord;
  onClose: () => void;
}

function NotesModal({ project, onClose }: NotesModalProps) {
  const addProjectNote = useStudentStore((s) => s.addProjectNote);
  const deleteProjectNote = useStudentStore((s) => s.deleteProjectNote);
  const projects = useStudentStore((s) => s.dexieProjects);

  // Always read the freshest version from the store
  const fresh = projects.find((p) => p.id === project.id) ?? project;
  const notes = useMemo(
    () =>
      [...(fresh.notes ?? [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [fresh.notes]
  );

  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAdd = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSaving(true);
    await addProjectNote(fresh.id, trimmed);
    setText('');
    setSaving(false);
    textareaRef.current?.focus();
  };

  const handleDelete = async (noteId: string) => {
    await deleteProjectNote(fresh.id, noteId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2
              className="text-base font-bold text-slate-900"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Notes
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{fresh.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <ExportMenu project={fresh} small />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Note input */}
        <div className="p-5 border-b border-slate-100">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd();
            }}
            placeholder="Add a note… (Ctrl+Enter to save)"
            rows={3}
            className="w-full text-sm text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl p-3 resize-none outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
          />
          <button
            onClick={handleAdd}
            disabled={!text.trim() || saving}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Note
          </button>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {notes.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No notes yet. Add one above.</p>
          ) : (
            notes.map((n) => (
              <div key={n.id} className="flex items-start gap-3 group p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 mb-1">
                    {new Date(n.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{n.text}</p>
                </div>
                <button
                  onClick={() => handleDelete(n.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all flex-shrink-0"
                  title="Delete note"
                >
                  <Trash className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ProjectLibrary() {
  const navigate = useNavigate();

  const projects = useStudentStore((s) => s.dexieProjects);
  const activeProjectId = useStudentStore((s) => s.activeProjectId);
  const setActiveProject = useStudentStore((s) => s.setActiveProject);
  const resetProjectProgress = useStudentStore((s) => s.resetProjectProgress);
  const deleteProjectById = useStudentStore((s) => s.deleteProjectById);
  const updateProjectStatus = useStudentStore((s) => s.updateProjectStatus);
  const loadProjects = useStudentStore((s) => s.loadDexieProjects);

  const [filterTab, setFilterTab] = useState<FilterTab>('All');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notesProjectId, setNotesProjectId] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // ── Filter (uses effective status) ────────────────────────────────────────
  const displayed = useMemo(() => {
    let list = [...projects];

    if (filterTab !== 'All') {
      list = list.filter((p) => getEffectiveStatus(p) === filterTab);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => p.title.toLowerCase().includes(q));
    }

    // Default order: most recently updated
    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return list;
  }, [projects, filterTab, search]);

  // ── Tab counts (effective status) ─────────────────────────────────────────
  const tabCounts = useMemo(() => {
    const map: Partial<Record<FilterTab, number>> = { All: projects.length };
    for (const p of projects) {
      const eff = getEffectiveStatus(p);
      map[eff] = (map[eff] ?? 0) + 1;
    }
    return map;
  }, [projects]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleOpen = async (id: string) => {
    setBusyId(id);
    await setActiveProject(id);
    navigate(`/project/${id}`);
  };

  const handleReset = async (id: string) => {
    if (!window.confirm("Reset this project? This will clear all milestone progress.")) return;
    setBusyId(id);
    await resetProjectProgress(id);
    setBusyId(null);
  };

  const handleArchiveToggle = async (project: ProjectRecord) => {
    setBusyId(project.id);
    if (project.status === 'Archived') {
      const { completed, total } = milestoneProgress(project);
      const newStatus: ProjectStatus = total > 0 && completed > 0 ? 'InProgress' : 'NotStarted';
      await updateProjectStatus(project.id, newStatus);
    } else {
      await updateProjectStatus(project.id, 'Archived');
    }
    setBusyId(null);
  };

  const handleDelete = async (project: ProjectRecord) => {
    if (!window.confirm(`Delete "${project.title}"? This cannot be undone.`)) return;
    setBusyId(project.id);
    await deleteProjectById(project.id);
    setBusyId(null);
  };

  const handleDropToggle = async (project: ProjectRecord) => {
    if (project.status === 'Dropped') {
      if (!window.confirm('Restore this project?')) return;
      const { completed } = milestoneProgress(project);
      const newStatus: ProjectStatus = completed > 0 ? 'InProgress' : 'NotStarted';
      setBusyId(project.id);
      await updateProjectStatus(project.id, newStatus);
      setBusyId(null);
    } else {
      if (!window.confirm('Drop this project?')) return;
      setBusyId(project.id);
      await updateProjectStatus(project.id, 'Dropped');
      setBusyId(null);
    }
  };

  const notesProject = notesProjectId ? projects.find((p) => p.id === notesProjectId) ?? null : null;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <AnimatePresence>
        {notesProject && (
          <NotesModal project={notesProject} onClose={() => setNotesProjectId(null)} />
        )}
      </AnimatePresence>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div
          variants={cardItem}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6 sm:p-8 text-white"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full -translate-y-1/4 translate-x-1/4" />
          <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-purple-500/10 rounded-full translate-y-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Folder className="w-5 h-5 text-indigo-400" />
              <span className="text-indigo-300 text-sm font-medium uppercase tracking-wide">
                Project Library
              </span>
            </div>
            <h1
              className="text-2xl sm:text-3xl font-bold mb-2"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              All Your Projects
            </h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Manage all AI-generated projects. Open, reset, archive, export or delete any project.
            </p>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div variants={cardItem}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search projects…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
            />
          </div>
        </motion.div>

        {/* Filter tabs */}
        <motion.div variants={cardItem} className="flex gap-1.5 flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={clsx(
                'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all',
                filterTab === tab
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
              )}
            >
              {tab === 'All' ? 'All' : STATUS_LABEL[tab as ProjectStatus]}
              {tabCounts[tab] !== undefined && (
                <span
                  className={clsx(
                    'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                    filterTab === tab ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {tabCounts[tab]}
                </span>
              )}
            </button>
          ))}
        </motion.div>

        {/* Project grid */}
        {displayed.length === 0 ? (
          <motion.div
            variants={cardItem}
            className="bg-white rounded-2xl p-10 border border-slate-100 shadow-sm text-center"
          >
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Folder className="w-7 h-7 text-slate-400" />
            </div>
            <h3
              className="text-base font-semibold text-slate-900 mb-1"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              No projects found
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              {projects.length === 0
                ? "You haven't generated a project yet."
                : 'No projects match your current filter.'}
            </p>
            <button
              onClick={() => navigate('/project')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Generate a Project
            </button>
          </motion.div>
        ) : (
          <motion.div variants={container} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map((project) => {
              const { completed, total } = milestoneProgress(project);
              const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;
              const effectiveStatus = getEffectiveStatus(project);
              const isActive = project.id === activeProjectId;
              const isBusy = busyId === project.id;
              const noteCount = project.notes?.length ?? 0;

              return (
                <motion.div
                  key={project.id}
                  variants={cardItem}
                  className={clsx(
                    'bg-white rounded-2xl border shadow-sm flex flex-col transition-all',
                    isActive
                      ? 'border-indigo-300 ring-1 ring-indigo-200'
                      : 'border-slate-100 hover:border-slate-200 hover:shadow-md'
                  )}
                >
                  {/* Card body */}
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className={clsx(
                              'inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide',
                              STATUS_COLORS[effectiveStatus]
                            )}
                          >
                            {STATUS_LABEL[effectiveStatus]}
                          </span>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-600 text-white">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              Active
                            </span>
                          )}
                          {noteCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                              <StickyNote className="w-2.5 h-2.5" />
                              {noteCount} note{noteCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <h3
                          className="text-sm font-bold text-slate-900 leading-snug line-clamp-2"
                          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                          {project.title}
                        </h3>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(project.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {completed}/{total} milestones
                      </div>
                    </div>

                    {/* Progress bar */}
                    {total > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-400">Progress</span>
                          <span className="font-semibold text-slate-600">{progressPct}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={clsx('h-full rounded-full transition-all', {
                              'bg-emerald-400': progressPct === 100,
                              'bg-indigo-400': progressPct > 0 && progressPct < 100,
                              'bg-slate-200': progressPct === 0,
                            })}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card actions */}
                  <div className="px-4 pb-4 pt-0 flex items-center gap-1.5 border-t border-slate-50 mt-auto flex-wrap">
                    {/* Open */}
                    <button
                      onClick={() => handleOpen(project.id)}
                      disabled={isBusy}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      Open
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Notes */}
                    <button
                      onClick={() => setNotesProjectId(project.id)}
                      title="Notes"
                      className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-300 transition-colors"
                    >
                      <StickyNote className="w-3.5 h-3.5" />
                    </button>

                    {/* Export */}
                    <ExportMenu project={project} />

                    {/* Reset */}
                    <button
                      onClick={() => handleReset(project.id)}
                      disabled={isBusy}
                      title="Reset progress"
                      className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-300 transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    {/* Drop / Restore */}
                    <button
                      onClick={() => handleDropToggle(project)}
                      disabled={isBusy}
                      title={project.status === 'Dropped' ? 'Restore' : 'Drop'}
                      className={clsx(
                        'p-2 rounded-xl border transition-colors disabled:opacity-50',
                        project.status === 'Dropped'
                          ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          : 'border-slate-200 text-slate-500 hover:text-rose-500 hover:border-rose-300'
                      )}
                    >
                      {project.status === 'Dropped' ? (
                        <Undo2 className="w-3.5 h-3.5" />
                      ) : (
                        <Ban className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Archive / Unarchive */}
                    <button
                      onClick={() => handleArchiveToggle(project)}
                      disabled={isBusy}
                      title={project.status === 'Archived' ? 'Unarchive' : 'Archive'}
                      className={clsx(
                        'p-2 rounded-xl border transition-colors disabled:opacity-50',
                        project.status === 'Archived'
                          ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                          : 'border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-300'
                      )}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(project)}
                      disabled={isBusy}
                      title="Delete project"
                      className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-300 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>
    </>
  );
}

