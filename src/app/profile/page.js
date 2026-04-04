'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { User, Github, LogOut, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [githubUsername, setGithubUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Check for admin status - Redirect admins to hub
      const { data: isAdmin } = await supabase
        .from('admins')
        .select('email')
        .eq('email', user.email)
        .single()
      
      if (isAdmin) {
        router.push('/admin')
        return
      }

      setUser(user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileData) {
        setProfile(profileData)
        setGithubUsername(profileData.github_username || '')
      }
      setLoading(false)
    }

    fetchData()
  }, [router])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setUpdating(true)
    setMessage(null)

    const { error } = await supabase
      .from('profiles')
      .update({ github_username: githubUsername })
      .eq('id', user.id)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'GitHub username updated successfully!' })
      // Update local state highlighting
      localStorage.setItem('devsphere_github_username', githubUsername)
    }
    setUpdating(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('devsphere_github_username')
    router.push('/')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
    </div>
  )

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px]" />

      <div className="max-w-xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 md:p-10 backdrop-blur-2xl"
        >
          {/* Header */}
          <div className="flex items-center gap-6 mb-10 pb-10 border-b border-neutral-800">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center border border-white/10 shadow-2xl shadow-purple-500/20">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest mb-1.5 ring-1 ring-purple-500/20 px-2 py-0.5 rounded-full inline-block">Registered Participant</p>
              <h1 className="text-2xl font-black text-white italic tracking-tight">{user.email}</h1>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleUpdate} className="space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">GitHub Connection</label>
              <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-600 font-mono text-sm group-focus-within:text-purple-500/50 transition-colors">github.com/</span>
                <input
                  type="text"
                  required
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  placeholder="username"
                  className="w-full bg-black/50 border border-neutral-800 rounded-2xl py-5 pl-[105px] pr-5 text-white font-mono tracking-tight focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-lg"
                />
              </div>
              <p className="text-[11px] text-neutral-600 px-1 leading-relaxed">
                Your ranking on the leaderboard is linked to this handle. Changes take effect on your next contribution.
              </p>
            </div>

            {message && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "p-5 rounded-2xl text-sm font-semibold flex items-center gap-3 border shadow-lg",
                  message.type === 'success' 
                    ? "bg-green-500/10 text-green-400 border-green-500/20 shadow-green-500/5" 
                    : "bg-red-500/10 text-red-400 border-red-500/20 shadow-red-500/5"
                )}
              >
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                {message.text}
              </motion.div>
            )}

            <div className="space-y-4 pt-4">
              <button
                type="submit"
                disabled={updating || githubUsername === profile?.github_username}
                className="w-full bg-white text-black font-black py-5 rounded-2xl hover:bg-neutral-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg shadow-xl shadow-white/5 active:scale-95"
              >
                {updating ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Apply Changes'}
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-red-400 hover:border-red-500/30 font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-sm group"
              >
                <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Sign Out from Session
              </button>
            </div>
          </form>
        </motion.div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-neutral-700 font-bold uppercase tracking-[0.3em]">DevSphere • Participant Control Panel</p>
        </div>
      </div>
    </div>
  )
}
