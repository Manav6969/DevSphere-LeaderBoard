'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Crown, Award, Medal, Zap } from 'lucide-react'

// Category color mapping
const CATEGORY_COLORS = {
  web:  { text: 'text-blue-400', header: 'bg-blue-500/15', solved: 'bg-blue-500/10', glow: 'shadow-blue-500/20', border: 'border-blue-500/20', accent: '#3b82f6' },
  app:  { text: 'text-emerald-400', header: 'bg-emerald-500/15', solved: 'bg-emerald-500/10', glow: 'shadow-emerald-500/20', border: 'border-emerald-500/20', accent: '#10b981' },
  ml:   { text: 'text-purple-400', header: 'bg-purple-500/15', solved: 'bg-purple-500/10', glow: 'shadow-purple-500/20', border: 'border-purple-500/20', accent: '#a855f7' },
  foss: { text: 'text-orange-400', header: 'bg-orange-500/15', solved: 'bg-orange-500/10', glow: 'shadow-orange-500/20', border: 'border-orange-500/20', accent: '#f97316' },
}

const DIFFICULTY_LABELS = { easy: 'E', medium: 'M', hard: 'H' }
const DIFFICULTY_ORDER = ['easy', 'medium', 'hard']

// Codeforces-style HH:MM
function formatTimeShort(seconds) {
  if (!seconds || seconds <= 0) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

// Full HH:MM:SS
function formatTimeFull(seconds) {
  if (!seconds || seconds <= 0) return '--:--:--'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// Rank badge component for top 3
function RankBadge({ rank }) {
  const config = {
    1: { icon: Crown, gradient: 'from-yellow-300 via-yellow-500 to-amber-600', shadow: 'shadow-yellow-500/40', text: 'text-yellow-900' },
    2: { icon: Award, gradient: 'from-slate-200 via-slate-400 to-slate-500', shadow: 'shadow-slate-400/30', text: 'text-slate-800' },
    3: { icon: Medal, gradient: 'from-amber-400 via-amber-600 to-amber-800', shadow: 'shadow-amber-600/30', text: 'text-amber-900' },
  }[rank]

  if (!config) return <span className="text-gray-600 font-mono text-sm">{rank}</span>

  const Icon = config.icon

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: rank * 0.1 }}
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br shadow-lg relative",
        config.gradient, config.shadow
      )}
    >
      <Icon className={cn("w-4 h-4", config.text)} />
      {/* Pulse ring for 1st place */}
      {rank === 1 && (
        <div className="absolute inset-0 rounded-full bg-yellow-400/20 animate-ping" />
      )}
    </motion.div>
  )
}

// Stagger animation variants
const tableVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 }
  }
}

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  }
}

