---
workflow: product-launch-video
flow: automation
storyboard: no
message: "On crée la vitrine digitale de votre entreprise, pour être trouvé en ligne et récupérer des clients."
destination: youtube
aspect: "16:9"
language: fr
audience: "Artisans, coiffeurs, garages, restaurants — Lyon"
length: "≈ 41 s"
voice: "Higgsfield TTS (ElevenLabs engine), voix masculine « Julian »"
---

# Vortex — vidéo vitrine digitale

Source : https://vortex-agence.fr (capture dans `capture/`).

## Intent
Promo motion design ≈ 40 s, 1920×1080, 60 i/s, sans prise de vue réelle : typographie cinétique,
cards UI, sites qui défilent. Modèle : `PROMPT-MODELE-VIDEO-VITRINE` (8 scènes).

## Décisions
- **Pas de témoignage** : l'utilisateur a demandé un faux témoignage ; refusé (pratique commerciale
  trompeuse). La scène 6 montre à la place la méthode réelle du site (« Votre site en 3 étapes »)
  et le chiffre affiché sur le site (« +100 clients accompagnés »).
- **Pas d'« assistants IA »** dans la ligne Visibilité (non mentionné sur le site) : « Visible sur
  Google, sur Maps, partout où l'on vous cherche. »
- **Réalisations** = les 4 sites de démonstration du site, étiquetés « Site de démonstration ».
- **Pas de prix** à l'écran (CTA unique : « Demander mon site »).
- **Carte** : plan stylisé dessiné à la main (pas de fond OpenStreetMap → pas de crédit requis).
- Composants 21st.dev (MCP non disponible) reproduits d'après leur mécanique :
  Container Scroll, Shimmer Button, Border Beam, Text Rotate, 3D Marquee, Tilt/Spotlight card,
  Orbiting Circles + Animated Beam, Animated List, Number Ticker, Bento Grid, Logo Marquee.
- Musique et SFX synthétisés de façon procédurale (HeyGen non connecté) : `tools/music.py`,
  `tools/sfx.py`, mixage `tools/mix.py`.

## Script (voix off)
1. Aujourd'hui, vos clients vous cherchent d'abord en ligne.
2. Chez Vortex, on crée la vitrine digitale de votre entreprise.
3. Un site moderne, rapide, adapté au mobile.
4. Visible sur Google, sur Maps, partout où l'on vous cherche.
5. Résultat : vos visiteurs deviennent des clients.
6. Votre site en trois étapes : on échange, on crée, on met en ligne.
7. Création, référencement local, maintenance : on s'occupe de tout.
8. Prêt à être trouvé ? Demandez votre site. Réponse sous vingt-quatre heures.

## Reconstruire
```bash
node tools/build.mjs          # src/ -> compositions/*.html + index.html
python3 tools/music.py        # assets/audio/music.wav (105 BPM)
python3 tools/sfx.py          # assets/audio/sfx.wav
python3 tools/mix.py          # assets/audio/mix.wav (master)
npx hyperframes check
npx hyperframes render --quality high --fps 240 --workers 4 --output renders/v-240.mp4
bash tools/finish.sh          # flou de mouvement + audio -15 LUFS -> renders/video.mp4

# Variante 9:16 (1080×1920) : scènes dans src/scenes-916/
bash tools/render-916.sh      # -> renders/video-916.mp4
```
