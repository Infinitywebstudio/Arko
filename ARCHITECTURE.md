# Architecture ARKO

État de l'infrastructure et de la donnée pour la plateforme de dog-sitting court terme. Document destiné à servir de référence aux développeurs, aux décisions ops, et à éclairer le client sur ce qui tourne où.

> Dernière mise à jour : commit qui ajoute ce fichier. Pour l'état le plus récent, voir le code (notamment `supabase/migrations/`) qui reste la source de vérité.

---

## 1. Vue d'ensemble

```
                         ┌───────────────────────────────┐
                         │  Navigateur (client / sitter) │
                         └────────────────┬──────────────┘
                                          │ HTTPS
                                          ▼
                         ┌───────────────────────────────┐
                         │   Vercel (Next.js 16)         │
                         │   ─ Server Components         │
                         │   ─ Server Actions            │
                         │   ─ Route Handlers (API)      │
                         │   ─ Cron Sweeps               │
                         └─────┬─────────┬─────────┬─────┘
                               │         │         │
                  ┌────────────┘         │         └────────────┐
                  │                      │                      │
                  ▼                      ▼                      ▼
        ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
        │ Supabase         │  │ Stripe           │  │ Resend           │
        │ (Postgres +      │  │ (Checkout +      │  │ (Transactional   │
        │  Auth + Storage) │  │  refunds)        │  │  emails)         │
        │ eu-central-1     │  │ EU (Ireland)     │  │ EU configurable  │
        └──────────────────┘  └──────────────────┘  └──────────────────┘
```

Aucun autre service tiers en boucle. Pas de microservice maison. Pas de file de message. Pas d'auth maison.

---

## 2. Stack technique

| Couche | Choix | Pourquoi |
|---|---|---|
| Framework web | **Next.js 16** (App Router, Server Components, Server Actions) | SSR par défaut, sécurité serveur native, déploiement Vercel trivial |
| Langage | **TypeScript 5+** | Type-safety bout-en-bout, autocomplétion Supabase via types générés |
| UI | React 19, CSS-in-JS inline + tokens dans `src/app/globals.css` | Pas de Tailwind class-soup, design system custom léger |
| Auth + DB | **Supabase** (Postgres 15 + Auth + Storage + RLS) | Tout-en-un, RLS native, types TS auto-générés |
| Validation | **Zod 4** | Schémas réutilisés client + serveur, parsing strict |
| Paiements | **Stripe** Checkout (hosted) | Zéro scope PCI, intégration triviale, refunds via API |
| Emails | **Resend** | API simple, free tier 3 000/mois, idéal MVP |
| Hébergement | **Vercel** | Auto-deploy git, edge functions, cron jobs natifs |

---

## 3. Données — où vit quoi

### 3.1 Base de données — Supabase Postgres

- **Région** : `eu-central-1` (Frankfurt, Allemagne) — RGPD-friendly, dans l'UE
- **Plan actuel** : Free tier (500 Mo DB, 50 000 utilisateurs actifs / mois) — large pour le MVP, scale-up à payer quand le volume monte
- **Console** : Supabase Dashboard → projet `nlbmkvtimckjrgsikdnr`

### 3.2 Tables (source de vérité : `supabase/migrations/`)

