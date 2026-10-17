import { useEffect, useRef } from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';

import { Button, colors, styles } from './ui';

/**
 * Sur le web, l'impression et le partage de fichiers ne sont pas toujours permis (pages intégrées) :
 * on affiche le document tel qu'il sera envoyé, isolé dans un shadow DOM pour garder ses styles.
 */
export function PdfPreview({ html, onClose }: { html: string | null; onClose: () => void }) {
  const host = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!html || !host.current) return;
    const root = host.current.shadowRoot ?? host.current.attachShadow({ mode: 'open' });
    root.innerHTML =
      '<style>:host{display:block;font-family:-apple-system,Helvetica,Arial,sans-serif;color:#111;font-size:12px;padding:20px}</style>' +
      html.replace(/<!doctype html>/i, '');
  }, [html]);

  return (
    <Modal visible={Boolean(html)} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={[styles.row, { justifyContent: 'space-between', padding: 16 }]}>
          <Text style={styles.h2}>Aperçu</Text>
          <View style={{ width: 110 }}>
            <Button title="Fermer" variant="secondary" onPress={onClose} />
          </View>
        </View>
        <ScrollView contentContainerStyle={{ padding: 12, paddingTop: 0 }}>
          <div ref={host} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${colors.border}`, overflowX: 'auto' }} />
          <Text style={[styles.muted, { padding: 12, textAlign: 'center' }]}>
            Dans l’app mobile, ce bouton génère le PDF et l’envoie par e-mail, WhatsApp ou SMS.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}
