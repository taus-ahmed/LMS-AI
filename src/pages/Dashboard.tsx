import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Clock,
  Target,
  Zap,
  Award,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import { useStudentStore } from '../store/studentStore';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export default function Dashboard() {
  const student = useStudentStore((s) => s.student);

  const completedWeeks = student.weekModules.filter((w) => w.status === 'completed').length;
  const avgScore = Math.round(
    student.weekModules.filter((w) => w.score).reduce((acc, w) => acc + (w.score || 0), 0) / completedWeeks
  );
  const nextMilestone = student.project?.milestones.find((m) => m.status === 'in-progress' || m.status === 'upcoming');
  const strongestSkill = [...student.skills].sort((a, b) => b.score - a.score)[0];
  const weakestSkill = [...student.skills].sort((a, b) => a.score - b.score)[0];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Welcome banner */}
      <motion.div
        variants={item}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 p-6 sm:p-8 text-white"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <p className="text-indigo-200 text-sm font-medium mb-1">Welcome back,</p>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {student.name} 👋
          </h1>
          <p className="text-indigo-100 text-sm sm:text-base max-w-xl leading-relaxed">
            You're on <strong>Week {student.currentWeek}</strong> of {student.course}. Your personalized project is ready — keep pushing forward!
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link
              to="/project"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-indigo-700 text-sm font-semibold hover:bg-indigo-50 transition-colors shadow-lg shadow-black/10"
            >
              <Target className="w-4 h-4" />
              View My Project
            </Link>
            <Link
              to="/mentor"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 text-white text-sm font-medium hover:bg-white/25 transition-colors backdrop-blur-sm"
            >
              <Zap className="w-4 h-4" />
              Ask AI Mentor
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Overall Progress', value: `${student.overallProgress}%`, icon: Target, color: 'indigo', sub: `Week ${student.currentWeek} of ${student.totalWeeks}` },
          { label: 'Average Score', value: `${avgScore}%`, icon: Award, color: 'amber', sub: `Across ${completedWeeks} modules` },
          { label: 'Strongest Skill', value: strongestSkill.name, icon: TrendingUp, color: 'emerald', sub: `${strongestSkill.score}% proficiency` },
          { label: 'Needs Growth', value: weakestSkill.name, icon: AlertCircle, color: 'rose', sub: `${weakestSkill.score}% proficiency` },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center mb-3', {
              'bg-indigo-50 text-indigo-600': stat.color === 'indigo',
              'bg-amber-50 text-amber-600': stat.color === 'amber',
              'bg-emerald-50 text-emerald-600': stat.color === 'emerald',
              'bg-rose-50 text-rose-600': stat.color === 'rose',
            })}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
            <p className="text-base sm:text-lg font-bold text-slate-900 truncate">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Skills overview */}
        <motion.div variants={item} className="lg:col-span-3 bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Skill Proficiency
            </h3>
            <Link to="/course" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
              View details →
            </Link>
          </div>
          <div className="space-y-3.5">
            {student.skills.map((skill, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-slate-700 font-medium">{skill.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-slate-900">{skill.score}%</span>
                    {skill.trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
                    {skill.trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-rose-500" />}
                    {skill.trend === 'stable' && <Minus className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${skill.score}%` }}
                    transition={{ duration: 1, delay: i * 0.08, ease: 'easeOut' }}
                    className={clsx('h-full rounded-full', {
                      'bg-gradient-to-r from-emerald-400 to-emerald-500': skill.score >= 80,
                      'bg-gradient-to-r from-indigo-400 to-indigo-500': skill.score >= 65 && skill.score < 80,
                      'bg-gradient-to-r from-amber-400 to-amber-500': skill.score >= 50 && skill.score < 65,
                      'bg-gradient-to-r from-rose-400 to-rose-500': skill.score < 50,
                    })}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right column */}
        <motion.div variants={item} className="lg:col-span-2 space-y-4">
          {/* Upcoming milestone */}
          {nextMilestone && (
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900 mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Upcoming Milestone
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{nextMilestone.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{nextMilestone.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Due: {new Date(nextMilestone.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    ~{nextMilestone.estimatedHours}h effort
                  </div>
                </div>
                <div className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', {
                  'bg-amber-50 text-amber-700': nextMilestone.status === 'in-progress',
                  'bg-slate-50 text-slate-600': nextMilestone.status === 'upcoming',
                })}>
                  <div className={clsx('w-1.5 h-1.5 rounded-full', {
                    'bg-amber-500 animate-pulse': nextMilestone.status === 'in-progress',
                    'bg-slate-400': nextMilestone.status === 'upcoming',
                  })} />
                  {nextMilestone.status === 'in-progress' ? 'In Progress' : 'Upcoming'}
                </div>
              </div>
              <Link
                to="/project"
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-medium hover:bg-indigo-100 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                View Project Details
              </Link>
            </div>
          )}

          {/* Recent activity */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Recent Activity
            </h3>
            <div className="space-y-3">
              {student.weekModules
                .filter((w) => w.status === 'completed')
                .slice(-3)
                .reverse()
                .map((week, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                      W{week.week}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 font-medium truncate">{week.title}</p>
                      <p className="text-xs text-slate-400">{week.completedAt}</p>
                    </div>
                    <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-md', {
                      'bg-emerald-50 text-emerald-700': (week.score || 0) >= 85,
                      'bg-indigo-50 text-indigo-700': (week.score || 0) >= 70 && (week.score || 0) < 85,
                      'bg-amber-50 text-amber-700': (week.score || 0) < 70,
                    })}>
                      {week.score}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
