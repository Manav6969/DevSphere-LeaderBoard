'use client'

import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { LogOut, User, Trophy, BarChart3, LayoutGrid, Settings } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export default function Navbar({ user }) {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)

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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              DevSphere
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-gray-200 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold">
                <Trophy className="w-4 h-4" />
                Leaderboard
              </Link>
              {!user && (
                <Link href="/login" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
                  Participate
                </Link>
              )}
              {user && (
                <Link 
                  href={isAdmin ? "/admin" : "/profile"} 
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 border shadow-sm",
                    isAdmin ? "border-purple-500/20 text-purple-400 bg-purple-500/5 hover:bg-purple-500/10" : "border-white/10 text-white bg-white/5 hover:bg-white/10"
                  )}
                >
                  {isAdmin ? <LayoutGrid className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  {isAdmin ? 'Admin Panel' : 'My Profile'}
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end hidden lg:flex">
                  <span className="text-sm font-black text-white italic tracking-tight">{user.email}</span>
                  <span className={isAdmin ? "text-[10px] text-purple-400 uppercase tracking-widest font-black" : "text-[10px] text-gray-500 uppercase tracking-widest font-black"}>
                    {isAdmin ? 'Administrator' : 'Participant'}
                  </span>
                </div>
                <div className={isAdmin ? "h-10 w-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center border border-purple-500/50 shadow-lg shadow-purple-500/20" : "h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10"}>
                  <User className={isAdmin ? "w-5 h-5 text-white" : "w-5 h-5 text-gray-400"} />
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="bg-white text-black px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-tight hover:bg-neutral-200 transition-all shadow-2xl shadow-white/5 active:scale-95"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
