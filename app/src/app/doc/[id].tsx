import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, Switch, Text, TextInput, View } from 'react-native';

import { Button, Card, colors, confirm, Field, styles } from '@/components/ui';
import { formatDate, formatEur, newId, totals } from '@/lib/money';
import { shareDocPdf } from '@/lib/pdf';
import { ProRequiredError, useStore } from '@/lib/store';
import { UNITS, type Line } from '@/lib/types';

const parseNumber = (s: string) => {
  const n = parseFloat(s.replace(',', '.').replace(/\s/g, ''));
  return Number.isFinite(n) ? n : 0;
};

function LineEditor({
  line,
  editable,
  onChange,
  onRemove,
}: {
  line: Line;
  editable: boolean;
  onChange: (patch: Partial<Line>) => void;
  onRemove: () => void;
}) {
  const nextUnit = () => onChange({ unit: UNITS[(UNITS.indexOf(line.unit) + 1) % UNITS.length] });
  return (
    <View style={{ gap: 8, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
      <TextInput
        defaultValue={line.description}
        onChangeText={(description) => onChange({ description })}
        editable={editable}
        multiline
        style={[styles.text, { fontWeight: '600' }]}
      />
      <View style={styles.row}>
        <TextInput
          defaultValue={String(line.quantity).replace('.', ',')}
          onChangeText={(v) => onChange({ quantity: parseNumber(v) })}
          editable={editable}
          keyboardType="decimal-pad"
          style={[styles.input, { width: 56, paddingVertical: 6 }]}
        />
        <Pressable onPress={editable ? nextUnit : undefined} style={[styles.input, { paddingVertical: 6 }]}>
          <Text style={styles.text}>{line.unit}</Text>
        </Pressable>
        <Text style={styles.muted}>×</Text>
        <TextInput
          defaultValue={String(line.unitPrice).replace('.', ',')}
          onChangeText={(v) => onChange({ unitPrice: parseNumber(v), estimated: false })}
          editable={editable}
          keyboardType="decimal-pad"
          style={[
            styles.input,
            { width: 80, paddingVertical: 6 },
            line.estimated && editable && { backgroundColor: colors.warnBg, borderColor: colors.warn },
          ]}
        />
        <Text style={[styles.text, { flex: 1, textAlign: 'right', fontWeight: '600' }]} numberOfLines={1} adjustsFontSizeToFit>
          {formatEur(line.quantity * line.unitPrice)}
        </Text>
      </View>
      {editable && (
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <Text style={[styles.muted, { color: colors.warn }]}>{line.estimated ? 'Prix estimé par l’IA, à vérifier' : ''}</Text>
          <Pressable onPress={onRemove}>
            <Text style={[styles.muted, { color: colors.danger }]}>Supprimer</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function DocScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { docs, company, session, plan, updateDoc, deleteDoc, convertToInvoice, requestSignature } = useStore();
  const [sharing, setSharing] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const doc = docs.find((d) => d.id === id);

  if (!doc) {
    return (
      <View style={[styles.screen, styles.content]}>
        <Text style={styles.text}>Document introuvable.</Text>
      </View>
    );
  }

  const isQuote = doc.kind === 'quote';
  // Une facture émise ou un devis signé ne se modifient plus : lignes figées.
  const editable = isQuote && !doc.signedAt;
  const t = totals(doc.lines, company);
  const invoice = docs.find((d) => d.sourceQuoteId === doc.id);
  const hasEstimates = doc.lines.some((l) => l.estimated);
  const due = new Date(new Date(doc.createdAt).getTime() + company.paymentTermsDays * 86_400_000);
  const overdueDays = Math.floor((Date.now() - due.getTime()) / 86_400_000);

  const setLine = (lineId: string, patch: Partial<Line>) =>
    updateDoc(doc.id, { lines: doc.lines.map((l) => (l.id === lineId ? { ...l, ...patch } : l)) });

  async function share() {
    if (!doc) return;
    setSharing(true);
    try {
      await shareDocPdf(doc, company);
      if (doc.status === 'draft') updateDoc(doc.id, { status: 'sent' });
    } catch (e) {
      Alert.alert('Envoi impossible', e instanceof Error ? e.message : String(e));
    } finally {
      setSharing(false);
    }
  }

  async function sendForSignature() {
    if (!doc) return;
    if (!session) return router.push('/account');
    setRequesting(true);
    try {
      const url = await requestSignature(doc.id);
      const who = company.name || 'votre artisan';
      await Share.share({
        message: `Bonjour${doc.clientName ? ' ' + doc.clientName : ''}, voici votre devis ${doc.number} de ${who}. Vous pouvez le consulter et le signer en ligne : ${url}`,
      });
    } catch (e) {
      if (e instanceof ProRequiredError) return router.push('/pro');
      Alert.alert('Envoi impossible', e instanceof Error ? e.message : String(e));
    } finally {
      setRequesting(false);
    }
  }

  function toInvoice() {
    if (!doc) return;
    if (invoice) return router.replace(`/doc/${invoice.id}`);
    confirm(
      'Transformer en facture ?',
      'Le devis sera marqué comme accepté et une facture numérotée sera créée.',
      'Créer la facture',
      () => router.replace(`/doc/${convertToInvoice(doc.id).id}`),
    );
  }

  function remove() {
    if (!doc) return;
    confirm(
      'Supprimer ce devis ?',
      'Cette action est définitive.',
      'Supprimer',
      () => {
        deleteDoc(doc.id);
        router.back();
      },
      true,
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: `${isQuote ? 'Devis' : 'Facture'} ${doc.number}` }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card>
          <Field label="Objet" defaultValue={doc.title} onChangeText={(title) => updateDoc(doc.id, { title })} editable={editable} />
          <Field label="Client" defaultValue={doc.clientName} onChangeText={(clientName) => updateDoc(doc.id, { clientName })} />
          <Field
            label="E-mail du client"
            defaultValue={doc.clientEmail}
            onChangeText={(clientEmail) => updateDoc(doc.id, { clientEmail: clientEmail.trim() })}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="Pour les relances automatiques"
          />
          <Field
            label="Adresse du client"
            defaultValue={doc.clientAddress}
            onChangeText={(clientAddress) => updateDoc(doc.id, { clientAddress })}
            multiline
          />
        </Card>

        <Card>
          <Text style={styles.h2}>Prestations</Text>
          {doc.lines.map((line) => (
            <LineEditor
              key={line.id}
              line={line}
              editable={editable}
              onChange={(patch) => setLine(line.id, patch)}
              onRemove={() => updateDoc(doc.id, { lines: doc.lines.filter((l) => l.id !== line.id) })}
            />
          ))}
          {editable && (
            <Button
              title="+ Ajouter une ligne"
              variant="secondary"
              onPress={() =>
                updateDoc(doc.id, {
                  lines: [...doc.lines, { id: newId(), description: 'Nouvelle prestation', quantity: 1, unit: 'u', unitPrice: 0 }],
                })
              }
            />
          )}
          <View style={{ gap: 4, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 }}>
            <View style={[styles.row, { justifyContent: 'space-between' }]}>
              <Text style={styles.muted}>Total HT</Text>
              <Text style={styles.text}>{formatEur(t.ht)}</Text>
            </View>
            <View style={[styles.row, { justifyContent: 'space-between' }]}>
              <Text style={styles.muted}>{company.vatExempt ? 'TVA non applicable' : `TVA ${t.vatRate} %`}</Text>
              <Text style={styles.text}>{formatEur(t.vat)}</Text>
            </View>
            <View style={[styles.row, { justifyContent: 'space-between' }]}>
              <Text style={styles.h2}>Total TTC</Text>
              <Text style={styles.h2}>{formatEur(t.ttc)}</Text>
            </View>
          </View>
        </Card>

        {doc.signedAt && (
          <Card>
            <Text style={[styles.h2, { color: colors.success }]}>Signé ✓</Text>
            <Text style={styles.text}>
              Par {doc.signerName} le {formatDate(doc.signedAt)} à{' '}
              {new Date(doc.signedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {doc.signature && (
              <Image source={{ uri: doc.signature }} style={{ height: 80, width: '100%' }} resizeMode="contain" />
            )}
          </Card>
        )}

        {!isQuote && doc.status !== 'paid' && (
          <Card>
            <Text style={styles.text}>
              Échéance : {formatDate(due.toISOString())}
              {overdueDays > 0 ? (
                <Text style={{ color: colors.danger }}> · en retard de {overdueDays} jour{overdueDays > 1 ? 's' : ''}</Text>
              ) : null}
            </Text>
            <View style={[styles.row, { justifyContent: 'space-between' }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.text}>Relances automatiques {plan.pro ? '' : '(Pro)'}</Text>
                <Text style={styles.muted}>
                  {!doc.clientEmail
                    ? 'Ajoute l’e-mail du client pour les activer.'
                    : 'Par e-mail à J+1, J+8 et J+15 après l’échéance, de ta part.'}
                </Text>
              </View>
              <Switch
                value={plan.pro && doc.autoRemind !== false && Boolean(doc.clientEmail)}
                disabled={plan.pro && !doc.clientEmail}
                onValueChange={(on) => (plan.pro ? updateDoc(doc.id, { autoRemind: on }) : router.push('/pro'))}
              />
            </View>
            {(doc.remindersSent ?? 0) > 0 && (
              <Text style={styles.muted}>
                {doc.remindersSent} relance{doc.remindersSent! > 1 ? 's' : ''} envoyée{doc.remindersSent! > 1 ? 's' : ''}
                {doc.lastReminderAt ? `, la dernière le ${formatDate(doc.lastReminderAt)}` : ''}.
              </Text>
            )}
          </Card>
        )}

        {hasEstimates && editable && (
          <Text style={[styles.muted, { color: colors.warn }]}>
            Certains prix ont été estimés par l’IA (en orange). Vérifie-les avant d’envoyer.
          </Text>
        )}

        {isQuote && !doc.signedAt && (
          <Button
            title={doc.shareToken ? '✍️  Renvoyer le lien de signature' : '✍️  Envoyer pour signature en ligne'}
            onPress={sendForSignature}
            loading={requesting}
          />
        )}
        <Button
          title={`Envoyer ${isQuote ? 'le devis' : 'la facture'} (PDF)`}
          variant={isQuote && !doc.signedAt ? 'secondary' : 'primary'}
          onPress={share}
          loading={sharing}
        />
        {isQuote ? (
          <>
            <Button title={invoice ? 'Voir la facture' : 'Transformer en facture'} variant="secondary" onPress={toInvoice} />
            {!invoice && !doc.signedAt && <Button title="Supprimer le devis" variant="danger" onPress={remove} />}
          </>
        ) : (
          <Button
            title={doc.status === 'paid' ? 'Marquer comme non payée' : 'Marquer comme payée ✓'}
            variant="secondary"
            onPress={() => updateDoc(doc.id, { status: doc.status === 'paid' ? 'sent' : 'paid' })}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
