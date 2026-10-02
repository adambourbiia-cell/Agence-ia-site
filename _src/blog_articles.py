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
]
