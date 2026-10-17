import { KeyboardAvoidingView, Platform, ScrollView, Switch, Text, View } from 'react-native';

import { Card, Field, styles } from '@/components/ui';
import { useStore } from '@/lib/store';

export default function Settings() {
  const { company, updateCompany, ready } = useStore();
  if (!ready) return null;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.muted}>Ces informations apparaissent sur tous tes devis et factures.</Text>
        <Card>
          <Field label="Nom de l’entreprise" defaultValue={company.name} onChangeText={(name) => updateCompany({ name })} />
          <Field label="Adresse" defaultValue={company.address} onChangeText={(address) => updateCompany({ address })} multiline />
          <Field label="SIRET" defaultValue={company.siret} onChangeText={(siret) => updateCompany({ siret })} keyboardType="number-pad" />
          <Field
            label="E-mail"
            defaultValue={company.email}
            onChangeText={(email) => updateCompany({ email })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field label="Téléphone" defaultValue={company.phone} onChangeText={(phone) => updateCompany({ phone })} keyboardType="phone-pad" />
        </Card>
        <Card>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.text}>Franchise de TVA</Text>
              <Text style={styles.muted}>Micro-entreprise : « TVA non applicable, art. 293 B du CGI »</Text>
            </View>
            <Switch value={company.vatExempt} onValueChange={(vatExempt) => updateCompany({ vatExempt })} />
          </View>
          {!company.vatExempt && (
            <Field
              label="Taux de TVA (%)"
              defaultValue={String(company.vatRate)}
              onChangeText={(v) => updateCompany({ vatRate: parseFloat(v.replace(',', '.')) || 0 })}
              keyboardType="decimal-pad"
            />
          )}
          <Field
            label="Délai de paiement des factures (jours)"
            defaultValue={String(company.paymentTermsDays)}
            onChangeText={(v) => updateCompany({ paymentTermsDays: parseInt(v, 10) || 0 })}
            keyboardType="number-pad"
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
