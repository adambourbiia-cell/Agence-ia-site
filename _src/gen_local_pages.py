"""Génère les pages locales SEO de Vortex (création de site web par ville et par métier).

Usage : python3 _src/gen_local_pages.py  (depuis la racine du dépôt)
Chaque page est écrite dans /<slug>/index.html et ajoutée au sitemap.
"""
import hashlib
import html
import json
import os
import re

SITE = "https://ligne-studio-web.netlify.app"
PAY = "https://buy.stripe.com/6oU7sKeFweKm5UU84z7Zu04"
TODAY = "2026-10-01"


def ver(path):
    return hashlib.md5(open(path, "rb").read()).hexdigest()[:8]


V_FONTS, V_CSS, V_JS = ver("assets/css/fonts.css"), ver("assets/css/style.css"), ver("assets/js/main.js")

DEMOS = {
    "artisan": ("Cuivre & Co", "/demo/artisan/", "assets/img/demo-cuivre.jpg", "plombier-chauffagiste : bandeau urgence, estimation de prix en ligne, avant / après"),
    "restaurant": ("Le Brasier", "/demo/restaurant/", "assets/img/demo-brasier.jpg", "bistrot-grill : carte interactive, galerie, réservation de table"),
    "coiffure": ("Atelier Lune", "/demo/coiffure/", "assets/img/demo-lune.jpg", "salon de coiffure : tarifs par catégorie, prise de rendez-vous en ligne"),
    "garage": ("Delta Auto", "/demo/garage/", "assets/img/demo-garage.jpg", "garage : devis express par plaque d'immatriculation, rendez-vous en ligne"),
}

# ---------- Pages ville ----------
CITIES = [
    {
        "slug": "creation-site-web-givors", "city": "Givors", "cp": "69700",
        "near": ["Grigny", "Chasse-sur-Rhône", "Loire-sur-Rhône", "Ternay", "Montagny"],
        "intro": "Basé à Givors, Vortex accompagne les artisans, restaurateurs et commerçants de la ville et des communes voisines. Un interlocuteur local, que vous pouvez rencontrer, et un site pensé pour être trouvé quand on cherche un professionnel à Givors.",
        "local": "Du centre-ville à Montrond, en passant par la zone des Vernes et les bords du Rhône, beaucoup d'entreprises givordines sont encore absentes de Google. Un site simple et bien référencé suffit souvent à passer devant la concurrence locale.",
        "demo": "artisan",
    },
    {
        "slug": "creation-site-web-lyon", "city": "Lyon", "cp": "69000",
        "near": ["Villeurbanne", "Vénissieux", "Caluire-et-Cuire", "Oullins", "Bron"],
        "intro": "À Lyon, la concurrence sur Google est forte : un site rapide, clair et optimisé pour votre arrondissement fait toute la différence. Vortex crée des sites vitrines modernes pour les indépendants et petites entreprises lyonnaises, du 1er au 9e arrondissement.",
        "local": "Presqu'île, Croix-Rousse, Part-Dieu, Gerland ou Monplaisir : vos clients cherchent « près de chez moi ». On optimise votre site et votre fiche Google pour votre quartier, pas seulement pour « Lyon ».",
        "demo": "restaurant",
    },
    {
        "slug": "creation-site-web-villeurbanne", "city": "Villeurbanne", "cp": "69100",
        "near": ["Lyon 6e", "Vaulx-en-Velin", "Bron", "Caluire-et-Cuire", "Rillieux-la-Pape"],
        "intro": "Villeurbanne compte des milliers de commerces et d'artisans, des Gratte-Ciel à Cusset. Vortex crée leur site web pour qu'ils soient visibles auprès des habitants qui cherchent un professionnel à proximité.",
        "local": "Un salon à Charpennes, un plombier à Saint-Jean, un restaurant près du campus de la Doua : chaque activité a ses propres recherches Google. Votre site est construit autour de ce que vos clients tapent réellement.",
        "demo": "coiffure",
    },
    {
        "slug": "creation-site-web-venissieux", "city": "Vénissieux", "cp": "69200",
        "near": ["Saint-Fons", "Lyon 8e", "Saint-Priest", "Corbas", "Feyzin"],
        "intro": "Garages, artisans du bâtiment, commerces de proximité : à Vénissieux, beaucoup de professionnels n'ont qu'une fiche annuaire. Vortex leur crée un vrai site, avec leurs services, leurs prix et un moyen simple d'être contactés.",
        "local": "Des Minguettes au centre, en passant par les zones d'activité, les clients comparent sur leur téléphone avant d'appeler. Un site rapide et adapté au mobile vous place en tête de leur liste.",
        "demo": "garage",
    },
    {
        "slug": "creation-site-web-grigny", "city": "Grigny", "cp": "69520",
        "near": ["Givors", "Brignais", "Millery", "Vernaison", "Montagny"],
        "intro": "Vortex accompagne les entreprises de Grigny et de la vallée du Rhône dans la création de leur site internet : un site professionnel, rapide et visible sur Google, pour un prix clair annoncé dès le départ.",
        "local": "Artisans, entreprises du bâtiment et commerces grignerots : vos clients viennent de Grigny mais aussi de Givors, Brignais ou Millery. Votre site cible toute votre zone d'intervention.",
        "demo": "artisan",
    },
    {
        "slug": "creation-site-web-brignais", "city": "Brignais", "cp": "69530",
        "near": ["Chaponost", "Vourles", "Saint-Genis-Laval", "Millery", "Grigny"],
        "intro": "À Brignais, commerces du centre et entreprises de la zone des Aigais ont tout à gagner à être visibles en ligne. Vortex crée des sites vitrines modernes pour les professionnels brignairots et du sud-ouest lyonnais.",
        "local": "Vos clients viennent de Brignais, Chaponost, Vourles ou Saint-Genis-Laval : on construit votre site et vos pages pour chacune de ces recherches locales.",
        "demo": "coiffure",
    },
]

