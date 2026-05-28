import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://frsvrgojdttnajxdakxv.supabase.co"
const SUPABASE_KEY = "sb_publishable_glqqufYmNPaPVrt3Ar23-A_nUXAh-Gr"

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export async function dbLoad(key, def) {
  try {
    const { data, error } = await supabase
      .from('msp_store')
      .select('value')
      .eq('key', key)
      .single()
    if (error || !data) return def
    return JSON.parse(data.value)
  } catch {
    return def
  }
}

export async function dbSave(key, value) {
  try {
    await supabase
      .from('msp_store')
      .upsert({ key, value: JSON.stringify(value) }, { onConflict: 'key' })
  } catch(e) {
    console.error('dbSave error:', e)
  }
}
