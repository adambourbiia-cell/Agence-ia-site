// Sur mobile, le PDF passe par la feuille de partage (voir lib/pdf.ts) : pas d'aperçu à afficher.
export function PdfPreview(_props: { html: string | null; onClose: () => void }) {
  return null;
}