# ---------- Pages métier ----------
JOBS = [
    {
        "slug": "site-internet-plombier-lyon", "job": "plombier", "title_job": "plombier chauffagiste", "demo": "artisan",
        "intro": "Quand une fuite survient, vos clients prennent leur téléphone et tapent « plombier » suivi de leur ville. Le plombier qui a un site clair, avec ses services et son numéro bien visible, reçoit l'appel.",
        "features": [("Bouton d'appel toujours visible", "Sur mobile, un bouton « Appeler » reste en bas de l'écran : en urgence, vos clients vous joignent en un geste."),
                     ("Bandeau urgence 7j/7", "Mettez en avant vos dépannages et vos délais d'intervention dès l'arrivée sur le site."),
                     ("Estimation de prix en ligne", "Un petit simulateur rassure le client et vous évite les appels « juste pour un prix »."),
                     ("Avant / après de vos chantiers", "Vos rénovations de salle de bain parlent pour vous, avec un curseur interactif.")],
    },
    {
        "slug": "site-internet-electricien-lyon", "job": "électricien", "title_job": "électricien", "demo": "artisan",
        "intro": "Mise aux normes, dépannage, borne de recharge : les particuliers comparent les électriciens en ligne avant de demander un devis. Un site professionnel inspire confiance et vous fait passer devant ceux qui n'ont qu'une fiche annuaire.",
        "features": [("Vos certifications en avant", "Qualifelec, IRVE, RGE : affichez vos labels, c'est un argument décisif pour vos clients."),
                     ("Demande de devis simplifiée", "Un formulaire court qui arrive directement dans votre boîte mail, avec le type de travaux."),
                     ("Zone d'intervention claire", "Les communes que vous couvrez, avec une carte : vous recevez des demandes près de chez vous."),
                     ("Galerie de réalisations", "Tableaux électriques, éclairages, bornes : montrez la qualité de votre travail.")],
    },
    {
        "slug": "site-internet-restaurant-lyon", "job": "restaurant", "title_job": "restaurant", "demo": "restaurant",
        "intro": "Avant de réserver, vos clients regardent la carte, les photos et les horaires. Un site élégant et rapide donne envie de venir, là où une simple page d'annuaire ne montre rien de votre ambiance.",
        "features": [("Carte en ligne facile à mettre à jour", "Entrées, plats, desserts, menu du midi : vos clients consultent la carte sur leur téléphone."),
                     ("Réservation de table", "Un formulaire de réservation ou un lien vers votre outil habituel, visible partout sur le site."),
                     ("Galerie qui donne faim", "Vos plats et votre salle mis en valeur, avec des photos optimisées pour un affichage rapide."),
                     ("Horaires et accès", "Horaires, plan Google Maps et bouton itinéraire : zéro client perdu en route.")],
    },
    {
        "slug": "site-internet-coiffeur-lyon", "job": "coiffeur", "title_job": "salon de coiffure", "demo": "coiffure",
        "intro": "Vos clientes cherchent un salon près de chez elles, regardent vos réalisations et vos prix, puis réservent. Un site à votre image, avec vos tarifs et la prise de rendez-vous, vous rend indépendant des plateformes.",
        "features": [("Tarifs clairs par catégorie", "Femme, homme, couleur, soins : vos prix bien présentés rassurent avant la réservation."),
                     ("Prise de rendez-vous en ligne", "Vos clientes réservent à toute heure, ou via le lien de votre outil de réservation actuel."),
                     ("Lookbook de vos réalisations", "Balayages, coupes, chignons : vos plus belles photos en galerie."),
                     ("Votre univers, pas celui d'une plateforme", "Vos couleurs, votre nom, votre histoire : un site qui vous ressemble.")],
    },
    {
        "slug": "site-internet-garage-lyon", "job": "garage", "title_job": "garage automobile", "demo": "garage",
        "intro": "Un automobiliste qui a un voyant allumé cherche un garage proche, honnête et rapide. Avec un site qui affiche vos services, vos prix indicatifs et la prise de rendez-vous, c'est vous qu'il appelle.",
        "features": [("Devis express en ligne", "Plaque d'immatriculation + intervention : une estimation immédiate qui déclenche la prise de contact."),
                     ("Services et tarifs indicatifs", "Vidange, freins, pneus, diagnostic : la transparence sur les prix fait venir les clients."),
                     ("Rendez-vous en ligne", "Le client choisit son jour, vous le rappelez pour confirmer l'heure de dépôt."),
                     ("Toutes marques mises en avant", "Montrez les marques que vous entretenez et vos engagements (garantie, véhicule de prêt).")],
    },
    {
        "slug": "site-internet-artisan-batiment-lyon", "job": "artisan du bâtiment", "title_job": "artisan du bâtiment (maçon, peintre, menuisier)", "demo": "artisan",
        "intro": "Maçons, peintres, menuisiers, carreleurs : les particuliers choisissent l'artisan qui montre ses chantiers et inspire confiance. Un site avec vos réalisations et vos garanties vous apporte des demandes de devis qualifiées.",
        "features": [("Vos chantiers en photos", "Avant / après, rénovations, extensions : vos réalisations sont votre meilleur argument."),
                     ("Garanties et assurances", "Décennale, RGE, années d'expérience : affichez ce qui rassure vos clients."),
                     ("Demande de devis en ligne", "Le client décrit son projet et vous envoie ses photos directement."),
                     ("Zone d'intervention", "Les communes où vous travaillez, pour recevoir des demandes proches de vos chantiers.")],
    },
]

