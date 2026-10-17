import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';

import { Button, Card, colors, confirm, Field, styles } from '@/components/ui';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

const syncLabel = {
  off: 'Synchronisation désactivée',
  idle: 'Tout est sauvegardé',
  syncing: 'Synchronisation…',
  error: 'Échec de la synchronisation',
};

export default function Account() {
  const { session, sync, syncNow, signOut } = useStore();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);

  if (!supabase) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Card>
          <Text style={styles.h2}>Cloud non configuré</Text>
          <Text style={styles.muted}>
            Renseigne EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY dans .env.local (voir le README).
          </Text>
        </Card>
      </ScrollView>
    );
  }
  const auth = supabase.auth;

  async function sendCode() {
    setLoading(true);
    const { error } = await auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: true } });
    setLoading(false);
    if (error) return Alert.alert('Envoi impossible', error.message);
    setStep('code');
  }

  async function verify() {
    setLoading(true);
    const { error } = await auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'email' });
    setLoading(false);
    if (error) return Alert.alert('Code invalide', 'Vérifie le code reçu par e-mail ou demande-en un nouveau.');
    router.back();
  }

  function logout() {
    confirm('Se déconnecter ?', 'Tes devis et factures restent sauvegardés dans ton compte.', 'Se déconnecter', async () => {
      try {
        await signOut();
      } catch (e) {
        Alert.alert('Déconnexion impossible', e instanceof Error ? e.message : String(e));
      }
    });
  }

  if (session) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Card>
          <Text style={styles.muted}>Connecté avec</Text>
          <Text style={styles.h2}>{session.user.email}</Text>
        </Card>
        <Card>
          <Text style={[styles.text, sync.state === 'error' && { color: colors.danger }]}>{syncLabel[sync.state]}</Text>
          {sync.error && <Text style={styles.muted}>{sync.error}</Text>}
          {sync.lastAt && (
            <Text style={styles.muted}>Dernière synchro : {new Date(sync.lastAt).toLocaleTimeString('fr-FR')}</Text>
          )}
          <Button title="Synchroniser maintenant" variant="secondary" onPress={syncNow} loading={sync.state === 'syncing'} />
        </Card>
        <Button title="Se déconnecter" variant="danger" onPress={logout} />
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card>
          <Text style={styles.h2}>Ton compte Dicta</Text>
          <Text style={styles.muted}>
            Gratuit. Active l’IA, sauvegarde tes devis dans le cloud et permet à tes clients de signer en ligne. Pas de mot de
            passe : on t’envoie un code par e-mail.
          </Text>
        </Card>
        {step === 'email' ? (
          <>
            <Field
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="toi@exemple.fr"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Button title="Recevoir mon code" onPress={sendCode} loading={loading} disabled={!email.includes('@')} />
          </>
        ) : (
          <>
            <Text style={styles.text}>Code envoyé à {email}.</Text>
            <Field
              label="Code reçu par e-mail"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              autoFocus
            />
            <Button title="Valider" onPress={verify} loading={loading} disabled={code.trim().length < 6} />
            <Button title="Changer d’e-mail" variant="secondary" onPress={() => setStep('email')} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
