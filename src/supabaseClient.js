import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pjeevpeypwlgkxuhfnsb.supabase.co'
const supabaseKey = 'sb_publishable_SlPhZc8JqAwhy6UjuI0PPw_m5Vh2onc'

export const supabase = createClient(supabaseUrl, supabaseKey)
