import { createClient as supabaseCreateClient } from "@supabase/supabase-js"

// Re-export createClient for use in other files
export { supabaseCreateClient as createClient }

// Create a single supabase client for the server
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!

export const supabase = supabaseCreateClient(supabaseUrl, supabaseKey)

// Create a client-side singleton to prevent multiple instances
let clientSingleton: ReturnType<typeof supabaseCreateClient> | null = null

export function createClientComponentClient() {
  if (clientSingleton) return clientSingleton

  clientSingleton = supabaseCreateClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  return clientSingleton
}
