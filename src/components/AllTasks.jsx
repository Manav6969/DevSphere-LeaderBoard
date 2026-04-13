'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ExternalLink, Code2, Globe, Smartphone, Brain, GitFork } from 'lucide-react'

const CATEGORY_CONFIG = {
  web: { label: 'Web Development', icon: Globe, gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300' },
  app: { label: 'App Development', icon: Smartphone, gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
  ml: { label: 'Machine Learning', icon: Brain, gradient: 'from-purple-500 to-pink-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300' },
  foss: { label: 'Open Source', icon: GitFork, gradient: 'from-orange-500 to-amber-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-300' },
}

const DIFFICULTY_CONFIG = {
  easy: { label: 'Easy', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', badge: 'bg-green-500/20 text-green-300' },
  medium: { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', badge: 'bg-yellow-500/20 text-yellow-300' },
  hard: { label: 'Hard', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', badge: 'bg-red-500/20 text-red-300' },
}

export default function AllTasks({ tasks = [] }) {
  // Group tasks by category
  const grouped = {}
  const categoryOrder = ['web', 'app', 'ml', 'foss']
  categoryOrder.forEach(cat => { grouped[cat] = [] })

  tasks.forEach(task => {
    const cat = task.title?.toLowerCase() || 'web'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(task)
  })

  // Sort each category by difficulty
  const diffOrder = { easy: 0, medium: 1, hard: 2 }
  Object.values(grouped).forEach(arr => {
    arr.sort((a, b) => (diffOrder[a.difficulty] || 0) - (diffOrder[b.difficulty] || 0))
  })

  const totalTasks = tasks.length
  const totalPoints = tasks.reduce((s, t) => s + (t.points || 0), 0)

  return (
    <div className="space-y-8">
      {/* Stats Bar */}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
          <Code2 className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-bold text-white">{totalTasks}</span>
          <span className="text-xs text-gray-500">challenges</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
          <span className="text-sm font-bold text-purple-400">{totalPoints}</span>
          <span className="text-xs text-gray-500">total points</span>
        </div>
      </div>

      {/* Category Sections */}
      {categoryOrder.map((cat, catIdx) => {
        const catTasks = grouped[cat]
        if (!catTasks || catTasks.length === 0) return null
        const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.web
        const Icon = config.icon

        return (
          <motion.div
            key={cat}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIdx * 0.1, duration: 0.4 }}
          >
            {/* Category Header */}
            <div className={cn("flex items-center gap-3 mb-4 pb-3 border-b", config.border)}>
              <div className={cn("p-2 rounded-lg", config.bg)}>
                <Icon className={cn("w-5 h-5", config.text)} />
              </div>
              <h2 className={cn("text-lg font-bold uppercase tracking-wider", config.text)}>
                {config.label}
              </h2>
              <span className="text-xs text-gray-600 font-mono ml-auto">{catTasks.length} task{catTasks.length > 1 ? 's' : ''}</span>
            </div>

            {/* Task Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {catTasks.map((task, i) => {
                const diff = DIFFICULTY_CONFIG[task.difficulty] || DIFFICULTY_CONFIG.medium
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: catIdx * 0.1 + i * 0.05, duration: 0.3 }}
                    className={cn(
                      "group relative bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 transition-all duration-300",
                      "hover:bg-white/[0.06] hover:border-white/[0.15] hover:shadow-lg hover:shadow-black/20",
                      "flex flex-col gap-3"
                    )}
                  >
                    {/* Top Row: Difficulty + Category + Points */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border", diff.badge, diff.border)}>
                          {diff.label}
                        </span>
                        <span className={cn("text-[10px] font-bold uppercase px-2.5 py-1 rounded-full", config.badge)}>
                          {cat.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-black text-purple-400">+{task.points}</span>
                        <span className="text-[9px] text-gray-600 uppercase font-bold">pts</span>
                      </div>
                    </div>

                    {/* Task identifier — clickable if URL exists */}
                    {task.task_url ? (
                      <a
                        href={task.task_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white font-bold text-sm tracking-wide hover:text-purple-300 transition-colors flex items-center gap-1.5 group/link"
                      >
                        {task.github_identifier}
                        <ExternalLink className="w-3 h-3 text-gray-600 group-hover/link:text-purple-400 transition-colors" />
                      </a>
                    ) : (
                      <h3 className="text-white font-bold text-sm tracking-wide">
                        {task.github_identifier}
                      </h3>
                    )}

                    {/* Bottom: Open Task Link */}
                    {task.task_url ? (
                      <a
                        href={task.task_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "mt-auto flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all",
                          "bg-gradient-to-r", config.gradient,
                          "text-white opacity-80 hover:opacity-100 hover:shadow-lg active:scale-95"
                        )}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open Task
                      </a>
                    ) : (
                      <div className="mt-auto flex items-center gap-2 text-xs text-gray-700 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <ExternalLink className="w-3.5 h-3.5" />
                        No link available
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )
      })}

      {tasks.length === 0 && (
        <div className="text-center py-20">
          <Code2 className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">No tasks available yet</p>
          <p className="text-gray-700 text-sm mt-1">Check back later for new challenges!</p>
        </div>
      )}
    </div>
  )
}