HEAD = """<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <link rel="canonical" href="{url}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
  <meta name="theme-color" content="#0f1117">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:site_name" content="Vortex">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{site}/assets/img/og-image.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="preload" href="/assets/fonts/syne-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/css/fonts.css?v={vf}">
  <link rel="stylesheet" href="/assets/css/style.css?v={vc}">
  <script type="application/ld+json">{ld}</script>
</head>
<body class="local-page">
  <div class="scroll-progress" aria-hidden="true"><span></span></div>
  <header class="header" id="header">
    <div class="container header__inner">
      <a href="/" class="logo" aria-label="Vortex, accueil">
        <svg class="logo__mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3a13 13 0 0 1 12.2 8.5" /><path d="M29 16a13 13 0 0 1-8.5 12.2" /><path d="M16 29A13 13 0 0 1 3.8 20.5" /><path d="M3 16a13 13 0 0 1 8.5-12.2" /><circle cx="16" cy="16" r="4.5" /></svg>
        <span>vortex</span>
      </a>
      <nav class="header__nav" aria-label="Navigation principale">
        <a href="/#services">Services</a>
        <a href="/#realisations">Réalisations</a>
        <a href="/#offre">Offre</a>
        <a href="/#faq">FAQ</a>
        <a href="/#contact">Contact</a>
      </nav>
      <a href="/#contact" class="btn btn--primary btn--sm" data-magnetic>Demander mon site</a>
    </div>
  </header>
"""

