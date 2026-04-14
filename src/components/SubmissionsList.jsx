'use client'

import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export default function SubmissionsList({ submissions, isAdmin, onToggleStatus }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">User</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Task</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Difficulty</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Points</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
              {isAdmin && <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {submissions.map((sub) => (
              <tr key={sub.id} className="group hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-white">{sub.profiles?.github_username || 'Anonymous'}</p>
                  <p className="text-[10px] text-gray-500">{sub.profiles?.email || '—'}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-300 font-bold">{sub.tasks?.task_name || sub.tasks?.github_identifier || '—'}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">{sub.tasks?.title || '—'}</p>
                  <p className="text-[10px] text-gray-500">{new Date(sub.created_at).toLocaleString()}</p>
                </td>
                <td className="px-6 py-4 text-xs font-medium uppercase">
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full border",
                    sub.tasks?.difficulty === 'easy' ? "text-green-400 border-green-400/20 bg-green-400/5" :
                    sub.tasks?.difficulty === 'medium' ? "text-yellow-400 border-yellow-400/20 bg-yellow-400/5" :
                    "text-red-400 border-red-400/20 bg-red-400/5"
                  )}>
                    {sub.tasks?.difficulty || '—'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-purple-400">+{sub.tasks?.points ?? sub.tasks?.score ?? 0}</td>
                <td className="px-6 py-4">
                  <div className={cn(
                    "flex items-center gap-1.5 text-xs font-semibold",
                    sub.status === 'valid' ? "text-blue-400" : "text-red-400"
                  )}>
                    {sub.status === 'valid' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {sub.status === 'valid' ? 'Valid' : 'Invalidated'}
                  </div>
                </td>
                {isAdmin && (
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onToggleStatus(sub.id, sub.status)}
                      className={cn(
                        "text-[10px] font-bold uppercase py-1.5 px-3 rounded-lg border transition-all inline-flex items-center gap-2 shadow-sm",
                        sub.status === 'valid' 
                          ? "border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500 shadow-red-900/10" 
                          : "border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400"
                      )}
                      title={sub.status === 'valid' ? "Invalidate this task (e.g. for cheating)" : "Restore this task"}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      {sub.status === 'valid' ? 'Invalidate' : 'Valid'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {submissions.length === 0 && (
          <div className="text-center p-12 text-gray-500">
            No submissions yet.
          </div>
        )}
      </div>
    </motion.div>
  )
}
