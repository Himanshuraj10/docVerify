// Supabase Client Configuration for Project: qplrpyjfxiddhezjutqa
export const SUPABASE_PROJECT_ID = 'qplrpyjfxiddhezjutqa';
export const SUPABASE_URL = 'https://qplrpyjfxiddhezjutqa.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Hx3PofzCvtAvwy_W4qWovQ_BSSlTMz6';

export const supabaseConfig = {
  projectId: SUPABASE_PROJECT_ID,
  url: SUPABASE_URL,
  apiKey: SUPABASE_PUBLISHABLE_KEY,
  headers: {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    'Content-Type': 'application/json'
  }
};
