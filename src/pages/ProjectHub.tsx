import { motion } from 'framer-motion';
import { useState, useCallback, type ElementType } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Brain, Loader2, CheckCircle2, Plus, Clock, Target, Package,
  MessageCircle, Trash2, AlertCircle, Cpu, Activity, Bot,
} from 'lucide-react';
import { useStudentStore } from '../store/studentStore';
import { useUnifiedProjects } from '../utils/projectAdapter';
import { COURSE_PROGRAMS } from '../data/coursePrograms';
import { generateAIProject } from '../services/aiService';
import clsx from 'clsx';

// Map icon strings from course data to actual components
const ICON_MAP: Record<string, ElementType> = { Cpu, Activity, Microchip: Cpu, Bot };

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; light: string }> = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', light: 'bg-indigo-100' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', light: 'bg-emerald-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', light: 'bg-amber-100' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', light: 'bg-rose-100' },
};

export default function ProjectHub() {
  const student = useStudentStore((s) => s.student);
  const isLoading = useStudentStore((s) => s.isLoading);
  const addProject = useStudentStore((s) => s.addProject);
  const deleteProject = useStudentStore((s) => s.deleteProject);
  const deleteProjectById = useStudentStore((s) => s.deleteProjectById);
  const createProjectFromGenerated = useStudentStore((s) => s.createProjectFromGenerated);
  const archiveActiveIfUnused = useStudentStore((s) => s.archiveActiveIfUnused);
  const isGenerating = useStudentStore((s) => s.isGeneratingProject);
  const setIsGenerating = useStudentStore((s) => s.setIsGeneratingProject);

  // Dexie-backed unified project list (source of truth for count + status)
  const unifiedProjects = useUnifiedProjects();

  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [genError, setGenError] = useState<string | null>(null);
  const [genStage, setGenStage] = useState('');
  const [showCreator, setShowCreator] = useState(false);

  const toggleCourse = (id: string) => {
    setSelectedCourses((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  };

  const handleGenerate = useCallback(async () => {
    if (!student || selectedCourses.length === 0) return;
    setGenError(null);
    setIsGenerating(true);

    const stages = [
      'Analyzing selected course syllabi...',
      'Mapping your skill profile across courses...',
      'Identifying cross-course integration points...',
      'Designing industry-aligned project scope...',
      'Generating milestones & deliverables...',
      'Finalizing your personalized brief...',
    ];
    let idx = 0;
    setGenStage(stages[0]);
    const interval = setInterval(() => { idx++; if (idx < stages.length) setGenStage(stages[idx]); }, 2000);

    try {
      const brief = await generateAIProject(student, selectedCourses);
      clearInterval(interval);
      // 1. Archive the previously-active project if it was never started
      await archiveActiveIfUnused();
      // 2. Create the canonical Dexie record — this sets the shared id
      const dexieId = await createProjectFromGenerated(brief);
      // 3. Create the in-memory StudentProject using the SAME id so the
      //    adapter can merge both models by id
      addProject(selectedCourses, brief, dexieId);
      setSelectedCourses([]);
      setShowCreator(false);
    } catch (err) {
      clearInterval(interval);
      console.error(err);
      setGenError('Failed to generate project. Please try again.');
    } finally {
      setIsGenerating(false);
      setGenStage('');
    }
  }, [selectedCourses, student, addProject, createProjectFromGenerated, archiveActiveIfUnused, setIsGenerating]);

  if (isLoading || !student) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your projects...</p>
        </div>
      </div>
    );
  }

  const enrolledCourses = COURSE_PROGRAMS.filter((c) => student.enrolledCourseIds.includes(c.id));

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            My Projects
          </h1>
          <p className="text-sm text-slate-500 mt-1">
          {unifiedProjects.length} project{unifiedProjects.length !== 1 ? 's' : ''} created · Select courses to generate new ones
          </p>
        </div>
        {!showCreator && (
          <button onClick={() => setShowCreator(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/20">
            <Plus className="w-4 h-4" /> New Project
          </button>
        )}
      </motion.div>

      {/* ─── Project Creator ─── */}
      {showCreator && (
        <motion.div variants={item} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 to-indigo-900 px-6 py-5 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-5 h-5 text-indigo-300" />
              <span className="text-indigo-200 text-xs font-semibold uppercase tracking-wider">AI Project Generator</span>
            </div>
            <h2 className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Select Courses to Combine
            </h2>
            <p className="text-indigo-200 text-sm mt-1">
              Pick one or more courses. The AI will generate a single integrated project drawing from all selected syllabi.
            </p>
          </div>

          <div className="p-6 space-y-5">
            {/* Course grid */}
            <div className="grid sm:grid-cols-2 gap-3">
              {enrolledCourses.map((course) => {
                const selected = selectedCourses.includes(course.id);
                const cm = COLOR_MAP[course.color] || COLOR_MAP.indigo;
                const completed = course.weekModules.filter((w) => w.status === 'completed').length;
                const IconComp = ICON_MAP[course.icon] || Cpu;
                return (
                  <button key={course.id} onClick={() => !isGenerating && toggleCourse(course.id)}
                    disabled={isGenerating}
                    className={clsx(
                      'text-left p-4 rounded-xl border-2 transition-all',
                      selected
                        ? `${cm.border} ${cm.bg} shadow-sm`
                        : 'border-slate-200 hover:border-slate-300 bg-white',
                      isGenerating && 'opacity-60 cursor-not-allowed'
                    )}>
                    <div className="flex items-start gap-3">
                      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                        selected ? cm.light : 'bg-slate-100')}>
                        <IconComp className={clsx('w-5 h-5', selected ? cm.text : 'text-slate-400')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-400">{course.code}</p>
                          {selected && <CheckCircle2 className={clsx('w-5 h-5', cm.text)} />}
                        </div>
                        <p className="text-sm font-semibold text-slate-900 mt-0.5">{course.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{completed}/{course.totalWeeks} weeks completed</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {course.skills.slice(0, 3).map((s) => (
                            <span key={s.name} className={clsx('text-[10px] font-medium px-2 py-0.5 rounded-full',
                              s.score >= 75 ? 'bg-emerald-50 text-emerald-700' : s.score >= 60 ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700')}>
                              {s.name} {s.score}%
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected summary + generate button */}
            {selectedCourses.length > 0 && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                <div>
                  <p className="text-sm font-semibold text-indigo-900">
                    {selectedCourses.length} course{selectedCourses.length > 1 ? 's' : ''} selected
                  </p>
                  <p className="text-xs text-indigo-600 mt-0.5">
                    {selectedCourses.map((id) => COURSE_PROGRAMS.find((c) => c.id === id)?.code).join(' + ')}
                  </p>
                </div>
                <button onClick={handleGenerate} disabled={isGenerating}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-60">
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isGenerating ? 'Generating...' : 'Generate Project'}
                </button>
              </div>
            )}

            {/* Generation progress */}
            {isGenerating && genStage && (
              <div className="text-center py-4">
                <motion.p key={genStage} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-indigo-600 font-medium flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" /> {genStage}
                </motion.p>
                <div className="mt-3 mx-auto max-w-xs h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    initial={{ width: '5%' }} animate={{ width: '90%' }} transition={{ duration: 14, ease: 'linear' }} />
                </div>
              </div>
            )}

            {genError && (
              <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 px-4 py-2.5 rounded-xl border border-rose-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {genError}
              </div>
            )}

            {!isGenerating && (
              <button onClick={() => { setShowCreator(false); setSelectedCourses([]); }}
                className="text-sm text-slate-500 hover:text-slate-700 font-medium">
                Cancel
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* ─── Project Cards List ─── */}
      {unifiedProjects.length === 0 && !showCreator && (
        <motion.div variants={item} className="text-center py-16">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            No projects yet
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-5">
            Select courses from your program and let the AI generate industry-grade projects tailored to your skills.
          </p>
          <button onClick={() => setShowCreator(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20">
            <Plus className="w-4 h-4" /> Create Your First Project
          </button>
        </motion.div>
      )}

      {unifiedProjects.length > 0 && (
        <div className="space-y-4">
          {unifiedProjects.map((proj) => {
            const courses = proj.selectedCourseIds
              .map((id) => COURSE_PROGRAMS.find((c) => c.id === id))
              .filter(Boolean);
            const completedMs = proj.brief.milestones.filter((m) => m.status === 'completed').length;
            return (
              <motion.div key={proj.id} variants={item}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {courses.map((c) => c && (
                          <span key={c.id} className={clsx('text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full',
                            COLOR_MAP[c.color]?.bg, COLOR_MAP[c.color]?.text)}>
                            {c.code}
                          </span>
                        ))}
                      </div>
                      <Link to={`/project/${proj.id}`} className="group">
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors"
                          style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                          {proj.brief.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{proj.brief.context}</p>
                    </div>
                    <button onClick={() => { deleteProject(proj.id); deleteProjectById(proj.id).catch(console.error); }}
                      className="flex-shrink-0 p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                      title="Delete project">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> {completedMs}/{proj.brief.milestones.length} Milestones</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> ~{proj.brief.totalEstimatedHours}h</span>
                    <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" /> {proj.brief.deliverables.length} Deliverables</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {proj.chatHistory.length} messages</span>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Link to={`/project/${proj.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors">
                      <Target className="w-4 h-4" /> View Brief
                    </Link>
                    <Link to={`/project/${proj.id}/mentor`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-medium hover:bg-indigo-100 transition-colors">
                      <MessageCircle className="w-4 h-4" /> Open Mentor
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
