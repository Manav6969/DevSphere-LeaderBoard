import { Inter } from "next/font/google";
import "./globals.css";
import { createServerClient } from "@supabase/ssr";
import { cookies } from 'next/headers'
import Navbar from '../components/Navbar'

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "DevSphere | Event Leaderboard",
  description: "Track your progress and compete with others in the DevSphere event.",
};

export default async function RootLayout({ children }) {
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
            // The `set` method was called from a Server Component.
            // This can be ignored in layouts if you have middleware or aren't actively extending sessions here.
          }
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <Navbar user={user} />
        <main className="pt-16">
          {children}
        </main>
      </body>
    </html>
  );
}
