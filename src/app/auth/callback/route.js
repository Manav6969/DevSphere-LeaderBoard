import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

    if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Domain Verification
        const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS 
          ? process.env.ALLOWED_EMAIL_DOMAINS.split(',').map(d => d.trim().toLowerCase()) 
          : []
        
        if (allowedDomains.length > 0) {
          const userDomain = user.email.split('@')[1].toLowerCase()
          if (!allowedDomains.includes(userDomain)) {
            await supabase.auth.signOut()
            return NextResponse.redirect(`${origin}/login?error=unauthorized_domain`)
          }
        }

        const { data: isAdmin } = await supabase
          .from('admins')
          .select('email')
          .eq('email', user.email)
          .single()

        if (isAdmin) {
          return NextResponse.redirect(`${origin}/admin`)
        }

        // --- Participant Logic ---
        // Force the creation of the profile row in case the DB trigger failed
        const { data: profile } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email
          }, { onConflict: 'id' })
          .select('github_username')
          .single()

        if (!profile?.github_username) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }

        return NextResponse.redirect(`${origin}/`)
      }
    }
  }

  // Redirect to error page or login page on failure
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
