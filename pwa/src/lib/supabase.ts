import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Create client even without env vars (will fail gracefully at runtime)
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: localStorage,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null

export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey)
}

// Helper: Subscribe to conversation changes
export function subscribeToConversations(userId: string, callback: (payload: any) => void) {
  if (!supabase) return { unsubscribe: () => {} }
  return supabase
    .channel(`conversations:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe()
}

// Helper: Subscribe to message changes in a conversation
export function subscribeToMessages(conversationId: string, callback: (payload: any) => void) {
  if (!supabase) return { unsubscribe: () => {} }
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      callback
    )
    .subscribe()
}

// Helper: Upload file to Supabase Storage
export async function uploadFile(userId: string, file: File, path: string) {
  if (!supabase) throw new Error('Supabase not configured')
  const filePath = `${userId}/${path}`
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (error) throw error
  return data
}

// Helper: Get public URL for file
export function getPublicUrl(filePath: string) {
  if (!supabase) return ''
  const { data } = supabase.storage
    .from('uploads')
    .getPublicUrl(filePath)

  return data.publicUrl
}
