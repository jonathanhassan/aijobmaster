
# JobMaster AI Pro — V2.0

Application complète de gestion de recherche d'emploi avec IA. Stack : **TanStack Start** (déjà en place dans ce projet, pas React Router + `src/pages/`), Supabase (Lovable Cloud), Tailwind v4, shadcn/ui, Zustand, Recharts, Framer Motion, Zod, react-hook-form.

> **Adaptation importante** : ta spec mentionne `src/pages/` et un Router classique. Ce projet utilise TanStack Start avec routing par fichiers dans `src/routes/`. Je vais respecter cette architecture (sinon le build casse). Toutes les pages deviendront des routes TanStack équivalentes. Le reste de la spec (UI, features, DB, IA) est implémenté à 100%.

## 1. Backend Supabase

Migration unique créant : `profiles`, `applications`, `cvs`, `ai_generations`, `settings` (schéma exact fourni) + GRANTS authenticated/service_role + RLS `auth.uid() = user_id` + trigger `updated_at` + trigger `on_auth_user_created` qui crée auto une ligne `profiles` + `settings` à l'inscription. Bucket Storage `cvs` (privé) pour les PDFs.

## 2. Routes TanStack (équivalent pages)

```
src/routes/
  __root.tsx              shell + QueryClient + Toaster + auth listener
  _authenticated.tsx      AuthGuard (redirect /auth si non loggé)
  _authenticated/
    dashboard.tsx
    candidatures.tsx      + index, $id (slide-over via search param)
    mes-cvs.tsx
    ia.tsx                tabs: score|lettre|cv|entretien|coach
    stats.tsx
    profil.tsx
    parametres.tsx
  auth.tsx                login/signup toggle
  index.tsx               redirect → /dashboard ou /auth
```

## 3. Layout

