import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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

// Helper: Subscribe to conversation changes
export function subscribeToConversations(userId: string, callback: (payload: any) => void) {
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
  const { data } = supabase.storage
    .from('uploads')
    .getPublicUrl(filePath)
  
  return data.publicUrl
}
