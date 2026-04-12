'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Crown, Award, Medal, Zap, Users, Target } from 'lucide-react'

// ─── Color System ───
const CATEGORY_COLORS = {
  web:  { text: 'text-sky-400', header: 'bg-sky-500/12', solved: 'bg-sky-500/8', dot: 'bg-sky-400', accent: '#38bdf8', ring: 'ring-sky-500/30' },
  app:  { text: 'text-emerald-400', header: 'bg-emerald-500/12', solved: 'bg-emerald-500/8', dot: 'bg-emerald-400', accent: '#34d399', ring: 'ring-emerald-500/30' },
  ml:   { text: 'text-violet-400', header: 'bg-violet-500/12', solved: 'bg-violet-500/8', dot: 'bg-violet-400', accent: '#a78bfa', ring: 'ring-violet-500/30' },
  foss: { text: 'text-amber-400', header: 'bg-amber-500/12', solved: 'bg-amber-500/8', dot: 'bg-amber-400', accent: '#fbbf24', ring: 'ring-amber-500/30' },
}

const DIFFICULTY_LABELS = { easy: 'E', medium: 'M', hard: 'H' }
const DIFFICULTY_ORDER = ['easy', 'medium', 'hard']

function formatTimeShort(seconds) {
  if (!seconds || seconds <= 0) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

function formatTimeFull(seconds) {
  if (!seconds || seconds <= 0) return '--:--:--'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// ─── Rank Badge ───
function RankBadge({ rank }) {
  if (rank > 3) {
    return (
      <span className="text-gray-600 font-mono text-sm font-bold tabular-nums">
        {rank}
      </span>
    )
  }

  const config = {
    1: { icon: Crown, bg: 'from-yellow-200 via-yellow-400 to-amber-500', shadow: 'shadow-yellow-500/30', iconColor: 'text-yellow-900', pulse: true },
    2: { icon: Award, bg: 'from-slate-100 via-slate-300 to-slate-400', shadow: 'shadow-slate-400/20', iconColor: 'text-slate-700', pulse: false },
    3: { icon: Medal, bg: 'from-amber-300 via-amber-500 to-amber-700', shadow: 'shadow-amber-600/20', iconColor: 'text-amber-900', pulse: false },
  }[rank]

  const Icon = config.icon

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: rank * 0.08 }}
      className="relative"
    >
      <div className={cn(
        "w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg",
        `bg-gradient-to-br ${config.bg} ${config.shadow}`
      )}>
        <Icon className={cn("w-4 h-4", config.iconColor)} />
      </div>
      {config.pulse && (
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-xl bg-yellow-400/20"
        />
      )}
    </motion.div>
  )
}

// ─── Swap spring config (the Hero animation) ───
const SWAP_SPRING = {
  type: 'spring',
  stiffness: 400,
  damping: 35,
  mass: 0.8,
}

