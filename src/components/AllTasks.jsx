'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ExternalLink, Code2, Globe, Smartphone, Brain, GitFork, Sparkles } from 'lucide-react'

const CATEGORY_CONFIG = {
  web: { label: 'Web Development', icon: Globe, gradient: 'from-blue-500 to-cyan-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', badge: 'bg-blue-500/15 text-blue-300 border-blue-500/20', glow: 'rgba(59,130,246,0.08)' },
  app: { label: 'App Development', icon: Smartphone, gradient: 'from-emerald-500 to-teal-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20', glow: 'rgba(16,185,129,0.08)' },
  ml: { label: 'Machine Learning', icon: Brain, gradient: 'from-purple-500 to-pink-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', badge: 'bg-purple-500/15 text-purple-300 border-purple-500/20', glow: 'rgba(147,51,234,0.08)' },
  foss: { label: 'FOSS', icon: GitFork, gradient: 'from-orange-500 to-amber-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', badge: 'bg-orange-500/15 text-orange-300 border-orange-500/20', glow: 'rgba(249,115,22,0.08)' },
}

const DIFFICULTY_CONFIG = {
  easy: { label: 'Easy', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', badge: 'bg-green-500/15 text-green-300 border-green-500/20' },
  medium: { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', badge: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/20' },
  hard: { label: 'Hard', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', badge: 'bg-red-500/15 text-red-300 border-red-500/20' },
}

export default function AllTasks({ tasks = [] }) {
  const grouped = {}
  const categoryOrder = ['web', 'app', 'ml', 'foss']
  categoryOrder.forEach(cat => { grouped[cat] = [] })

  tasks.forEach(task => {
    const cat = task.title?.toLowerCase() || 'web'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(task)
  })

  const diffOrder = { easy: 0, medium: 1, hard: 2 }
  Object.values(grouped).forEach(arr => {
    arr.sort((a, b) => (diffOrder[a.difficulty] || 0) - (diffOrder[b.difficulty] || 0))
  })

  const totalTasks = tasks.length
  const totalPoints = tasks.reduce((s, t) => s + (t.points || 0), 0)

  return (
    <div className="space-y-10">
      {/* Stats Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 flex-wrap"
      >
        <div className="flex items-center gap-2.5 px-5 py-2.5 glass rounded-xl">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-black text-white">{totalTasks}</span>
          <span className="text-xs text-gray-500 font-medium">challenges</span>
        </div>
        <div className="flex items-center gap-2.5 px-5 py-2.5 glass rounded-xl">
          <span className="text-sm font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">{totalPoints}</span>
          <span className="text-xs text-gray-500 font-medium">total points</span>
        </div>
      </motion.div>

      {/* Category Sections */}
      {categoryOrder.map((cat, catIdx) => {
        const catTasks = grouped[cat]
        if (!catTasks || catTasks.length === 0) return null
        const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.web
        const Icon = config.icon

        return (
          <motion.div
            key={cat}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIdx * 0.12, duration: 0.5, ease: 'easeOut' }}
          >
            {/* Category Header */}
            <div className={cn("flex items-center gap-3 mb-5 pb-4 border-b", config.border)}>
              <div className={cn("p-2.5 rounded-xl", config.bg)} style={{ boxShadow: `0 0 20px ${config.glow}` }}>
                <Icon className={cn("w-5 h-5", config.text)} />
              </div>
              <h2 className={cn("text-lg font-black uppercase tracking-wider", config.text)}>
                {config.label}
              </h2>
              <div className="ml-auto flex items-center gap-2 px-3 py-1 rounded-lg bg-white/[0.03]">
                <span className="text-xs text-gray-600 font-mono">{catTasks.length}</span>
                <span className="text-[10px] text-gray-700">task{catTasks.length > 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Task Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {catTasks.map((task, i) => {
                const diff = DIFFICULTY_CONFIG[task.difficulty] || DIFFICULTY_CONFIG.medium
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: catIdx * 0.1 + i * 0.06, duration: 0.35, ease: 'easeOut' }}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    className={cn(
                      "group relative card-shimmer overflow-hidden",
                      "glass rounded-2xl p-5 transition-all duration-300",
                      "hover:shadow-xl hover:border-white/[0.12]",
                      "flex flex-col gap-3.5"
                    )}
                    style={{ boxShadow: `0 0 60px ${config.glow}` }}
                  >
                    {/* Subtle gradient glow at top */}
                    <div className={cn("absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r", config.gradient, "opacity-30 group-hover:opacity-60 transition-opacity")} />

                    {/* Top Row: Difficulty + Category + Points */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border", diff.badge)}>
                          {diff.label}
                        </span>
                        <span className={cn("text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border", config.badge)}>
                          {cat.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                          +{task.points}
                        </span>
                        <span className="text-[9px] text-gray-600 uppercase font-bold">pts</span>
                      </div>
                    </div>

                    {/* Task identifier — clickable if URL exists */}
                    <div className="flex flex-col gap-0.5">
                      {task.task_url ? (
                        <a
                          href={task.task_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white font-bold text-sm tracking-wide hover:text-purple-300 transition-colors flex items-center gap-1.5 group/link"
                        >
                          {task.task_name || task.github_identifier}
                          <ExternalLink className="w-3 h-3 text-gray-600 group-hover/link:text-purple-400 transition-colors" />
                        </a>
                      ) : (
                        <h3 className="text-white font-bold text-sm tracking-wide">
                          {task.task_name || task.github_identifier}
                        </h3>
                      )}
                    </div>

                    {/* Bottom: Open Task Link */}
                    {task.task_url ? (
                      <a
                        href={task.task_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "mt-auto flex items-center justify-center gap-2 text-xs font-bold px-4 py-3 rounded-xl transition-all",
                          "bg-gradient-to-r", config.gradient,
                          "text-white/90 hover:text-white opacity-80 hover:opacity-100",
                          "hover:shadow-lg active:scale-[0.98] hover:shadow-purple-500/10"
                        )}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open Task
                      </a>
                    ) : (
                      <div className="mt-auto flex items-center justify-center gap-2 text-xs text-gray-700 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
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
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24"
        >
          <div className="relative inline-block">
            <Code2 className="w-16 h-16 text-gray-800 mx-auto mb-5" />
            <div className="absolute inset-0 w-16 h-16 mx-auto bg-purple-500/5 blur-2xl rounded-full" />
          </div>
          <p className="text-gray-500 text-lg font-semibold">No tasks available yet</p>
          <p className="text-gray-700 text-sm mt-2">Check back later for new challenges!</p>
        </motion.div>
      )}
    </div>
  )
}
