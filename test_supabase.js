import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pjeevpeypwlgkxuhfnsb.supabase.co'
const supabaseKey = 'sb_publishable_SlPhZc8JqAwhy6UjuI0PPw_m5Vh2onc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
  try {
    console.log('🔍 Testing Supabase connection...\n')
    
    // Try to fetch articles
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .limit(5)
    
    if (error) {
      console.log('❌ Error connecting to articles table:')
      console.log(error.message)
      return
    }
    
    console.log('✅ Successfully connected to Supabase!')
    console.log(`✅ 'articles' table exists`)
    console.log(`📊 Articles found: ${data?.length || 0}`)
    
    if (data && data.length > 0) {
      console.log('\n📝 Sample article:')
      console.log(JSON.stringify(data[0], null, 2))
    } else {
      console.log('\n⚠️  Table exists but is empty. No articles added yet.')
    }
    
  } catch (err) {
    console.log('❌ Connection failed:', err.message)
  }
}

checkTables()