ARROW = '<svg class="arrow" viewBox="0 0 12 12"><path d="M3 9l6-6M4 3h5v5"/></svg>'


def demo_block(key):
    name, url, img, desc = DEMOS[key]
    return f"""
    <section class="local-demo">
      <div class="container">
        <article class="project" data-reveal>
          <a href="{url}" class="project__visual" target="_blank" rel="noopener" aria-label="Ouvrir le site de démonstration {html.escape(name)}">
            <div class="project__frame" data-tilt-frame>
              <div class="project__bar"><i></i><i></i><i></i><span>exemple · démo</span></div>
              <div class="project__shot"><img src="/{img}" width="1200" height="750" decoding="async" loading="lazy" alt="Aperçu du site de démonstration {html.escape(name)}"></div>
            </div>
            <span class="project__open">Voir l'exemple {ARROW}</span>
          </a>
          <div class="project__text">
            <span class="tag">Exemple de réalisation</span>
            <h2 class="local-h2">{html.escape(name)}</h2>
            <p>Site de démonstration pour un {html.escape(desc)}. C'est ce type de site que nous créons pour vous, avec vos textes, vos photos et vos couleurs.</p>
            <a href="{url}" class="btn btn--primary" target="_blank" rel="noopener" data-magnetic>Voir l'exemple {ARROW}</a>
          </div>
        </article>
      </div>
    </section>"""


def offer_block(where):
    return f"""
    <section class="local-offer">
      <div class="container local-offer__grid">
        <div data-reveal>
          <h2 class="title title--light">Votre site clé en main <em>dès 250 €.</em></h2>
          <p class="muted muted--dark">Un prix fixe, annoncé dès le départ, pour les professionnels {where}.</p>
        </div>
        <ul class="incl local-offer__list" data-reveal style="--d:.1s">
          <li>Design sur mesure, moderne et animé</li>
          <li>Adapté au mobile et à la tablette</li>
          <li>Référencement de base sur Google</li>
          <li>Formulaire de contact vers votre e-mail</li>
          <li>Mise en ligne incluse</li>
          <li>Maintenance possible à 50 €/mois, sans engagement</li>
        </ul>
        <div class="local-offer__cta" data-reveal style="--d:.2s">
          <a href="/#contact" class="btn btn--primary btn--lg" data-magnetic>Demander mon site {ARROW}</a>
          <a href="{PAY}" class="btn btn--dark" rel="noopener">Payer en ligne · 250 €</a>
        </div>
      </div>
    </section>"""


def faq_block(items):
    body = "\n".join(
        f"""          <details class="faq__item">
            <summary>{html.escape(q)}<span class="faq__icon" aria-hidden="true"></span></summary>
            <div class="faq__answer"><p>{html.escape(a)}</p></div>
          </details>""" for q, a in items)
    return f"""
    <section class="faq">
      <div class="container faq__grid">
        <div class="faq__intro"><h2 class="title" data-split>Questions <em>fréquentes.</em></h2></div>
        <div class="faq__list">
{body}
        </div>
      </div>
    </section>"""


def links_block(current):
    cities = "".join(f'<a href="/{c["slug"]}/">Site web {c["city"]}</a>' for c in CITIES if c["slug"] != current)
    jobs = "".join(f'<a href="/{j["slug"]}/">Site {j["job"]}</a>' for j in JOBS if j["slug"] != current)
    return f"""
    <section class="local-links">
      <div class="container">
        <p class="local-links__t">Nous créons aussi des sites à</p>
        <div class="local-links__row">{cities}</div>
        <p class="local-links__t">Et pour chaque métier</p>
        <div class="local-links__row">{jobs}</div>
      </div>
    </section>"""


FOOT = """
  </main>
  <footer class="footer">
    <div class="container">
      <div class="footer__bottom">
        <div>
          <a href="/" class="logo logo--small" aria-label="Vortex, accueil">
            <svg class="logo__mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3a13 13 0 0 1 12.2 8.5" /><path d="M29 16a13 13 0 0 1-8.5 12.2" /><path d="M16 29A13 13 0 0 1 3.8 20.5" /><path d="M3 16a13 13 0 0 1 8.5-12.2" /><circle cx="16" cy="16" r="4.5" /></svg>
            <span>vortex</span>
          </a>
          <p class="footer__copy">© <span class="year">2026</span> Vortex. Tous droits réservés. · <a href="/mentions-legales.html">Mentions légales &amp; confidentialité</a></p>
        </div>
        <div class="footer__right"><span>📍 Givors · Lyon</span><a href="mailto:vortex.twitch.live@gmail.com">vortex.twitch.live@gmail.com</a></div>
      </div>
    </div>
  </footer>
  <script src="/assets/js/main.js?v={vj}"></script>
</body>
</html>
"""


