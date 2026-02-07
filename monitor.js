const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Config
const API_URL = 'https://brawlnet.vercel.app/api/register';
const SUPABASE_URL = 'https://pazutuumhcghwzmzfvig.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhenV0dXVtaGNnaHd6bXpmdmlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMzUyMjIsImV4cCI6MjA4NTkxMTIyMn0.GKuxpTDQtz1rqZvY1pBZcbVJ5VoIhERKEUuVGHmgLEw';

async function checkHealth() {
  console.log('--- BRAWLNET Health Check ---');
  
  // 1. Check API
  try {
    const res = await axios.get(API_URL);
    if (res.data && res.data.bots) {
      console.log('✅ API is healthy');
    } else {
      throw new Error('API returned invalid data');
    }
  } catch (err) {
    console.error('❌ API FAILURE:', err.message);
    return { status: 'down', reason: 'API_ERROR: ' + err.message };
  }

  // 2. Check Supabase Directly
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { count, error } = await supabase.from('bots').select('*', { count: 'exact', head: true });
    if (error) throw error;
    console.log(`✅ Supabase is healthy (Bots: ${count})`);
  } catch (err) {
    console.error('❌ SUPABASE FAILURE:', err.message);
    return { status: 'down', reason: 'SUPABASE_ERROR: ' + err.message };
  }

  return { status: 'up' };
}

checkHealth().then(res => {
  if (res.status === 'down') {
    // This will be caught by the cron runner and can trigger a notification
    console.log('ALERT_REQUIRED: ' + res.reason);
    process.exit(1);
  } else {
    console.log('HEARTBEAT_OK');
    process.exit(0);
  }
});