export default function Leaderboard({ data, tasks, completions, eventStartTime, currentProfileId, highlightUsername }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [hoveredRow, setHoveredRow] = useState(null)
  const [flashedRows, setFlashedRows] = useState(new Set())
  const prevRanksRef = useRef({})
  const ITEMS_PER_PAGE = 15

  // ─── Build category structure ───
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
    const order = ['web', 'app', 'ml', 'foss']
    const result = []
    order.forEach(cat => { if (grouped[cat]) result.push({ category: cat, tasks: grouped[cat] }) })
    Object.keys(grouped).forEach(cat => { if (!order.includes(cat)) result.push({ category: cat, tasks: grouped[cat] }) })
    return result
  }, [tasks])

  // ─── Completion map ───
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

  // Calculate solve time for a single completion using commit_time from payload
  const getSolveTime = (completion) => {
    if (!completion) return 0

    // 1. Try commit_time from the webhook payload (the actual time the user committed)
    const payload = completion.payload
    if (payload && payload.commit_time && eventStartTime) {
      const commitTime = new Date(payload.commit_time)
      return Math.max(0, Math.floor((commitTime - eventStartTime) / 1000))
    }

    // 2. Fallback: use created_at relative to eventStartTime
    if (eventStartTime) {
      return Math.max(0, Math.floor((new Date(completion.created_at) - eventStartTime) / 1000))
    }

    return 0
  }

  // Get commit_time formatted as clock time (for display when relative time can't be computed)
  const getCommitClockTime = (completion) => {
    if (!completion) return ''
    const payload = completion.payload
    const timeStr = payload?.commit_time || completion.created_at
    if (!timeStr) return ''
    const d = new Date(timeStr)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  // ─── Ranked data ───
  const rankedData = useMemo(() => {
    return data.map(entry => {
      let totalScore = 0, solvedCount = 0, totalPenaltySeconds = 0
      allTasks.forEach(task => {
        const c = completionMap[`${entry.id}_${task.id}`]
        if (c) {
          totalScore += task.points || 0
          solvedCount++
          totalPenaltySeconds += getSolveTime(c)
        }
      })
      return { ...entry, computedScore: totalScore, solvedCount, totalPenaltySeconds }
    }).sort((a, b) => {
      if (b.computedScore !== a.computedScore) return b.computedScore - a.computedScore
      return a.totalPenaltySeconds - b.totalPenaltySeconds
    })
  }, [data, allTasks, completionMap, eventStartTime])

  // ─── Detect rank changes and flash rows that moved ───
  useEffect(() => {
    const newRanks = {}
    rankedData.forEach((entry, i) => { newRanks[entry.id] = i })

    const moved = new Set()
    Object.entries(prevRanksRef.current).forEach(([id, oldRank]) => {
      if (newRanks[id] !== undefined && newRanks[id] !== oldRank) {
        moved.add(id)
      }
    })

    if (moved.size > 0) {
      setFlashedRows(moved)
      const timer = setTimeout(() => setFlashedRows(new Set()), 1500)
      return () => clearTimeout(timer)
    }

    prevRanksRef.current = newRanks
  }, [rankedData])

  const totalPages = Math.ceil(rankedData.length / ITEMS_PER_PAGE)
  const paginatedData = rankedData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const absoluteUserIndex = rankedData.findIndex(entry =>
    currentProfileId === entry.id || (highlightUsername && highlightUsername === entry.github_username)
  )
  const userEntry = absoluteUserIndex !== -1 ? rankedData[absoluteUserIndex] : null

  return (
    <div className="space-y-5">
      {/* ═══════ Stats Bar ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3 flex-wrap"
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-white/[0.06] to-white/[0.03] border border-white/10 shadow-lg shadow-black/20">
          <Users className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-bold text-gray-400">
            <span className="text-white font-black">{rankedData.length}</span> competing
          </span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-white/[0.06] to-white/[0.03] border border-white/10 shadow-lg shadow-black/20">
          <Target className="w-3.5 h-3.5 text-green-400" />
          <span className="text-xs font-bold text-gray-400">
            <span className="text-white font-black">{allTasks.length}</span> challenges
          </span>
        </div>
        <div className="hidden md:flex items-center gap-2 ml-auto">
          {categoryStructure.map(({ category, tasks: catTasks }) => {
            const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.web
            return (
              <div key={category} className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5",
                colors.solved
              )}>
                <div className={cn("w-1.5 h-1.5 rounded-full", colors.dot)} />
                <span className={cn("text-[10px] font-black uppercase tracking-wider", colors.text)}>{category}</span>
                <span className="text-[9px] text-gray-600 font-mono">({catTasks.length})</span>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* ═══════ Scoreboard ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] via-white/[0.02] to-transparent backdrop-blur-2xl shadow-2xl shadow-black/40 overflow-hidden"
      >
        {/* Gradient border top */}
        <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

        <div className="overflow-x-auto scrollbar-thin">
          <LayoutGroup id="scoreboard">
            <table className="w-full text-left border-collapse min-w-[900px]">
              {/* ───── HEADER ───── */}
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-black/40 sticky left-0 z-20 w-14 text-center backdrop-blur-xl" rowSpan={2}>#</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-black/40 sticky left-[56px] z-20 min-w-[160px] backdrop-blur-xl" rowSpan={2}>Who</th>
                  <th className="px-4 py-4 text-center bg-black/40 border-l border-white/[0.04] w-20" rowSpan={2}>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Score</div>
                  </th>
                  <th className="px-4 py-4 text-center bg-black/40 border-l border-white/[0.04] w-24" rowSpan={2}>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Time</div>
                  </th>
                  {categoryStructure.map(({ category, tasks: catTasks }) => {
                    const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.web
                    return (
                      <th
                        key={category}
                        colSpan={catTasks.length}
                        className={cn(
                          "px-2 py-3 text-center text-[11px] font-black uppercase tracking-wider border-l border-white/[0.04] relative overflow-hidden",
                          colors.text, colors.header
                        )}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-[shimmer_4s_ease-in-out_infinite]" />
                        <span className="relative z-10">{category}</span>
                      </th>
                    )
                  })}
                </tr>
                <tr className="border-b border-white/[0.06] bg-black/20">
                  {categoryStructure.flatMap(({ category, tasks: catTasks }) =>
                    catTasks.map((task) => {
                      const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.web
                      return (
                        <th key={task.id} className="px-2 py-2.5 text-center border-l border-white/[0.04] min-w-[80px]">
                          <div className={cn("text-[11px] font-black uppercase", colors.text)}>
                            {DIFFICULTY_LABELS[task.difficulty] || task.difficulty?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="text-[9px] text-gray-600 font-mono mt-0.5">{task.points}</div>
                        </th>
                      )
                    })
                  )}
                </tr>
              </thead>

              {/* ───── BODY (with LayoutGroup for swap animations) ───── */}
              <tbody className="divide-y divide-white/[0.04]">
                <AnimatePresence initial={false}>
                  {paginatedData.map((entry, index) => {
                    const rank = (currentPage - 1) * ITEMS_PER_PAGE + index + 1
                    const isSelf = currentProfileId === entry.id || (highlightUsername && highlightUsername === entry.github_username)
                    const isHovered = hoveredRow === entry.id
                    const isFlashed = flashedRows.has(entry.id)
                    const solvedRatio = allTasks.length > 0 ? entry.solvedCount / allTasks.length : 0

                    return (
                      <motion.tr
                        key={entry.id}

                        // ★ SWAP ANIMATION: layout prop makes rows animate to new positions
                        layout
                        layoutId={entry.id}

                        initial={{ opacity: 0, x: -30 }}
                        animate={{
                          opacity: 1,
                          x: 0,
                          backgroundColor: isFlashed
                            ? 'rgba(168, 85, 247, 0.15)'
                            : 'rgba(0, 0, 0, 0)',
                        }}
                        exit={{ opacity: 0, x: 30, transition: { duration: 0.2 } }}

                        transition={{
                          layout: SWAP_SPRING,
                          opacity: { duration: 0.3 },
                          x: { type: 'spring', stiffness: 300, damping: 30, delay: index * 0.03 },
                          backgroundColor: { duration: isFlashed ? 0.3 : 0.8 },
                        }}

                        onMouseEnter={() => setHoveredRow(entry.id)}
                        onMouseLeave={() => setHoveredRow(null)}

                        className={cn(
                          "group relative cursor-default transition-colors duration-200",
                          isSelf && "!bg-purple-500/[0.08]",
                          !isSelf && isHovered && "!bg-white/[0.04]",
                        )}
                      >
                        {/* Flash overlay for rank changes */}
                        {isFlashed && (
                          <motion.td
                            initial={{ opacity: 0.6 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 1.5 }}
                            className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/10 to-transparent pointer-events-none z-0"
                            colSpan={999}
                          />
                        )}

                        {/* Rank */}
                        <td className={cn(
                          "px-4 py-3.5 text-center sticky left-0 z-10 backdrop-blur-xl transition-colors duration-200",
                          isSelf ? "bg-purple-950/60" : "bg-black/80"
                        )}>
                          <RankBadge rank={rank} />
                        </td>

                        {/* Username */}
                        <td className={cn(
                          "px-5 py-3.5 sticky left-[56px] z-10 backdrop-blur-xl transition-colors duration-200",
                          isSelf ? "bg-purple-950/60" : "bg-black/80"
                        )}>
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black uppercase shrink-0 transition-all duration-300",
                                isSelf
                                  ? "bg-purple-500/25 text-purple-300 ring-1 ring-purple-500/40"
                                  : rank <= 3
                                    ? "bg-white/10 text-white/80 ring-1 ring-white/10"
                                    : "bg-white/[0.04] text-gray-600"
                              )}
                            >
                              {entry.github_username?.charAt(0)}
                            </motion.div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-sm font-bold truncate transition-colors duration-200",
                                  isSelf ? "text-purple-200" :
                                  rank <= 3 ? "text-white" :
                                  isHovered ? "text-white" : "text-gray-300"
                                )}>
                                  {entry.github_username}
                                </span>
                                {isSelf && (
                                  <motion.span
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', delay: 0.3 }}
                                    className="text-[7px] font-black bg-purple-500 text-white px-1.5 py-0.5 rounded-md uppercase tracking-widest shrink-0 shadow-lg shadow-purple-500/20"
                                  >
                                    You
                                  </motion.span>
                                )}
                              </div>
                              {/* Solve progress bar */}
                              <div className="w-20 h-[3px] bg-white/[0.04] rounded-full mt-1.5 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${solvedRatio * 100}%` }}
                                  transition={{ duration: 0.8, delay: index * 0.04 + 0.2, ease: 'easeOut' }}
                                  className={cn(
                                    "h-full rounded-full",
                                    isSelf ? "bg-purple-500" :
                                    solvedRatio === 1 ? "bg-green-400" :
                                    solvedRatio >= 0.5 ? "bg-sky-400" : "bg-white/15"
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Score */}
                        <td className="px-4 py-3.5 text-center border-l border-white/[0.04]">
                          <motion.span
                            key={entry.computedScore}
                            initial={{ scale: 1.3 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            className={cn(
                              "font-black text-[15px] tabular-nums",
                              rank === 1 ? "text-yellow-400" :
                              rank <= 3 ? "text-green-400" : "text-white"
                            )}
                          >
                            {entry.computedScore || entry.total_points || 0}
                          </motion.span>
                        </td>

                        {/* Penalty Time */}
                        <td className="px-4 py-3.5 text-center border-l border-white/[0.04]">
                          <span className="text-[11px] font-mono text-gray-500 tabular-nums tracking-tight">
                            {entry.totalPenaltySeconds > 0
                              ? formatTimeFull(entry.totalPenaltySeconds)
                              : entry.total_time && entry.total_time > 0
                                ? formatTimeFull(Math.floor(entry.total_time))
                                : '--:--:--'}
                          </span>
                        </td>

                        {/* Per-Task Cells */}
                        {categoryStructure.flatMap(({ category, tasks: catTasks }) =>
                          catTasks.map((task) => {
                            const completion = completionMap[`${entry.id}_${task.id}`]
                            const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.web
                            const isSolved = !!completion
                            const solveTimeSecs = isSolved ? getSolveTime(completion) : 0
                            // Show relative time (from event start) OR commit clock time
                            const displayTime = solveTimeSecs > 0
                              ? formatTimeShort(solveTimeSecs)
                              : (isSolved ? getCommitClockTime(completion) : '')

                            return (
                              <td
                                key={task.id}
                                className={cn(
                                  "px-2 py-2.5 text-center border-l border-white/[0.04] transition-all duration-300 relative",
                                  isSolved && colors.solved,
                                  isSolved && isHovered && "brightness-150"
                                )}
                              >
                                {isSolved ? (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.3 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                  >
                                    <div className={cn("text-sm font-bold tabular-nums leading-tight", colors.text)}>
                                      {task.points}
                                    </div>
                                    {displayTime && (
                                      <div className="text-[10px] text-gray-500 font-mono leading-tight mt-0.5 tabular-nums">
                                        {displayTime}
                                      </div>
                                    )}
                                    {/* Solved dot */}
                                    <div className={cn("absolute top-1 right-1 w-1 h-1 rounded-full opacity-50", colors.dot)} />
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

                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={4 + allTasks.length} className="text-center py-20">
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/[0.06]">
                          <Zap className="w-7 h-7 text-gray-700" />
                        </div>
                        <p className="text-gray-600 text-sm font-medium">No participants yet.</p>
                      </motion.div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </LayoutGroup>
        </div>

        {/* Gradient border bottom */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </motion.div>

      {/* ═══════ Pagination ═══════ */}
      {totalPages > 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex items-center justify-center gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="px-5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm font-semibold text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            ←
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(i + 1)}
              className={cn(
                "w-9 h-9 rounded-xl text-xs font-bold transition-all",
                currentPage === i + 1
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "bg-white/[0.04] text-gray-500 hover:text-white"
              )}
            >
              {i + 1}
            </motion.button>
          ))}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="px-5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm font-semibold text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            →
          </button>
        </motion.div>
      )}

      {/* ═══════ Sticky Bottom Tracker ═══════ */}
      {userEntry && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.5 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-2xl border-t border-white/[0.06]"
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Rank</span>
                <motion.span
                  key={absoluteUserIndex}
                  initial={{ scale: 1.5, color: '#a855f7' }}
                  animate={{ scale: 1, color: '#fff' }}
                  className="text-2xl font-black italic tracking-tighter"
                >
                  #{absoluteUserIndex + 1}
                </motion.span>
              </div>
              <div className="hidden md:block h-8 w-px bg-white/[0.06]" />
              <div className="hidden md:flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center text-[10px] font-black text-purple-300 uppercase ring-1 ring-purple-500/25">
                  {userEntry.github_username?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{userEntry.github_username}</h3>
                  <span className="text-[7px] bg-purple-500 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-widest">You</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden md:block text-right">
                <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Solved</p>
                <p className="font-mono font-bold text-white text-lg">{userEntry.solvedCount || 0}<span className="text-gray-700">/{allTasks.length}</span></p>
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Penalty</p>
                <p className="font-mono text-gray-400 text-sm tabular-nums">{formatTimeFull(userEntry.totalPenaltySeconds || userEntry.total_time || 0)}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] text-purple-400 font-bold uppercase tracking-[0.15em]">Score</p>
                <motion.p
                  key={userEntry.computedScore}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className="font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400"
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
