import { Link, router, Stack } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { Button, colors, styles } from '@/components/ui';
import { formatDate, formatEur, totals } from '@/lib/money';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import type { DocKind, DocStatus } from '@/lib/types';

const statusLabel: Record<DocStatus, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  accepted: 'Accepté',
  paid: 'Payée',
};

export default function Home() {
  const { docs, company, ready, session, sync } = useStore();
  const [tab, setTab] = useState<DocKind>('quote');
  const list = docs.filter((d) => d.kind === tab);

  const unpaid = docs
    .filter((d) => d.kind === 'invoice' && d.status !== 'paid')
    .reduce((sum, d) => sum + totals(d.lines, company).ttc, 0);

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerLeft: () =>
            supabase ? (
              <Link href="/account" style={{ color: sync.state === 'error' ? colors.danger : colors.primary, fontSize: 16 }}>
                {session ? (sync.state === 'syncing' ? 'Compte ⟳' : sync.state === 'error' ? 'Compte ⚠' : 'Compte ✓') : 'Connexion'}
              </Link>
            ) : null,
          headerRight: () => (
            <Link href="/settings" style={{ color: colors.primary, fontSize: 16 }}>
              Réglages
            </Link>
          ),
        }}
      />
      <FlatList
        data={list}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            {!company.name && ready && (
              <Pressable onPress={() => router.push('/settings')} style={[styles.card, { backgroundColor: colors.warnBg }]}>
                <Text style={[styles.text, { color: colors.warn }]}>
                  Renseigne ton entreprise (nom, SIRET, TVA) pour des devis conformes →
                </Text>
              </Pressable>
            )}
            {process.env.EXPO_PUBLIC_WEB_DEMO && (
              <View style={[styles.card, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                <Text style={[styles.text, { fontWeight: '700' }]}>Version web de Dicta</Text>
                <Text style={styles.muted}>
                  Les exemples ci-dessous sont modifiables. Tes devis restent dans ce navigateur. L’IA, la signature en
                  ligne et les relances sont dans l’app mobile.
                </Text>
              </View>
            )}
            {supabase && !session && ready && docs.length > 0 && (
              <Pressable onPress={() => router.push('/account')} style={[styles.card, { backgroundColor: colors.warnBg }]}>
                <Text style={[styles.text, { color: colors.warn }]}>
                  Tes devis ne sont que sur ce téléphone. Crée ton compte gratuit pour les sauvegarder →
                </Text>
              </Pressable>
            )}
            <View style={styles.card}>
              <Text style={styles.muted}>À encaisser</Text>
              <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text }}>{formatEur(unpaid)}</Text>
            </View>
            <View style={[styles.row, { backgroundColor: colors.border, borderRadius: 10, padding: 3 }]}>
              {(['quote', 'invoice'] as const).map((k) => (
                <Pressable
                  key={k}
                  onPress={() => setTab(k)}
                  style={{ flex: 1, padding: 8, borderRadius: 8, backgroundColor: tab === k ? colors.card : 'transparent' }}
                >
                  <Text style={{ textAlign: 'center', fontWeight: '600', color: colors.text }}>
                    {k === 'quote' ? 'Devis' : 'Factures'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={[styles.muted, { textAlign: 'center', marginTop: 32 }]}>
            {tab === 'quote'
              ? 'Aucun devis. Dicte ton premier chantier, il sera prêt en 30 secondes.'
              : 'Aucune facture. Transforme un devis accepté en facture en un tap.'}
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/doc/${item.id}`)} style={styles.card}>
            <View style={[styles.row, { justifyContent: 'space-between' }]}>
              <Text style={styles.h2} numberOfLines={1}>
                {item.clientName || 'Client à renseigner'}
              </Text>
              <Text style={styles.h2}>{formatEur(totals(item.lines, company).ttc)}</Text>
            </View>
            <Text style={styles.text} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={[styles.row, { justifyContent: 'space-between' }]}>
              <Text style={styles.muted}>
                {item.number} · {formatDate(item.createdAt)}
              </Text>
              <Text style={[styles.muted, (item.status === 'paid' || item.signedAt) && { color: colors.success }]}>
                {item.signedAt && item.kind === 'quote' ? 'Signé ✓' : statusLabel[item.status]}
              </Text>
            </View>
          </Pressable>
        )}
      />
      <View style={{ padding: 16, paddingBottom: 32 }}>
        <Button title="🎙  Dicter un devis" onPress={() => router.push('/new')} />
      </View>
    </View>
  );
}