def ld_for(title, desc, url, faq):
    return json.dumps([
        {"@context": "https://schema.org", "@type": "WebPage", "name": title, "description": desc, "url": url,
         "isPartOf": {"@type": "WebSite", "name": "Vortex", "url": SITE + "/"},
         "about": {"@id": SITE + "/#business"}},
        {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Accueil", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": title.split(" — ")[0], "item": url}]},
        {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq]},
    ], ensure_ascii=False)


def hero(kicker, h1_plain, h1_em, lead):
    return f"""
  <main id="top">
    <section class="local-hero">
      <div class="hero__grid" aria-hidden="true"></div>
      <div class="container local-hero__inner">
        <nav class="crumbs" aria-label="Fil d'Ariane"><a href="/">Accueil</a><span>›</span><span>{html.escape((h1_plain + ' ' + h1_em).strip().rstrip('.'))}</span></nav>
        <div class="pill" data-reveal><span class="pill__dot"></span>{kicker}</div>
        <h1 class="local-title" data-split>{html.escape(h1_plain)} <em>{html.escape(h1_em)}</em></h1>
        <p class="hero__lead" data-reveal style="--d:.35s">{lead}</p>
        <div class="hero__ctas" data-reveal style="--d:.5s">
          <a href="/#contact" class="btn btn--primary" data-magnetic>Demander mon site {ARROW}</a>
          <a href="/#realisations" class="btn btn--dark">Voir nos réalisations {ARROW}</a>
        </div>
      </div>
    </section>"""


def city_page(c):
    url = f"{SITE}/{c['slug']}/"
    title = f"Création de site web à {c['city']} ({c['cp'][:2]}) — Vortex, dès 250 €"
    desc = f"Création de site internet à {c['city']} pour artisans, restaurants et commerçants : site moderne, adapté au mobile et visible sur Google, dès 250 €."
    near = ", ".join(c["near"])
    faq = [
        (f"Combien coûte un site web à {c['city']} ?", "Un site vitrine clé en main coûte 250 € : design sur mesure, adaptation mobile, référencement de base, formulaire de contact et mise en ligne. Pour un projet plus complet, le devis est gratuit."),
        (f"Intervenez-vous autour de {c['city']} ?", f"Oui : {c['city']} et les communes voisines ({near}), ainsi que toute la métropole de Lyon. Tout peut aussi se faire à distance, par message ou e-mail."),
        ("Mon site sera-t-il visible sur Google ?", f"Chaque site est optimisé dès sa création (titres, vitesse, adaptation mobile, informations locales) pour les recherches à {c['city']} et aux alentours."),
        ("Et après la mise en ligne ?", "Vous pouvez souscrire la maintenance à 50 € par mois, sans engagement : mises à jour, sécurité, sauvegardes et petites modifications incluses."),
    ]
    body = hero(f"Création de sites web · {c['city']}", "Création de site web à", f"{c['city']}.",
                html.escape(c["intro"]))
    body += f"""
    <section class="local-text">
      <div class="container local-text__grid">
        <div data-reveal>
          <h2 class="title">Soyez trouvé par vos clients <em>à {html.escape(c['city'])}.</em></h2>
        </div>
        <div class="local-text__body" data-reveal style="--d:.1s">
          <p>{html.escape(c['local'])}</p>
          <p>Nous créons des sites pour tous les métiers de proximité : <strong>plombiers, électriciens, maçons, restaurants, coiffeurs, garages, commerces</strong>. Chaque site est rapide, adapté au téléphone, et pensé pour transformer une visite en appel ou en demande de devis.</p>
          <p>Nous intervenons à {html.escape(c['city'])} et aux alentours : <strong>{html.escape(near)}</strong>.</p>
        </div>
      </div>
    </section>
    <section class="local-steps">
      <div class="container">
        <h2 class="title title--light" data-split>Votre site en <em>3 étapes.</em></h2>
        <div class="local-steps__grid">
          <div data-reveal><b>01</b><h3>On échange</h3><p>Par message ou e-mail : votre activité, vos services, vos photos.</p></div>
          <div data-reveal style="--d:.1s"><b>02</b><h3>Maquette offerte</h3><p>Vous voyez votre site avant de payer quoi que ce soit.</p></div>
          <div data-reveal style="--d:.2s"><b>03</b><h3>Mise en ligne</h3><p>Votre site est publié et optimisé pour {html.escape(c['city'])}.</p></div>
        </div>
      </div>
    </section>"""
    body += demo_block(c["demo"]) + offer_block(f"de {c['city']}") + faq_block(faq) + links_block(c["slug"])
    return title, desc, url, faq, body


