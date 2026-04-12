'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, History, Github, CheckCircle2, User } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'

const Leaderboard = dynamic(() => import('@/components/Leaderboard'), {
  loading: () => <div className="h-96 flex items-center justify-center bg-white/5 rounded-2xl animate-pulse text-gray-500">Loading Leaderboard...</div>
})
const SubmissionsList = dynamic(() => import('@/components/SubmissionsList'), {
  loading: () => <div className="h-96 flex items-center justify-center bg-white/5 rounded-2xl animate-pulse text-gray-500">Loading Submissions...</div>
})
import Link from 'next/link'

export default function RootPage() {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'leaderboard'
  const router = useRouter()

  const [leaderboard, setLeaderboard] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [tasks, setTasks] = useState([])
  const [allCompletions, setAllCompletions] = useState([])
  const [eventStartTime, setEventStartTime] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [registeredUsername, setRegisteredUsername] = useState(null)

  useEffect(() => {
    const fetchData = async (isInitial = true) => {
      if (isInitial) setLoading(true)

      // Parallelize: Auth Session + Main Data Fetch
      const [sessionPromise, _] = await Promise.all([
        supabase.auth.getSession(),
        (async () => {
          const [lbRes, subRes, tasksRes, allCompRes, settingsRes] = await Promise.all([
            supabase.from('leaderboard').select('id, github_username, total_points, total_time, tasks_completed').order('total_points', { ascending: false }).order('total_time', { ascending: true }),
            supabase.from('task_completions').select('id, status, created_at, profile_id, profiles(email, github_username), tasks(title, difficulty, points)').order('created_at', { ascending: false }).limit(100),
            supabase.from('tasks').select('id, title, difficulty, points, github_identifier').order('title').order('difficulty'),
            supabase.from('task_completions').select('id, profile_id, task_id, status, created_at, payload').eq('status', 'valid'),
            supabase.from('settings').select('value').eq('key', 'event_start_time').maybeSingle()
          ])
          setLeaderboard(lbRes.data || [])
          setSubmissions(subRes.data || [])
          setTasks(tasksRes.data || [])
          setAllCompletions(allCompRes.data || [])
          if (settingsRes.error) console.warn('Settings fetch warning:', settingsRes.error.message)
          if (settingsRes.data?.value) {
            setEventStartTime(new Date(settingsRes.data.value))
          } else {
            console.warn('Event start time not found in settings, using fallback')
          }
        })()
      ])

      const user = sessionPromise.data.session?.user
      setUser(user)

      const storedUsername = localStorage.getItem('devsphere_github_username')
      setRegisteredUsername(storedUsername)

      if (user) {
        // Parallelize Admin and Profile checks
        const [adminRes, profileRes] = await Promise.all([
          supabase.from('admins').select('email').eq('email', user.email).maybeSingle(),
          supabase.from('profiles').select('github_username').eq('id', user.id).single()
        ])

        if (adminRes.data) setIsAdmin(true)
        else if (!profileRes.data?.github_username) {
          router.push('/onboarding')
          return
        }
      }

      if (isInitial) setLoading(false)
    }

    fetchData()

    // Realtime subscription — only refresh data that changes
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_completions' }, () => {
        fetchData(false)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router, searchParams]) // Added missing dependencies

  const setTab = (tab) => {
    router.push(`/?tab=${tab}`)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
        <p className="text-gray-400 font-medium animate-pulse">Loading DevSphere...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-16 pb-12 md:pt-24 md:pb-20">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50"
          >
            DevSphere <span className="text-purple-500">Leaderboard</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10"
          >
            Compete with top developers, solve challenges, and climb the ranks in the ultimate coding arena.
          </motion.p>

          {/* Only show to non-admin authenticated users or logged-out visitors */}
          {!isAdmin && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-12 max-w-sm mx-auto"
            >
              <Link
                href={user ? "/onboarding" : "/login"}
                className={cn(
                  "w-full font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-lg shadow-2xl active:scale-95 group",
                  user ? "bg-white/5 border border-white/10 text-white hover:bg-white/10 shadow-purple-500/5" : "bg-white text-black hover:bg-neutral-200 shadow-white/5"
                )}
              >
                {user ? (
                  <>
                    <User className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
                    Change GitHub Username
                  </>
                ) : (
                  <>
                    <Github className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                    Join the Competition
                  </>
                )}
              </Link>
              <p className="mt-4 text-gray-500 text-sm font-medium">
                {user ? "Update your linked GitHub identity." : "Sign in to start climbing the leaderboard."}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-xl">
            <button
              onClick={() => setTab('leaderboard')}
              className={cn(
                "px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
                activeTab === 'leaderboard' ? "bg-white text-black shadow-lg" : "text-gray-400 hover:text-white"
              )}
            >
              <Trophy className="w-4 h-4" />
              Leaderboard
            </button>
            <button
              onClick={() => setTab('submissions')}
              className={cn(
                "px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
                activeTab === 'submissions' ? "bg-white text-black shadow-lg" : "text-gray-400 hover:text-white"
              )}
            >
              <History className="w-4 h-4" />
              Recent Activity
            </button>
            {user && (
              <button
                onClick={() => setTab('mytasks')}
                className={cn(
                  "px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
                  activeTab === 'mytasks' ? "bg-white text-black shadow-lg" : "text-gray-400 hover:text-white"
                )}
              >
                <CheckCircle2 className="w-4 h-4" />
                My Tasks
              </button>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'leaderboard' ? (
            <motion.div key="leaderboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Leaderboard data={leaderboard} tasks={tasks} completions={allCompletions} eventStartTime={eventStartTime} currentProfileId={user?.id} highlightUsername={registeredUsername} />
            </motion.div>
          ) : activeTab === 'submissions' ? (
            <motion.div key="submissions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <SubmissionsList submissions={submissions} isAdmin={false} />
            </motion.div>
          ) : activeTab === 'mytasks' && user ? (
            <motion.div key="mytasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <SubmissionsList submissions={submissions.filter(s => s.profile_id === user.id)} isAdmin={false} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}