| Table | Rôle | RLS |
|---|---|---|
| `auth.users` | Identifiants (email, mdp hashé bcrypt, sessions). Géré par Supabase Auth. | Géré par Supabase |
| `public.profiles` | Profil applicatif : `id` (= auth.users.id), `role` (client / sitter), `full_name`, `phone`, `avatar_url` | Lecture restreinte aux contractants (clients voient phone d'un sitter avec qui ils ont une booking) |
| `public.sitter_profiles` | Données sitter-spécifiques : bio, expérience, zones, chiens dangereux | Lecture publique via la vue `sitters_public` |
| `public.sitter_availability` | Créneaux hebdo (par weekday) | Lecture publique authentifiée, écriture par le sitter uniquement |
| `public.sitter_badges` | Badges vérif (id_check, background_check, first_aid) | Lecture publique, écriture **service_role uniquement** (admin seulement) |
| `public.bookings` | **Transactions de garde** — status, prix snapshotés, IDs Stripe, contact snapshoté | Lecture/écriture restreinte au client ou au sitter du booking |

### 3.3 Vues

- `public.sitters_public` : sitters listables publiquement, **n'expose ni email ni téléphone** (seule la fiche publique passe par là)

### 3.4 Enums

- `user_role` : `client` | `sitter`
- `booking_status` : `pending_payment` → `pending_acceptance` → (`confirmed` | `cancelled_by_client` | `refused_by_sitter` | `no_response`) → `completed`
- `sitter_badge_kind` : `id_check` | `background_check` | `first_aid`

### 3.5 Storage Supabase

| Bucket | Accès | Contenu |
|---|---|---|
| `avatars` | Public en lecture, écriture sitter dans son dossier `{user_id}/...` | Photos de profil |
| `sitter-documents` | Privé strict, lecture/écriture sitter dans son dossier | Pièces d'identité, attestations pour badges (workflow ops manuel pour validation) |

### 3.6 Migrations DB

Toutes versionnées dans `supabase/migrations/` (datées au timestamp UTC). En cours, dans l'ordre chronologique :

1. `init_auth_profiles` — Schéma auth, profiles + RLS
2. `sitter_profiles` — Tables sitter (profiles, availability, badges) + buckets storage
3. `drop_sitter_general_time_range` — Suppression de la plage horaire globale (redondante avec availability)
4. `bookings` — Table bookings + enum status + RLS + trigger de cohérence prix
5. `bookings_coordination_fields` — Ajout `client_full_name`, `client_phone`, `meeting_zone_id`, `client_notes` (snapshots)
6. `profiles_phone_privacy` — Durcissement RLS : un client ne voit le téléphone d'un sitter que s'il a une booking avec lui

---

## 4. Paiements — Stripe sans Connect

### 4.1 Choix d'architecture

La plateforme **n'utilise pas Stripe Connect**. Conséquences :

- ARKO encaisse **100 % du montant client** sur son compte Stripe (test mode actuellement, à provisionner en prod)
- Le client gère **manuellement** le reversement des 65 % au sitter (virement bancaire hors-plateforme)
- ARKO conserve la commission (~35 %, exactement 6 / 11 / 16 € selon la durée)

### 4.2 Tarifs (server-side, source : `src/lib/booking/pricing.ts`)

| Durée | Client paie | Sitter reçoit | ARKO garde |
|---|---|---|---|
| 1h | 18,00 € | 12,00 € | 6,00 € |
| 2h | 32,00 € | 21,00 € | 11,00 € |
| 3h | 45,00 € | 29,00 € | 16,00 € |

**Options** (+addons sur le total client) : chien cat. 1/2 +5 €, urgent (<30 min) +7 €, tardive (≥19 h) +7 €. La répartition options vs base est documentée dans le code (constante `OPTION_RECIPIENT`, par défaut 100 % plateforme — à valider avec le client).

### 4.3 Flow technique

1. **Server action** `createBookingAction` insère un booking `pending_payment` puis crée une Checkout Session Stripe avec `metadata.booking_id`
2. **Stripe redirige** le client vers `stripe.com` pour la saisie carte
3. **Webhook Stripe** (`/api/stripe/webhook`) reçoit `checkout.session.completed`, vérifie la signature avec `STRIPE_WEBHOOK_SECRET`, flip le booking en `pending_acceptance`, déclenche email sitter
4. **Refunds automatiques** via `stripe.refunds.create()` lors de :
   - Annulation par le client (jusqu'au démarrage de la garde)
   - Refus par le sitter
   - Cron : sitter n'a pas répondu à H+0 (no-response sweep)

### 4.4 Garde-fous

- **Trigger Postgres** sur `bookings` : `price_cents = sitter_payout_cents + platform_fee_cents` enforcé en DB
- **Prix jamais envoyé par le client** : entièrement re-dérivé côté serveur à chaque création
- **Snapshot du prix** dans le booking : si les tarifs changent demain, les bookings passés restent à leur prix d'origine
- **Idempotence webhook** : `.eq("status", "pending_payment")` garantit qu'une livraison dupliquée ne fait rien

---

## 5. Emails transactionnels — Resend

| Email | Déclenché par | Destinataire |
|---|---|---|
| Nouvelle garde | Webhook Stripe (paiement réussi) | Sitter |
| Garde acceptée | Action `acceptBookingAction` | Client (avec numéro sitter + boutons WhatsApp/tel) |
| Garde refusée | Action `refuseBookingAction` | Client |
| Garde expirée (no-response) | Cron sweep H+0 | Client |

Templates : `src/lib/email/booking.ts`. Tous incluent text + HTML, click-to-call et lien `wa.me` pour WhatsApp quand un téléphone est dispo.

**Resend project** : à provisionner par le client. Domaine d'envoi à vérifier (par défaut `onboarding@resend.dev` pour le dev).

---

## 6. Code & déploiement

| Aspect | Où |
|---|---|
| Repo Git | `github.com/Infinitywebstudio/Arko` |
| Branche prod | `main` |
| CI/CD | Vercel auto-deploy à chaque push sur `main`, preview sur chaque PR |
| URL prod | (à confirmer dans le dashboard Vercel) |
| Secrets prod | Vercel → Settings → Environment Variables |
| Secrets local | `.env.local` (gitignored). Template : `.env.example` |

### 6.1 Cron jobs

Vercel Cron lit `vercel.json` à la racine. Une seule entrée actuellement :

```json
{ "path": "/api/cron/sweep", "schedule": "0 4 * * *" }
```

Exécution quotidienne à 04:00 UTC (06:00 Paris). Deux passes :

1. **No-response sweep** : tout booking `pending_acceptance` dont `start_at < now()` → refund Stripe + status `no_response` + email client
2. **Auto-close** : tout booking `confirmed` qui est ≥ 48h après `end_at` (start_at + duration) → status `completed` silencieusement (hygiène, pour les sitters qui oublient de clôturer)

**Sécurité** : requiert `Authorization: Bearer ${CRON_SECRET}` (envoyé automatiquement par Vercel Cron).

**Limite Vercel Hobby** : 1 cron / jour. Pour passer à 15 min de granularité (utile pour les no-response refunds), il faut soit upgrade Vercel Pro, soit déclencher l'endpoint depuis GitHub Actions (free, schedule à 5 min) ou Supabase pg_cron.

### 6.2 Mode démo

Flag d'env `DEMO_MODE=true` court-circuite Stripe et Resend pour démonstration sans comptes externes :

- Booking créé → status auto-`pending_acceptance` (skip Checkout)
- Refunds → status flippé sans appel API Stripe
- Emails → `console.info` au lieu d'envoi

À utiliser pour la présentation client, **à désactiver en production**.

---

## 7. Sécurité

### 7.1 Row-Level Security (RLS)

Toutes les tables `public.*` ont RLS activée. Politiques résumées :

- **Profils** : utilisateur lit son propre profil ; un client lit le profil d'un sitter uniquement s'il a une booking active avec lui (incluant le téléphone) ; sitter listing public passe par la vue `sitters_public` qui n'expose ni téléphone ni email
- **Bookings** : le client lit/crée/annule ses propres bookings ; le sitter lit/met à jour les siens (accept/refuse/close)
- **Storage** : politiques de bucket enforcent que `(storage.foldername(name))[1] = auth.uid()::text` — chaque user ne touche que son propre dossier
- **service_role** : utilisé exclusivement côté serveur pour les opérations admin (webhooks, crons, suppression compte). **Jamais exposé côté navigateur**.

### 7.2 Pricing intégrité

- Server-side uniquement (`src/lib/booking/pricing.ts`)
- Trigger Postgres double-vérifie l'invariant `price = sitter_payout + platform_fee`
- Le client ne peut pas envoyer de prix dans le formulaire — c'est dérivé des inputs (durée + options) à chaque création

### 7.3 Webhooks

- Signature Stripe vérifiée via `STRIPE_WEBHOOK_SECRET`
- 401 retourné si la signature ne match pas
- Cron endpoint protégé par `CRON_SECRET` (Bearer token)

### 7.4 Mots de passe

- Stockés dans `auth.users` par Supabase (bcrypt)
- Minimum 8 caractères enforcé côté Supabase et côté Zod
- Réinitialisation par lien email (sécurisé temporaire)
- Suppression de compte exige re-saisie du mot de passe actuel + confirmation "SUPPRIMER"

---

## 8. RGPD / localisation des données

| Service | Région | RGPD-compatible |
|---|---|---|
| Supabase | Frankfurt (DE) | ✅ Hébergement EU |
| Stripe | Dublin (IE) | ✅ Sous-traitant déclaré, DPA dispo |
| Resend | Multi-région, sender configurable | ✅ avec sender EU |
| Vercel | Multi-région par défaut, possible de forcer EU | ⚠️ à configurer pour full-EU |
| GitHub | US | Hors-EU mais ne stocke pas de donnée perso utilisateur (juste code) |

### 8.1 Données personnelles stockées

- Email (auth.users)
- Nom complet (profiles)
- Numéro de téléphone (profiles, snapshot dans bookings)
- Avatar (storage.avatars)
- Pour les sitters : bio, expérience, zones (sitter_profiles), pièces d'identité (storage.sitter-documents)
- Pour les bookings : tout l'historique (start_at, prix, notes client)

### 8.2 Droits utilisateurs

- **Droit d'accès** : implicite via le compte (toutes les données visibles dans `/sitter/...` ou `/compte/...`)
- **Droit à l'oubli** : action "Supprimer mon compte" dans `/sitter/parametres` (ou équivalent client à venir). Cascade : `auth.users` → `profiles` → tables liées
- **Limite actuelle** : les bookings sont supprimés en cascade (perte d'historique financier). À durcir en soft-delete avant volume réel pour conformité comptable

---

## 9. Risques flaggés à valider avec Louis

### 9.1 Légal / fiscal

- **Paiement pour compte de tiers** : ARKO encaisse au nom des sitters. En France, déclenche obligation **DAC7** (déclaration des revenus des sitters à l'administration fiscale au-delà de 30 transactions ou 2 000 €/an).
- **Statut des sitters** : sans Stripe Connect ni contrat sous-traitant clair, risque de requalification (travail dissimulé). Les sitters doivent être micro-entrepreneurs ou particuliers (limites « coup de main »).
- **CGU à rédiger** : doit stipuler explicitement que le sitter est tiers indépendant et qu'ARKO agit en mandat d'encaissement.

### 9.2 Sécurité opérationnelle

- **Pas de KYC sitter** : n'importe qui peut s'inscrire avec une fausse identité. En cas d'incident (chien blessé, vol), pas de remontée fiable. Bucket `sitter-documents` en place, **non utilisé** — à activer quand Louis veut.
- **Pas de Stripe Connect** : flux financier exposé à un seul compte. Si la banque ferme le compte ARKO, blocage complet.

### 9.3 Capacité

- **Vercel Hobby** : cron 1×/jour. Auto-refund "no-response" peut prendre jusqu'à 24 h. Acceptable au lancement, à upgrader en Pro (~20 $/mois) dès qu'on a du volume.
- **Supabase Free tier** : 500 Mo DB, 50 000 MAU. Largement suffisant les premiers mois.

---

## 10. Évolutions documentées comme « pas dans le MVP »

Référence : `~/.claude/projects/.../memory/arko_mvp_cuts.md`. Résumé :

- ❌ Messagerie interne (cut budget) — remplacé par WhatsApp + tel:
- ❌ Stripe Connect + KYC + payouts auto (cut budget) — reversement manuel par Louis
- ❌ Notation 5 étoiles / système d'avis (cut MVP) — juste un commentaire libre fin de garde
- ❌ Bilan de garde détaillé (photos, checklist) — version light avec commentaire optionnel
- ❌ Carte interactive — remplacé par dropdown statique de zones
- ❌ SMS / push notifications — email uniquement
- ❌ Admin client-facing — Louis gère hors-plateforme ; un admin **interne** est à construire pour notre usage (revente future)

Ces cuts sont des **décisions client**. Toute réintroduction = nouveau line item devis.

---

## 11. Pour reprendre le projet (onboarding dev)

1. Cloner le repo, `npm install`
2. Copier `.env.example` vers `.env.local`, remplir les clés Supabase / Stripe / Resend
3. `npx supabase db push` pour synchroniser le schéma local (si besoin)
4. `npm run dev` → http://localhost:3000
5. Pour tester sans Stripe / Resend : `DEMO_MODE=true npm run dev`
6. Lire `CLAUDE.md` et `AGENTS.md` pour les conventions

---

*Source de vérité : le code et les migrations. Ce document est un résumé qui peut diverger légèrement — toujours valider contre l'état du repo.*
