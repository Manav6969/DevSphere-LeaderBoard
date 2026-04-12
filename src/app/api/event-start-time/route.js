import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'event_start_time')
      .single()

    if (error || !data) {
      return NextResponse.json({ event_start_time: null }, { status: 200 })
    }

    return NextResponse.json({ event_start_time: data.value }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ event_start_time: null }, { status: 200 })
  }
}
