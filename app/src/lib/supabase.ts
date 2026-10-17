import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** null tant que le projet Supabase n'est pas configuré : l'app reste utilisable hors ligne. */
export const supabase =
  url && key
    ? createClient(url, key, {
        auth: { storage: localStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
      })
    : null;

/** Adresse de la page de signature publique (dossier `sign/`), ex. https://signer.dicta.app */
export const SIGN_URL = process.env.EXPO_PUBLIC_SIGN_URL ?? '';

if (supabase) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
