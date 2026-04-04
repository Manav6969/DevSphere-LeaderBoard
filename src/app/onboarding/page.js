'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Github, Loader2, CheckCircle2, AlertCircle, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const [githubUsername, setGithubUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      }
    }
    checkSession()
  }, [router])

  const handleOnboarding = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Get current auth session
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Check if the username is already taken by someone else
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('github_username', githubUsername)
      .maybeSingle()

    if (existingProfile && existingProfile.id !== user.id) {
      setError('This GitHub username is already linked to another participant.')
      setLoading(false)
      return
    }

    // Update existing profile (safely upserting on ID to guarantee row existence)
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({ 
        id: user.id, 
        email: user.email,
        github_username: githubUsername 
      }, { onConflict: 'id' })

    if (upsertError) {
      setError(upsertError.message)
      setLoading(false)
    } else {
      // Store in localStorage for leaderboard highlighting
      localStorage.setItem('devsphere_github_username', githubUsername)
      setSuccess(true)
      setLoading(false)
      setTimeout(() => router.push('/'), 3000)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg p-10 rounded-3xl bg-neutral-900/50 border border-green-500/30 backdrop-blur-2xl text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-green-500/10 rounded-2xl border border-green-500/20 text-green-400">
              <CheckCircle2 className="w-12 h-12" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Linked Successfully!</h1>
          <p className="text-neutral-400 text-lg mb-8">
            Your GitHub username <span className="text-white font-mono">{githubUsername}</span> has been registered.
            Any contribution you make will now appear on the live leaderboard.
          </p>
          <p className="text-sm text-neutral-500 animate-pulse">Redirecting to leaderboard...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden px-4 py-12">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl p-10 rounded-3xl bg-neutral-900/50 border border-neutral-800 backdrop-blur-2xl relative z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20">
            <Github className="w-10 h-10 text-purple-400" />
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Join the Leaderboard</h1>
          <p className="text-neutral-400 text-lg">
            Enter your GitHub username to link your progress and compete.
          </p>
        </div>

        <form onSubmit={handleOnboarding} className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-neutral-300 ml-1 flex items-center gap-2">
                <Github className="w-4 h-4 text-neutral-500" />
                GitHub Username
              </label>
              <div className="relative group">
                <input
                  type="text"
                  placeholder="e.g. github_username"
                  required
                  className="w-full bg-black/50 border border-neutral-700 rounded-xl py-4 px-6 text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-lg font-mono tracking-tight group-hover:border-neutral-600"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                />
              </div>
              <p className="text-[11px] text-neutral-500 mt-2 italic px-1 font-medium">
                Make sure this is correct! Your points are calculated based on this handle.
              </p>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-4 text-red-400 shadow-lg shadow-red-500/5"
            >
              <AlertCircle className="w-6 h-6 shrink-0" />
              <p className="text-sm font-medium leading-relaxed">{error}</p>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading || !githubUsername}
            className="w-full bg-white text-black hover:bg-neutral-200 font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-2xl shadow-white/5 active:scale-95"
          >
            {loading ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <>
                Link GitHub Handle
                <CheckCircle2 className="w-6 h-6" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