export default function Leaderboard({ data, tasks, completions, eventStartTime, currentProfileId, highlightUsername }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [hoveredRow, setHoveredRow] = useState(null)
  const ITEMS_PER_PAGE = 15

  // Build category → tasks structure
  const categoryStructure = useMemo(() => {
    if (!tasks || tasks.length === 0) return []
    const grouped = {}
    tasks.forEach(task => {
      const cat = task.title?.toLowerCase() || 'other'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(task)
    })
    Object.keys(grouped).forEach(cat => {
      grouped[cat].sort((a, b) => DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty))
    })
    const categoryOrder = ['web', 'app', 'ml', 'foss']
    const result = []
    categoryOrder.forEach(cat => { if (grouped[cat]) result.push({ category: cat, tasks: grouped[cat] }) })
    Object.keys(grouped).forEach(cat => { if (!categoryOrder.includes(cat)) result.push({ category: cat, tasks: grouped[cat] }) })
    return result
  }, [tasks])

  // Completion lookup map
  const completionMap = useMemo(() => {
    if (!completions) return {}
    const map = {}
    completions.forEach(c => {
      if (c.status === 'valid') {
        const key = `${c.profile_id}_${c.task_id}`
        if (!map[key]) map[key] = c
      }
    })
    return map
  }, [completions])

  const allTasks = useMemo(() => categoryStructure.flatMap(c => c.tasks), [categoryStructure])

  const getSolveTime = (completion) => {
    if (!completion || !eventStartTime) return 0
    const solvedAt = new Date(completion.created_at)
    return Math.max(0, Math.floor((solvedAt - eventStartTime) / 1000))
  }

  // Ranked data with computed fields
  const rankedData = useMemo(() => {
    return data.map(entry => {
      let totalScore = 0
      let solvedCount = 0
      let totalPenaltySeconds = 0
      allTasks.forEach(task => {
        const completion = completionMap[`${entry.id}_${task.id}`]
        if (completion) {
          totalScore += task.points || 0
          solvedCount++
          totalPenaltySeconds += getSolveTime(completion)
        }
      })
      return { ...entry, computedScore: totalScore, solvedCount, totalPenaltySeconds }
    }).sort((a, b) => {
      if (b.computedScore !== a.computedScore) return b.computedScore - a.computedScore
      return a.totalPenaltySeconds - b.totalPenaltySeconds
    })
  }, [data, allTasks, completionMap, eventStartTime])

  const totalPages = Math.ceil(rankedData.length / ITEMS_PER_PAGE)
  const paginatedData = rankedData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const absoluteUserIndex = rankedData.findIndex(entry =>
    currentProfileId === entry.id || (highlightUsername && highlightUsername === entry.github_username)
  )
  const userEntry = absoluteUserIndex !== -1 ? rankedData[absoluteUserIndex] : null

  return (
    <div className="space-y-6">
      {/* ═══════ Stats Bar ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 flex-wrap"
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-bold text-gray-300">
            <span className="text-white">{rankedData.length}</span> Participants
          </span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
          <span className="text-sm font-bold text-gray-300">
            <span className="text-purple-400">{allTasks.length}</span> Tasks
          </span>
        </div>
        {categoryStructure.map(({ category, tasks: catTasks }) => {
          const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.web
          return (
            <div key={category} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border", colors.border, colors.solved)}>
              <div className={cn("w-2 h-2 rounded-full", `bg-[${colors.accent}]`)} style={{ backgroundColor: colors.accent }} />
              <span className={cn("text-xs font-black uppercase tracking-wider", colors.text)}>{category}</span>
              <span className="text-[10px] text-gray-500 font-mono">×{catTasks.length}</span>
            </div>
          )
        })}
      </motion.div>

      {/* ═══════ Scoreboard Table ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent backdrop-blur-xl shadow-2xl shadow-black/50"
      >
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <table className="w-full text-left border-collapse min-w-[900px]">
            {/* ───── HEADER ───── */}
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-3 py-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5 sticky left-0 z-20 w-12 text-center backdrop-blur-xl" rowSpan={2}>#</th>
                <th className="px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5 sticky left-[48px] z-20 min-w-[150px] backdrop-blur-xl" rowSpan={2}>Who</th>
                <th className="px-4 py-3.5 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5 w-20 border-l border-white/5" rowSpan={2}>
                  <div className="text-base">Σ</div>
                  <div className="text-[8px] text-gray-600 font-normal mt-0.5 normal-case">Score</div>
                </th>
                <th className="px-4 py-3.5 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5 w-24 border-l border-white/5" rowSpan={2}>
                  <div className="text-base">⏱</div>
                  <div className="text-[8px] text-gray-600 font-normal mt-0.5 normal-case">Penalty</div>
                </th>
                {categoryStructure.map(({ category, tasks: catTasks }) => {
                  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.web
                  return (
                    <motion.th
                      key={category}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      colSpan={catTasks.length}
                      className={cn(
                        "px-2 py-3 text-center text-xs font-black uppercase tracking-wider border-l border-white/5 relative overflow-hidden",
                        colors.text, colors.header
                      )}
                    >
                      {/* Category shimmer */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_ease-in-out_infinite]" />
                      <span className="relative z-10">{category}</span>
                    </motion.th>
                  )
                })}
              </tr>
              {/* Sub-row: difficulty + points */}
              <tr className="border-b border-white/10 bg-white/[0.02]">
                {categoryStructure.flatMap(({ category, tasks: catTasks }) =>
                  catTasks.map((task, i) => {
                    const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.web
                    return (
                      <th key={task.id} className={cn("px-2 py-2 text-center border-l border-white/5 min-w-[80px]")}>
                        <div className={cn("text-[11px] font-black uppercase", colors.text)}>
                          {DIFFICULTY_LABELS[task.difficulty] || task.difficulty?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="text-[9px] text-gray-600 font-mono mt-0.5">{task.points} pts</div>
                      </th>
                    )
                  })
                )}
              </tr>
            </thead>

            {/* ───── BODY ───── */}
            <motion.tbody
              variants={tableVariants}
              initial="hidden"
              animate="visible"
              className="divide-y divide-white/5"
            >
              <AnimatePresence mode="popLayout">
                {paginatedData.map((entry, index) => {
                  const rank = (currentPage - 1) * ITEMS_PER_PAGE + index + 1
                  const isSelf = currentProfileId === entry.id || (highlightUsername && highlightUsername === entry.github_username)
                  const isHovered = hoveredRow === entry.id
                  const solvedRatio = allTasks.length > 0 ? entry.solvedCount / allTasks.length : 0

                  return (
                    <motion.tr
                      key={entry.id}
                      variants={rowVariants}
                      layout
                      onMouseEnter={() => setHoveredRow(entry.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      className={cn(
                        "group relative transition-all duration-300 cursor-default",
                        isSelf
                          ? "bg-gradient-to-r from-purple-500/15 via-purple-500/10 to-blue-500/10"
                          : isHovered
                            ? "bg-white/[0.06]"
                            : rank <= 3
                              ? "bg-white/[0.02]"
                              : ""
                      )}
                    >
                      {/* Rank */}
                      <td className={cn(
                        "px-3 py-3.5 text-center sticky left-0 z-10 transition-colors duration-300",
                        isSelf ? "bg-purple-900/50 backdrop-blur-xl" : "bg-black/90 backdrop-blur-xl"
                      )}>
                        <RankBadge rank={rank} />
                      </td>

                      {/* Username */}
                      <td className={cn(
                        "px-4 py-3.5 sticky left-[48px] z-10 transition-colors duration-300",
                        isSelf ? "bg-purple-900/50 backdrop-blur-xl" : "bg-black/90 backdrop-blur-xl"
                      )}>
                        <div className="flex items-center gap-2.5">
                          {/* Avatar circle */}
                          <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black uppercase shrink-0 transition-all duration-300",
                            isSelf
                              ? "bg-purple-500/30 text-purple-300 ring-2 ring-purple-500/50"
                              : rank <= 3
                                ? "bg-white/10 text-white ring-1 ring-white/20"
                                : "bg-white/5 text-gray-500"
                          )}>
                            {entry.github_username?.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={cn(
                                "text-sm font-bold truncate transition-colors duration-300",
                                isSelf ? "text-purple-200" :
                                isHovered ? "text-white" :
                                rank <= 3 ? "text-white" : "text-gray-300"
                              )}>
                                {entry.github_username}
                              </span>
                              {isSelf && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="text-[7px] font-black bg-purple-500 text-white px-1.5 py-0.5 rounded uppercase tracking-widest shrink-0"
                                >
                                  You
                                </motion.span>
                              )}
                            </div>
                            {/* Mini progress bar */}
                            <div className="w-full h-0.5 bg-white/5 rounded-full mt-1 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${solvedRatio * 100}%` }}
                                transition={{ duration: 1, delay: index * 0.05 + 0.3 }}
                                className={cn(
                                  "h-full rounded-full",
                                  isSelf ? "bg-purple-500" : rank <= 3 ? "bg-green-500" : "bg-white/20"
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Total Score */}
                      <td className="px-4 py-3.5 text-center border-l border-white/5">
                        <motion.span
                          key={entry.computedScore}
                          initial={{ scale: 1.2, color: '#22c55e' }}
                          animate={{ scale: 1, color: rank <= 3 ? '#4ade80' : '#ffffff' }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          className="font-black text-base tabular-nums"
                        >
                          {entry.computedScore || entry.total_points || 0}
                        </motion.span>
                      </td>

                      {/* Total Penalty Time */}
                      <td className="px-4 py-3.5 text-center border-l border-white/5">
                        <span className="text-xs font-mono text-gray-400 tabular-nums">
                          {entry.totalPenaltySeconds > 0
                            ? formatTimeFull(entry.totalPenaltySeconds)
                            : entry.total_time
                              ? formatTimeFull(entry.total_time)
                              : '--:--:--'}
                        </span>
                      </td>

                      {/* ───── Per-Task Cells ───── */}
                      {categoryStructure.flatMap(({ category, tasks: catTasks }) =>
                        catTasks.map((task, i) => {
                          const completion = completionMap[`${entry.id}_${task.id}`]
                          const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.web
                          const isSolved = !!completion
                          const solveTimeSecs = isSolved ? getSolveTime(completion) : 0

                          return (
                            <td
                              key={task.id}
                              className={cn(
                                "px-2 py-2.5 text-center border-l border-white/5 transition-all duration-300 relative",
                                isSolved && colors.solved,
                                isSolved && isHovered && "brightness-125"
                              )}
                            >
                              {isSolved ? (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.5 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                >
                                  {/* Points */}
                                  <div className={cn("text-sm font-bold tabular-nums leading-tight", colors.text)}>
                                    {task.points}
                                  </div>
                                  {/* Solve time */}
                                  {solveTimeSecs > 0 && (
                                    <div className="text-[10px] text-gray-500 font-mono leading-tight mt-0.5 tabular-nums">
                                      {formatTimeShort(solveTimeSecs)}
                                    </div>
                                  )}
                                  {/* Solved indicator dot */}
                                  <div className={cn(
                                    "absolute top-1 right-1 w-1.5 h-1.5 rounded-full opacity-60",
                                    category === 'web' && "bg-blue-400",
                                    category === 'app' && "bg-emerald-400",
                                    category === 'ml' && "bg-purple-400",
                                    category === 'foss' && "bg-orange-400"
                                  )} />
                                </motion.div>
                              ) : (
                                <span className="text-gray-800 text-sm">—</span>
                              )}
                            </td>
                          )
                        })
                      )}
                    </motion.tr>
                  )
                })}
              </AnimatePresence>

              {/* Empty state */}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={4 + allTasks.length} className="text-center py-20">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                        <Zap className="w-8 h-8 text-gray-700" />
                      </div>
                      <p className="text-gray-600 text-sm font-medium">No participants yet.</p>
                      <p className="text-gray-700 text-xs">Complete a task to appear here!</p>
                    </motion.div>
                  </td>
                </tr>
              )}
            </motion.tbody>
          </table>
        </div>
      </motion.div>

      {/* ═══════ Pagination ═══════ */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-3"
        >
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
          >
            ← Prev
          </button>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(i + 1)}
                className={cn(
                  "w-9 h-9 rounded-xl text-xs font-bold transition-all",
                  currentPage === i + 1
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40 ring-2 ring-purple-500/30"
                    : "bg-white/5 text-gray-500 hover:text-white hover:bg-white/10"
                )}
              >
                {i + 1}
              </motion.button>
            ))}
          </div>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
          >
            Next →
          </button>
        </motion.div>
      )}

      {/* ═══════ Sticky Bottom Rank Tracker ═══════ */}
      {userEntry && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.6 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-2xl border-t border-purple-500/30"
        >
          {/* Gradient line at top */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="flex flex-col items-center justify-center">
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Rank</span>
                <motion.span
                  key={absoluteUserIndex}
                  initial={{ scale: 1.5, color: '#a855f7' }}
                  animate={{ scale: 1, color: '#ffffff' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="text-2xl lg:text-3xl font-black italic tracking-tighter"
                >
                  #{absoluteUserIndex + 1}
                </motion.span>
              </div>
              <div className="hidden md:block h-8 w-px bg-white/10" />
              <div className="hidden md:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-black text-purple-300 uppercase ring-1 ring-purple-500/30">
                  {userEntry.github_username?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm tracking-wide">{userEntry.github_username}</h3>
                  <span className="text-[8px] bg-purple-500 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-widest">You</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-5 md:gap-8">
              <div className="hidden md:block text-right">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Solved</p>
                <p className="font-mono font-bold text-white text-lg">{userEntry.solvedCount || 0}<span className="text-gray-600">/{allTasks.length}</span></p>
              </div>
              <div className="hidden md:block text-right">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Time</p>
                <p className="font-mono font-bold text-gray-300 text-sm tabular-nums">
                  {formatTimeFull(userEntry.totalPenaltySeconds || userEntry.total_time || 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-purple-400 font-bold uppercase tracking-[0.2em] mb-0.5">Score</p>
                <motion.p
                  key={userEntry.computedScore || userEntry.total_points}
                  initial={{ scale: 1.3, color: '#a855f7' }}
                  animate={{ scale: 1, color: '#c084fc' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-300 to-blue-400"
                >
                  {(userEntry.computedScore || userEntry.total_points || 0).toLocaleString()}
                </motion.p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
