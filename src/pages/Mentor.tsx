import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Bot, MessageCircle, Sparkles, ArrowRight } from 'lucide-react';
import { useStudentStore } from '../store/studentStore';
import { COURSE_PROGRAMS } from '../data/coursePrograms';
import clsx from 'clsx';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700' },
};

export default function Mentor() {
  const student = useStudentStore((s) => s.student);
  const isLoading = useStudentStore((s) => s.isLoading);

  if (isLoading || !student) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          AI Mentors
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Each project has its own dedicated AI mentor that only knows about that project and its source courses — no cross-contamination between projects.
        </p>
      </motion.div>

      {student.projects.length === 0 ? (
        <motion.div variants={item} className="text-center py-16">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Bot className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            No mentors yet
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-5">
            Mentors are created automatically when you generate a project. Each project gets its own dedicated AI mentor.
          </p>
          <Link to="/project"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-4 h-4" /> Create a Project First
          </Link>
        </motion.div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {student.projects.map((proj) => {
            const courses = proj.selectedCourseIds
              .map((id) => COURSE_PROGRAMS.find((c) => c.id === id))
              .filter(Boolean);
            const msgCount = proj.chatHistory.length;

            return (
              <motion.div key={proj.id} variants={item}>
                <Link to={`/project/${proj.id}/mentor`}
                  className="block bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-indigo-200 transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {courses.map((c) => c && (
                          <span key={c.id} className={clsx('text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full',
                            COLOR_MAP[c.color]?.bg, COLOR_MAP[c.color]?.text)}>
                            {c.code}
                          </span>
                        ))}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        {proj.brief.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5" /> {msgCount} message{msgCount !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-400" /> Online
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors flex-shrink-0 mt-2" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
