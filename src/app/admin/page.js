'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, History, ShieldCheck, LayoutGrid, Settings, Plus, Trash2, Edit2, Save, X, Clock, AlertTriangle } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import SubmissionsList from '@/components/SubmissionsList'

// --- COMPONENTS ---

function TaskManagement({ tasks, onUpdate }) {
  const [editingId, setEditingId] = useState(null)
  const [newForm, setNewForm] = useState({ github_identifier: '', task_name: '', title: '', difficulty: 'medium', points: 0, task_url: '' })
  const [editForm, setEditForm] = useState({})

  const handleCreate = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('tasks').insert(newForm)
    if (error) alert(error.message)
    else {
      setNewForm({ github_identifier: '', task_name: '', title: '', difficulty: 'medium', points: 0, task_url: '' })
      onUpdate()
    }
  }

  const handleUpdate = async (id) => {
    const { error } = await supabase.from('tasks').update(editForm).eq('id', id)
    if (error) alert(error.message)
    else {
      setEditingId(null)
      onUpdate()
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) alert(error.message)
    else onUpdate()
  }

  return (
    <div className="space-y-8">
      {/* Create New Task */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 relative overflow-hidden group"
      >
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
        <h2 className="text-lg font-black text-white mb-6 flex items-center gap-2 uppercase tracking-wider">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <Plus className="w-5 h-5 text-green-400" />
          </div>
          Create New Task
        </h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text" required
            placeholder="GitHub ID (e.g. repo name)"
            className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all hover:bg-white/[0.05]"
            value={newForm.github_identifier}
            onChange={(e) => setNewForm({ ...newForm, github_identifier: e.target.value })}
          />
          <input
            type="text" required
            placeholder="Display Name (e.g. My Awesome Task)"
            className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all hover:bg-white/[0.05]"
            value={newForm.task_name}
            onChange={(e) => setNewForm({ ...newForm, task_name: e.target.value })}
          />
          <select
            required
            className={cn(
              "bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none w-full focus:ring-2 focus:ring-purple-500 transition-all hover:bg-white/[0.05]",
              newForm.title === 'web' ? "text-blue-400" :
              newForm.title === 'app' ? "text-emerald-400" :
              newForm.title === 'ml' ? "text-purple-400" :
              newForm.title === 'foss' ? "text-orange-400" : "text-white"
            )}
            value={newForm.title}
            onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
          >
            <option className="bg-neutral-950 text-white" value="" disabled>Select Type</option>
            <option className="bg-neutral-950 text-blue-400" value="web">Web Development</option>
            <option className="bg-neutral-950 text-emerald-400" value="app">App Development</option>
            <option className="bg-neutral-950 text-purple-400" value="ml">Machine Learning</option>
            <option className="bg-neutral-950 text-orange-400" value="foss">FOSS</option>
          </select>
          <div className="flex gap-2">
            <select
              className={cn(
                "bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm flex-1 outline-none focus:ring-2 focus:ring-purple-500 transition-all hover:bg-white/[0.05]",
                newForm.difficulty === 'easy' ? "text-green-400" :
                newForm.difficulty === 'medium' ? "text-yellow-400" :
                newForm.difficulty === 'hard' ? "text-red-400" : "text-white"
              )}
              value={newForm.difficulty}
              onChange={(e) => setNewForm({ ...newForm, difficulty: e.target.value })}
            >
              <option className="bg-neutral-950 text-green-400" value="easy">Easy</option>
              <option className="bg-neutral-950 text-yellow-400" value="medium">Medium</option>
              <option className="bg-neutral-950 text-red-400" value="hard">Hard</option>
            </select>
            <input
              type="number" required
              placeholder="Points"
              className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white w-24 focus:ring-2 focus:ring-purple-500 outline-none transition-all hover:bg-white/[0.05]"
              value={newForm.points}
              onChange={(e) => setNewForm({ ...newForm, points: parseInt(e.target.value) })}
            />
          </div>
          <button type="submit" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-xl px-6 py-3 transition-all text-sm shadow-xl shadow-purple-900/40 active:scale-95">
            ADD TASK
          </button>
          <input
            type="url"
            placeholder="Task URL (GitHub Repository Link)"
            className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none md:col-span-4 transition-all hover:bg-white/[0.05]"
            value={newForm.task_url}
            onChange={(e) => setNewForm({ ...newForm, task_url: e.target.value })}
          />
        </form>
      </motion.div>

      {/* Task List */}
      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <motion.div 
              layout
              key={task.id} 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className={cn(
                "glass rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all",
                editingId === task.id ? "ring-2 ring-purple-500/50 bg-white/[0.06]" : "hover:bg-white/[0.05]"
              )}
            >
              {editingId === task.id ? (
                <>
                  <div className="flex flex-col gap-4 flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <select
                        className={cn(
                          "bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500",
                          editForm.title === 'web' ? "text-blue-400" :
                          editForm.title === 'app' ? "text-emerald-400" :
                          editForm.title === 'ml' ? "text-purple-400" :
                          editForm.title === 'foss' ? "text-orange-400" : "text-white"
                        )}
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      >
                        <option className="bg-neutral-950 text-blue-400" value="web">Web</option>
                        <option className="bg-neutral-950 text-emerald-400" value="app">App</option>
                        <option className="bg-neutral-950 text-purple-400" value="ml">ML</option>
                        <option className="bg-neutral-950 text-orange-400" value="foss">FOSS</option>
                      </select>
                      <select
                        className={cn(
                          "bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500",
                          editForm.difficulty === 'easy' ? "text-green-400" :
                          editForm.difficulty === 'medium' ? "text-yellow-400" :
                          editForm.difficulty === 'hard' ? "text-red-400" : "text-white"
                        )}
                        value={editForm.difficulty}
                        onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}
                      >
                        <option className="bg-neutral-950 text-green-400" value="easy">Easy</option>
                        <option className="bg-neutral-950 text-yellow-400" value="medium">Medium</option>
                        <option className="bg-neutral-950 text-red-400" value="hard">Hard</option>
                      </select>
                      <div className="relative group">
                        <input
                          type="number"
                          className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-purple-500 w-full"
                          value={editForm.points}
                          onChange={(e) => setEditForm({ ...editForm, points: parseInt(e.target.value) })}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-500 group-focus-within:text-purple-400">PTS</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Repo Name (e.g. task-1)"
                        className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-purple-500 w-full"
                        value={editForm.github_identifier || ''}
                        onChange={(e) => setEditForm({ ...editForm, github_identifier: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Display Name"
                        className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-purple-500 w-full"
                        value={editForm.task_name || ''}
                        onChange={(e) => setEditForm({ ...editForm, task_name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <input
                        type="url"
                        placeholder="Task Repository URL"
                        className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-purple-500 w-full"
                        value={editForm.task_url || ''}
                        onChange={(e) => setEditForm({ ...editForm, task_url: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleUpdate(task.id)} 
                      className="p-3 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-xl transition-all active:scale-95 shadow-lg shadow-green-900/10"
                    >
                      <Save className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setEditingId(null)} 
                      className="p-3 bg-white/5 text-gray-400 hover:bg-white/10 rounded-xl transition-all active:scale-95"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn(
                        "p-2 rounded-lg bg-white/5",
                        task.title === 'web' ? "text-blue-400" :
                        task.title === 'app' ? "text-emerald-400" :
                        task.title === 'ml' ? "text-purple-400" : "text-orange-400"
                      )}>
                        <LayoutGrid className="w-4 h-4" />
                      </div>
                      <h3 className="font-black text-white tracking-tight text-lg">{task.task_name || task.github_identifier}</h3>
                      <span className="text-[10px] text-gray-500 font-mono">({task.github_identifier})</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{task.title}</p>
                      <span className={cn(
                        "text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border shadow-sm",
                        task.difficulty === 'easy' ? "text-green-400 border-green-500/20 bg-green-500/10" :
                        task.difficulty === 'medium' ? "text-yellow-400 border-yellow-500/20 bg-yellow-400/10" :
                        "text-red-400 border-red-500/20 bg-red-500/10"
                      )}>
                        {task.difficulty}
                      </span>
                      {task.task_url && (
                        <a 
                          href={task.task_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[10px] font-black text-purple-400 hover:text-purple-300 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 transition-colors"
                        >
                          REPO ↗
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-2xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">+{task.points}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Points</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(task.id)
                          setEditForm(task)
                        }}
                        className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all active:scale-95"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="p-3 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all active:scale-95"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

function EventSettings({ onUpdate }) {
  const [startTime, setStartTime] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'event_start_time')
        .single()
      
      if (data) {
        const date = new Date(data.value)
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
        setStartTime(localDate)
      }
      setLoading(false)
    }
    fetchSettings()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('settings')
      .upsert({ key: 'event_start_time', value: new Date(startTime).toISOString() })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Settings saved successfully!' })
      onUpdate()
    }
    setSaving(false)
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>

  return (
    <div className="max-w-3xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
      <form onSubmit={handleSave} className="space-y-8">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            Event Start Time
          </label>
          <input
            type="datetime-local"
            required
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:ring-4 focus:ring-purple-500/20 outline-none transition-all placeholder:text-gray-600 text-lg"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <p className="mt-4 text-xs text-gray-500 flex items-start gap-2 leading-relaxed">
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />
            Changing this will affect the relative time calculations for the entire leaderboard. Existing submission timestamps are kept, but their offset from start will change.
          </p>
        </div>

        {message && (
          <div className={cn(
            "p-4 rounded-2xl text-sm font-semibold border",
            message.type === 'success' ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
          )}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-white text-black font-black py-5 rounded-2xl hover:bg-neutral-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg shadow-2xl shadow-white/5"
        >
          {saving ? 'Saving Changes...' : 'Update Global Settings'}
          <Save className="w-5 h-5" />
        </button>
      </form>
    </div>
  )
}

// --- MAIN PAGE ---

function AdminDashboardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get('tab') || 'submissions'
  const [isAdmin, setIsAdmin] = useState(false)
  const [tasks, setTasks] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: adminRecord } = await supabase
      .from('admins')
      .select('email')
      .eq('email', user.email)
      .single()

    if (!adminRecord) {
      router.push('/')
      return
    }
    setIsAdmin(true)

    // Parallel fetches
    const [tasksRes, subRes] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('task_completions').select(`
        *,
        profiles (email, github_username),
        tasks (title, difficulty, points)
      `).order('created_at', { ascending: false })
    ])

    setTasks(tasksRes.data || [])
    setSubmissions(subRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [router])

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'valid' ? 'invalidated' : 'valid'
    const { error } = await supabase
      .from('task_completions')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) alert(error.message)
    else fetchData()
  }

  const setTab = (tab) => {
    router.push(`/admin?tab=${tab}`)
  }

  // Filter Submissions
  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = sub.profiles?.github_username?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || sub.tasks?.title === categoryFilter
    return matchesSearch && matchesCategory
  })

  if (loading) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
        <p className="text-gray-400 font-medium animate-pulse">Initializing Admin Hub...</p>
      </div>
    </div>
  )

  if (!isAdmin) return null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3" />
            System Control
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white">
            Admin <span className="text-purple-400">Hub</span>
          </h1>
          <p className="text-gray-500 text-sm font-medium">Manage tasks, review participant activity, and configure event parameters.</p>
        </div>

        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl shrink-0">
          <button
            onClick={() => setTab('submissions')}
            className={cn(
              "px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'submissions' ? "bg-white text-black shadow-xl" : "text-gray-500 hover:text-white"
            )}
          >
            <History className="w-4 h-4" />
            Submissions
          </button>
          <button
            onClick={() => setTab('tasks')}
            className={cn(
              "px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'tasks' ? "bg-white text-black shadow-xl" : "text-gray-500 hover:text-white"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            Tasks
          </button>
          <button
            onClick={() => setTab('settings')}
            className={cn(
              "px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'settings' ? "bg-white text-black shadow-xl" : "text-gray-500 hover:text-white"
            )}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'submissions' && (
            <div className="space-y-6">
              {/* Search & Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search by GitHub username..."
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  disabled={loading}
                  className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all md:w-48 appearance-none cursor-pointer"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="web">Web</option>
                  <option value="app">App</option>
                  <option value="ml">ML</option>
                  <option value="foss">FOSS</option>
                </select>
              </div>
              <SubmissionsList submissions={filteredSubmissions} isAdmin={true} onToggleStatus={handleToggleStatus} />
            </div>
          )}
          {activeTab === 'tasks' && (
            <TaskManagement tasks={tasks} onUpdate={fetchData} />
          )}
          {activeTab === 'settings' && (
            <EventSettings onUpdate={fetchData} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default function AdminHub() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminDashboardContent />
    </Suspense>
  )
}
