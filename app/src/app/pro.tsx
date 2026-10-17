import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Platform, ScrollView, Text, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';

import { Button, Card, colors, styles } from '@/components/ui';
import { billingAvailable, getProPackage, purchasePro, restorePro } from '@/lib/billing';
import { FREE_MONTHLY_DICTATIONS, useStore } from '@/lib/store';

const BENEFITS = [
  ['🎙', 'Dictées IA illimitées', `Le plan gratuit en compte ${FREE_MONTHLY_DICTATIONS} par mois.`],
  ['✍️', 'Signature en ligne', 'Ton client signe le devis sur son téléphone, sans imprimer.'],
  ['🔔', 'Alerte dès la signature', 'Une notification au moment où le client dit oui.'],
  ['📨', 'Relances automatiques', 'Les factures impayées sont relancées par e-mail à J+1, J+8 et J+15.'],
] as const;

const MANAGE_URL = Platform.select({
  ios: 'https://apps.apple.com/account/subscriptions',
  android: 'https://play.google.com/store/account/subscriptions',
});

export default function Pro() {
  const { session, plan, syncNow } = useStore();
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState<'buy' | 'restore' | null>(null);

  useEffect(() => {
    if (session && billingAvailable) getProPackage().then(setPkg, () => setPkg(null));
  }, [session]);

  async function run(kind: 'buy' | 'restore') {
    setLoading(kind);
    try {
      const ok = kind === 'buy' ? pkg && (await purchasePro(pkg)) : await restorePro();
      if (ok) {
        await syncNow();
        router.back();
      } else if (kind === 'restore') {
        Alert.alert('Aucun abonnement trouvé', 'Aucun achat Dicta Pro n’est associé à ce compte App Store / Google Play.');
      }
    } catch (e) {
      Alert.alert('Achat impossible', e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(null);
    }
  }

  const product = pkg?.product;
  const trial = product?.introPrice?.price === 0 ? product.introPrice : null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={{ alignItems: 'center', gap: 6, paddingVertical: 8 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>Dicta Pro</Text>
        <Text style={[styles.muted, { textAlign: 'center' }]}>Fais signer plus vite, fais-toi payer plus vite.</Text>
      </View>

      <Card>
        {BENEFITS.map(([icon, title, desc]) => (
          <View key={title} style={[styles.row, { alignItems: 'flex-start', gap: 12, paddingVertical: 4 }]}>
            <Text style={{ fontSize: 22 }}>{icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.text, { fontWeight: '700' }]}>{title}</Text>
              <Text style={styles.muted}>{desc}</Text>
            </View>
          </View>
        ))}
      </Card>

      {plan.pro ? (
        <Card>
          <Text style={[styles.h2, { color: colors.success }]}>Tu es Pro ✓</Text>
          {MANAGE_URL && <Button title="Gérer mon abonnement" variant="secondary" onPress={() => Linking.openURL(MANAGE_URL)} />}
        </Card>
      ) : !session ? (
        <Button title="Créer mon compte pour continuer" onPress={() => router.replace('/account')} />
      ) : !billingAvailable ? (
        <Card>
          <Text style={styles.text}>L’abonnement sera disponible dans la version publiée sur l’App Store et Google Play.</Text>
        </Card>
      ) : (
        <>
          <Button
            title={
              product
                ? trial
                  ? `Essayer gratuitement, puis ${product.priceString}/mois`
                  : `Passer à Pro · ${product.priceString}/mois`
                : 'Chargement de l’offre…'
            }
            onPress={() => run('buy')}
            loading={loading === 'buy'}
            disabled={!pkg}
          />
          <Button title="Restaurer mes achats" variant="secondary" onPress={() => run('restore')} loading={loading === 'restore'} />
          <Text style={[styles.muted, { textAlign: 'center', fontSize: 12 }]}>
            Abonnement mensuel renouvelé automatiquement, résiliable à tout moment depuis ton compte
            {Platform.OS === 'ios' ? ' App Store' : ' Google Play'}.
            {trial ? ' Aucun prélèvement pendant l’essai si tu résilies avant la fin.' : ''}
          </Text>
          <View style={[styles.row, { justifyContent: 'center', gap: 16 }]}>
            {process.env.EXPO_PUBLIC_TERMS_URL && (
              <Text style={[styles.muted, { color: colors.primary }]} onPress={() => Linking.openURL(process.env.EXPO_PUBLIC_TERMS_URL!)}>
                Conditions d’utilisation
              </Text>
            )}
            {process.env.EXPO_PUBLIC_PRIVACY_URL && (
              <Text style={[styles.muted, { color: colors.primary }]} onPress={() => Linking.openURL(process.env.EXPO_PUBLIC_PRIVACY_URL!)}>
                Confidentialité
              </Text>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}
