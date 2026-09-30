# Ligne — Studio de création de sites web

Site vitrine statique (HTML / CSS / JS vanilla, sans dépendance) inspiré du langage visuel Stripe :
typographie Inter Tight 300, un seul accent indigo `#533afd`, rayons 4px, aucune ombre.

## Animations
- **Scroll** : barre de progression, nav qui se masque/réapparaît, titres révélés mot à mot, compteurs,
  manifeste qui s'illumine mot par mot, étapes « Méthode » avec ligne de progression et compteur sticky,
  réalisations en défilement horizontal épinglé, parallaxe du dégradé du hero.
- **Survol** : boutons magnétiques avec reflet, mockup du hero en tilt 3D, cartes avec projecteur qui suit
  la souris et icônes redessinées, soulignements animés, cartes réalisations/tarifs qui se soulèvent.
- **En continu** : mot rotatif dans le titre, dégradé animé, mockup navigateur qui « se construit »
  (scores Lighthouse, terminal de déploiement), marquee de clients, carrousel de témoignages.

`prefers-reduced-motion` est respecté. Responsive jusqu'à 360px.

## Lancer
Ouvrir `index.html` dans un navigateur, ou `python3 -m http.server` puis http://localhost:8000.
