import { motion } from 'framer-motion';
import {
  Rocket,
  FileText,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Target,
  Wrench,
  Package,
  Calendar,
  Sparkles,
  Loader2,
  Brain,
  BookOpen,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useStudentStore } from '../store/studentStore';
import { generateAIProject } from '../services/aiService';
import clsx from 'clsx';
import { useState, useCallback } from 'react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function ProjectHub() {
  const student = useStudentStore((s) => s.student);
  const isLoading = useStudentStore((s) => s.isLoading);
  const activeProject = useStudentStore((s) => s.activeProject);
  const createProjectFromGenerated = useStudentStore((s) => s.createProjectFromGenerated);
  const archiveActiveIfUnused = useStudentStore((s) => s.archiveActiveIfUnused);
  const isGeneratingProject = useStudentStore((s) => s.isGeneratingProject);
  const setIsGeneratingProject = useStudentStore((s) => s.setIsGeneratingProject);
  const addMessage = useStudentStore((s) => s.addMessage);

  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(
    activeProject?.brief.milestones.find((m) => m.status === 'in-progress')?.id || null
  );
  const [activeTab, setActiveTab] = useState<'brief' | 'requirements' | 'milestones'>(
    'brief'
  );

  if (isLoading || !student) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your project hub...</p>
        </div>
      </div>
    );
  }
  const [genError, setGenError] = useState<string | null>(null);
  const [genStage, setGenStage] = useState('');

  // AI Project Generation handler
  const handleGenerateProject = useCallback(async () => {
    setGenError(null);
    setIsGeneratingProject(true);

    const stages = [
      'Analyzing your skill profile...',
      'Reviewing completed course modules...',
      'Identifying strengths & growth areas...',
      'Designing industry-aligned project scope...',
      'Generating milestones & deliverables...',
      'Calibrating difficulty to your level...',
      'Finalizing project brief...',
    ];

    let stageIndex = 0;
    setGenStage(stages[0]);
    const stageInterval = setInterval(() => {
      stageIndex++;
      if (stageIndex < stages.length) {
        setGenStage(stages[stageIndex]);
      }
    }, 1800);

    try {
      const generatedProject = await generateAIProject(student);
      clearInterval(stageInterval);
      await archiveActiveIfUnused();
      await createProjectFromGenerated(generatedProject);

      // Add a mentor message about the generated project
      await addMessage({
        role: 'mentor',
        content: `🚀 Your personalized project has been generated: **"${generatedProject.title}"**\n\nThis project was tailored based on your strong performance in Programming (${student.skills.find((s) => s.name.includes('Programming'))?.score}%) and Circuit Design (${student.skills.find((s) => s.name.includes('Circuit'))?.score}%), while incorporating opportunities to strengthen your Mechanical Design and Sensor Integration skills.\n\nHead to the **My Project** page to review the full brief, requirements, and milestone timeline. Feel free to ask me any questions about the project!`,
        type: 'feedback',
      });
    } catch (err) {
      clearInterval(stageInterval);
      console.error('Project generation failed:', err);
      setGenError(
        'Failed to generate project. Please check your connection and try again.'
      );
    } finally {
      setIsGeneratingProject(false);
      setGenStage('');
    }
  }, [student, archiveActiveIfUnused, createProjectFromGenerated, setIsGeneratingProject, addMessage]);

  // ─── No project yet: show generation UI ───
  if (!activeProject) {
    return (
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* AI Generation Header */}
        <motion.div
          variants={item}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 p-8 sm:p-10 text-white"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-purple-500/10 rounded-full translate-y-1/2" />
          <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-amber-500/10 rounded-full" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30">
                <Brain className="w-4 h-4 text-indigo-300" />
                <span className="text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                  AI-Powered Generation
                </span>
              </div>
            </div>
            <h1
              className="text-3xl sm:text-4xl font-bold mb-3"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Your Personalized Project
            </h1>
            <p className="text-indigo-200 text-base max-w-2xl leading-relaxed">
              The AI will analyze your course syllabus, completed modules, quiz scores,
              and skill profile to generate an industry-grade engineering project
              tailored specifically to your abilities and growth areas.
            </p>
          </div>
        </motion.div>

        {/* What AI analyzes */}
        <motion.div
          variants={item}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            {
              icon: BookOpen,
              label: 'Course Syllabus',
              value: `${student.weekModules.filter((w) => w.status === 'completed').length} modules completed`,
              color: 'indigo',
            },
            {
              icon: TrendingUp,
              label: 'Skill Profile',
              value: `${student.skills.length} skills tracked`,
              color: 'emerald',
            },
            {
              icon: Target,
              label: 'Performance',
              value: `${student.gpa} GPA · ${student.overallProgress}% progress`,
              color: 'amber',
            },
            {
              icon: AlertCircle,
              label: 'Growth Areas',
              value:
                student.skills
                  .filter((s) => s.score < 65)
                  .map((s) => s.name)
                  .join(', ') || 'None identified',
              color: 'rose',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
            >
              <div
                className={clsx(
                  'w-9 h-9 rounded-xl flex items-center justify-center mb-3',
                  {
                    'bg-indigo-50 text-indigo-600': item.color === 'indigo',
                    'bg-emerald-50 text-emerald-600': item.color === 'emerald',
                    'bg-amber-50 text-amber-600': item.color === 'amber',
                    'bg-rose-50 text-rose-600': item.color === 'rose',
                  }
                )}
              >
                <item.icon className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-500 mb-1">{item.label}</p>
              <p className="text-sm font-semibold text-slate-900">{item.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Generate Button / Loading State */}
        <motion.div variants={item}>
          {isGeneratingProject ? (
            <div className="bg-white rounded-2xl p-8 border border-indigo-200 shadow-sm text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/20">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <h3
                className="text-xl font-bold text-slate-900 mb-2"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Generating Your Project
              </h3>
              <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">
                The AI is analyzing your profile and creating a personalized
                industry-grade project brief...
              </p>
              <motion.div
                key={genStage}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 text-indigo-600 text-sm font-medium"
              >
                <Sparkles className="w-4 h-4" />
                {genStage}
              </motion.div>
              {/* Progress bar animation */}
              <div className="mt-5 mx-auto max-w-xs">
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    initial={{ width: '5%' }}
                    animate={{ width: '90%' }}
                    transition={{ duration: 14, ease: 'linear' }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 rounded-2xl p-8 border-2 border-dashed border-indigo-200 text-center">
              {genError && (
                <div className="mb-4 flex items-center justify-center gap-2 text-rose-600 text-sm bg-rose-50 px-4 py-2 rounded-xl inline-flex mx-auto">
                  <AlertCircle className="w-4 h-4" />
                  {genError}
                </div>
              )}
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3
                className="text-xl font-bold text-slate-900 mb-2"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Ready to Generate Your Project
              </h3>
              <p className="text-sm text-slate-500 mb-6 max-w-lg mx-auto">
                You've completed {student.weekModules.filter((w) => w.status === 'completed').length} course modules.
                The AI will synthesize your performance data, skill gaps, and course
                objectives to create a unique project tailored to you.
              </p>
              <button
                onClick={handleGenerateProject}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.98]"
              >
                <Brain className="w-5 h-5" />
                Generate My Industry Project
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    );
  }

  // ─── Project exists: show full project dashboard ───
  const completedMilestones = activeProject.brief.milestones.filter(
    (m) => m.status === 'completed'
  ).length;
  const totalHoursCompleted = activeProject.brief.milestones
    .filter((m) => m.status === 'completed')
    .reduce((acc, m) => acc + m.estimatedHours, 0);

  const tabs = [
    { id: 'brief' as const, label: 'Project Brief', icon: FileText },
    { id: 'requirements' as const, label: 'Requirements', icon: Wrench },
    { id: 'milestones' as const, label: 'Milestones', icon: Target },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Project header */}
      <motion.div
        variants={item}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6 sm:p-8 text-white"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full -translate-y-1/4 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-purple-500/10 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Rocket className="w-5 h-5 text-indigo-400" />
            <span className="text-indigo-300 text-sm font-medium uppercase tracking-wide">
              AI-Generated Project
            </span>
            <span className="text-[10px] font-mono text-indigo-400/70 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-400/20">
              Llama 3 70B
            </span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-bold mb-3"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {activeProject.brief.title}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            {activeProject.brief.context}
          </p>
          <div className="flex flex-wrap gap-4 mt-5">
            <div className="flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-300">
                {completedMilestones}/{activeProject.brief.milestones.length} Milestones
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300">
                ~{activeProject.brief.totalEstimatedHours}h Total Effort
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Package className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">
                {activeProject.brief.deliverables.length} Deliverables
              </span>
            </div>
          </div>
          {/* Regenerate button */}
          <div className="mt-5">
            <button
              onClick={handleGenerateProject}
              disabled={isGeneratingProject}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white/80 text-xs font-medium hover:bg-white/20 transition-all backdrop-blur-sm border border-white/10 disabled:opacity-50"
            >
              {isGeneratingProject ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Regenerate Project
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tab navigation */}
      <motion.div variants={item} className="flex gap-1 p-1 bg-slate-100 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Tab content */}
      {activeTab === 'brief' && (
        <motion.div variants={item} className="space-y-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3
                className="text-base font-semibold text-slate-900"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Problem Statement
              </h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              {activeProject.brief.problemStatement}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm">
            <h3
              className="text-base font-semibold text-slate-900 mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Project Goals
            </h3>
            <div className="space-y-3">
              {activeProject.brief.goals.map((goal, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{goal}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm">
            <h3
              className="text-base font-semibold text-slate-900 mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Constraints
            </h3>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {activeProject.brief.constraints.map((constraint, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50/50 border border-rose-100"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">{constraint}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm">
            <h3
              className="text-base font-semibold text-slate-900 mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Final Deliverables
            </h3>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {activeProject.brief.deliverables.map((deliverable, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <Package className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <p className="text-sm text-slate-700 font-medium">{deliverable}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'requirements' && (
        <motion.div
          variants={item}
          className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm"
        >
          <h3
            className="text-base font-semibold text-slate-900 mb-5"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Technical Requirements
          </h3>
          <div className="space-y-3">
            {activeProject.brief.technicalRequirements.map((req, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  {i + 1}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed pt-0.5">{req}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'milestones' && (
        <motion.div variants={item} className="space-y-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3
                className="text-base font-semibold text-slate-900"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Project Timeline
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                {totalHoursCompleted}h / {activeProject.brief.totalEstimatedHours}h completed
              </div>
            </div>

            {/* Visual timeline */}
            <div className="flex items-center gap-1 mb-6">
              {activeProject.brief.milestones.map((ms, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className={clsx('w-full h-2 rounded-full', {
                      'bg-emerald-400': ms.status === 'completed',
                      'bg-indigo-400 animate-pulse': ms.status === 'in-progress',
                      'bg-slate-200': ms.status === 'todo',
                    })}
                  />
                  <span className="text-[10px] text-slate-400 hidden sm:block">
                    MS{i + 1}
                  </span>
                </div>
              ))}
            </div>

            {/* Milestone cards */}
            <div className="space-y-3">
              {activeProject.brief.milestones.map((ms) => {
                const isExpanded = expandedMilestone === ms.id;
                return (
                  <div
                    key={ms.id}
                    className={clsx('rounded-xl border transition-all', {
                      'border-emerald-200 bg-emerald-50/30': ms.status === 'completed',
                      'border-indigo-200 bg-indigo-50/30 shadow-sm':
                        ms.status === 'in-progress',
                      'border-slate-200 bg-slate-50/30': ms.status === 'todo',
                    })}
                  >
                    <button
                      onClick={() =>
                        setExpandedMilestone(isExpanded ? null : ms.id)
                      }
                      className="w-full flex items-center gap-4 p-4 text-left"
                    >
                      <div
                        className={clsx(
                          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                          {
                            'bg-emerald-100 text-emerald-600':
                              ms.status === 'completed',
                            'bg-indigo-100 text-indigo-600':
                              ms.status === 'in-progress',
                            'bg-slate-100 text-slate-400': ms.status === 'todo',
                          }
                        )}
                      >
                        {ms.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : ms.status === 'in-progress' ? (
                          <div className="relative">
                            <Circle className="w-5 h-5" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                            </div>
                          </div>
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {ms.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {ms.dueDate
                              ? new Date(ms.dueDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'TBD'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />~{ms.estimatedHours}h
                          </span>
                        </div>
                      </div>
                      <div
                        className={clsx(
                          'px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide',
                          {
                            'bg-emerald-100 text-emerald-700':
                              ms.status === 'completed',
                            'bg-indigo-100 text-indigo-700':
                              ms.status === 'in-progress',
                            'bg-slate-100 text-slate-500': ms.status === 'todo',
                          }
                        )}
                      >
                        {ms.status === 'in-progress' ? 'Active' : ms.status}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="px-4 pb-4 overflow-hidden"
                      >
                        <div className="ml-14 space-y-3 pt-1">
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {ms.description}
                          </p>
                          <div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                              Deliverables
                            </p>
                            <div className="space-y-1.5">
                              {ms.deliverables.map((d, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 text-sm text-slate-700"
                                >
                                  <div
                                    className={clsx(
                                      'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                                      {
                                        'border-emerald-300 bg-emerald-100':
                                          ms.status === 'completed',
                                        'border-slate-300':
                                          ms.status !== 'completed',
                                      }
                                    )}
                                  >
                                    {ms.status === 'completed' && (
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    )}
                                  </div>
                                  {d}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
