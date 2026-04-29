import { supabase } from './supabase';

// ── Load a user's full budget state from Supabase ──────────────
export async function loadBudgetState(userId) {
  const { data, error } = await supabase
    .from('budget_state')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = "no rows returned" — normal for first login
    console.error('Error loading budget state:', error);
    return null;
  }
  return data || null;
}

// ── Save (upsert) a user's full budget state to Supabase ───────
export async function saveBudgetState(userId, state) {
  const { error } = await supabase
    .from('budget_state')
    .upsert({
      user_id:           userId,
      income:            state.income            || 0,
      available_balance: state.available_balance || 0,
      transactions:      state.transactions      || [],
      profile_data:      { 
        ...(state.profile_data || {}), 
        investments: state.investments || 0, 
        fd:          state.fd          || 0,
        savings:     state.savings     || 0,
        loans:       state.loans       || []
      },
      updated_at:        new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) console.error('Error saving budget state:', error);
}

// ── Load user profile from Supabase profiles table ─────────────
export async function loadProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) { console.error('Error loading profile:', error); return null; }
  return data;
}

// ── Save profile data (name updates etc.) ──────────────────────
export async function saveProfile(userId, profileData) {
  const { error } = await supabase
    .from('profiles')
    .update({ name: profileData.name, avatar_url: profileData.avatar_url })
    .eq('id', userId);

  if (error) console.error('Error saving profile:', error);
}
