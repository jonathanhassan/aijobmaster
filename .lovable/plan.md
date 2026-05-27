# Plan — Page Candidatures v2

## Périmètre
Refonte ciblée de `src/routes/_authenticated/candidatures.tsx` + nouveaux composants. Aucun autre fichier de l'app modifié hors ajout de migration et d'une serverFn IA.

## Dépendances à installer
- `framer-motion` (animations slide-over + transitions)
- `recharts` (déjà installé d'après stats.tsx — à vérifier, sinon ajouter)
- `date-fns` (dates relatives FR)
- `zod` (déjà présent)

## Migration Supabase (1 seule)
Ajout sur `applications` :
- `contact_name text`, `contact_email text`, `contact_phone text`
- `source text` (LinkedIn, Indeed, WTTJ, Réseau, Autre)
- `interview_questions jsonb default '[]'`
La colonne `timeline jsonb` existe déjà → réutilisée.

## Nouveaux fichiers

### `src/components/applications/ApplicationSlideOver.tsx`
- Panel droit 580px, Framer Motion (`AnimatePresence` + `motion.div` translateX)
- Overlay sombre cliquable + close sur Escape (useEffect keydown)
- Header : avatar initiales (couleur hash du nom entreprise), titre, badge statut
- Tabs shadcn (Détails / Timeline / IA)
- **Tab Détails** : infos read-only + textarea notes avec autosave debounce 1s (useEffect + setTimeout), contact éditable inline, dropdown changement statut (update Supabase immédiat + toast)
- **Tab Timeline** : map sur `application.timeline[]` triée desc, icônes par type (création/statut/note/relance), date relative via `formatDistanceToNow` FR, formulaire ajout note → push dans timeline + update Supabase
- **Tab IA** : 3 boutons (Scorer, Lettre, Préparer entretien), skeletons pendant fetch, radar Recharts 5 axes pour le score, textarea copiable pour la lettre, liste numérotée pour les questions
- Toutes mutations via React Query `useMutation` + invalidation `["applications"]`
- Types stricts depuis `@/types`

### `src/components/applications/CreateApplicationStepper.tsx`
- Dialog shadcn, barre progression (3 segments), state `step: 1|2|3`
- 3 schémas Zod (un par étape), validation avant `Suivant`
- **Étape 1** : URL + bouton "Extraire via IA" (nouvelle serverFn `aiExtractJobFromUrl` dans `ai.functions.ts` — fetch URL côté serveur + Mammouth pour parsing JSON), titre*, entreprise*, lieu, contrat (Select), salaire min/max (2 inputs number), statut initial (Select)
- **Étape 2** : Select CV (query `cvs`), textarea lettre + bouton "Générer via IA" (réutilise `aiGenerateCoverLetter`), contact nom/email, date picker (input type date, défaut today), Select source
- **Étape 3** : récap read-only en cartes, score IA calculé en background après INSERT (mutation chaînée), bouton "Créer" → INSERT applications → ferme → invalidate → toast → trigger `aiScoreApplication` async (fire-and-forget)
- Boutons Précédent/Suivant en footer

### `src/components/applications/KanbanCard.tsx`
Extrait de la page actuelle, enrichi :
- Avatar 2 initiales, couleur dérivée d'un hash simple du nom entreprise (palette 8 couleurs)
- Titre + entreprise
- Badge score (vert/orange/rouge selon seuils)
- Date relative `formatDistanceToNow(updated_at, fr)`
- Indicateur SLA : utilise `src/lib/sla.ts` (existant) → si dépassé, point rouge avec classe `animate-pulse`
- Props : `application`, `onClick`, `onDragStart`

### `src/components/applications/KanbanColumn.tsx`
- Header : label + compteur
- Barre accent 3px en haut avec `STATUS_COLORS[s]`
- Zone drop : highlight `ring-2 ring-primary` quand `isDragOver` (state local)

## Fichiers modifiés

### `src/routes/_authenticated/candidatures.tsx`
- Remplace le rendu carte/colonne inline par `<KanbanCard>` et `<KanbanColumn>`
- Ajoute state `selectedAppId` → ouvre `<ApplicationSlideOver>`
- Remplace la modal actuelle par `<CreateApplicationStepper>`
- Conserve query `applications` et mutation `move` existantes

### `src/lib/ai.functions.ts`
Ajoute :
- `aiExtractJobFromUrl({ url })` : fetch HTML (timeout 10s, strip tags simple), envoie à Mammouth avec prompt JSON → renvoie `{ title, company, location, contract_type, salary_min, salary_max, description }`
- `aiInterviewPrep({ applicationId })` : récupère app + profil, demande 10 questions, sauvegarde dans `applications.interview_questions`

## Contraintes respectées
- TS strict, types depuis `@/types`, zéro `any` dans le code nouveau
- Toast `sonner` sur succès/erreur de chaque action
- Loading states (`isPending`) + skeletons
- Glass morphism cohérent (`glass-card`, `gradient-primary`)
- Aucun changement aux autres routes/composants

## Ordre d'exécution
1. Migration SQL (colonnes contact + source + interview_questions)
2. `bun add framer-motion date-fns` (+ recharts si manquant)
3. Étendre `ai.functions.ts` (2 nouvelles serverFn)
4. Créer `KanbanCard`, `KanbanColumn`
5. Créer `ApplicationSlideOver`
6. Créer `CreateApplicationStepper`
7. Refactor `candidatures.tsx` pour câbler le tout
