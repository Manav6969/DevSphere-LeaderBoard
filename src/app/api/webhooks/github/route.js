import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

// Use service role key for admin-level DB access in webhooks
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const body = await req.json()
    const signature = req.headers.get('x-hub-signature-256')

    // Optional: Verify GitHub Webhook Secret if provided
    if (process.env.GITHUB_WEBHOOK_SECRET && signature) {
      const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET)
      const digest = 'sha256=' + hmac.update(JSON.stringify(body)).digest('hex')
      if (signature !== digest) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const githubUsername = body.sender?.login
    const repoIdentifier = body.repository?.full_name // e.g. "user/repo"
    const taskIdInPayload = body.task_id
    const finalIdentifier = taskIdInPayload || repoIdentifier

    // Additional identifiers for strict 3-field matching
    const taskTitle      = body.task_title   // e.g. "ml"
    const taskDifficulty = body.difficulty   // e.g. "hard"

    if (!githubUsername || !finalIdentifier) {
      return NextResponse.json({ error: 'Missing user or repository in payload' }, { status: 400 })
    }

    if (!taskTitle || !taskDifficulty) {
      return NextResponse.json({ error: 'Missing task_title or difficulty in payload' }, { status: 400 })
    }

    // 1. Find the user in our profiles table by github_username
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, score, time_taken')
      .eq('github_username', githubUsername)
      .single()

    if (profileError || !profile) {
      console.error(`User ${githubUsername} not found in DevSphere profiles. skipping.`)
      return NextResponse.json({ message: 'User not registered on platform' }, { status: 200 })
    }

    // 2. Find task — must match 3 identifiers: github_identifier, title, difficulty
    const { data: task } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('github_identifier', finalIdentifier)
      .eq('title', taskTitle)
      .eq('difficulty', taskDifficulty)
      .single()

    if (!task) {
      console.error(`Task not found for: ${finalIdentifier} / ${taskTitle} / ${taskDifficulty}`)
      return NextResponse.json({ error: 'Task not available on platform' }, { status: 404 })
    }

    // 3. Check if user already completed this task
    const { data: existingCompletion } = await supabaseAdmin
      .from('task_completions')
      .select('id')
      .eq('profile_id', profile.id)
      .eq('task_id', task.id)
      .eq('status', 'valid')
      .single()

    if (existingCompletion) {
      return NextResponse.json({ message: 'Task already completed' }, { status: 200 })
    }

    // 4. Fetch Event Start Time
    const { data: startTimeSetting } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'event_start_time')
      .single()
    
    const eventStartTime = startTimeSetting ? new Date(startTimeSetting.value) : new Date(Date.now() - 3600000) // Default 1 hour ago
    const currentTime = new Date()
    const timeTakenSeconds = Math.floor((currentTime - eventStartTime) / 1000)

    // 5. Update Profile
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({
        score: (profile.score || 0) + (task.score || task.points || 0),
        time_taken: timeTakenSeconds // This represents T_final - T_start
      })
      .eq('id', profile.id)
    
    if (profileUpdateError) throw profileUpdateError

    // 6. Record the Completion
    const { error: completionError } = await supabaseAdmin
      .from('task_completions')
      .upsert({
        profile_id: profile.id,
        task_id: task.id,
        status: 'valid',
        payload: body
      }, { onConflict: 'profile_id,task_id' })

    if (completionError) throw completionError

    return NextResponse.json({ message: 'Task completion recorded successfully' }, { status: 200 })

  } catch (err) {
    console.error('Webhook Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
