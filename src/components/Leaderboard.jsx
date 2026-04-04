'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { Medal } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Leaderboard({ data, currentProfileId, highlightUsername }) {
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  const totalPages = useMemo(() => Math.ceil(data.length / ITEMS_PER_PAGE), [data.length])
  
  const paginatedData = useMemo(() => 
    data.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [data, currentPage]
  )

  const absoluteUserIndex = useMemo(() => 
    data.findIndex(entry => 
      currentProfileId === entry.id || 
      (highlightUsername && highlightUsername === entry.github_username)
    ),
    [data, currentProfileId, highlightUsername]
  )

  const userEntry = absoluteUserIndex !== -1 ? data[absoluteUserIndex] : null

  return (
    <LayoutGroup id="leaderboard">
      {/* Grid container — layout animated so it resizes when items swap */}
      <motion.div layout className="grid gap-4">

        {/* AnimatePresence tracks cards entering/exiting the page slice */}
        <AnimatePresence initial={false} mode="popLayout">
          {paginatedData.map((entry, index) => {
            const absoluteIndex = (currentPage - 1) * ITEMS_PER_PAGE + index
            const isSelf = currentProfileId === entry.id || (highlightUsername && highlightUsername === entry.github_username)

            return (
              <motion.div
                // STABLE key = Framer Motion tracks this card across re-renders
                // and animates it from old position to new position (FLIP)
                key={entry.id}

                // layout="position" = only animate XY position changes, not size
                layout="position"

                // New cards slide in from below
                initial={{ opacity: 0, y: 60, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                // Removed cards slide up and out
                exit={{ opacity: 0, y: -60, scale: 0.9, transition: { duration: 0.25 } }}

                // Swap physics — snappy spring for position changes
                transition={{
                  layout: {
                    type: 'spring',
                    stiffness: 350,
                    damping: 30,
                    mass: 0.8,
                  },
                  opacity: { duration: 0.3 },
                  scale: { type: 'spring', stiffness: 300, damping: 25 },
                  y: { type: 'spring', stiffness: 300, damping: 25 },
                }}

                whileHover={{ scale: 1.015, zIndex: 10, transition: { duration: 0.15 } }}

                className={cn(
                  "group relative p-4 md:p-6 rounded-2xl border transition-colors duration-300 flex items-center justify-between overflow-hidden cursor-default",
                  isSelf
                    ? "bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-purple-500/50 shadow-[0_0_30px_rgba(147,51,234,0.2)]"
                    : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]"
                )}
              >
                {isSelf && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 animate-pulse" />
                )}

                <div className="flex items-center gap-4 md:gap-8 relative z-10">
                  <div className="flex items-center justify-center w-12 h-12">
                    {absoluteIndex < 3 ? (
                      <div className="relative">
                        <Medal className={cn(
                          "w-10 h-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]",
                          absoluteIndex === 0 ? "text-yellow-400" : absoluteIndex === 1 ? "text-gray-300" : "text-amber-600"
                        )} />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-black/60 mt-1">
                          {absoluteIndex + 1}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xl font-black text-white/20 italic tracking-tighter">
                        {String(absoluteIndex + 1).padStart(2, '0')}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-3">
                      {entry.github_username}
                      {isSelf && (
                        <span className="text-[10px] font-black bg-white text-black px-2 py-0.5 rounded-full uppercase tracking-widest ring-4 ring-purple-500/20">You</span>
                      )}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
                        {entry.tasks_completed} Tasks
                      </span>
                      <div className="w-1 h-1 rounded-full bg-gray-700" />
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        Rank {absoluteIndex + 1}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8 relative z-10">
                  <div className="text-right">
                    <div className="mb-1">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Time</p>
                      <p className="text-sm font-mono text-gray-400">
                        {entry.total_time ? (() => {
                          const s = Math.floor(entry.total_time)
                          const h = Math.floor(s / 3600)
                          const m = Math.floor((s % 3600) / 60)
                          const sec = s % 60
                          return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
                        })() : '--:--:--'}
                      </p>
                    </div>
                    <p className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/20">
                      {entry.total_points.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-purple-400/80 uppercase tracking-[0.2em] font-black mt-0.5">Points</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={cn(
                  "w-10 h-10 rounded-lg text-sm font-bold transition-all",
                  currentPage === i + 1
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40"
                    : "bg-white/5 text-gray-400 hover:text-white"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      )}

      {/* Sticky bottom rank tracker */}
      {userEntry && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.4 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-black/80 backdrop-blur-2xl border-t border-purple-500/20 flex justify-center shadow-[0_-20px_40px_rgba(147,51,234,0.1)]"
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
                <span className="text-xs bg-white text-black px-2 py-0.5 rounded-full font-black uppercase tracking-widest">You</span>
              </div>
            </div>

            <div className="flex items-center gap-6 md:gap-10">
              <div className="hidden md:block text-right">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Tasks Done</p>
                <p className="font-mono font-bold text-white text-xl">{userEntry.tasks_completed}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-purple-400 font-bold uppercase tracking-[0.2em] mb-0.5">Total Points</p>
                <motion.p
                  key={userEntry.total_points}
                  initial={{ scale: 1.3, color: '#a855f7' }}
                  animate={{ scale: 1, color: '#c084fc' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="font-black text-3xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-300 to-blue-400"
                >
                  {userEntry.total_points.toLocaleString()}
                </motion.p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </LayoutGroup>
  )
}