def job_page(j):
    url = f"{SITE}/{j['slug']}/"
    title = f"Site internet pour {j['job']} à Lyon — Vortex, dès 250 €"
    desc = f"Création de site internet pour {j['title_job']} à Lyon et alentours : site moderne, visible sur Google et pensé pour recevoir des demandes, dès 250 €."
    faq = [
        (f"Combien coûte un site internet pour {j['job']} ?", "250 € pour un site vitrine clé en main : design sur mesure, adapté au mobile, référencement de base, formulaire de contact et mise en ligne. Pas de frais cachés."),
        ("Je n'ai pas le temps de m'en occuper, comment ça se passe ?", "Vous nous envoyez vos services et quelques photos par message ; on s'occupe de tout le reste et on vous montre une maquette avant tout paiement."),
        ("Pourrai-je modifier mon site ensuite ?", "Oui : avec la maintenance à 50 € par mois (sans engagement), vos modifications, mises à jour et sauvegardes sont incluses."),
        ("Intervenez-vous en dehors de Lyon ?", "Oui : Givors, Villeurbanne, Vénissieux, Grigny, Brignais et toute la région lyonnaise. Tout se fait facilement à distance."),
    ]
    feats = "\n".join(f'          <article class="scard" data-reveal style="--d:{i*0.08:.2f}s"><h3>{html.escape(t)}</h3><p>{html.escape(d)}</p></article>' for i, (t, d) in enumerate(j["features"]))
    body = hero(f"Site internet · {j['title_job'][0].upper() + j['title_job'][1:]}", f"Le site internet des {j['job']}s" if not j['job'].endswith(('s', 'x')) and ' ' not in j['job'] else f"Le site internet pour {j['job']}", "à Lyon.", html.escape(j["intro"]))
    body += f"""
    <section class="local-feats">
      <div class="container">
        <h2 class="title" data-split>Ce que votre site <em>fait pour vous.</em></h2>
        <div class="local-feats__grid">
{feats}
        </div>
      </div>
    </section>"""
    body += demo_block(j["demo"]) + offer_block(f"({j['job']}s et artisans de la région lyonnaise)" if j['job'] != 'artisan du bâtiment' else "du bâtiment de la région lyonnaise") + faq_block(faq) + links_block(j["slug"])
    return title, desc, url, faq, body


def write(slug, title, desc, url, faq, body):
    os.makedirs(slug, exist_ok=True)
    page = HEAD.format(title=html.escape(title), desc=html.escape(desc), url=url, site=SITE, vf=V_FONTS, vc=V_CSS,
                       ld=ld_for(title, desc, url, faq)) + body + FOOT.format(vj=V_JS)
    open(os.path.join(slug, "index.html"), "w").write(page)


def main():
    slugs = []
    for c in CITIES:
        write(c["slug"], *city_page(c)); slugs.append(c["slug"])
    for j in JOBS:
        write(j["slug"], *job_page(j)); slugs.append(j["slug"])
    # sitemap
    urls = [("", "1.0"), ("mentions-legales.html", "0.3")] + [(s + "/", "0.8") for s in slugs]
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    xml += "".join(f"  <url><loc>{SITE}/{u}</loc><lastmod>{TODAY}</lastmod><priority>{p}</priority></url>\n" for u, p in urls)
    xml += "</urlset>\n"
    open("sitemap.xml", "w").write(xml)
    print(len(slugs), "pages")


if __name__ == "__main__":
    main()
