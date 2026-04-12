'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// Category color mapping
const CATEGORY_COLORS = {
  web:  { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', header: 'bg-blue-500/15', solved: 'bg-blue-500/8' },
  app:  { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', header: 'bg-emerald-500/15', solved: 'bg-emerald-500/8' },
  ml:   { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', header: 'bg-purple-500/15', solved: 'bg-purple-500/8' },
  foss: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', header: 'bg-orange-500/15', solved: 'bg-orange-500/8' },
}

const DIFFICULTY_LABELS = { easy: 'E', medium: 'M', hard: 'H' }
const DIFFICULTY_ORDER = ['easy', 'medium', 'hard']

// Format seconds into HH:MM (Codeforces style)
function formatTimeShort(seconds) {
  if (!seconds || seconds <= 0) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

// Format seconds into HH:MM:SS
function formatTimeFull(seconds) {
  if (!seconds || seconds <= 0) return '--:--:--'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function Leaderboard({ data, tasks, completions, eventStartTime, currentProfileId, highlightUsername }) {
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 15

  // Build the category → tasks structure
  const categoryStructure = useMemo(() => {
    if (!tasks || tasks.length === 0) return []

    const grouped = {}
    tasks.forEach(task => {
      const cat = task.title?.toLowerCase() || 'other'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(task)
    })

    // Sort tasks within each category by difficulty order
    Object.keys(grouped).forEach(cat => {
      grouped[cat].sort((a, b) =>
        DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty)
      )
    })

    const categoryOrder = ['web', 'app', 'ml', 'foss']
    const result = []
    categoryOrder.forEach(cat => {
      if (grouped[cat]) result.push({ category: cat, tasks: grouped[cat] })
    })
    // Any extra categories
    Object.keys(grouped).forEach(cat => {
      if (!categoryOrder.includes(cat)) result.push({ category: cat, tasks: grouped[cat] })
    })

    return result
  }, [tasks])

  // Build a lookup: { `${profileId}_${taskId}` → completion }
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

  // All task columns (flat list)
  const allTasks = useMemo(() => categoryStructure.flatMap(c => c.tasks), [categoryStructure])

  // Calculate per-task solve time in seconds (from event start)
  const getSolveTime = (completion) => {
    if (!completion || !eventStartTime) return 0
    const solvedAt = new Date(completion.created_at)
    return Math.max(0, Math.floor((solvedAt - eventStartTime) / 1000))
  }

  // Build ranked data with per-user scores, solved counts, and total penalty time
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

      return {
        ...entry,
        computedScore: totalScore,
        solvedCount,
        totalPenaltySeconds
      }
    }).sort((a, b) => {
      // Primary: higher score wins
      if (b.computedScore !== a.computedScore) return b.computedScore - a.computedScore
      // Tiebreak: lower total penalty time wins
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
      {/* Scoreboard Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            {/* ───── HEADER ───── */}
            <thead>
              {/* Top row: Category names spanning sub-columns */}
              <tr className="border-b border-white/10">
                <th className="px-3 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5 sticky left-0 z-20 w-10 text-center" rowSpan={2}>#</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5 sticky left-[40px] z-20 min-w-[140px]" rowSpan={2}>Who</th>
                <th className="px-3 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5 w-20 border-l border-white/5" rowSpan={2}>
                  <div>=</div>
                  <div className="text-[8px] text-gray-600 font-normal mt-0.5">Score</div>
                </th>
                <th className="px-3 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5 w-20 border-l border-white/5" rowSpan={2}>
                  <div>⏱</div>
                  <div className="text-[8px] text-gray-600 font-normal mt-0.5">Penalty</div>
                </th>
                {categoryStructure.map(({ category, tasks: catTasks }) => {
                  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.web
                  return (
                    <th
                      key={category}
                      colSpan={catTasks.length}
                      className={cn(
                        "px-2 py-2.5 text-center text-xs font-black uppercase tracking-wider border-l border-white/5",
                        colors.text, colors.header
                      )}
                    >
                      {category}
                    </th>
                  )
                })}
              </tr>
              {/* Sub-row: Individual task labels (difficulty + points) */}
              <tr className="border-b border-white/10 bg-white/[0.03]">
                {categoryStructure.flatMap(({ category, tasks: catTasks }) =>
                  catTasks.map((task, i) => {
                    const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.web
                    return (
                      <th
                        key={task.id}
                        className={cn(
                          "px-2 py-2 text-center border-l border-white/5 min-w-[75px]",
                          i === 0 && colors.border
                        )}
                      >
                        <div className={cn("text-[11px] font-black uppercase", colors.text)}>
                          {DIFFICULTY_LABELS[task.difficulty] || task.difficulty?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="text-[9px] text-gray-600 font-mono mt-0.5">
                          {task.points} pts
                        </div>
                      </th>
                    )
                  })
                )}
              </tr>
            </thead>

            {/* ───── BODY ───── */}
            <tbody className="divide-y divide-white/5">
              {paginatedData.map((entry, index) => {
                const rank = (currentPage - 1) * ITEMS_PER_PAGE + index + 1
                const isSelf = currentProfileId === entry.id || (highlightUsername && highlightUsername === entry.github_username)

                return (
                  <tr
                    key={entry.id}
                    className={cn(
                      "group transition-colors duration-200",
                      isSelf
                        ? "bg-purple-500/10 hover:bg-purple-500/15"
                        : "hover:bg-white/[0.04]",
                      rank <= 3 && !isSelf && "bg-white/[0.02]"
                    )}
                  >
                    {/* Rank */}
                    <td className={cn(
                      "px-3 py-3 text-center font-black text-sm sticky left-0 z-10",
                      isSelf ? "bg-purple-900/40" : "bg-black/90",
                      rank === 1 ? "text-yellow-400" :
                      rank === 2 ? "text-slate-300" :
                      rank === 3 ? "text-amber-500" :
                      "text-gray-600"
                    )}>
                      {rank}
                    </td>

                    {/* Username */}
                    <td className={cn(
                      "px-4 py-3 sticky left-[40px] z-10",
                      isSelf ? "bg-purple-900/40" : "bg-black/90"
                    )}>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-bold truncate max-w-[120px]",
                          isSelf ? "text-purple-300" :
                          rank <= 3 ? "text-white" : "text-gray-300"
                        )}>
                          {entry.github_username}
                        </span>
                        {isSelf && (
                          <span className="text-[8px] font-black bg-purple-500 text-white px-1.5 py-0.5 rounded uppercase tracking-widest shrink-0">You</span>
                        )}
                      </div>
                    </td>

                    {/* Total Score */}
                    <td className="px-3 py-3 text-center border-l border-white/5">
                      <span className={cn(
                        "font-black text-base tabular-nums",
                        rank <= 3 ? "text-green-400" : "text-white"
                      )}>
                        {entry.computedScore || entry.total_points || 0}
                      </span>
                    </td>

                    {/* Total Penalty Time */}
                    <td className="px-3 py-3 text-center border-l border-white/5">
                      <span className="text-xs font-mono text-gray-400">
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
                              "px-2 py-2 text-center border-l border-white/5 transition-colors",
                              i === 0 && colors.border,
                              isSolved && colors.solved
                            )}
                          >
                            {isSolved ? (
                              <div>
                                {/* Points earned */}
                                <div className={cn("text-sm font-bold tabular-nums leading-tight", colors.text)}>
                                  {task.points}
                                </div>
                                {/* Solve time from event start (Codeforces-style HH:MM) */}
                                {solveTimeSecs > 0 && (
                                  <div className="text-[10px] text-gray-500 font-mono leading-tight mt-0.5">
                                    {formatTimeShort(solveTimeSecs)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-800">—</span>
                            )}
                          </td>
                        )
                      })
                    )}
                  </tr>
                )
              })}

              {/* Empty state */}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={4 + allTasks.length} className="text-center py-16 text-gray-600 text-sm">
                    No participants yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            ← Prev
          </button>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={cn(
                  "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                  currentPage === i + 1
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40"
                    : "bg-white/5 text-gray-500 hover:text-white"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next →
          </button>
        </div>
      )}

      {/* Sticky bottom rank tracker */}
      {userEntry && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.4 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-black/90 backdrop-blur-2xl border-t border-purple-500/20 flex justify-center shadow-[0_-20px_40px_rgba(147,51,234,0.1)]"
        >
          <div className="max-w-7xl w-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center justify-center">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Your Rank</span>
                <motion.span
                  key={absoluteUserIndex}
                  initial={{ scale: 1.4, color: '#a855f7' }}
                  animate={{ scale: 1, color: '#ffffff' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="text-3xl lg:text-4xl font-black italic tracking-tighter"
                >
                  #{absoluteUserIndex + 1}
                </motion.span>
              </div>
              <div className="hidden md:block h-10 w-px bg-white/10" />
              <div className="hidden md:block">
                <h3 className="font-bold text-white text-lg tracking-wide">{userEntry.github_username}</h3>
                <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest">You</span>
              </div>
            </div>

            <div className="flex items-center gap-6 md:gap-10">
              <div className="hidden md:block text-right">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Solved</p>
                <p className="font-mono font-bold text-white text-xl">{userEntry.solvedCount || userEntry.tasks_completed || 0}/{allTasks.length}</p>
              </div>
              <div className="hidden md:block text-right">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Time</p>
                <p className="font-mono font-bold text-gray-300 text-lg">
                  {formatTimeFull(userEntry.totalPenaltySeconds || userEntry.total_time || 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-purple-400 font-bold uppercase tracking-[0.2em] mb-0.5">Total</p>
                <motion.p
                  key={userEntry.computedScore || userEntry.total_points}
                  initial={{ scale: 1.3, color: '#a855f7' }}
                  animate={{ scale: 1, color: '#c084fc' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="font-black text-3xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-300 to-blue-400"
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
