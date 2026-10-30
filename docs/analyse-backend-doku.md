# Analyse backend — Doku

Date de l'analyse : 19 octobre 2026  
Périmètre : code présent dans `backend/`, configuration, migrations, tests et fichiers de déploiement versionnés.  
Méthode : lecture statique et contrôles non destructifs. Le contenu de `backend/.env` n'a pas été ouvert et aucun secret n'est reproduit ici.

## Sommaire

1. [Conclusion rapide](#conclusion-rapide)
2. [Technologies et architecture](#technologies-et-architecture)
3. [Dossiers et logique du projet](#dossiers-et-logique-du-projet)
4. [Routes API](#routes-api)
5. [Plan de mise à jour](#plan-de-mise-à-jour)
6. [Capacité et montée en charge](#capacité-et-montée-en-charge)
7. [Sécurité et confidentialité](#sécurité-et-confidentialité)
8. [Contrôles réalisés et limites](#contrôles-réalisés-et-limites)
9. [Recommandations finales](#recommandations-finales)

## Conclusion rapide

Le backend est un monolithe Django bien découpé par métier. L'authentification possède déjà de bonnes bases : mots de passe hachés avec Argon2, jeton d'accès court, refresh token HttpOnly avec rotation, limitation des tentatives et réponses d'erreur homogènes.

Il ne doit toutefois pas être exposé en production dans son état actuel. La configuration est encore une configuration de développement, une base SQLite et des images sont suivies par Git, et plusieurs règles importantes doivent être corrigées : isolation des catégories entre boutiques, invalidation des sessions après changement de mot de passe, exactitude du bénéfice, numérotation des tickets, synchronisation réelle et protection contre les doubles ventes lors d'une nouvelle tentative réseau.

**Résumé étape 1 — structure :** le découpage est clair et adapté à Doku ; les modules `sync`, quelques services et les tests métier restent largement incomplets.

**Résumé étape 2 — routes :** 24 chemins sont montés, dont 23 API. Les routes métier sont protégées par JWT, sauf les routes d'authentification et la sonde de santé.

**Résumé étape 3 — mises à jour :** les corrections P0 ci-dessous sont à faire avant toute mise en ligne ; elles concernent surtout les secrets, la confidentialité et l'intégrité des ventes.

**Résumé étape 4 — capacité :** SQLite rend le serveur mono-écrivain. Sans PostgreSQL, pagination et cache partagé, une montée en charge fiable n'est pas possible.

**Résumé étape 5 — sécurité :** le modèle de session est bon, mais les secrets et données versionnés, ainsi que la configuration de production manquante, sont des risques critiques.

## Technologies et architecture

| Sujet | État constaté |
|---|---|
| Langage | Python, cible Python 3.12 (`ruff.toml`) |
| Framework | Django 5.2.18 + Django REST Framework 3.18.3 |
| Authentification | `djangorestframework-simplejwt` 5.5.1 : access token JWT de 15 minutes et refresh token de 30 jours avec rotation et liste noire |
| Base active | SQLite, fichier local `backend/db.sqlite3` configuré dans `config/settings.py` |
| Base prévue | PostgreSQL 17 est défini dans `docker-compose.yml`, mais les réglages Django ne l'utilisent pas encore |
| Médias | Fichiers produits sur le disque local, sous `backend/media/` |
| Serveur | WSGI et ASGI sont présents ; Gunicorn est dans les dépendances, sans configuration de lancement versionnée |
| Cache / tâches | Aucun cache Django ni file de tâches asynchrones configurés dans le code inspecté |
| Hébergement | Non déterminable : aucun Dockerfile, Procfile, configuration Nginx, Kubernetes ou CI/CD n'est présent |

### Logique générale

Chaque commerçant possède un compte et une seule boutique. Cette boutique est la frontière de données : produits, catégories, mouvements de stock, ventes et taux de change doivent toujours lui appartenir.

```text
Compte utilisateur ── 1:1 ── Boutique
                               ├── Catégories ── Produits ── Mouvements de stock
                               ├── Taux de change
                               └── Ventes ── Lignes de vente

Client mobile → API Django → SQLite actuel / PostgreSQL prévu
```

Le code suit globalement le chemin suivant :

1. Une vue HTTP valide le jeton et reçoit la demande.
2. Un serializer vérifie la forme des données.
3. Le modèle ou un service applique la règle métier et écrit en base.
4. Une réponse JSON uniforme est renvoyée au frontend.

La synchronisation a des routes, mais son code actuel renvoie une réponse vide : il n'enregistre ni n'échange encore les données.

## Dossiers et logique du projet

| Dossier / fichier | Rôle | État observé |
|---|---|---|
| `backend/config/` | Réglages Django, routes racines, points d'entrée WSGI/ASGI | Centralise la sécurité, la base et les routes. Les réglages sont encore orientés développement. |
| `backend/accounts/` | Utilisateurs, boutique, connexion, inscription, refresh, déconnexion, profil | Partie la plus testée. Modèle `User` personnalisé avec téléphone comme identifiant et relation 1:1 avec `Shop`. |
| `backend/core/` | Devises, taux de change, format unique des erreurs | Les devises sont créées par migration. Les taux sont ajoutés à l'historique, sans modification. |
| `backend/catalog/` | Catégories, produits, archivage et image produit | CRUD principal disponible. Une validation d'appartenance de catégorie manque. |
| `backend/inventory/` | Journal des mouvements et vue du stock courant | Le stock est recalculé par somme de tous les mouvements. Correct pour un petit catalogue, coûteux à grande échelle. |
| `backend/sales/` | Création, consultation et annulation de ventes ; statistiques | Les prix de vente sont figés dans la ligne de vente. Le coût d'achat ne l'est pas encore, ce qui fausse le bénéfice historique. |
| `backend/sync/` | Contrat de synchronisation et sonde de santé | Structure présente, mais `push` et `pull` sont des réponses fictives sans transfert réel. |
| `backend/*/migrations/` | Historique versionné du schéma | Les migrations sont cohérentes avec les modèles : `makemigrations --check --dry-run` ne signale aucun écart. |
| `backend/*/tests/` | Tests automatisés | Bonne couverture d'authentification et des devises. Les tests catalogues, stock, ventes et synchronisation sont vides. |
| `backend/requirements/` | Dépendances de production et développement | PostgreSQL, Gunicorn, WhiteNoise et `django-environ` sont listés, mais pas tous configurés dans les réglages. |
| `backend/media/` | Images téléversées des produits | Stockage local ; deux images sont suivies dans Git. À sortir du dépôt. |
| `backend/db.sqlite3` | Base locale actuelle | Fichier suivi par Git. Il peut contenir des données personnelles et ne doit pas être versionné. |
| `docker-compose.yml` | Démarre PostgreSQL pour le développement | Ne contient que la base. Il n'orchestre ni l'API, ni les sauvegardes, ni les médias. |

> Note : « PII » signifie données personnelles identifiantes : nom, téléphone, e-mail, adresse de boutique ou image liée à une activité.

## Routes API

Préfixe commun : `/api/v1/`. Les UUID sont notés `{uuid}`. Dans cette version, un utilisateur connecté est le propriétaire de sa boutique ; aucun rôle métier distinct (caissier, gérant, etc.) n'est implémenté.

| Méthode | Chemin | Rôle | Authentification requise |
|---|---|---|---|
| Plusieurs | `/admin/` | Interface d'administration Django et sous-routes internes | Compte Django `is_staff`, session Django ; modèles métier non enregistrés à ce stade |
| POST | `/api/v1/auth/register/` | Créer un commerçant, sa boutique et ouvrir sa session | Non ; limité par adresse IP |
| POST | `/api/v1/auth/login/` | Ouvrir une session | Non ; limité par téléphone et adresse IP |
| POST | `/api/v1/auth/refresh/` | Renouveler l'access token | Cookie refresh + en-tête applicatif + origine de confiance ; pas de JWT nécessaire |
| POST | `/api/v1/auth/logout/` | Révoquer le refresh token et effacer le cookie | Cookie refresh facultatif + en-tête applicatif + origine de confiance |
| GET | `/api/v1/users/me/` | Lire le profil connecté | JWT |
| PATCH | `/api/v1/users/me/` | Modifier le profil connecté | JWT |
| POST | `/api/v1/users/me/password/` | Changer le mot de passe | JWT + mot de passe actuel |
| GET | `/api/v1/shops/me/` | Lire la boutique courante | JWT |
| PATCH | `/api/v1/shops/me/` | Modifier la boutique courante | JWT |
| GET | `/api/v1/exchange-rates/` | Lire l'historique des taux de la boutique | JWT |
| POST | `/api/v1/exchange-rates/` | Ajouter un nouveau taux USD → CDF | JWT |
| GET | `/api/v1/products/` | Lister les produits actifs de la boutique | JWT |
| POST | `/api/v1/products/` | Créer un produit et, si fourni, son mouvement de stock initial | JWT |
| GET | `/api/v1/products/{uuid}/` | Lire un produit | JWT |
| PATCH | `/api/v1/products/{uuid}/` | Modifier un produit | JWT |
| PATCH | `/api/v1/products/{uuid}/archive/` | Archiver un produit | JWT |
| GET | `/api/v1/categories/` | Lister les catégories actives et leur nombre de produits | JWT |
| POST | `/api/v1/categories/` | Créer une catégorie | JWT |
| PATCH | `/api/v1/categories/{uuid}/` | Renommer une catégorie | JWT |
| DELETE | `/api/v1/categories/{uuid}/` | Archiver logiquement une catégorie et détacher ses produits | JWT |
| GET | `/api/v1/stock/` | Lister le stock courant des produits actifs | JWT |
| GET | `/api/v1/products/{uuid}/stock-movements/` | Lire le journal de stock d'un produit | JWT |
| POST | `/api/v1/products/{uuid}/stock-movements/` | Ajouter un réapprovisionnement ou un ajustement | JWT |
| GET | `/api/v1/sales/` | Lister les ventes de la boutique, avec recherche de ticket | JWT |
| POST | `/api/v1/sales/` | Enregistrer une vente et ses sorties de stock | JWT |
| GET | `/api/v1/sales/{uuid}/` | Lire une vente et ses lignes | JWT |
| POST | `/api/v1/sales/{uuid}/cancel/` | Annuler une vente et réintégrer le stock | JWT |
| GET | `/api/v1/stats/summary/` | Lire chiffre d'affaires, coût, bénéfice et marge sur une période | JWT |
| GET | `/api/v1/stats/top-products/` | Lire les produits les plus vendus / rentables selon le calcul actuel | JWT |
| GET | `/api/v1/health/` | Vérifier que l'API répond | Non ; aucune donnée métier renvoyée |
| POST | `/api/v1/sync/push/` | Envoyer les données locales en attente | JWT ; actuellement sans effet métier |
| GET | `/api/v1/sync/pull/` | Récupérer les changements distants | JWT ; actuellement sans effet métier |

### Écarts visibles avec les besoins Doku

- `GET /api/v1/stats/daily/` est attendu par la documentation d'interface, mais n'existe pas dans le backend.
- La documentation évoque un journal global de stock ; le backend propose actuellement seulement le journal par produit (`/products/{uuid}/stock-movements/`).
- La synchronisation est annoncée au frontend mais ne transporte encore aucune donnée.

## Plan de mise à jour

### P0 — à traiter avant toute mise en ligne

| Priorité | Fichiers / zones | Problème | Correctif attendu |
|---|---|---|---|
| P0 | `config/settings.py`, environnement de déploiement | Les valeurs de sécurité sont écrites dans le code, `DEBUG` est actif, les hôtes autorisés sont vides et HTTPS/HSTS ne sont pas configurés. Le contrôle Django de déploiement remonte 7 avertissements. | Lire toutes les valeurs sensibles depuis les variables d'environnement ; générer et **faire tourner** la clé applicative ; `DEBUG=False`, hôtes explicites, HTTPS forcé derrière proxy connu, HSTS après validation, cookies de session/CSRF sécurisés. Faire échouer le démarrage s'il manque une variable critique. |
| P0 | Git, `backend/db.sqlite3`, `backend/media/`, `docker-compose.yml` | La base SQLite et deux images de produits sont suivies par Git. Le mot de passe PostgreSQL de développement est également versionné. Ces fichiers peuvent diffuser des PII ou faciliter l'accès à un environnement. | Retirer la base et les médias du suivi Git, les ajouter au `.gitignore`, faire nettoyer l'historique si le dépôt a été partagé, puis faire tourner les secrets concernés. Utiliser un gestionnaire de secrets ; ne jamais committer un mot de passe, même de test partagé. |
| P0 | `catalog/serializers.py` — `ProductSerializer` | La relation `category` utilise le queryset global par défaut. Un utilisateur connaissant l'UUID d'une catégorie d'une autre boutique peut l'associer à son produit : rupture d'isolation entre boutiques. | Dans le serializer, limiter le queryset de catégories à `request.user.shop` et `deleted_at__isnull=True`, ou valider explicitement l'appartenance dans `validate_category`. Ajouter un test avec deux boutiques. |
| P0 | `accounts/views.py` — `ChangePasswordView` | Après changement de mot de passe, les refresh tokens déjà émis restent utilisables pendant leur durée de vie. | Révoquer tous les refresh tokens existants de l'utilisateur, puis créer une nouvelle session sur l'appareil courant ou forcer une reconnexion. Tester le comportement. |
| P0 | `catalog/models.py`, `catalog/serializers.py`, `sales/views.py`, `sales/models.py` | Les prix d'achat/de vente n'ont pas de contrainte positive explicite. Le bénéfice utilise le prix d'achat actuel du produit au lieu du coût lors de la vente ; il devient faux après modification du produit et mélange USD/CDF. | Ajouter validations et contraintes non négatives. Ajouter `unit_cost` dans `SaleItem`, le remplir lors de la vente, puis calculer les statistiques devise par devise et la consolidation avec le taux enregistré par vente. Migrer les données existantes avec une règle documentée. |
| P0 | `sales/views.py` — numéro de ticket et création de vente | Le numéro de ticket est basé sur un compte global et peut entrer en collision lors de ventes simultanées. Un renvoi réseau peut aussi créer une deuxième vente. | Utiliser un compteur transactionnel par boutique ou un identifiant non devinable ; ajouter une clé d'idempotence unique par boutique pour `POST /sales/`. Répondre à la même requête répétée avec la vente existante. |

### P1 — fiabilité, synchronisation et performance

| Priorité | Fichiers / zones | Amélioration |
|---|---|---|
| P1 | `sync/models.py`, `sync/services.py`, `sync/views.py` | Implémenter un vrai journal de synchronisation : identifiant client, opération, version, date, état, erreur, curseur par boutique et stratégie de conflit. Ne pas déclarer « synchronisé » avant l'accusé réception du serveur. |
| P1 | `core/models.py` — `Mutable`, serializers et vues de catalogue | `updated_at` et `version` ne sont pas augmentés lors des modifications normales. Centraliser cette mise à jour dans le modèle/service, utiliser `transaction.atomic()` pour les opérations composées et prévoir la résolution de conflit de synchronisation. |
| P1 | `catalog/views.py` — suppression de catégorie ; création de produit | La suppression détache les produits puis archive la catégorie sans transaction. La création produit + stock initial devrait aussi être atomique. | Entourer chaque opération composée d'une transaction et ajouter des tests de rollback. |
| P1 | `inventory/views.py`, `sales/views.py`, modèles/migrations | Le stock est recalculé depuis tous les mouvements et aucun index métier composite ni pagination n'est prévu. | Conserver le journal immuable, mais ajouter un solde matérialisé transactionnel ou des agrégats, des index (`shop`, `product`, `created_at`), des filtres et une pagination cursor. |
| P1 | `sales/stats_views.py`, `sales/urls.py` | `days` n'est pas validé : texte invalide provoque une erreur serveur et une période énorme peut être coûteuse. La route quotidienne manque. | Créer un serializer de paramètres avec bornes, ajouter `GET /stats/daily/`, indexer les ventes par boutique/date et tester les périodes. |
| P1 | `config/settings.py`, infrastructure | SQLite, cache local et médias locaux ne sont pas adaptés à plusieurs processus ou machines. | Passer à PostgreSQL, Redis pour limitations et cache, stockage objet privé pour les images, Gunicorn/Uvicorn derrière un proxy TLS. |
| P1 | `catalog/serializers.py` — images | La vérification accepte le type HTTP déclaré par le client et une signature `RIFF` trop générale pour WebP. | Décoder réellement l'image avec Pillow/libvips, limiter dimensions et pixels, renommer côté serveur, stocker hors du webroot public, servir avec type et disposition contrôlés. |
| P1 | `REST_FRAMEWORK`, vues publiques | Chaque vue actuelle déclare bien ses permissions, mais aucune permission par défaut n'empêche un oubli sur une future vue. | Définir `DEFAULT_PERMISSION_CLASSES = [IsAuthenticated]`, puis déclarer explicitement `AllowAny` seulement sur inscription, connexion et santé. |

### P2 — qualité et exploitation

| Priorité | Fichiers / zones | Amélioration |
|---|---|---|
| P2 | `catalog/tests.py`, `inventory/tests.py`, `sales/tests.py`, `sync/tests.py` | Écrire les tests absents : isolation entre deux boutiques, images, stock insuffisant, ventes concurrentes, annulation, idempotence, statistiques, synchronisation et droits. |
| P2 | Tous les modules métier | `ruff check .` signale 85 erreurs, surtout lignes trop longues, imports inutilisés et instructions séparées par `;`. Reformer le code sans changer la logique pour le rendre relisible et maintenable. |
| P2 | Journalisation et opérations | Ajouter logs structurés sans PII, identifiant de corrélation, surveillance d'erreurs, métriques (latence, erreurs, synchronisation, stock négatif), alertes et procédure d'incident. |
| P2 | Admin Django | Enregistrer des modèles utiles, limiter l'accès réseau, utiliser MFA/SSO si disponible et documenter qui peut créer un administrateur. |

## Capacité et montée en charge

### Ce qui limite aujourd'hui

1. **SQLite n'accepte qu'une écriture à la fois.** Deux encaissements qui écrivent au même moment peuvent attendre, échouer avec un verrou ou ralentir tout le serveur. `select_for_update()` ne fournit pas la même protection avec SQLite qu'avec PostgreSQL.
2. **Les listes ne sont pas paginées.** L'API charge tous les produits, ventes, taux ou mouvements demandés. Plus l'historique grandit, plus la réponse devient lente et lourde pour le téléphone.
3. **Le stock est recalculé depuis tout l'historique.** Pour chaque produit, l'application additionne tous les mouvements ; la charge grandit continuellement.
4. **Le throttle est local au processus.** Sans Redis, plusieurs workers ou serveurs ne partagent pas les compteurs de connexion.
5. **Les images et la base sont sur le disque local.** Cela empêche le déploiement sur plusieurs instances et complique les sauvegardes.

### Estimation prudente

Ce ne sont pas des mesures de charge : aucun matériel, trafic réel ni test de performance n'ont été fournis. Elles servent uniquement à décider du prochain investissement.

| Scénario | Hypothèses | Utilisateurs inscrits | Utilisateurs simultanés | Conclusion |
|---|---|---:|---:|---|
| État actuel, démonstration locale | Un seul serveur, SQLite, petit catalogue, faible historique, pas de pics | Quelques dizaines à quelques centaines | Lecture : quelques dizaines ; écriture : **un seul écrivain efficace à la fois** | Suffisant pour développement ou démonstration, pas pour une caisse publique. |
| Première production après P0/P1 | PostgreSQL, Redis, 2 vCPU / 4 Go, 2–4 workers, médias objet, pagination, index, sauvegardes ; quelques centaines de produits par boutique | Environ 1 000 à 5 000 comptes | Environ 25 à 100 actifs | Point de départ réaliste à valider avec un test de charge sur les vrais parcours d'encaissement. |
| Production consolidée | 4 vCPU / 8 Go ou plus, PostgreSQL surveillé, cache partagé, solde de stock optimisé, limites API et observabilité | 10 000+ comptes possibles | 100 à 300 actifs, selon ventes/minute et taille des catalogues | Exige mesures, réglages et un plan de capacité ; ce n'est pas une promesse sans benchmark. |

### Plan de montée en charge

1. Mesurer d'abord : définir un test avec recherches, création de vente, mouvement de stock, synchronisation et consultation de bilan.
2. Migrer SQLite vers PostgreSQL avant l'ouverture au public ; tester les transactions et la concurrence sur PostgreSQL.
3. Introduire Redis pour limitation de débit, cache et éventuellement file de tâches.
4. Paginer les listes et conserver un solde de stock calculé transactionnellement, sans supprimer le journal des mouvements.
5. Déplacer les images vers un stockage objet privé avec URL signée ou proxy applicatif.
6. Installer métriques, sauvegardes testées, alertes et revue de capacité trimestrielle.

## Sécurité et confidentialité

### Protections déjà présentes

| Domaine | Protection constatée | Appréciation |
|---|---|---|
| Mots de passe | Argon2 est le premier algorithme de hachage ; les mots de passe ne sont pas renvoyés par les serializers. | Bon socle. |
| Session | Access token court (15 min), refresh token 30 jours, rotation et liste noire. | Bon modèle pour le web mobile. |
| Cookie refresh | `HttpOnly`, `SameSite=Lax`, chemin restreint aux routes d'authentification, `Secure` prévu hors DEBUG. | Correct si la configuration de production est effectivement appliquée. |
| Anti-CSRF refresh/logout | En-tête applicatif obligatoire et vérification d'origine. | Bonne défense complémentaire aux cookies. |
| Anti-bruteforce | Limites par téléphone et par IP sur connexion ; limites par IP sur inscription. | Utile, mais à déplacer vers Redis avant multi-instance. |
| Réponses d'erreur | Format JSON unique ; les erreurs inattendues ne renvoient pas de trace au client. | Bon pour ne pas exposer l'interne. |
| Isolation de données | Les recherches de produits, ventes, stocks, taux et profil filtrent principalement sur la boutique du JWT. | Correct dans la plupart des vues, avec une exception critique sur la catégorie d'un produit. |
| Intégrité | Transactions sur vente/annulation, contraintes SQL de quantité et totaux, produits protégés contre suppression directe. | Base utile, à compléter. |

### Risques et corrections

| Gravité | Risque constaté | Conséquence possible | Correctif |
|---|---|---|---|
| Critique | Clé applicative dans le code source, DEBUG activé, hôtes/HTTPS de production absents | Prise de contrôle de mécanismes Django, fuite de détails, exposition HTTP ou démarrage non sûr | Variables d'environnement, rotation de clé, `DEBUG=False`, configuration TLS, HSTS après validation, vérification de démarrage. |
| Critique | Base SQLite et médias suivis par Git ; mot de passe de développement de la base aussi présent dans le dépôt | Exposition potentielle de numéros, e-mails, boutiques, images ou accès à un environnement | Retirer du suivi et de l'historique, faire tourner les secrets, stockage hors Git et contrôle d'accès aux sauvegardes. |
| Élevée | Une catégorie d'une autre boutique peut être choisie dans un produit | Fuite ou mélange de données entre commerçants | Restreindre le queryset du champ catégorie au `shop` courant et tester l'attaque. |
| Élevée | Changer le mot de passe ne révoque pas les autres refresh tokens | Un appareil perdu reste connecté | Blacklister les refresh tokens de l'utilisateur et régénérer la session actuelle. |
| Élevée | Synchronisation non implémentée | Des écrits locaux peuvent ne jamais atteindre le serveur ; faux sentiment de sécurité | Construire le journal, les curseurs, l'idempotence et les tests de reprise réseau avant de l'annoncer comme opérationnelle. |
| Élevée | Pas de sauvegarde/restauration, rétention ou chiffrement au repos documentés | Perte définitive ou exposition de PII après panne/vol | Sauvegardes chiffrées, restauration testée, chiffrement disque/base, politique de rétention et registre d'accès. |
| Élevée | Images validées de manière incomplète et stockées localement | Fichier malveillant, saturation disque, exposition via serveur de médias | Décodage réel, quotas, stockage objet, antivirus si nécessaire, serveurs de médias séparés. |
| Moyenne | Limitation de débit en mémoire locale, pas de cache partagé | Contournement par multi-worker, limites incohérentes après redémarrage | Redis, proxy avec limites globales, bonne configuration d'IP cliente (`NUM_PROXIES` seulement si proxy maîtrisé). |
| Moyenne | Création de vente non idempotente, ticket concurrent, agrégats de stock coûteux | Double vente après coupure réseau, erreur 500, lenteurs | Clé d'idempotence, compteur transactionnel par boutique, PostgreSQL, solde matérialisé/index. |
| Moyenne | Coût historique et devises mal calculés dans le bilan | Bénéfice affiché incorrect, mauvaise décision commerciale | Figer le coût à la vente, consolider avec le taux de la vente, tests de régression. |
| Moyenne | `days` non validé dans les statistiques ; pas de pagination | Erreur 500 générique ou requêtes trop lourdes | Serializer de query params avec min/max, pagination, index. |
| Moyenne | Faible couverture de tests pour stock, ventes, catalogue et sync | Régression silencieuse sur les montants ou l'isolation | Tests de comportement et de concurrence dans la CI. |
| Faible à moyenne | Aucun audit métier détaillé (acteur, appareil, cause) visible dans les mouvements | Enquête difficile après un ajustement ou conflit | Journal d'audit minimal, sans stocker de secrets, avec politique de conservation. |

### Données personnelles et confidentialité

Les données identifiantes observées sont : nom complet, téléphone (identifiant de connexion), e-mail facultatif, nom/adresse/téléphone de boutique, identifiants UUID, dates de connexion et photos de produits. Les ventes et tickets sont aussi des données commerciales sensibles.

Ce qui est **non vérifiable** depuis le dépôt : emplacement réel des serveurs, chiffrement disque, accès des administrateurs, sauvegardes, durée de conservation, contrat d'hébergement, procédure de suppression de compte et politique de confidentialité remise aux commerçants.

À définir avant l'ouverture : qui accède aux données, pendant combien de temps, comment une boutique exporte/supprime ses données, où sont stockées les sauvegardes, qui les restaure et comment un incident est notifié.

## Contrôles réalisés et limites

| Contrôle | Résultat |
|---|---|
| Lecture de structure, routes, vues, serializers, modèles, migrations, dépendances et tests | Réalisée, sans modification du code. |
| Contenu des fichiers `.env` | Non lu volontairement. |
| `python manage.py makemigrations --check --dry-run` | Réussi : aucune migration manquante. |
| `python manage.py check --deploy` | 7 avertissements : HSTS, redirection HTTPS, clé de sécurité, cookies sécurisés, DEBUG et `ALLOWED_HOSTS`. |
| `ruff check .` | 85 erreurs, surtout formatage, imports inutilisés et instructions `;`. Elles n'empêchent pas toutes l'exécution, mais réduisent la maintenabilité. |
| Tests automatisés | Inventoriés mais non exécutés afin de respecter la consigne de ne pas modifier les fichiers existants. Les tests d'authentification sont nombreux ; les tests catalogue/inventaire/ventes/synchronisation sont vides. |
| Test de charge / pénétration | Non réalisé : il faut un environnement de préproduction autorisé, des données fictives et un protocole dédié. |

## Recommandations finales

1. **Bloquer le déploiement public** tant que les éléments P0 ne sont pas corrigés.
2. **Traiter les données déjà versionnées comme potentiellement exposées** : retrait Git, nettoyage d'historique si partagé, puis rotation des secrets concernés.
3. **Migrer vers PostgreSQL avant la première vraie boutique**, puis écrire un test de vente concurrente et de reprise après perte réseau.
4. **Finir la synchronisation avant de promettre une disponibilité multi-appareils** : opérations idempotentes, conflits, journal et indicateurs fiables.
5. **Sécuriser les chiffres** : coût figé à la vente, calcul par devise, taux historique, test du bilan.
6. **Installer une base d'exploitation** : Redis, sauvegardes chiffrées restaurées régulièrement, stockage objet pour images, alertes et métriques.
7. **Mettre ces règles sous CI** : migrations, lint, tests, vérification de sécurité Django, analyse de dépendances et test d'isolation entre deux boutiques.

Le prochain travail recommandé est un lot P0 limité : configuration de production, sortie des données de Git, isolation de catégorie, révocation de session et intégrité des ventes. Il réduit le risque sans modifier l'expérience du commerçant.
