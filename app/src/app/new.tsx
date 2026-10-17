import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput } from 'react-native';

import { Button, Card, colors, Field, styles } from '@/components/ui';
import { parseDictation, QuotaError } from '@/lib/ai';
import { FREE_MONTHLY_DICTATIONS, useStore } from '@/lib/store';

const EXAMPLE =
  "Salle de bain chez madame Martin, 12 rue des Lilas à Lyon. Dépose de l'ancienne baignoire, " +
  'pose d’un receveur de douche 90 par 120, 6 mètres carrés de faïence à 45 euros le mètre carré, ' +
  'et 2 jours de main d’œuvre.';

export default function NewQuote() {
  const { createQuote, session, plan, syncNow } = useStore();
  const [text, setText] = useState('');
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const parsed = await parseDictation(text.trim(), Boolean(session));
      const doc = createQuote({
        title: parsed.title,
        clientName: clientName.trim() || parsed.clientName,
        clientEmail: '',
        clientAddress: '',
        lines: parsed.lines,
        dictation: text.trim(),
      });
      router.replace(`/doc/${doc.id}`);
      syncNow();
    } catch (e) {
      if (e instanceof QuotaError) return router.push('/pro');
      Alert.alert('Impossible de générer le devis', e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card>
          <Text style={styles.h2}>Décris le chantier</Text>
          <Text style={styles.muted}>
            Appuie sur le micro 🎙 de ton clavier et parle naturellement : travaux, quantités, prix si tu les connais.
            {session ? ' L’IA s’occupe du reste.' : ''}
          </Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={EXAMPLE}
            placeholderTextColor={colors.muted}
            multiline
            autoFocus
            style={[styles.input, { minHeight: 180, textAlignVertical: 'top' }]}
          />
          {!text && <Button title="Essayer avec un exemple" variant="secondary" onPress={() => setText(EXAMPLE)} />}
        </Card>
        <Field label="Client (facultatif)" value={clientName} onChangeText={setClientName} placeholder="Mme Martin" />
        {!session && (
          <Pressable onPress={() => router.push('/account')}>
            <Text style={[styles.muted, { color: colors.warn }]}>
              Sans compte, le texte sera mis dans une seule ligne à chiffrer à la main.{' '}
              <Text style={{ fontWeight: '700' }}>Crée ton compte gratuit pour activer l’IA →</Text>
            </Text>
          </Pressable>
        )}
        {session && !plan.pro && (
          <Pressable onPress={() => router.push('/pro')}>
            <Text style={styles.muted}>
              {Math.max(0, FREE_MONTHLY_DICTATIONS - plan.aiUsedThisMonth)}/{FREE_MONTHLY_DICTATIONS} dictées IA gratuites
              restantes ce mois-ci · <Text style={{ color: colors.primary }}>Illimité avec Pro</Text>
            </Text>
          </Pressable>
        )}
        <Button title="Générer le devis" onPress={generate} loading={loading} disabled={!text.trim()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
