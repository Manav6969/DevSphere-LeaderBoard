'use client'

import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { LogOut, User, Trophy, LayoutGrid, Zap } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export default function Navbar({ user }) {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (user) {
      const checkAdmin = async () => {
        const { data } = await supabase
          .from('admins')
          .select('email')
          .eq('email', user.email)
          .single()
        if (data) setIsAdmin(true)
      }
      checkAdmin()
    } else {
      setIsAdmin(false)
    }
  }, [user])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('devsphere_github_username')
    window.location.href = '/'
  }

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled 
          ? "bg-black/70 backdrop-blur-2xl border-b border-white/[0.06] shadow-2xl shadow-purple-900/5" 
          : "bg-transparent backdrop-blur-sm"
      )}
    >
      {/* Gradient line at very top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative">
                <Zap className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
                <div className="absolute inset-0 w-5 h-5 bg-purple-500/30 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-xl font-black tracking-tight">
                <span className="text-white">Dev</span>
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Sphere</span>
              </span>
            </Link>
            
            <div className="hidden md:flex items-center gap-1">
              <Link href="/" className="px-4 py-2 text-gray-300 hover:text-white transition-colors flex items-center gap-2 text-sm font-semibold rounded-lg hover:bg-white/[0.04]">
                <Trophy className="w-4 h-4" />
                Leaderboard
              </Link>
              {!user && (
                <Link href="/login" className="px-4 py-2 text-gray-500 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium rounded-lg hover:bg-white/[0.04]">
                  Participate
                </Link>
              )}
              {user && (
                <Link 
                  href={isAdmin ? "/admin" : "/profile"} 
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                    isAdmin 
                      ? "text-purple-400 hover:text-purple-300 hover:bg-purple-500/10" 
                      : "text-gray-300 hover:text-white hover:bg-white/[0.04]"
                  )}
                >
                  {isAdmin ? <LayoutGrid className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  {isAdmin ? 'Admin' : 'Profile'}
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-sm font-bold text-white/90 tracking-tight">{user.email}</span>
                  <span className={cn(
                    "text-[10px] uppercase tracking-widest font-black",
                    isAdmin ? "text-purple-400" : "text-gray-600"
                  )}>
                    {isAdmin ? '⚡ Admin' : 'Participant'}
                  </span>
                </div>
                <div className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center transition-all",
                  isAdmin 
                    ? "bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-600/20 border border-purple-500/30" 
                    : "bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.15]"
                )}>
                  <User className={cn("w-4 h-4", isAdmin ? "text-white" : "text-gray-400")} />
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-600 hover:text-red-400 transition-all hover:bg-red-400/5 rounded-lg"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="relative group px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 overflow-hidden bg-white text-black hover:shadow-lg hover:shadow-white/10"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
