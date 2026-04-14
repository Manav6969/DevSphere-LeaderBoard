'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, History, Github, CheckCircle2, User, LayoutList } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'

const Leaderboard = dynamic(() => import('@/components/Leaderboard'), {
  loading: () => <div className="h-96 flex items-center justify-center bg-white/5 rounded-2xl animate-pulse text-gray-500">Loading Leaderboard...</div>
})
const SubmissionsList = dynamic(() => import('@/components/SubmissionsList'), {
  loading: () => <div className="h-96 flex items-center justify-center bg-white/5 rounded-2xl animate-pulse text-gray-500">Loading Submissions...</div>
})
const AllTasks = dynamic(() => import('@/components/AllTasks'), {
  loading: () => <div className="h-96 flex items-center justify-center bg-white/5 rounded-2xl animate-pulse text-gray-500">Loading Tasks...</div>
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
          const [lbRes, subRes, tasksRes, allCompRes, eventTimeRes] = await Promise.all([
            supabase.from('leaderboard').select('id, github_username, total_points, total_time, tasks_completed').order('total_points', { ascending: false }).order('total_time', { ascending: true }),
            supabase.from('task_completions').select('id, status, created_at, profile_id, profiles(email, github_username), tasks(title, difficulty, points, task_name, github_identifier)').order('created_at', { ascending: false }).limit(100),
            supabase.from('tasks').select('id, title, difficulty, points, github_identifier, task_url, task_name').order('title').order('difficulty'),
            supabase.from('task_completions').select('id, profile_id, task_id, status, created_at, payload').eq('status', 'valid'),
            fetch('/api/event-start-time').then(r => r.json()).catch(() => ({ event_start_time: null }))
          ])
          setLeaderboard(lbRes.data || [])
          setSubmissions(subRes.data || [])
          setTasks(tasksRes.data || [])
          setAllCompletions(allCompRes.data || [])
          if (eventTimeRes.event_start_time) {
            setEventStartTime(new Date(eventTimeRes.event_start_time))
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
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      {/* Animated orbs for loading */}
      <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-purple-600/20 rounded-full blur-[120px] mesh-orb-1" />
      <div className="absolute bottom-1/4 right-1/3 w-48 h-48 bg-blue-600/15 rounded-full blur-[100px] mesh-orb-2" />
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="w-14 h-14 border-[3px] border-purple-500/10 border-t-purple-500 rounded-full animate-spin" />
          <div className="absolute inset-0 w-14 h-14 bg-purple-500/10 rounded-full blur-xl animate-pulse-glow" />
        </div>
        <p className="text-gray-500 text-sm font-medium tracking-wider uppercase animate-pulse">Loading DevSphere...</p>
      </div>
    </div>
  )

  const tabs = [
    { key: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { key: 'submissions', label: 'Activity', icon: History },
    { key: 'tasks', label: 'Tasks', icon: LayoutList },
    ...(user ? [{ key: 'mytasks', label: 'My Tasks', icon: CheckCircle2 }] : []),
  ]

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden noise-overlay">
      {/* ═══ Animated mesh background ═══ */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-600/[0.07] rounded-full blur-[150px] mesh-orb-1" />
        <div className="absolute top-[30%] right-[-10%] w-[400px] h-[400px] bg-blue-600/[0.05] rounded-full blur-[130px] mesh-orb-2" />
        <div className="absolute bottom-[-10%] left-[30%] w-[450px] h-[450px] bg-indigo-600/[0.06] rounded-full blur-[140px] mesh-orb-3" />
        {/* Radial vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_70%,rgba(0,0,0,0.8)_100%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 md:pt-8 md:pb-12 relative z-10">
        {/* ═══ Premium Tab Switcher ═══ */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex glass rounded-2xl p-1.5 gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setTab(tab.key)}
                  className={cn(
                    "relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2",
                    isActive 
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/20" 
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTabGlow"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 -z-10"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ═══ Tab Content ═══ */}
        <AnimatePresence mode="wait">
          {activeTab === 'leaderboard' ? (
            <motion.div key="leaderboard" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              <Leaderboard data={leaderboard} tasks={tasks} completions={allCompletions} eventStartTime={eventStartTime} currentProfileId={user?.id} highlightUsername={registeredUsername} />
            </motion.div>
          ) : activeTab === 'submissions' ? (
            <motion.div key="submissions" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              <SubmissionsList submissions={submissions} isAdmin={false} />
            </motion.div>
          ) : activeTab === 'mytasks' && user ? (
            <motion.div key="mytasks" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              <SubmissionsList submissions={submissions.filter(s => s.profile_id === user.id)} isAdmin={false} />
            </motion.div>
          ) : activeTab === 'tasks' ? (
            <motion.div key="tasks" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              <AllTasks tasks={tasks} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}
