import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Lock,
  PlayCircle,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { useStudentStore } from '../store/studentStore';
import clsx from 'clsx';
import { useState } from 'react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function CourseProgress() {
  const student = useStudentStore((s) => s.student);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(student.currentWeek);

  const completedWeeks = student.weekModules.filter((w) => w.status === 'completed').length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Course header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {student.course}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {student.courseCode} · {student.semester} · {completedWeeks} of {student.totalWeeks} modules complete
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
            {completedWeeks} Done
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700">
            <PlayCircle className="w-4 h-4" />
            1 Active
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">
            <Lock className="w-4 h-4" />
            {student.totalWeeks - completedWeeks - 1} Locked
          </div>
        </div>
      </motion.div>

      {/* Progress timeline */}
      <motion.div variants={item} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Visual progress bar */}
        <div className="px-5 sm:px-6 pt-5 pb-4">
          <div className="flex items-center gap-1.5">
            {student.weekModules.map((week, i) => (
              <div
                key={i}
                className={clsx('h-2 flex-1 rounded-full transition-all duration-500', {
                  'bg-emerald-400': week.status === 'completed',
                  'bg-indigo-400 animate-pulse': week.status === 'current',
                  'bg-slate-200': week.status === 'locked',
                })}
              />
            ))}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-400">Week 1</span>
            <span className="text-xs text-slate-400">Week {student.totalWeeks}</span>
          </div>
        </div>

        {/* Module list */}
        <div className="border-t border-slate-100">
          {student.weekModules.map((week) => {
            const isExpanded = expandedWeek === week.week;
            const canExpand = week.status !== 'locked';

            return (
              <div key={week.week} className={clsx('border-b border-slate-50 last:border-0', {
                'bg-indigo-50/30': week.status === 'current',
              })}>
                <button
                  onClick={() => canExpand && setExpandedWeek(isExpanded ? null : week.week)}
                  className={clsx(
                    'w-full flex items-center gap-4 px-5 sm:px-6 py-4 text-left transition-colors',
                    canExpand ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default opacity-60'
                  )}
                >
                  {/* Status icon */}
                  <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold', {
                    'bg-emerald-100 text-emerald-700': week.status === 'completed',
                    'bg-indigo-100 text-indigo-700': week.status === 'current',
                    'bg-slate-100 text-slate-400': week.status === 'locked',
                  })}>
                    {week.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : week.status === 'current' ? (
                      <PlayCircle className="w-5 h-5" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-400">Week {week.week}</span>
                      {week.status === 'current' && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-semibold uppercase tracking-wide">
                          Current
                        </span>
                      )}
                    </div>
                    <p className={clsx('text-sm font-medium mt-0.5', {
                      'text-slate-900': week.status !== 'locked',
                      'text-slate-400': week.status === 'locked',
                    })}>
                      {week.title}
                    </p>
                  </div>

                  {/* Score */}
                  {week.score && (
                    <span className={clsx('text-sm font-bold px-2.5 py-1 rounded-lg', {
                      'bg-emerald-50 text-emerald-700': week.score >= 85,
                      'bg-indigo-50 text-indigo-700': week.score >= 70 && week.score < 85,
                      'bg-amber-50 text-amber-700': week.score < 70,
                    })}>
                      {week.score}%
                    </span>
                  )}

                  {/* Expand icon */}
                  {canExpand && (
                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  )}
                </button>

                {/* Expanded content */}
                {isExpanded && canExpand && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="px-5 sm:px-6 pb-5 overflow-hidden"
                  >
                    <div className="ml-14 space-y-3">
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Topics Covered</p>
                        <div className="flex flex-wrap gap-2">
                          {week.topics.map((topic, i) => (
                            <span key={i} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                      {week.completedAt && (
                        <p className="text-xs text-slate-400">
                          Completed on {new Date(week.completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Skills breakdown */}
      <motion.div variants={item} className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Skill Development Tracker
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {student.skills.map((skill, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold', {
                'bg-emerald-100 text-emerald-700': skill.score >= 80,
                'bg-indigo-100 text-indigo-700': skill.score >= 65 && skill.score < 80,
                'bg-amber-100 text-amber-700': skill.score >= 50 && skill.score < 65,
                'bg-rose-100 text-rose-700': skill.score < 50,
              })}>
                {skill.score}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">{skill.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {skill.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
                  {skill.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-rose-500" />}
                  {skill.trend === 'stable' && <Minus className="w-3.5 h-3.5 text-slate-400" />}
                  <span className={clsx('text-xs font-medium', {
                    'text-emerald-600': skill.trend === 'up',
                    'text-rose-600': skill.trend === 'down',
                    'text-slate-500': skill.trend === 'stable',
                  })}>
                    {skill.trend === 'up' ? 'Improving' : skill.trend === 'down' ? 'Needs attention' : 'Stable'}
                  </span>
                </div>
              </div>
              {/* Mini bar */}
              <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={clsx('h-full rounded-full transition-all duration-1000', {
                    'bg-emerald-400': skill.score >= 80,
                    'bg-indigo-400': skill.score >= 65 && skill.score < 80,
                    'bg-amber-400': skill.score >= 50 && skill.score < 65,
                    'bg-rose-400': skill.score < 50,
                  })}
                  style={{ width: `${skill.score}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
