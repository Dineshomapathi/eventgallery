import { createClient } from "@supabase/supabase-js"

// Create a single supabase client for the server
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Create a client-side singleton to prevent multiple instances
let clientSingleton: ReturnType<typeof createClient> | null = null

export function createClientComponentClient() {
  if (clientSingleton) return clientSingleton

  clientSingleton = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  return clientSingleton
}
