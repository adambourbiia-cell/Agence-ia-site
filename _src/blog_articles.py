# Articles du blog Vortex (/blog/). Le corps est en HTML simple : <h2>, <p>, <ul>, <ol>, <strong>, <a>.
# Pour ajouter un article : copier un bloc, changer le slug, puis lancer  python3 _src/gen_local_pages.py

ARTICLES = [
    {
        "slug": "prix-site-internet-artisan",
        "date": "2026-10-02",
        "title": "Combien coûte un site internet pour un artisan en 2026 ?",
        "h1": ("Combien coûte un site internet", "pour un artisan ?"),
        "desc": "Prix d'un site internet pour un artisan ou un commerce : site gratuit, agence, freelance… Les vrais tarifs, ce qui est inclus et les coûts cachés à éviter.",
        "excerpt": "De 0 à plus de 5 000 € : on fait le point sur les vrais prix, ce qui est inclus et les coûts cachés.",
        "read": 5,
        "cta": ("/tarif/", "Calculer le prix de mon site"),
        "body": """
<p>« C'est combien, un site ? » C'est la première question que se posent les artisans, restaurateurs et commerçants. Et les réponses trouvées sur internet vont de « gratuit » à « 10 000 € ». Voici comment s'y retrouver.</p>

<h2>Les 3 grandes options et leurs prix</h2>
<h3>1. Le faire soi-même (Wix, Squarespace, WordPress…)</h3>
<p>Les créateurs de sites en ligne affichent des abonnements à partir de quelques euros par mois, souvent <strong>entre 10 et 30 € par mois</strong> pour avoir votre propre nom de domaine et retirer les publicités. Sur plusieurs années, la facture dépasse vite celle d'un site fait par un professionnel.</p>
<p>Le vrai coût, c'est surtout <strong>votre temps</strong> : choisir un modèle, écrire les textes, retoucher les photos, régler le référencement… Comptez plusieurs soirées ou week-ends. Et le résultat ressemble souvent à un modèle vu mille fois.</p>

<h3>2. Une agence web classique</h3>
<p>Pour un site vitrine, les agences annoncent généralement <strong>de 1 500 à 5 000 €</strong>, parfois plus. Le résultat est soigné, mais les délais sont longs et chaque modification est facturée en plus. C'est adapté aux entreprises qui ont un vrai budget marketing, beaucoup moins à un artisan qui démarre.</p>

<h3>3. Un indépendant ou une petite agence locale</h3>
<p>C'est souvent le meilleur compromis : un site professionnel, sur mesure, pour <strong>quelques centaines d'euros</strong>, avec un interlocuteur que vous pouvez joindre facilement. Chez Vortex, par exemple, le site vitrine clé en main est à <strong>250 € prix fixe</strong>.</p>

<h2>Ce qui doit être inclus dans le prix</h2>
<p>Avant de comparer deux devis, vérifiez que ces éléments sont bien compris :</p>
<ul>
<li><strong>Le design adapté au téléphone</strong> : la grande majorité de vos clients vous cherchent sur mobile.</li>
<li><strong>Le référencement de base</strong> : titres, descriptions, vitesse, pour que Google comprenne votre activité et votre ville.</li>
<li><strong>Un formulaire de contact</strong> et un bouton d'appel visible.</li>
<li><strong>La mise en ligne</strong> : hébergement et configuration du nom de domaine.</li>
<li><strong>Vos textes et vos photos intégrés</strong>, pas des textes « lorem ipsum » à remplir vous-même.</li>
</ul>

<h2>Les coûts cachés à surveiller</h2>
<ul>
<li><strong>Le nom de domaine</strong> (votre-entreprise.fr) : environ 10 € par an. À votre nom, toujours.</li>
<li><strong>L'hébergement</strong> : parfois gratuit pour un site simple, parfois facturé chaque mois.</li>
<li><strong>Les modifications</strong> : changer des horaires ou un tarif ne devrait pas coûter 80 € à chaque fois.</li>
<li><strong>Les options</strong> : réservation en ligne, galerie photos, pages supplémentaires… Demandez le prix à l'avance.</li>
</ul>

<h2>Un site, ça rapporte combien ?</h2>
<p>Faites le calcul à l'envers : si votre site vous apporte <strong>un seul nouveau client par mois</strong>, combien cela représente-t-il pour vous ? Pour un plombier, un seul dépannage couvre souvent le prix du site. Pour un restaurant, ce sont quelques tables de plus chaque semaine.</p>

<h2>En résumé</h2>
<p>Pour un artisan ou un commerce local, un site vitrine professionnel n'a pas besoin de coûter des milliers d'euros. L'important : un prix clair dès le départ, un site rapide sur téléphone, et quelqu'un qui s'occupe de tout.</p>
<p>👉 Envie de connaître le prix exact de votre site ? <a href="/tarif/">Cochez vos options sur notre calculateur</a> : le prix s'affiche en direct.</p>
""",
    },
    {
        "slug": "site-internet-ou-page-facebook",
        "date": "2026-10-02",
        "title": "Site internet ou page Facebook : faut-il vraiment les deux ?",
        "h1": ("Site internet ou page Facebook :", "faut-il les deux ?"),
        "desc": "Une page Facebook suffit-elle pour un artisan ou un commerce ? Les différences avec un site internet, et pourquoi les deux se complètent pour trouver de nouveaux clients.",
        "excerpt": "Facebook, c'est gratuit. Alors pourquoi payer un site ? La réponse tient en un mot : Google.",
        "read": 4,
        "cta": ("/mon-site/", "Voir mon futur site en 10 s"),
        "body": """
<p>Beaucoup d'artisans et de commerçants nous disent : « J'ai déjà une page Facebook, ça suffit, non ? ». C'est une bonne question. Facebook est gratuit, facile, et vos habitués vous y suivent. Mais il y a une limite importante.</p>

<h2>Vos nouveaux clients ne vous cherchent pas sur Facebook</h2>
<p>Quand quelqu'un a une fuite d'eau, une envie de pizza ou besoin d'une coupe, il ne va pas sur Facebook. Il tape sur Google : <strong>« plombier Givors »</strong>, <strong>« restaurant Grigny »</strong>, <strong>« coiffeur près de moi »</strong>.</p>
<p>Une page Facebook ressort rarement dans ces recherches. Un site internet, lui, est fait pour ça : chaque page peut cibler votre métier et votre ville.</p>

<h2>Ce que Facebook fait bien</h2>
<ul>
<li>Garder le contact avec vos clients actuels.</li>
<li>Partager vos actualités, promotions et photos du quotidien.</li>
<li>Recevoir des messages rapidement.</li>
</ul>

<h2>Ce qu'un site fait mieux</h2>
<ul>
<li><strong>Être trouvé sur Google</strong> par des gens qui ne vous connaissent pas encore.</li>
<li><strong>Inspirer confiance</strong> : un site propre fait plus sérieux qu'une page avec 3 publications en 2021.</li>
<li><strong>Présenter clairement</strong> vos services, vos tarifs, votre zone d'intervention et vos horaires.</li>
<li><strong>Vous appartenir</strong> : Facebook peut changer ses règles, limiter la visibilité de vos publications ou bloquer un compte. Votre site, lui, reste à vous.</li>
<li><strong>Toucher tout le monde</strong>, y compris les personnes qui n'ont pas Facebook.</li>
</ul>

<h2>La bonne stratégie : les deux, chacun son rôle</h2>
<p>Le site est votre <strong>vitrine permanente</strong> : il attire les nouveaux clients via Google. Facebook (ou Instagram) est votre <strong>lien avec les habitués</strong>. Mettez le lien de votre site sur Facebook, et un bouton vers Facebook sur votre site : les deux se renforcent.</p>

<h2>Et la fiche Google, dans tout ça ?</h2>
<p>Votre fiche Google (celle qui apparaît dans Google Maps) est le troisième pilier, et elle est gratuite. Un site bien fait, relié à votre fiche Google, améliore vos chances d'apparaître dans le « pack local », les 3 entreprises affichées en haut des résultats. On en parle dans <a href="/blog/fiche-google-apparaitre-google-maps/">notre article sur la fiche Google</a>.</p>

<p>👉 Curieux de voir à quoi ressemblerait votre site ? <a href="/mon-site/">Tapez le nom de votre entreprise ici</a>, il s'affiche en 10 secondes.</p>
""",
    },
    {
        "slug": "avoir-plus-avis-google",
        "date": "2026-10-02",
        "title": "Comment avoir plus d'avis Google (sans tricher) ?",
        "h1": ("Comment avoir plus", "d'avis Google ?"),
        "desc": "6 méthodes simples et autorisées pour obtenir plus d'avis Google quand on est artisan, restaurateur ou commerçant. Ce qu'il faut faire, et ce que Google interdit.",
        "excerpt": "Vos clients sont contents mais ne laissent pas d'avis ? 6 méthodes simples, et ce qu'il ne faut surtout pas faire.",
        "read": 5,
        "cta": ("/avis/", "Découvrir Vortex Avis"),
        "body": """
<p>Les avis Google sont souvent la première chose qu'un client regarde avant de vous appeler. Entre une entreprise avec 4 avis et une autre avec 60, le choix est vite fait. Bonne nouvelle : la plupart de vos clients satisfaits sont prêts à en laisser un… si vous leur demandez au bon moment, de la bonne façon.</p>

<h2>1. Demandez, tout simplement</h2>
<p>C'est la raison n°1 du manque d'avis : on ne demande pas. Un client content ne pense pas à laisser un avis tout seul. Une phrase suffit : « Si vous êtes satisfait, un petit avis Google m'aiderait beaucoup. »</p>

<h2>2. Au bon moment : juste après la prestation</h2>
<p>Le meilleur moment, c'est quand le client est content : le chantier vient d'être terminé, le repas était bon, la coupe est réussie. Une semaine plus tard, l'enthousiasme est retombé.</p>

<h2>3. Envoyez le lien direct</h2>
<p>Chaque étape en plus fait perdre des avis. Ne dites pas « cherchez-nous sur Google ». Envoyez le <strong>lien direct</strong> qui ouvre la fenêtre d'avis. Vous le trouvez dans votre fiche Google : « Demander des avis » ou « Partager le formulaire d'avis ».</p>

<h2>4. Par SMS ou WhatsApp, pas par e-mail</h2>
<p>Un SMS est lu presque immédiatement, un e-mail finit souvent oublié. Un message court, personnalisé avec le prénom du client et le lien, fonctionne très bien.</p>

<h2>5. Un QR code sur place</h2>
<p>Au comptoir, sur la table, sur la facture ou sur votre carte de visite : un QR code qui mène directement à la page d'avis. Le client scanne pendant qu'il attend.</p>

<h2>6. Répondez à tous les avis</h2>
<p>Remerciez pour les avis positifs, répondez calmement aux négatifs. Les futurs clients lisent vos réponses, et ça montre que vous êtes sérieux.</p>

<h2>Ce que Google interdit</h2>
<ul>
<li><strong>Offrir une récompense</strong> en échange d'un avis (réduction, cadeau, café offert).</li>
<li><strong>Demander uniquement aux clients contents</strong> en filtrant les autres.</li>
<li><strong>Acheter de faux avis</strong> ou en écrire soi-même.</li>
</ul>
<p>Google peut supprimer ces avis, et dans les cas graves, afficher un avertissement sur votre fiche. En France, les faux avis sont aussi une pratique commerciale trompeuse. Ça ne vaut pas le risque.</p>

<h2>Gagner du temps</h2>
<p>Le plus dur, c'est d'y penser à chaque client. C'est pour ça qu'on a créé <a href="/avis/">Vortex Avis</a> : vous tapez le prénom et le numéro du client, l'application envoie la demande par SMS ou WhatsApp avec votre lien, et vous rappelle de relancer ceux qui n'ont pas répondu. 10 secondes par client.</p>
""",
    },
    {
        "slug": "fiche-google-apparaitre-google-maps",
        "date": "2026-10-02",
        "title": "Fiche Google : 7 réglages pour apparaître dans Google Maps",
        "h1": ("Fiche Google : 7 réglages", "pour apparaître dans Maps"),
        "desc": "Comment optimiser votre fiche Google (Google Business Profile) pour apparaître dans Google Maps et le pack local : catégories, photos, horaires, avis, site internet. Guide simple pour artisans et commerces.",
        "excerpt": "Votre fiche Google est gratuite et c'est souvent elle qui vous ramène le plus d'appels. 7 réglages à vérifier aujourd'hui.",
        "read": 5,
        "cta": ("/audit/", "Faire l'audit Google gratuit"),
        "body": """
<p>Quand on cherche « électricien Givors » ou « pizzeria Lyon 7 », Google affiche une carte avec 3 entreprises en haut. C'est le <strong>pack local</strong>, et c'est là que se jouent beaucoup d'appels. Pour y apparaître, tout part de votre <strong>fiche Google</strong> (Google Business Profile). Elle est gratuite. Voici 7 réglages à vérifier.</p>

<h2>1. Revendiquez et validez votre fiche</h2>
<p>Votre entreprise a peut-être déjà une fiche créée automatiquement. Cherchez-la sur Google Maps et cliquez sur « Vous êtes le propriétaire ? ». Sans validation, vous ne pouvez rien modifier.</p>

<h2>2. Choisissez la bonne catégorie principale</h2>
<p>C'est l'un des réglages les plus importants. Soyez précis : « Plombier » plutôt que « Entreprise de construction », « Pizzeria » plutôt que « Restaurant ». Ajoutez ensuite des catégories secondaires pour vos autres activités.</p>

<h2>3. Nom, adresse, téléphone : identiques partout</h2>
<p>Votre nom, votre adresse et votre numéro doivent être <strong>exactement les mêmes</strong> sur votre fiche, votre site, Facebook et les annuaires. Les incohérences sèment le doute, chez Google comme chez vos clients.</p>

<h2>4. Indiquez votre zone d'intervention</h2>
<p>Si vous vous déplacez chez vos clients (artisans, dépanneurs), renseignez les villes que vous couvrez. Si vous recevez du public, vérifiez que le repère sur la carte est au bon endroit.</p>

<h2>5. Ajoutez de vraies photos, régulièrement</h2>
<p>Votre devanture, votre équipe, vos chantiers, vos plats. Des photos récentes et authentiques rassurent bien plus qu'une image de banque d'images. Ajoutez-en quelques-unes chaque mois.</p>

<h2>6. Horaires à jour et publications</h2>
<p>Rien de pire qu'un client qui se déplace pour trouver porte close. Pensez aux horaires des jours fériés et des vacances. Publiez aussi une actualité de temps en temps (une offre, un chantier terminé) : ça montre que l'entreprise est active.</p>

<h2>7. Reliez un vrai site internet</h2>
<p>Le lien « Site Web » de votre fiche compte. Un site rapide, qui reprend votre métier et votre ville, aide Google à comprendre ce que vous faites et où. Une fiche sans site, ou reliée à une simple page Facebook, est souvent moins bien placée face à la concurrence.</p>

<h2>Et les avis ?</h2>
<p>Le nombre d'avis, leur note et leur fraîcheur pèsent aussi beaucoup. On a écrit un guide dédié : <a href="/blog/avoir-plus-avis-google/">comment avoir plus d'avis Google sans tricher</a>.</p>

<p>👉 Vous voulez savoir où vous en êtes ? Faites <a href="/audit/">notre audit Google gratuit</a> : 10 questions, un score sur 100 et vos priorités.</p>
""",
    },
    {
        "slug": "appels-manques-artisan",
        "date": "2026-10-02",
        "title": "Appels manqués : combien ça coûte vraiment à un artisan ?",
        "h1": ("Appels manqués : combien", "ça vous coûte ?"),
        "desc": "Sur un chantier, sous une voiture ou en rendez-vous, impossible de décrocher. Combien rapportent les appels manqués d'un artisan, et 5 solutions pour ne plus perdre de clients.",
        "excerpt": "Un appel manqué, c'est souvent un client qui appelle le concurrent suivant. Faites le calcul, puis voyez les solutions.",
        "read": 4,
        "cta": ("/repondeur/demo/", "Tester l'AI Répondeur en direct"),
        "body": """
<p>Vous êtes sur un toit, les mains dans un moteur ou en pleine coupe. Le téléphone sonne. Vous rappellerez plus tard. Sauf que plus tard, le client a déjà appelé quelqu'un d'autre.</p>

<h2>Pourquoi un appel manqué est souvent un client perdu</h2>
<p>Beaucoup de gens ne laissent pas de message sur un répondeur. Quand ils ont un besoin (une fuite, une panne, une envie de réserver), ils passent simplement au numéro suivant dans les résultats Google. Le premier qui décroche a de bonnes chances de remporter le client.</p>

<h2>Faites le calcul pour votre entreprise</h2>
<p>Prenez trois chiffres :</p>
<ol>
<li>Le nombre d'appels que vous manquez par semaine (regardez votre journal d'appels).</li>
<li>La part de ces appels qui sont de vrais nouveaux clients (disons 1 sur 3).</li>
<li>Ce que vous rapporte un client en moyenne.</li>
</ol>
<p>Exemple : 6 appels manqués par semaine, dont 2 nouveaux clients, à 150 € le client. Si vous en perdez seulement la moitié, cela fait <strong>150 € par semaine</strong>, soit <strong>plus de 600 € par mois</strong> qui partent chez la concurrence.</p>
<p>Notre <a href="/repondeur/#simulateur">simulateur</a> fait le calcul pour vous avec vos propres chiffres.</p>

<h2>5 solutions, de la plus simple à la plus efficace</h2>
<h3>1. Un message de répondeur clair</h3>
<p>Gratuit. Indiquez quand vous rappelez et invitez à laisser nom, numéro et motif. Mieux que rien, mais beaucoup de gens raccrochent quand même.</p>
<h3>2. Le SMS automatique « Je vous rappelle »</h3>
<p>Certains téléphones et applications permettent de répondre automatiquement par SMS. Le client sait que vous l'avez vu.</p>
<h3>3. Un bouton de contact écrit sur votre site</h3>
<p>Formulaire ou WhatsApp : le client peut décrire son besoin sans attendre que vous décrochiez.</p>
<h3>4. Un secrétariat téléphonique</h3>
<p>Une personne répond à votre place. Efficace, mais souvent coûteux et limité aux heures de bureau.</p>
<h3>5. Une assistante téléphonique IA</h3>
<p>Elle décroche 24h/24, parle naturellement, comprend la demande (qui, quoi, où, urgent ou non) et vous l'envoie <strong>par SMS en quelques secondes</strong>. Vous rappelez le client quand vous êtes disponible, en sachant déjà ce qu'il veut. Vous gardez votre numéro habituel : seuls les appels que vous ne prenez pas lui sont renvoyés.</p>

<p>👉 C'est ce que fait l'<a href="/repondeur/">AI Répondeur de Vortex</a>. <a href="/repondeur/demo/">Testez la démo en direct</a> : vous parlez à l'assistante depuis votre navigateur, et vous voyez le SMS qu'elle enverrait.</p>
""",
    },
    {
        "slug": "site-internet-restaurant",
        "date": "2026-10-03",
        "title": "Site internet pour restaurant : les 7 éléments indispensables",
        "h1": ("Site de restaurant :", "les 7 indispensables"),
        "desc": "Ce que doit absolument contenir le site internet d'un restaurant pour remplir les tables : menu lisible sur mobile, photos, réservation, horaires, avis. Guide simple pour restaurateurs.",
        "excerpt": "Vos futurs clients décident en 10 secondes, sur leur téléphone. Voici ce qu'ils doivent trouver tout de suite.",
        "read": 5,
        "cta": ("/demo/restaurant/", "Voir un exemple de site de restaurant"),
        "body": """
<p>Avant de pousser la porte d'un restaurant, la plupart des clients regardent sur leur téléphone : la carte, les photos, les prix, les horaires. Si l'information est introuvable ou illisible, ils passent au restaurant suivant. Voici les 7 éléments qui font la différence.</p>

<h2>1. Un menu lisible sur téléphone</h2>
<p>Le menu en PDF à télécharger est la première cause d'abandon : il faut zoomer, il charge lentement. Un menu écrit directement sur la page, avec les prix, se lit en un coup d'œil et Google peut le comprendre (et vous faire apparaître sur « pizza 4 fromages Lyon 7 »).</p>

<h2>2. De vraies photos qui donnent faim</h2>
<p>Vos plats, votre salle, votre terrasse, votre équipe. Des photos lumineuses prises au téléphone valent mieux que des images de banque d'images que les clients reconnaissent tout de suite.</p>

<h2>3. Les horaires, à jour</h2>
<p>Rien ne coûte plus cher qu'un client qui se déplace et trouve porte close. Affichez les horaires en haut de page, et pensez aux jours fériés et aux vacances.</p>

<h2>4. Un bouton « Réserver » ou « Appeler » toujours visible</h2>
<p>Sur mobile, le bouton d'appel ou de réservation doit rester accessible sans chercher. Un clic, et la table est réservée.</p>

<h2>5. L'adresse et l'itinéraire en un clic</h2>
<p>Un lien qui ouvre directement Google Maps ou Waze, avec l'information sur le stationnement ou le transport en commun le plus proche.</p>

<h2>6. Vos avis clients</h2>
<p>Mettre en avant quelques avis Google rassure ceux qui ne vous connaissent pas encore. Et pour en récolter plus, lisez <a href="/blog/avoir-plus-avis-google/">notre guide pour avoir plus d'avis Google</a>.</p>

<h2>7. Un site rapide</h2>
<p>Sur un réseau mobile moyen, chaque seconde d'attente fait fuir des visiteurs. Des images optimisées et un site léger, c'est la base.</p>

<h2>Et la commande en ligne ?</h2>
<p>Les plateformes de livraison prennent souvent une commission importante sur chaque commande. Un lien de commande ou de click &amp; collect sur votre propre site peut compléter ces plateformes, pour vos clients fidèles.</p>

<p>👉 Voyez à quoi pourrait ressembler votre site : <a href="/mon-site/">tapez le nom de votre restaurant ici</a>, l'aperçu s'affiche en 10 secondes.</p>
""",
    },
    {
        "slug": "site-internet-coiffeur-rendez-vous",
        "date": "2026-10-03",
        "title": "Coiffeur, esthéticienne : faut-il un site avec prise de rendez-vous ?",
        "h1": ("Salon de coiffure :", "un site, ça change quoi ?"),
        "desc": "Planity, Instagram, site internet : quel outil pour un salon de coiffure ou d'esthétique ? Avantages d'un site avec vos tarifs et la prise de rendez-vous en ligne.",
        "excerpt": "Planity, Instagram, site internet… Que faut-il vraiment à un salon pour remplir son agenda ?",
        "read": 4,
        "cta": ("/demo/coiffure/", "Voir un exemple de site de salon"),
        "body": """
<p>Beaucoup de salons de coiffure et d'instituts fonctionnent avec Instagram et une plateforme de réservation. C'est un bon début. Mais quand une nouvelle cliente cherche « coiffeur Grigny » ou « onglerie Vienne » sur Google, c'est souvent un site internet qui ressort.</p>

<h2>Instagram : idéal pour montrer, pas pour être trouvé</h2>
<p>Instagram est parfait pour montrer vos réalisations et fidéliser. Mais les nouvelles clientes qui cherchent sur Google tombent rarement sur un compte Instagram, et n'y trouvent pas facilement vos tarifs ou vos horaires.</p>

<h2>Les plateformes de réservation : pratiques, mais vous n'êtes pas chez vous</h2>
<p>Sur une plateforme, votre salon est affiché à côté de vos concurrents. Un site à votre nom vous présente seule, avec votre univers. Les deux se complètent très bien : votre site peut renvoyer vers votre agenda en ligne.</p>

<h2>Ce que doit contenir le site d'un salon</h2>
<ul>
<li><strong>Vos prestations et vos tarifs</strong>, clairs, par catégorie (coupe, couleur, soins…).</li>
<li><strong>Un bouton « Prendre rendez-vous »</strong> toujours visible.</li>
<li><strong>Vos réalisations</strong> en photos, l'équipe, l'ambiance du salon.</li>
<li><strong>L'adresse, les horaires, l'accès.</strong></li>
<li><strong>Vos avis</strong> clients.</li>
</ul>

<h2>Le vrai gain : moins d'appels pendant que vous travaillez</h2>
<p>Quand vos tarifs et votre agenda sont en ligne, vous recevez moins d'appels « juste pour savoir », souvent pendant une couleur ou un brushing. Les clientes réservent seules, même le soir.</p>

<p>👉 Envie de voir ce que ça donnerait ? <a href="/mon-site/">Tapez le nom de votre salon ici</a> et choisissez « Coiffure, beauté ».</p>
""",
    },
    {
        "slug": "site-internet-garage-automobile",
        "date": "2026-10-03",
        "title": "Site internet pour garage automobile : comment attirer plus de clients",
        "h1": ("Garage automobile :", "attirer plus de clients"),
        "desc": "Comment un garage ou une carrosserie peut attirer de nouveaux clients avec un site internet : services, devis en ligne, prise de rendez-vous, fiche Google et avis.",
        "excerpt": "Vidange, freins, carrosserie : vos clients comparent en ligne avant d'appeler. Voici comment être celui qu'ils choisissent.",
        "read": 4,
        "cta": ("/demo/garage/", "Voir un exemple de site de garage"),
        "body": """
<p>Quand une voiture fait un bruit bizarre ou que le contrôle technique approche, l'automobiliste cherche « garage près de chez moi ». Il compare deux ou trois garages en quelques minutes, puis il appelle. Voici comment faire partie de ceux qu'il appelle.</p>

<h2>1. Lister clairement vos services</h2>
<p>Entretien, vidange, freins, pneus, climatisation, diagnostic, carrosserie… Chaque service listé sur votre site est une recherche de plus sur laquelle Google peut vous montrer.</p>

<h2>2. Donner une idée des prix</h2>
<p>La première question des clients est « combien ça coûte ? ». Une fourchette de prix ou un formulaire de devis rapide filtre les demandes et vous évite des appels qui n'aboutissent pas.</p>

<h2>3. Permettre la prise de rendez-vous</h2>
<p>Un formulaire ou un bouton de rendez-vous permet au client de réserver le soir, quand le garage est fermé. Vous retrouvez les demandes le matin.</p>

<h2>4. Soigner votre fiche Google</h2>
<p>Pour un garage, la fiche Google est souvent la première impression : photos de l'atelier, horaires, avis. Suivez <a href="/blog/fiche-google-apparaitre-google-maps/">nos 7 réglages pour apparaître dans Google Maps</a>.</p>

<h2>5. Ne plus perdre les appels manqués</h2>
<p>Sous une voiture, impossible de décrocher. Chaque appel manqué peut être un client qui appelle le garage suivant. On a fait le calcul dans <a href="/blog/appels-manques-artisan/">cet article sur les appels manqués</a>.</p>

<p>👉 Voyez votre futur site : <a href="/mon-site/">tapez le nom de votre garage ici</a> et choisissez « Garage ».</p>
""",
    },
    {
        "slug": "refonte-site-internet",
        "date": "2026-10-03",
        "title": "Refonte de site internet : 6 signes qu'il est temps de refaire le vôtre",
        "h1": ("Refaire son site :", "les 6 signes qui ne trompent pas"),
        "desc": "Votre site internet a plus de 5 ans, s'affiche mal sur téléphone ou ne vous apporte aucun client ? 6 signes qu'une refonte s'impose, et combien ça coûte.",
        "excerpt": "Un vieux site peut faire plus de mal que pas de site du tout. 6 signes qu'il est temps de le refaire.",
        "read": 4,
        "cta": ("/tarif/", "Calculer le prix de ma refonte"),
        "body": """
<p>Un site internet vieillit vite. Celui qui était très bien il y a quelques années peut aujourd'hui faire fuir vos clients. Voici 6 signes qu'une refonte s'impose.</p>

<h2>1. Il s'affiche mal sur téléphone</h2>
<p>Texte minuscule, il faut zoomer, les boutons sont trop petits : la majorité de vos visiteurs arrivent sur mobile. Un site non adapté donne une image négligée et Google le classe moins bien.</p>

<h2>2. Il est lent</h2>
<p>Si votre site met plusieurs secondes à s'afficher, une partie des visiteurs partent avant même de le voir.</p>

<h2>3. Les informations ne sont plus à jour</h2>
<p>Anciens tarifs, horaires faux, services que vous ne faites plus, numéro de téléphone changé… Chaque erreur fait perdre confiance.</p>

<h2>4. Vous ne pouvez pas le modifier</h2>
<p>Le prestataire a disparu, vous n'avez pas les accès, chaque petite modification coûte cher. C'est le moment de repartir sur une base saine, avec un nom de domaine et des accès à votre nom.</p>

<h2>5. Il ne vous apporte aucun client</h2>
<p>Pas de demandes via le formulaire, pas d'appels qui viennent du site : il ne remplit pas son rôle. Souvent, c'est un problème de référencement ou de bouton d'action introuvable.</p>

<h2>6. Il n'est pas sécurisé</h2>
<p>Si votre navigateur affiche « Non sécurisé » à côté de l'adresse, vos visiteurs le voient aussi. Un site moderne est en HTTPS.</p>

<h2>Combien coûte une refonte ?</h2>
<p>Pour un site vitrine, une refonte coûte généralement le prix d'un site neuf : chez Vortex, 250 € clé en main, en reprenant vos textes et vos photos quand c'est possible. <a href="/tarif/">Le calculateur</a> vous donne le prix exact avec vos options.</p>
""",
    },
    {
        "slug": "choisir-nom-de-domaine",
        "date": "2026-10-03",
        "title": "Nom de domaine : comment bien le choisir pour son entreprise",
        "h1": ("Nom de domaine :", "bien le choisir"),
        "desc": "Comment choisir le nom de domaine de son entreprise : .fr ou .com, avec ou sans ville, pièges à éviter, prix et propriété. Guide simple pour artisans et commerçants.",
        "excerpt": ".fr ou .com ? Avec le nom de la ville ? À qui il appartient vraiment ? Les réponses simples.",
        "read": 4,
        "cta": ("/mon-site/", "Voir mon futur site en 10 s"),
        "body": """
<p>Le nom de domaine, c'est l'adresse de votre site : <strong>votre-entreprise.fr</strong>. Il apparaît sur vos cartes de visite, votre camion, vos factures. Voici comment bien le choisir.</p>

<h2>.fr ou .com ?</h2>
<p>Pour une entreprise qui travaille en France, le <strong>.fr</strong> est un excellent choix : il inspire confiance et il est souvent encore disponible. Le .com est très bien aussi, mais les noms courts sont souvent déjà pris.</p>

<h2>Court, simple, facile à dicter</h2>
<p>Imaginez que vous le donnez au téléphone. Évitez les tirets multiples, les chiffres, les orthographes compliquées. <em>plomberie-martin.fr</em> se dicte mieux que <em>plomb3rie-mrtn-69.fr</em>.</p>

<h2>Ajouter la ville ? Parfois</h2>
<p>Si le nom de votre entreprise est déjà pris, ajouter la ville est une bonne solution : <em>garage-dupont-givors.fr</em>. Ça aide aussi les clients à vous situer.</p>

<h2>Le piège à éviter : un domaine qui n'est pas à votre nom</h2>
<p>Votre nom de domaine doit être enregistré <strong>à votre nom</strong>, pas à celui de votre prestataire. Sinon, le jour où vous voulez changer de prestataire, vous risquez de perdre votre adresse. Exigez-le de votre prestataire, et demandez les accès.</p>

<h2>Combien ça coûte ?</h2>
<p>Un .fr coûte en général une dizaine d'euros par an chez les bureaux d'enregistrement comme OVH ou Gandi. Méfiez-vous des offres « gratuites » qui deviennent très chères au renouvellement.</p>

<h2>Et l'adresse e-mail ?</h2>
<p>Avec votre domaine, vous pouvez avoir une adresse comme <em>contact@votre-entreprise.fr</em>. C'est plus professionnel qu'une adresse gratuite, et vos clients s'en souviennent mieux.</p>

<p>👉 Avant même de choisir votre domaine, <a href="/mon-site/">voyez votre futur site en 10 secondes</a>.</p>
""",
    },
]
