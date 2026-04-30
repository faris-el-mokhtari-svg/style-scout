# StyleMatch — MVP Plan

"GoodLook": Foto rein → KI versteht den Look → passende Produkte aus Google Shopping zum Kaufen.

## Was wir bauen (MVP)

Alle 4 Kernbereiche, mit echter Shop-Suche via **Serper.dev** (Google Shopping), Login per E-Mail + Google, und einem verspielten Gen-Z Look (à la Depop/Vinted).

## User Flow

```
Login/Signup
    ↓
Onboarding: 3 Lieblings-Outfits hochladen
    ↓
KI analysiert → erstes Style-Profil
    ↓
┌──────────────────────────────────────────┐
│  Bottom Nav: 4 Tabs                      │
│  [Schrank] [Discover] [Profil] [Likes]   │
└──────────────────────────────────────────┘
```

## Die 4 Bereiche

### 1. Mein Kleiderschrank

- Foto-Upload (Kamera oder Galerie), mehrere auf einmal
- Beim Upload: KI extrahiert automatisch Kategorie (Oberteil/Hose/Schuhe/…), Farbe(n), Schnitt, Style-Tags, Saison
- Grid-Ansicht mit Filter (Kategorie, Farbe, Tag)
- Tap auf Item → Detail mit "Ähnliches finden" Button → springt in Discovery mit vorausgefüllter Suche
- Swipe-to-delete

### 2. Style Discovery (Herzstück)

- Tinder-artiger Swipe-Stack mit Produktkarten (Bild, Titel, Preis, Shop, "Zum Shop"-Button)
- Quelle: **Serper.dev Google Shopping**, Query von KI generiert basierend auf Style-Profil + Kleiderschrank
- Swipe rechts = Like, links = Dislike, hoch = Speichern, Tap = Shop öffnen
- Filter-Sheet oben: Budget-Slider, Kategorien, Shops (Multi-Select: Zara, H&M, ASOS, Vinted, Zalando…), Farben, Größen
- "Refresh"-Button generiert neue Vorschläge (KI baut neue Query mit aktualisierten Likes)
- Caching: gleiche Query in den letzten 24h → aus DB statt neuer Serper-Call (spart Quota)

### 3. Style-Profil

- Visuelles Mood-Board: Collage aus Lieblings-Items + Likes
- KI-generierte Style-Beschreibung ("Du liebst minimalistisches Streetwear mit Erdtönen…")
- Top-3 Style-Etiketten als Badges (z.B. "Minimalist", "Streetwear", "Cottagecore")
- Farbpalette deines Stils (extrahiert aus Schrank + Likes)
- Stats: X Items im Schrank, Y Likes, Lieblings-Shops
- "Profil neu berechnen" Button (nach genug neuen Daten)

### 4. Likes / Wunschliste

- Alle gelikten + gespeicherten Produkte als Grid
- Sortieren nach Datum/Preis/Shop
- Direkt-Buttons zum Shop
- "Aus Wunschliste entfernen"

## Onboarding (erste Nutzung)

1. Welcome-Screen mit Pitch
2. Login/Signup (E-Mail + Google)
3. "Lade 3 Lieblings-Outfits hoch damit wir dich kennenlernen"
4. KI generiert erstes Style-Profil → kurze Vorschau
5. Direkt in Discovery

## Design (Playful Gen-Z)

- **Farben**: Sanftes Off-White als Basis, kräftiger Akzent (Hot Pink → Lila Gradient), softe Pastell-Sekundärfarben
- **Typo**: Runde, freundliche Sans (DM Sans / Inter mit kräftigem Bold für Headlines)
- **Komponenten**: Stark gerundete Cards (~24px radius), weiche Schatten, große Touch-Targets
- **Mikro-Animationen**: Swipe-Karten mit Spring-Physik, Like-Heart popst, Hover-Wiggle auf Buttons
- **Mobile-first**, Bottom-Nav, große Bilder
- Dark Mode Toggle

## Technische Details

**Stack**

- Frontend: React + Vite + Tailwind + shadcn/ui (vorhanden)
- Backend: Lovable Cloud (Supabase) — Auth, Postgres, Storage, Edge Functions
- KI: Lovable AI Gateway (`google/gemini-3-flash-preview`) für Bildanalyse + Style-Profil + Suchquery-Generierung
- Produktsuche: **Serper.dev** `/shopping` Endpoint — 2.500 freie Queries/Monat, danach sehr günstig

**Datenmodell**

- `profiles` (user_id, display_name, avatar)
- `wardrobe_items` (id, user_id, image_url, category, colors[], style_tags[], description, season, created_at)
- `style_profiles` (user_id, aesthetic_labels[], color_palette[], description, updated_at)
- `product_swipes` (id, user_id, product_data jsonb, action enum[like,dislike,save], created_at)
- `product_cache` (query_hash, results jsonb, created_at) — für Serper-Quota-Schonung
- `user_roles` (separate Tabelle, `app_role` enum, mit `has_role()` Security-Definer-Funktion)
- Storage-Bucket `wardrobe` (private, RLS: User sieht nur eigene)
- RLS überall aktiv, Policies pro User

**Edge Functions**

- `analyze-clothing-image`: Bild-URL → Gemini Vision → strukturierte JSON via Tool-Calling
- `generate-style-profile`: aggregiert Wardrobe + Likes → Aesthetic-Labels + Beschreibung
- `discover-products`: KI baut Suchquery aus Profil + Filtern → Cache-Check → Serper.dev `/shopping` → cleant + dedupliziert → Liste zurück
- Alle Functions: CORS, Zod-Validation, 402/429-Errors sauber an Client

**Secrets nötig**

- `LOVABLE_API_KEY` (auto)
- `SERPER_API_KEY` — du musst auf serper.dev einen kostenlosen Account anlegen, den API-Key kopieren; bei der Implementierung frage ich danach

**Sicherheit**

- Roles in eigener Tabelle (kein Privilege Escalation)
- Storage RLS pro User
- Serper-Key nie im Client
- Input-Validation mit Zod in allen Edge Functions
- Rate-Limit-Hinweis auf Discovery (Toast bei 429)

## Was im MVP NICHT drin ist

- Affiliate-Tracking (kommt später, Architektur erlaubt es)
- Native Mobile App (PWA-tauglich, aber zunächst Web)
- Social Features (folgen, teilen)
- Outfit-Builder ("kombiniere für mich")

Diese ergänzen wir iterativ nach dem MVP.