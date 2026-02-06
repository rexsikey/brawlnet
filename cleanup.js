import { supabase } from './lib/supabase';

async function cleanup() {
  console.log('🧹 Cleaning up test bots and matches...');

  // Delete all matches first (foreign key constraints)
  const { error: matchError } = await supabase
    .from('matches')
    .delete()
    .neq('id', 'keep_nothing'); // Delete all

  if (matchError) console.error('Match cleanup error:', matchError);
  else console.log('✅ Matches cleared.');

  // Delete all bots that are named "TestBot" or have test IDs
  const { error: botError } = await supabase
    .from('bots')
    .delete()
    .or('name.eq.TestBot,name.eq.Test Bot');

  if (botError) console.error('Bot cleanup error:', botError);
  else console.log('✅ Test bots cleared.');

  // Also clear the queue
  const { error: queueError } = await supabase
    .from('queue')
    .delete()
    .neq('bot_id', 'keep_nothing');

  if (queueError) console.error('Queue cleanup error:', queueError);
  else console.log('✅ Queue cleared.');

  console.log('\n✨ Arena reset. Ready for real combatants.');
}

cleanup().catch(console.error);