- `Sidebar` collapsible (240↔64px), nav avec badges compteurs, avatar + statut clé API + déconnexion en bas.
- `Header` : logo, recherche globale (Cmd+K → CommandPalette), cloche notifications (panel slide-in), menu avatar.
- Thème sombre par défaut (#0a0a0f / #111118), accents violet→bleu, tokens dans `styles.css`.

## 4. Pages — features clés

**Dashboard** : 6 KPI cards animées + sparklines · Plan d'action IA (urgences/entretiens/insights) · Activity feed timeline · Mini-Kanban scrollable.

**Candidatures** : 3 vues (Kanban DnD via @dnd-kit, Liste tableau, Tableau spreadsheet). Modal création 3 étapes (URL→extraction IA / Manuel → champs → score IA auto). Slide-over fiche complète (édition inline + contacts + entretiens + relances + timeline + actions IA + notes autosave 30s). Filtres avancés latéraux. SLA indicators colorés.

**Mes CVs** : 40% bibliothèque (cartes avec preview PDF page 1 via pdfjs-dist + actions) + drag & drop upload (max 5MB) · 60% analyse (tabs Mise en page / Contenu / ATS / Recommandations) avec jauges, checklists, recommandations priorisées · Export rapport PDF (jsPDF).

**Outils IA** : 5 tabs.
1. *Score compatibilité* (candidature + CV → score + sous-scores + reco)
2. *Lettre de motivation* (éditeur rich text + versioning ai_generations)
3. *Optimiseur CV* (avant/après ATS)
4. *Préparateur entretien* (Q&R + mode quiz timer + export PDF)
5. *Coach IA* (chat full-page contexte injecté + suggestions rapides + historique Supabase)

**Stats** : Recharts (barres, camembert, ligne, funnel) + filtres période + insights IA auto.

**Profil** : barre de complétion calculée + sections inline editable + autosave Supabase.

**Paramètres** : clé API Mammouth (test connexion) · SLAs configurables · thème/couleur/densité · export JSON/CSV · import · reset · compte (changer email/mdp, supprimer compte).

## 5. IA — Service Mammouth

`src/lib/ai.functions.ts` (createServerFn TanStack, protected par `requireSupabaseAuth`) : lit la clé Mammouth depuis `settings` de l'utilisateur, appelle `https://api.mammouth.ai/v1/chat/completions` model `mammouth`, retry x2, gestion 401/429/timeout, fallback message. Prompts dédiés par outil (score JSON structuré, lettre, optimiseur, entretien, coach avec contexte candidatures).

## 6. Transversal

- **CommandPalette** (cmdk) : recherche universelle + raccourcis N/C/I/`/`.
- **Notifications** store Zustand alimenté par computation SLA + entretiens.
- **Onboarding** 5 étapes (1er login détecté via `profile_completion = 0`), skip à chaque étape.
- **EmptyState** SVG réutilisable sur toutes les listes vides.
- **ErrorBoundary** par route + skeletons partout + lazy + Suspense.
- Toasts sonner sur toutes actions, confirmations AlertDialog avant suppressions, autosave 30s.

## 7. Structure du code (adaptée TanStack)

```
src/
  routes/ ...                (cf §2)
  components/
    layout/{Sidebar,Header,CommandPalette,NotificationsPanel,Onboarding}.tsx
    kanban/{KanbanBoard,KanbanColumn,ApplicationCard}.tsx
    candidature/{ApplicationForm,ApplicationDetail,URLExtractor,Timeline,Filters}.tsx
    cvs/{CVLibrary,CVCard,CVUploader,CVAnalysis}.tsx
    ia/{CompatibilityScore,CoverLetterGenerator,CVOptimizer,InterviewPrep,AICoach}.tsx
    dashboard/{KPICards,ActionPlan,ActivityFeed,MiniKanban}.tsx
    shared/{EmptyState,ScoreGauge,Sparkline,ConfirmDialog}.tsx
    ui/ ...                  (shadcn)
  lib/
    ai.functions.ts          serverFn Mammouth
    pdf.ts                   pdfjs preview + jsPDF export
    sla.ts                   calcul SLA
    cv-analyzer.ts           parsing PDF + heuristiques ATS
    utils.ts
  stores/{profile,application,cv,ui,notification}.store.ts  (Zustand)
  hooks/{useAuth,useApplications,useCVs,useAI,useDebounce}.ts
  types/{application,cv,user}.types.ts
  integrations/supabase/...  (déjà généré)
```

## 8. Détails techniques

- **Sécurité** : RLS sur les 5 tables, GRANTS authenticated, clé API Mammouth stockée chiffrée côté DB (texte chiffré via pgcrypto si dispo, sinon texte avec RLS strict) — choix : RLS strict suffit en V2 (clé jamais exposée client, lue uniquement via serverFn).
- **Validation** : Zod schemas dans `types/` + react-hook-form.
- **Performance** : `defaultPreloadStaleTime: 0` (déjà OK), `useMemo`/`useCallback` sur Kanban + tableau, debounce 300ms recherches, lazy loading routes via TanStack natif.
- **Responsive** : mobile-first, sidebar devient sheet < 1024px.
- **Packages à ajouter** : `@dnd-kit/core @dnd-kit/sortable zustand recharts framer-motion cmdk pdfjs-dist jspdf react-hook-form zod @hookform/resolvers date-fns`.

## 9. Plan d'exécution

1. Migration SQL (5 tables + RLS + GRANTS + trigger profil auto).
2. Install dépendances + tokens design system dans `styles.css`.
3. Types + Zod schemas + stores Zustand + hooks de base.
4. Route `auth` + `_authenticated` guard + `__root` (QueryClient, Toaster, auth listener).
5. Layout (Sidebar, Header, CommandPalette, Notifications).
6. ServerFn IA Mammouth.
7. Pages : Dashboard → Candidatures (Kanban + Modal + Detail) → CVs → IA (5 outils) → Stats → Profil → Paramètres.
8. Onboarding + EmptyStates + ErrorBoundaries + finitions responsive.

Volume estimé : ~60-80 fichiers, livré en une seule passe.

Approuve pour lancer la construction.
