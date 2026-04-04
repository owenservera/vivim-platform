# ╔══════════════════════════════════════════════════════════════════════╗
# ║  CONFLICT INTELLIGENCE MAP — MUNITIONS CATALOGUE & LIVE TICKER     ║
# ║  Deep Weapons Data Model · AI Background Research · Live Feed      ║
# ╚══════════════════════════════════════════════════════════════════════╝
#
#  DATE:         March 5, 2026 — all packages verified live
#  AI ENGINE:    ZaiClient (zai SDK) — GLM-5 exclusively
#                import: from zai import ZaiClient
#                model:  "glm-5"
#                DO NOT use Vercel AI SDK. DO NOT use any other AI SDK.
#
#  CONTEXT:      Existing Next.js 15 + Prisma + Socket.io conflict map.
#                You are adding three interconnected systems:
#                  1. MUNITIONS CATALOGUE — encyclopedic weapons database
#                  2. BACKGROUND RESEARCH ENGINE — GLM-5 auto-enrichment
#                  3. LIVE TICKER — Bloomberg-style real-time event strip
# ═══════════════════════════════════════════════════════════════════════

---

## ZAI SDK — CANONICAL USAGE PATTERN

Every AI call in this system uses this exact pattern. No exceptions.

```typescript
// server/lib/zai.ts  — singleton client, import everywhere
import { ZaiClient } from 'zai'

export const zai = new ZaiClient({
  apiKey: process.env.ZAI_API_KEY!,
})

// Standard research call with web search + preserved thinking
export async function researchQuery(
  systemPrompt: string,
  userPrompt:   string,
  maxTokens:    number = 4096
): Promise<string> {
  const response = await zai.chat.completions.create({
    model:    'glm-5',
    messages: [
      { role: 'system',  content: systemPrompt },
      { role: 'user',    content: userPrompt   },
    ],
    thinking:   { type: 'enabled' },  // preserved reasoning
    tools: [{
      type: 'web_search',
      name: 'web_search',
    }],
    stream:      false,
    max_tokens:  maxTokens,
    temperature: 0.1,   // low temp for factual research
  })

  // Concatenate all text content blocks
  return response.choices[0].message.content
    ?? response.choices[0].message.reasoning_content
    ?? ''
}

// Streaming variant for SSE endpoints
export async function researchStream(
  systemPrompt: string,
  userPrompt:   string,
  onChunk:      (text: string) => void
): Promise<void> {
  const stream = await zai.chat.completions.create({
    model:    'glm-5',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt   },
    ],
    thinking:    { type: 'enabled' },
    tools: [{ type: 'web_search', name: 'web_search' }],
    stream:      true,
    max_tokens:  8192,
    temperature: 0.1,
  })

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content
      ?? chunk.choices[0]?.delta?.reasoning_content
      ?? ''
    if (text) onChunk(text)
  }
}
```

---

## ═══════════════════════════════════════════════════════
## PART I — THE MUNITIONS CATALOGUE DATA MODEL
## ═══════════════════════════════════════════════════════

This is the authoritative schema for all weapons, munitions, platforms,
and delivery systems tracked in this conflict. It answers every question
a military analyst, journalist, or policy researcher would ask.

Design philosophy: EVERY FIELD HAS A SOURCE. Nothing is assumed.
Every value — cost, stockpile, range — carries a confidence level and
citation. Where data is unknown, that is recorded explicitly.

---

### PRISMA SCHEMA — ADD TO EXISTING schema.prisma

```prisma
// ══════════════════════════════════════════════
// MUNITIONS & WEAPONS SYSTEMS
// ══════════════════════════════════════════════

model MunitionSystem {
  id                   String   @id @default(uuid())
  slug                 String   @unique   // "iran-shahab-3" | "isr-delilah-slcm"

  // ── IDENTITY ──────────────────────────────────────────────────────
  officialName         String            // "Shahab-3"
  alternateNames       String            // JSON: ["Meteor-3","CSS-8 Mod 2","MRBM-3"]
  natoReportingName    String?           // NATO designation if applicable
  iaeaDesignation      String?           // If nuclear-relevant
  sipriId              String?           // SIPRI arms transfer DB ID

  // ── CLASSIFICATION ────────────────────────────────────────────────
  category             String            // see MUNITION_CATEGORIES
  subcategory          String            // see MUNITION_SUBCATEGORIES
  generation           String?           // "3rd gen" | "4th gen" | "hypersonic"
  guidanceType         String            // see GUIDANCE_TYPES
  propulsionType       String            // "solid-fuel" | "liquid-fuel" | "jet" | "rocket"
  warheadType          String            // see WARHEAD_TYPES
  deliveryMethod       String            // "air-launched" | "ground-launched" | "sea-launched" | "submarine"
  platformCompatible   String            // JSON: ["F-35I","F-15I","Dolphin-class sub"]

  // ── PERFORMANCE SPECS ─────────────────────────────────────────────
  rangeKmMin           Float?            // minimum effective range
  rangeKmMax           Float             // maximum range in km
  rangeKmConfidence    String  @default("estimated")  // "confirmed"|"estimated"|"disputed"

  cepMeters            Float?            // Circular Error Probable (accuracy)
  cepConfidence        String  @default("estimated")

  speedMach            Float?            // cruise/terminal speed
  speedMachConfidence  String  @default("estimated")

  altitudeCeilingM     Float?            // max operational altitude
  altitudeFloorM       Float?            // min operational altitude (cruise missiles)

  payloadKgMax         Float?            // maximum warhead weight kg
  payloadKgOperational Float?            // typical operational payload

  penetrationMm        Float?            // armor penetration (for anti-armor)
  blastRadiusM         Float?            // effective blast radius meters
  fragmentationRadiusM Float?            // fragmentation kill radius

  stealthRating        String?           // "none"|"low-observable"|"VLO"|"stealth"
  radarCrossSection    Float?            // m² RCS estimate
  irSignature          String?           // "high"|"medium"|"low"|"suppressed"

  // ── NUCLEAR / WMD CAPABILITY ──────────────────────────────────────
  nuclearCapable       Boolean @default(false)
  nuclearWarheadYield  String?           // "10-20kt"|"variable"|"unknown"
  chemCapable          Boolean @default(false)
  bioCapable           Boolean @default(false)
  empCapable           Boolean @default(false)
  clusterMunition      Boolean @default(false)  // banned under Oslo Convention
  thermobaricCapable   Boolean @default(false)

  // ── ORIGIN & PRODUCTION ───────────────────────────────────────────
  countryOfOrigin      String            // "Iran" | "Israel" | "USA" | "Russia"
  developedBy          String            // JSON: array of MunitionManufacturer IDs
  primaryManufacturer  String?           // FK → MunitionManufacturer.id
  programStartYear     Int?
  firstTestYear        Int?
  firstDeployedYear    Int?
  productionStatus     String            // "active"|"limited"|"discontinued"|"development"
  exportStatus         String            // "domestic-only"|"exported"|"embargoed"
  exportedTo           String            // JSON: ["Syria","Hezbollah","Houthis"]

  // ── COST INTELLIGENCE ─────────────────────────────────────────────
  unitCostUsdMin       Float?            // low estimate per unit USD
  unitCostUsdMax       Float?            // high estimate per unit USD
  unitCostUsdBest      Float?            // best single estimate
  unitCostYear         Int?              // year of cost estimate (inflation-adjust)
  unitCostSource       String?           // citation for cost figure
  unitCostConfidence   String  @default("estimated")

  programCostUsdTotal  Float?            // total R&D + production program cost
  perStrikeLogisticsUsd Float?           // estimated cost per operational strike
                                         // includes: crew, fuel, support, maintenance

  // ── STOCKPILE INTELLIGENCE ────────────────────────────────────────
  stockpileEstimates   StockpileEstimate[]

  // ── COMBAT PERFORMANCE (THIS CONFLICT) ───────────────────────────
  confirmedLaunches    Int     @default(0)
  confirmedHits        Int     @default(0)
  confirmedInterceptions Int   @default(0)
  confirmedMisses      Int     @default(0)
  combatAccuracyRate   Float?            // computed: hits / (hits + misses + intercepts)
  interceptedBy        String            // JSON: which systems intercepted it

  // ── COUNTERMEASURES & VULNERABILITIES ────────────────────────────
  effectiveCounterSystems String         // JSON: ["Iron Dome","Arrow-3","Patriot-PAC3"]
  vulnerabilities      String?           // JSON: known tactical/electronic vulnerabilities
  eccmCapability       Boolean @default(false)  // electronic counter-countermeasures
  decoyCapable         Boolean @default(false)

  // ── INCIDENTS ─────────────────────────────────────────────────────
  incidentUsage        IncidentWeapon[]

  // ── RESEARCH METADATA ─────────────────────────────────────────────
  researchSummary      String?           // GLM-5 generated 500-word profile
  lastResearchedAt     DateTime?
  researchCycleCount   Int     @default(0)
  sources              String            // JSON: [{url, tier, date, field_supported}]
  dataCompleteness     Float   @default(0.0)  // 0.0-1.0 how complete this record is
  flaggedForReview     Boolean @default(false)
  reviewNotes          String?

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@map("munition_systems")
}

// ── STOCKPILE ESTIMATES ───────────────────────────────────────────────
// One row per estimate, per holder, per date
// Multiple competing estimates tracked separately (IISS vs SIPRI vs USG)

model StockpileEstimate {
  id              String   @id @default(uuid())
  munitionId      String
  munition        MunitionSystem @relation(fields: [munitionId], references: [id])

  holder          String            // "Iran"|"IRGC Aerospace"|"Hezbollah"|"IDF"
  holderType      String            // "state"|"military-branch"|"proxy"|"non-state"

  estimateMin     Int?              // low bound
  estimateMax     Int?              // high bound
  estimateBest    Int?              // single best estimate
  estimateUnit    String  @default("units")  // "units"|"warheads"|"kg"|"tons"
  asOfDate        DateTime          // when this estimate applies
  estimateAge     String?           // "fresh"|"6mo"|"1yr"|"2yr+" (staleness)

  sourceName      String            // "IISS Military Balance 2026" | "CSIS" | "SIPRI"
  sourceUrl       String?
  sourceTier      Int               // 1-4 (see source tier system)
  sourceType      String            // "official"|"think-tank"|"media"|"leaked"|"satellite"
  confidence      Float             // 0.0-1.0

  attritionRate   Float?            // estimated depletion rate per month of conflict
  replenishmentRate Float?          // estimated replenishment rate per month
  projectedDepletionMonths Float?   // at current attrition rate, months until exhaustion

  notes           String?
  createdAt       DateTime @default(now())

  @@map("stockpile_estimates")
}

// ── MUNITION MANUFACTURERS & DEFENSE COMPANIES ───────────────────────

model MunitionManufacturer {
  id              String   @id @default(uuid())
  slug            String   @unique   // "rafael-advanced-defense" | "irgc-aerospace"

  // ── IDENTITY ────────────────────────────────────────────────────
  officialName    String
  tradingNames    String            // JSON array of aliases
  country         String
  entityType      String            // "private"|"state-owned"|"quasi-governmental"|"military-industrial"
  parentCompany   String?           // FK → MunitionManufacturer.id
  subsidiaries    String            // JSON: child company IDs

  // ── OWNERSHIP & GOVERNANCE ───────────────────────────────────────
  ownership       String            // "100% state"|"51% Ministry of Defense"|"publicly traded"
  stockSymbol     String?           // e.g. "RAFA.TA" (Rafael Advanced Defense not public, but Elbit: ESLT)
  stockExchange   String?
  annualRevenue   Float?            // USD, latest fiscal year
  revenueYear     Int?
  employees       Int?
  founded         Int?

  // ── KEY PROGRAMS ─────────────────────────────────────────────────
  keyWeaponSystems String           // JSON: MunitionSystem IDs produced here
  activeContracts  String           // JSON: {buyer, value, year, system}

  // ── FINANCIAL INTELLIGENCE ───────────────────────────────────────
  defenseBudgetShare Float?         // % of national defense budget flowing here
  exportRevenue   Float?            // annual export revenue USD
  majorExportCustomers String       // JSON: ["India","Azerbaijan","USA"]

  // ── SANCTIONS & LEGAL ────────────────────────────────────────────
  sanctionedBy    String            // JSON: ["OFAC","EU","UN"]
  sanctionDate    DateTime?
  sanctionReason  String?
  ofacEntry       String?           // OFAC SDN list entry ID
  activeInvestigation Boolean @default(false)
  investigationDetails String?

  // ── SUPPLY CHAIN ─────────────────────────────────────────────────
  keySuppliers    String            // JSON: {component, supplier, country}
  supplyChainRisks String           // JSON: known chokepoints + vulnerabilities
  criticalComponents String         // JSON: components that would halt production

  // ── CONFLICT RELEVANCE ───────────────────────────────────────────
  systemsUsedInConflict String      // JSON: which of their products appeared
  estimatedRevenuFromConflict Float? // estimated value of systems expended
  reputationImpact String?          // analysis of conflict effect on company

  // ── RESEARCH ────────────────────────────────────────────────────
  researchSummary String?
  lastResearchedAt DateTime?
  sources         String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("munition_manufacturers")
}

// ── INCIDENT ↔ WEAPON JUNCTION ───────────────────────────────────────
// Links incidents to specific munition systems with usage details

model IncidentWeapon {
  id                String   @id @default(uuid())
  incidentId        String   // FK → Incident.id (existing table)
  munitionId        String
  munition          MunitionSystem @relation(fields: [munitionId], references: [id])

  quantityLaunched  Int?              // how many fired
  quantityHit       Int?              // confirmed hits
  quantityIntercepted Int?            // confirmed intercepts
  quantityMissed    Int?

  launchPlatform    String?           // "F-35I Adir" | "S-300PMU2" | "Transporter-erector-launcher"
  launchLocation    String?           // where they were fired from
  launchLat         Float?
  launchLng         Float?
  targetType        String?           // what they were aimed at

  estimatedUnitCost Float?            // cost per unit for this deployment
  totalStrikeCostUsd Float?           // total cost of this weapons usage
  costConfidence    String  @default("estimated")

  confirmed         Boolean @default(false)  // confirmed vs suspected
  confirmationSource String?
  notes             String?

  @@map("incident_weapons")
}

// ── STRIKE COST LEDGER ────────────────────────────────────────────────
// Running total cost tracker by actor and system

model StrikeCostEntry {
  id              String   @id @default(uuid())
  incidentId      String
  actorId         String

  munitionId      String?
  munitionName    String            // denormalized for display
  quantity        Int
  unitCostUsd     Float
  totalCostUsd    Float
  costConfidence  String
  date            DateTime
  theater         String

  @@map("strike_cost_entries")
}

// ── WAR ECONOMY SNAPSHOT ──────────────────────────────────────────────
// GLM-5 maintained — updated daily — tracks aggregate economic warfare metrics

model WarEconomySnapshot {
  id                     String   @id @default(uuid())
  snapshotDate           DateTime @unique

  // Per-actor aggregate costs
  israelTotalSpentUsd    Float?
  israelMunitionsExpended Int?
  israelDailyBurnRateUsd Float?
  israelEstimatedReserveMonths Float?

  iranTotalSpentUsd      Float?
  iranMunitionsExpended  Int?
  iranDailyBurnRateUsd   Float?
  iranEstimatedReserveMonths Float?

  usaTotalSpentUsd       Float?    // US direct support costs
  usaMunitionsTransferred Int?
  usaAidValueUsd         Float?

  hezballahTotalSpentUsd Float?
  houthiTotalSpentUsd    Float?

  // Most expensive individual strikes (top 5)
  mostExpensiveStrike1   String?   // JSON: {incidentId, cost, system}
  mostExpensiveStrike2   String?
  mostExpensiveStrike3   String?
  mostExpensiveStrike4   String?
  mostExpensiveStrike5   String?

  // Comparative analysis
  totalWarCostUsd        Float?    // all actors combined
  infrastructureDamageUsd Float?   // estimated infrastructure destruction value
  humanitarianCostUsd    Float?    // aid, displacement, medical

  // Attrition rates
  israelMissileAttritionPct Float? // % of pre-conflict stockpile expended
  iranMissileAttritionPct   Float?

  generatedBy            String   @default("glm-5")
  sources                String
  createdAt              DateTime @default(now())

  @@map("war_economy_snapshots")
}

// ── SUPPLY CHAIN EVENT ────────────────────────────────────────────────
// Tracks weapons transfers, sanctions busts, arms deals

model SupplyChainEvent {
  id              String   @id @default(uuid())
  occurredAt      DateTime
  eventType       String   // "transfer"|"seizure"|"sanctions"|"deal"|"production-halt"|"shortage"

  fromActor       String?  // seller/transferor
  toActor         String?  // buyer/recipient
  munitionId      String?
  munitionName    String?

  quantity        Int?
  valueUsd        Float?
  shipmentRoute   String?  // "Persian Gulf" | "Red Sea" | "overland Syria"
  interceptedBy   String?

  legalStatus     String   // "legal"|"sanctioned"|"alleged"|"confirmed-illegal"
  un_resolution   String?  // if UN resolution violated

  significance    String?  // why this matters strategically
  sources         String
  confidence      Float

  createdAt       DateTime @default(now())

  @@map("supply_chain_events")
}
```

---

## ═══════════════════════════════════════════════════════
## PART II — REFERENCE ENUMERATIONS
## ═══════════════════════════════════════════════════════

```typescript
// lib/enums/munitions.ts

export const MUNITION_CATEGORIES = [
  'ballistic_missile',        // SRBM, MRBM, IRBM, ICBM
  'cruise_missile',           // subsonic, supersonic, hypersonic
  'anti-ship_missile',
  'anti-radiation_missile',   // HARM-type, targets radar
  'air-to-air_missile',
  'air-to-ground_missile',
  'surface-to-air_missile',
  'drone_ucav',               // combat drone
  'loitering_munition',       // kamikaze drone
  'glide_bomb',               // unpowered precision glide
  'smart_bomb',               // GPS/laser guided bomb
  'unguided_rocket',
  'artillery_shell',
  'naval_gun',
  'torpedo',
  'mine',
  'submarine_launched_missile',
  'hypersonic_glide_vehicle',
  'nuclear_device',
  'electronic_warfare',       // jamming, EMP
  'cyber_weapon',
]

export const MUNITION_SUBCATEGORIES = {
  ballistic_missile: ['SRBM', 'MRBM', 'IRBM', 'ICBM', 'SLBM', 'MIRV'],
  cruise_missile:    ['subsonic', 'supersonic', 'hypersonic', 'sea-skimming', 'terrain-following'],
  drone_ucav:        ['fixed-wing', 'rotary', 'swarm', 'stealth', 'HALE', 'MALE', 'MALE-UCAV'],
  loitering_munition: ['man-portable', 'vehicle-launched', 'VLS-launched', 'air-deployed'],
  surface_to_air:    ['point-defense', 'area-defense', 'MANPADS', 'upper-tier', 'multi-layer'],
}

export const GUIDANCE_TYPES = [
  'inertial',             // basic, no external signal needed
  'GPS',                  // satellite navigation
  'GPS_INS',              // GPS + inertial backup
  'terrain-following',    // radar altimeter guided
  'active-radar-homing',  // onboard radar seeker
  'semi-active-radar',    // ground-illuminated
  'infrared',             // heat-seeking
  'laser',                // laser-guided
  'optical',              // TV/EO guided
  'anti-radiation',       // homes on radar emissions
  'datalink',             // operator-guided in-flight
  'autonomous-AI',        // AI target recognition
  'combined',             // multiple modes
]

export const WARHEAD_TYPES = [
  'HE_blast',             // high explosive blast
  'HE_fragmentation',     // fragmenting warhead
  'shaped_charge',        // HEAT — anti-armor
  'thermobaric',          // fuel-air explosive, maximum blast radius
  'cluster',              // submunitions dispersal (banned Oslo)
  'penetrator',           // bunker-busting
  'EMP',                  // electromagnetic pulse
  'nuclear_fission',
  'nuclear_fusion',       // thermonuclear
  'radiological',         // dirty bomb
  'chemical',
  'biological',
  'kinetic_hit-to-kill',  // no warhead — kinetic energy interception
]

// Known stockpile holders relevant to this conflict
export const STOCKPILE_HOLDERS = [
  // Israel
  'IDF-Air Force',
  'IDF-Navy',
  'IDF-Ground Forces',
  'IDF-Missile Defense',
  // Iran
  'IRGC-Aerospace Force',
  'IRGC-Navy',
  'IRGC-Ground Forces',
  'Iranian Army',
  // Proxies
  'Hezbollah',
  'Hamas',
  'Houthis-Ansar Allah',
  'PMF-Iraq',
  'Palestinian Islamic Jihad',
  // US
  'USAF-CENTCOM',
  'USN-5th Fleet',
  'USMC-CENTCOM',
  // Other
  'Russia',
  'China',
  'Saudi Arabia',
]
```

---

## ═══════════════════════════════════════════════════════
## PART III — GLM-5 BACKGROUND RESEARCH ENGINE
## ═══════════════════════════════════════════════════════

This runs as a persistent background service. It uses the ZaiClient
to continuously enrich every record in the munitions catalogue.
It never waits to be called — it proactively finds what's incomplete.

`server/research-engine.ts`

### Research Cycle Architecture

```typescript
import { ZaiClient } from 'zai'
import { prisma }    from '../lib/prisma'
import { zai }       from '../lib/zai'
import cron          from 'node-cron'

// ── What the engine does ──────────────────────────────────────────
//
//  Every 10 minutes: scan for incomplete munition records → enrich them
//  Every 30 minutes: update stockpile estimates from latest sources
//  Every 60 minutes: update manufacturer financials + sanctions status
//  Every 4 hours:    generate war economy snapshot
//  Every 24 hours:   comprehensive profile refresh for all systems
//  On new incident:  immediately research any weapons mentioned
//

class ResearchEngine {

  // ── Completeness scoring ─────────────────────────────────────────
  computeCompleteness(system: MunitionSystem): number {
    const fields = [
      system.rangeKmMax,      system.cepMeters,
      system.speedMach,       system.payloadKgMax,
      system.unitCostUsdBest, system.programStartYear,
      system.firstDeployedYear, system.exportedTo,
      system.researchSummary,
    ]
    const filled = fields.filter(f => f !== null && f !== undefined).length
    return filled / fields.length
  }

  // ── Find records that need research ──────────────────────────────
  async getPriorityQueue(): Promise<MunitionSystem[]> {
    return prisma.munitionSystem.findMany({
      where: {
        OR: [
          { dataCompleteness: { lt: 0.7 } },
          { lastResearchedAt: { lt: new Date(Date.now() - 24*60*60*1000) } },
          { lastResearchedAt: null },
          { flaggedForReview: true },
        ],
      },
      orderBy: [
        { confirmedLaunches: 'desc' },  // prioritize systems seen in combat
        { dataCompleteness:  'asc'  },  // then most incomplete
      ],
      take: 5,  // process 5 per cycle
    })
  }

  // ── Full system research ──────────────────────────────────────────
  async researchMunitionSystem(system: MunitionSystem): Promise<void> {
    console.log(`[RESEARCH] Enriching: ${system.officialName}`)

    const systemPrompt = `
You are a defense intelligence analyst and weapons systems expert.
Your task is to research a specific weapons system and return
a comprehensive JSON object with all fields populated to the best
of your knowledge, with source citations for every data point.

CRITICAL RULES:
- Every field you provide must have a corresponding source entry
- Distinguish clearly: "confirmed" vs "estimated" vs "disputed" values
- For cost data: use the most recent available year, note the year
- For stockpile data: provide min/max range, note the source and year
- For nuclear capability: be conservative — only state "true" if confirmed
- Return ONLY a JSON object, no prose, no markdown

Return this exact structure:
{
  "rangeKmMin": number | null,
  "rangeKmMax": number | null,
  "rangeKmConfidence": "confirmed"|"estimated"|"disputed",
  "cepMeters": number | null,
  "cepConfidence": "confirmed"|"estimated"|"disputed",
  "speedMach": number | null,
  "altitudeCeilingM": number | null,
  "payloadKgMax": number | null,
  "blastRadiusM": number | null,
  "nuclearCapable": boolean,
  "nuclearWarheadYield": string | null,
  "clusterMunition": boolean,
  "thermobaricCapable": boolean,
  "unitCostUsdMin": number | null,
  "unitCostUsdMax": number | null,
  "unitCostUsdBest": number | null,
  "unitCostYear": number | null,
  "unitCostSource": string | null,
  "programCostUsdTotal": number | null,
  "perStrikeLogisticsUsd": number | null,
  "effectiveCounterSystems": string[],
  "exportedTo": string[],
  "productionStatus": "active"|"limited"|"discontinued"|"development",
  "researchSummary": "500-word factual profile",
  "sources": [
    {
      "url": "...",
      "title": "...",
      "publisher": "...",
      "date": "...",
      "fields_supported": ["rangeKmMax","cepMeters"]
    }
  ]
}
`

    const userPrompt = `
Research this weapons system comprehensively:

Name: ${system.officialName}
Alternate names: ${system.alternateNames}
Country of origin: ${system.countryOfOrigin}
Category: ${system.category}
Known operators: [fill from research]

Search for:
1. Technical specifications (range, CEP, speed, payload) from IISS, Jane's, SIPRI
2. Unit cost and program cost from DSCA notifications, Congressional budgets, SIPRI
3. Stockpile numbers from IISS Military Balance, Arms Control Association, CSIS
4. Combat performance data from any documented use in conflict
5. Export history from SIPRI Arms Transfer Database
6. Any nuclear/WMD capability from IAEA, Arms Control Association
7. Effective countermeasures from US DoD reports, IAF statements
8. Manufacturer details from company reports, SIPRI production data

Focus especially on: COST ESTIMATES and STOCKPILE NUMBERS.
Be precise. Cite every claim.
`

    try {
      const raw = await zai.chat.completions.create({
        model:       'glm-5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   },
        ],
        thinking:    { type: 'enabled' },
        tools: [{ type: 'web_search', name: 'web_search' }],
        stream:      false,
        max_tokens:  6144,
        temperature: 0.1,
      })

      const content = raw.choices[0].message.content ?? '{}'
      const data    = JSON.parse(content.replace(/```json|```/g, '').trim())

      await prisma.munitionSystem.update({
        where: { id: system.id },
        data:  {
          ...data,
          sources:           JSON.stringify(data.sources ?? []),
          exportedTo:        JSON.stringify(data.exportedTo ?? []),
          effectiveCounterSystems: JSON.stringify(data.effectiveCounterSystems ?? []),
          lastResearchedAt:  new Date(),
          researchCycleCount: { increment: 1 },
          dataCompleteness:  this.computeCompleteness({ ...system, ...data }),
          flaggedForReview:  false,
        },
      })

      console.log(`[RESEARCH] ✓ ${system.officialName} — completeness updated`)
    } catch (err) {
      console.error(`[RESEARCH] ✗ ${system.officialName}: ${err}`)
      await prisma.munitionSystem.update({
        where: { id: system.id },
        data:  { flaggedForReview: true, reviewNotes: String(err) },
      })
    }
  }

  // ── Stockpile estimate refresh ────────────────────────────────────
  async refreshStockpileEstimates(): Promise<void> {
    const systems = await prisma.munitionSystem.findMany({
      where: { confirmedLaunches: { gt: 0 } },  // only actively used systems
      select: { id: true, officialName: true, countryOfOrigin: true },
    })

    for (const system of systems) {
      const prompt = `
Search for the most current stockpile estimates for ${system.officialName}
(${system.countryOfOrigin}).

Look for:
- IISS Military Balance 2025/2026 data
- SIPRI arms data
- CSIS missile defense project data
- Arms Control Association assessments
- Any leaked or official government disclosures

For each holder (country/faction), provide:
{
  "holder": "...",
  "estimateMin": number,
  "estimateMax": number,
  "estimateBest": number,
  "asOfDate": "YYYY-MM-DD",
  "attritionRate": number per month (if in active conflict),
  "sourceName": "...",
  "sourceUrl": "...",
  "confidence": 0.0-1.0
}

Return JSON array only.
`
      try {
        const res  = await zai.chat.completions.create({
          model:    'glm-5',
          messages: [{ role: 'user', content: prompt }],
          thinking: { type: 'enabled' },
          tools:    [{ type: 'web_search', name: 'web_search' }],
          stream:   false, max_tokens: 2048, temperature: 0.1,
        })

        const estimates = JSON.parse(
          (res.choices[0].message.content ?? '[]').replace(/```json|```/g,'').trim()
        )

        for (const est of estimates) {
          await prisma.stockpileEstimate.create({
            data: { ...est, munitionId: system.id, asOfDate: new Date(est.asOfDate) },
          })
        }
      } catch { /* skip, try next cycle */ }
    }
  }

  // ── War economy snapshot ──────────────────────────────────────────
  async generateWarEconomySnapshot(): Promise<void> {
    const recentIncidentWeapons = await prisma.incidentWeapon.findMany({
      where:   { incident: { occurredAt: { gte: new Date(Date.now() - 30*24*60*60*1000) } } },
      include: { munition: true },
    })

    // Aggregate costs by actor
    const costByActor: Record<string, number> = {}
    for (const iw of recentIncidentWeapons) {
      const cost   = iw.totalStrikeCostUsd ?? 0
      const actor  = iw.incident?.actors?.[0] ?? 'unknown'
      costByActor[actor] = (costByActor[actor] ?? 0) + cost
    }

    const prompt = `
Based on recent conflict data, search for current estimates of:
1. Total cost of Israeli military operations in this conflict (USD)
2. Total cost of Iranian missile/drone attacks in this conflict (USD)
3. US military aid value transferred to Israel
4. Hezbollah weapons expenditure estimate
5. Houthi weapons expenditure estimate
6. Total infrastructure damage estimates

Search: CSIS, IISS, Congressional Research Service, Reuters, WSJ defense coverage.

Return JSON matching WarEconomySnapshot schema.
Provide sources for every figure.
`
    // ... generate and store snapshot
  }

  // ── Research triggered by new incident ───────────────────────────
  async onNewIncident(incident: Incident): Promise<void> {
    if (!incident.weaponsUsed?.length) return

    for (const weaponName of incident.weaponsUsed) {
      // Find or create munition record
      let munition = await prisma.munitionSystem.findFirst({
        where: {
          OR: [
            { officialName:    { contains: weaponName, mode: 'insensitive' } },
            { alternateNames:  { contains: weaponName, mode: 'insensitive' } },
          ],
        },
      })

      if (!munition) {
        // Create stub record — research engine will fill it in
        munition = await prisma.munitionSystem.create({
          data: {
            slug:          weaponName.toLowerCase().replace(/\s+/g,'-'),
            officialName:  weaponName,
            alternateNames: '[]',
            category:      'unknown',
            subcategory:   'unknown',
            guidanceType:  'unknown',
            propulsionType:'unknown',
            warheadType:   'unknown',
            deliveryMethod: 'unknown',
            platformCompatible: '[]',
            countryOfOrigin: incident.actors?.[0] ?? 'unknown',
            developedBy:   '[]',
            exportedTo:    '[]',
            exportStatus:  'unknown',
            productionStatus: 'unknown',
            effectiveCounterSystems: '[]',
            sources:       '[]',
            rangeKmMax:    0,
            dataCompleteness: 0.0,
          },
        })

        // Immediately queue for research
        await this.researchMunitionSystem(munition)
      }

      // Link to incident
      await prisma.incidentWeapon.create({
        data: {
          incidentId:    incident.id,
          munitionId:    munition.id,
          confirmed:     incident.confidence >= 0.75,
          estimatedUnitCost: munition.unitCostUsdBest ?? undefined,
          totalStrikeCostUsd: munition.unitCostUsdBest
            ? (munition.unitCostUsdBest * 1) // quantity=1 if unknown
            : undefined,
        },
      })
    }
  }
}

// ── Schedule all research cycles ─────────────────────────────────────
const engine = new ResearchEngine()

cron.schedule('*/10 * * * *',  () => engine.getPriorityQueue().then(q => q.forEach(s => engine.researchMunitionSystem(s))))
cron.schedule('*/30 * * * *',  () => engine.refreshStockpileEstimates())
cron.schedule('0 * * * *',     () => engine.generateWarEconomySnapshot())

export { engine }
```

---

## ═══════════════════════════════════════════════════════
## PART IV — LIVE TICKER COMPONENT
## ═══════════════════════════════════════════════════════

Bloomberg Terminal meets a war room operations screen.
A horizontally scrolling ticker strip fixed to the viewport.
Every new incident, weapon confirmation, and cost update scrolls through.

### Position: Between TopBar and Map (top: 48px, height: 36px)

`components/LiveTicker.tsx`

```tsx
'use client'
import { motion, useAnimationControls } from 'motion/react'
import { useEffect, useRef, useState }   from 'react'
import { useSocket }                     from '@/hooks/useSocket'

interface TickerItem {
  id:       string
  type:     'incident' | 'weapon' | 'cost' | 'stockpile' | 'statement' | 'supply'
  text:     string
  severity?: number
  urgent:   boolean
  ts:       number
}

const TYPE_CONFIG = {
  incident:  { prefix: '⚡ INCIDENT',  color: '#E8341A' },
  weapon:    { prefix: '🎯 WEAPON',    color: '#F5A623' },
  cost:      { prefix: '💰 COST',      color: '#4CAF50' },
  stockpile: { prefix: '📦 STOCKPILE', color: '#1E90FF' },
  statement: { prefix: '📢 STATEMENT', color: '#9C27B0' },
  supply:    { prefix: '🚢 SUPPLY',    color: '#FF9800'  },
}

// Ticker scroll speed: 80px/sec normally, 40px/sec on hover
const SCROLL_PX_PER_SEC = 80

export function LiveTicker() {
  const [items,    setItems]    = useState<TickerItem[]>([])
  const [paused,   setPaused]   = useState(false)
  const [flash,    setFlash]    = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const socket       = useSocket()

  // Prepend new items from Socket.io
  useEffect(() => {
    if (!socket) return

    const addItem = (item: TickerItem) => {
      setItems(prev => [item, ...prev].slice(0, 100))
      if (item.urgent) {
        setFlash(true)
        setTimeout(() => setFlash(false), 800)
      }
    }

    socket.on('incident:new', (inc: any) => addItem({
      id:       inc.id,
      type:     'incident',
      text:     `${inc.theater} · ${inc.title} · ${inc.location}`,
      severity: inc.severity,
      urgent:   inc.severity >= 4,
      ts:       Date.now(),
    }))

    socket.on('weapon:confirmed', (data: any) => addItem({
      id:     data.id,
      type:   'weapon',
      text:   `${data.system} confirmed in ${data.theater} · Est. cost $${formatCost(data.unitCostUsd)}/unit`,
      urgent: false,
      ts:     Date.now(),
    }))

    socket.on('stockpile:update', (data: any) => addItem({
      id:     data.id,
      type:   'stockpile',
      text:   `${data.holder} ${data.munitionName} stockpile est. ${data.estimateBest} units (${data.sourceName})`,
      urgent: false,
      ts:     Date.now(),
    }))

    socket.on('cost:update', (data: any) => addItem({
      id:     data.id,
      type:   'cost',
      text:   `War cost tracker · Israel $${formatCost(data.israelTotal)} · Iran $${formatCost(data.iranTotal)} · Running total $${formatCost(data.grandTotal)}`,
      urgent: false,
      ts:     Date.now(),
    }))

    socket.on('supply:event', (data: any) => addItem({
      id:     data.id,
      type:   'supply',
      text:   `${data.eventType.toUpperCase()} · ${data.munitionName} · ${data.fromActor} → ${data.toActor} · ${data.quantity} units`,
      urgent: data.eventType === 'seizure',
      ts:     Date.now(),
    }))

    socket.on('statement:new', (data: any) => addItem({
      id:     data.id,
      type:   'statement',
      text:   `${data.speaker} (${data.organization}) · "${data.summary}"`,
      urgent: data.containsThreat,
      ts:     Date.now(),
    }))

    return () => socket.removeAllListeners()
  }, [socket])

  // Divider items between incidents
  const SEPARATOR = '  ◈  '

  const tickerText = items.length === 0
    ? 'CONFLICT INTELLIGENCE MAP · LIVE · Monitoring 120+ sources globally'
    : items.map(item => {
        const cfg = TYPE_CONFIG[item.type]
        return `${cfg.prefix}: ${item.text}`
      }).join(SEPARATOR)

  return (
    <div
      className="live-ticker"
      style={{ borderColor: flash ? '#E8341A' : 'rgba(255,255,255,0.06)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* LEFT: LIVE badge */}
      <div className="ticker-badge">
        <motion.span
          className="ticker-dot"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
        LIVE
      </div>

      {/* CENTER: scrolling text */}
      <div className="ticker-track" ref={containerRef}>
        <motion.div
          className="ticker-content"
          animate={{ x: paused ? undefined : [0, -4000] }}
          transition={{
            x: {
              duration:   4000 / SCROLL_PX_PER_SEC,
              ease:       'linear',
              repeat:     Infinity,
              repeatType: 'loop',
            },
          }}
        >
          {/* Render twice for seamless loop */}
          <span className="ticker-text">{tickerText}</span>
          <span className="ticker-separator">{SEPARATOR}</span>
          <span className="ticker-text">{tickerText}</span>
        </motion.div>
      </div>

      {/* RIGHT: item count + pause indicator */}
      <div className="ticker-meta">
        {paused && <span className="ticker-paused">PAUSED</span>}
        <span className="ticker-count mono">{items.length} items</span>
      </div>
    </div>
  )
}

function formatCost(usd: number): string {
  if (!usd) return '?'
  if (usd >= 1e9) return `${(usd/1e9).toFixed(1)}B`
  if (usd >= 1e6) return `${(usd/1e6).toFixed(0)}M`
  if (usd >= 1e3) return `${(usd/1e3).toFixed(0)}K`
  return `${usd}`
}
```

### Ticker CSS (add to globals.css)

```css
.live-ticker {
  position:      fixed;
  top:           48px;
  left:          0; right: 0;
  height:        36px;
  z-index:       90;
  display:       flex;
  align-items:   center;
  background:    rgba(6, 9, 18, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  overflow:      hidden;
  transition:    border-color 0.3s ease;
}

.ticker-badge {
  flex-shrink:    0;
  display:        flex;
  align-items:    center;
  gap:            5px;
  padding:        0 12px;
  font-size:      9px;
  font-weight:    800;
  letter-spacing: 0.15em;
  color:          #E8341A;
  border-right:   1px solid rgba(255,255,255,0.06);
  height:         100%;
}

.ticker-dot {
  width:         6px;
  height:        6px;
  border-radius: 50%;
  background:    #E8341A;
  display:       block;
}

.ticker-track {
  flex:          1;
  overflow:      hidden;
  height:        100%;
  display:       flex;
  align-items:   center;
}

.ticker-content {
  display:       flex;
  white-space:   nowrap;
  will-change:   transform;
}

.ticker-text {
  font-size:     11px;
  color:         #B0B8CC;
  font-family:   'Berkeley Mono', 'JetBrains Mono', monospace;
  padding:       0 24px;
}

.ticker-separator {
  color:         rgba(255,255,255,0.15);
  font-size:     11px;
}

.ticker-meta {
  flex-shrink:    0;
  display:        flex;
  align-items:    center;
  gap:            8px;
  padding:        0 12px;
  border-left:    1px solid rgba(255,255,255,0.06);
  height:         100%;
}

.ticker-paused {
  font-size:      9px;
  font-weight:    700;
  letter-spacing: 0.1em;
  color:          #F5A623;
}

.ticker-count {
  font-size:      10px;
  color:          #6B7A99;
}

/* Push map down to accommodate ticker */
.map-surface {
  top:      84px !important;  /* 48px topbar + 36px ticker */
}
```

---

## ═══════════════════════════════════════════════════════
## PART V — WEAPONS PANEL UI
## ═══════════════════════════════════════════════════════

A full-screen panel accessible by pressing `W` or clicking a marker's
weapon tag. Shows the complete munition record.

`components/WeaponsPanel.tsx`

```
LAYOUT:

┌─────────────────────────────────────────────────────────────────┐
│  🎯 SHAHAB-3 · IRBM · IRAN                           [✕ CLOSE] │
├────────────────────────┬────────────────────────────────────────┤
│  PERFORMANCE           │  COST INTELLIGENCE                     │
│                        │                                        │
│  Range:  2,000 km      │  Unit Cost:  $2M–$4M (est. 2024)      │
│  CEP:    500m (est)    │  Program:    $2.1B total               │
│  Speed:  Mach 7 (term) │  Per Strike: $3.2M (incl. logistics)   │
│  Payload: 760 kg       │  Source: CSIS 2024                     │
│  Guidance: Inertial    │                                        │
│  Nuclear: Capable      │  STOCKPILE (2026 estimates)            │
│                        │  IRGC Aerospace: 200–300 units         │
├────────────────────────┤  Syrian stockpile: ~50 units (est)     │
│  COMBAT RECORD         │  Source: IISS Military Balance 2026    │
│                        │  Confidence: 0.72                      │
│  Launched:   34        │                                        │
│  Confirmed:  28        ├────────────────────────────────────────┤
│  Hit:        19        │  MANUFACTURER                          │
│  Intercepted: 9        │                                        │
│  Accuracy:   55%       │  Shahid Hemmat Industrial Group        │
│  Intercept: Arrow-3    │  State-owned · Iran MoD                │
│             Patriot    │  Sanctioned: OFAC, EU, UN              │
│                        │  Revenue: classified                   │
│                        │  Key supplier: Russia (guidance)       │
├────────────────────────┴────────────────────────────────────────┤
│  INCIDENTS USING THIS WEAPON                                    │
│  [list of incidents, linked to map markers]                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## ═══════════════════════════════════════════════════════
## PART VI — WAR COST DASHBOARD
## ═══════════════════════════════════════════════════════

Accessible at `/cost` — a separate page showing the economic dimension.

```
HEADLINE METRICS (large cards):

  ┌─────────────────────┐  ┌─────────────────────┐  ┌────────────────────┐
  │  TOTAL WAR COST     │  │  MOST EXPENSIVE      │  │  ISRAEL BURN RATE  │
  │  $4.2B (est)        │  │  SINGLE STRIKE       │  │  $18M / day        │
  │  ±$800M uncertainty │  │  Iron Dome intercept │  │  Runway: 14 months │
  │  Updated: 4h ago    │  │  $3.5M per intercept │  │  at current rate   │
  └─────────────────────┘  └─────────────────────┘  └────────────────────┘

COST BREAKDOWN (recharts BarChart):
  - Per actor: Israel vs Iran vs USA aid vs Proxy total
  - Per weapon system: which systems cost most
  - Per theater: geographic cost distribution

STOCKPILE DEPLETION (recharts LineChart):
  - Current estimate vs projected depletion curve
  - Replenishment rate overlay
  - "Exhaustion date" projection line
```

---

## ═══════════════════════════════════════════════════════
## PART VII — SEED DATA: MUNITIONS CATALOGUE
## ═══════════════════════════════════════════════════════

Pre-populate the database with these systems on first boot.
The research engine will fill in detailed specs autonomously.

```typescript
// prisma/seed-munitions.ts

const SEED_MUNITIONS = [
  // ── IRANIAN SYSTEMS ─────────────────────────────────────────────
  {
    slug: 'iran-shahab-3',
    officialName: 'Shahab-3',
    alternateNames: JSON.stringify(['Meteor-3','Zelzal-3','MRBM-3']),
    natoReportingName: 'CSS-8 Mod 2',
    category: 'ballistic_missile', subcategory: 'MRBM',
    countryOfOrigin: 'Iran',
    rangeKmMax: 2000, rangeKmConfidence: 'confirmed',
    nuclearCapable: true,
    unitCostUsdMin: 2000000, unitCostUsdMax: 4000000, unitCostYear: 2024,
    guidanceType: 'inertial', propulsionType: 'liquid-fuel',
    warheadType: 'HE_blast', deliveryMethod: 'ground-launched',
  },
  {
    slug: 'iran-shahed-136',
    officialName: 'Shahed-136',
    alternateNames: JSON.stringify(['Geran-2 (Russian designation)','Witness-136']),
    category: 'loitering_munition', subcategory: 'vehicle-launched',
    countryOfOrigin: 'Iran',
    rangeKmMax: 2000, rangeKmConfidence: 'confirmed',
    speedMach: 0.3,
    payloadKgMax: 50,
    unitCostUsdMin: 20000, unitCostUsdMax: 50000, unitCostYear: 2024,
    guidanceType: 'GPS_INS', propulsionType: 'jet',
    warheadType: 'HE_fragmentation', deliveryMethod: 'ground-launched',
    nuclearCapable: false,
  },
  {
    slug: 'iran-fattah-2',
    officialName: 'Fattah-2',
    alternateNames: JSON.stringify(['Fattah II']),
    category: 'ballistic_missile', subcategory: 'MRBM',
    countryOfOrigin: 'Iran',
    rangeKmMax: 1400, rangeKmConfidence: 'confirmed',
    speedMach: 15, // hypersonic terminal
    guidanceType: 'combined', propulsionType: 'solid-fuel',
    warheadType: 'HE_penetrator', deliveryMethod: 'ground-launched',
    unitCostUsdMin: 5000000, unitCostUsdMax: 15000000, unitCostYear: 2024,
    nuclearCapable: false,
  },
  {
    slug: 'iran-paveh-cruise',
    officialName: 'Paveh',
    alternateNames: JSON.stringify(['Ya Ali Mod 2']),
    category: 'cruise_missile', subcategory: 'subsonic',
    countryOfOrigin: 'Iran',
    rangeKmMax: 1650, rangeKmConfidence: 'estimated',
    speedMach: 0.8,
    guidanceType: 'terrain-following',
    warheadType: 'HE_blast', deliveryMethod: 'ground-launched',
    unitCostUsdMin: 1500000, unitCostUsdMax: 3000000, unitCostYear: 2024,
    nuclearCapable: false,
  },

  // ── ISRAELI SYSTEMS ──────────────────────────────────────────────
  {
    slug: 'isr-f-35i-adir',
    officialName: 'F-35I Adir',
    alternateNames: JSON.stringify(['F-35A (Israeli variant)','Adir']),
    category: 'drone_ucav', // actually fighter — extend category if needed
    countryOfOrigin: 'USA',
    rangeKmMax: 2200, rangeKmConfidence: 'confirmed',
    speedMach: 1.6,
    stealthRating: 'VLO',
    unitCostUsdBest: 110000000, unitCostYear: 2024,
    deliveryMethod: 'air-launched',
    nuclearCapable: true, // dual-capable platform
  },
  {
    slug: 'isr-iron-dome',
    officialName: 'Iron Dome',
    alternateNames: JSON.stringify(['Kippat Barzel']),
    category: 'surface-to-air_missile', subcategory: 'point-defense',
    countryOfOrigin: 'Israel',
    rangeKmMax: 70, rangeKmMin: 4,
    altitudeCeilingM: 10000,
    guidanceType: 'active-radar-homing',
    warheadType: 'kinetic_hit-to-kill',
    unitCostUsdBest: 50000, unitCostYear: 2024,     // per Tamir interceptor
    deliveryMethod: 'ground-launched',
    nuclearCapable: false,
  },
  {
    slug: 'isr-arrow-3',
    officialName: 'Arrow 3',
    alternateNames: JSON.stringify(['Hetz-3','Arrow III']),
    category: 'surface-to-air_missile', subcategory: 'upper-tier',
    countryOfOrigin: 'Israel',
    rangeKmMax: 2400, // exo-atmospheric
    altitudeCeilingM: 100000,  // exo-atmospheric intercept
    guidanceType: 'combined',
    warheadType: 'kinetic_hit-to-kill',
    unitCostUsdMin: 2000000, unitCostUsdMax: 3500000, unitCostYear: 2024,
    deliveryMethod: 'ground-launched',
    nuclearCapable: false,
  },
  {
    slug: 'isr-delilah',
    officialName: 'Delilah',
    alternateNames: JSON.stringify(['Delilah-AL','Delilah-GL']),
    category: 'cruise_missile', subcategory: 'subsonic',
    countryOfOrigin: 'Israel',
    rangeKmMax: 250,
    speedMach: 0.3,
    payloadKgMax: 30,
    guidanceType: 'combined',
    warheadType: 'HE_blast',
    unitCostUsdMin: 1000000, unitCostUsdMax: 2000000, unitCostYear: 2023,
    deliveryMethod: 'air-launched',
    nuclearCapable: false,
  },
]

// Run: bunx prisma db seed
```

---

## ═══════════════════════════════════════════════════════
## PART VIII — API ROUTES (munitions)
## ═══════════════════════════════════════════════════════

```
GET  /api/munitions                  ?category= &country= &nuclearCapable=
GET  /api/munitions/:id              full record with all relations
GET  /api/munitions/:id/stockpile    all stockpile estimates for this system
GET  /api/munitions/:id/incidents    all incidents where this was used
GET  /api/munitions/:id/cost         cost analysis for this system
GET  /api/manufacturers              all defense companies
GET  /api/manufacturers/:id          full company record
GET  /api/war-economy/snapshot       latest war economy snapshot
GET  /api/war-economy/history        daily snapshots (time series)
GET  /api/supply-chain               recent supply chain events
GET  /api/supply-chain/alerts        seizures and sanctions violations
```

---

## SELF-CHECK — VERIFY BEFORE CALLING DONE

DATABASE:
  [ ] All 6 new Prisma models created with complete schema
  [ ] Seed munitions populated (15 systems minimum)
  [ ] bunx prisma migrate dev runs cleanly
  [ ] IncidentWeapon junction table links incidents to munitions

ZAI SDK:
  [ ] ZaiClient imported from 'zai' — NOT Vercel AI SDK
  [ ] All AI calls use model: 'glm-5'
  [ ] thinking: { type: 'enabled' } on all research calls
  [ ] tools: [{ type: 'web_search' }] on all research calls
  [ ] NO import from 'ai', '@ai-sdk/*' anywhere in codebase

RESEARCH ENGINE:
  [ ] server/research-engine.ts starts as separate process
  [ ] First research cycle enriches at least 1 munition system
  [ ] GLM-5 returns valid JSON with cost + stockpile data
  [ ] dataCompleteness field updates after each enrichment
  [ ] onNewIncident() auto-creates stub records for new weapons
  [ ] War economy snapshot generates every 4 hours

TICKER:
  [ ] LiveTicker renders at top: 84px (below topbar)
  [ ] Ticker scrolls continuously at 80px/sec
  [ ] Pauses on hover, resumes on mouse leave
  [ ] New incidents prepend with urgent=true flash for sev 4+
  [ ] Cost updates broadcast via Socket.io
  [ ] Weapon confirmations appear in ticker
  [ ] All 6 item types render with correct color prefix

WEAPONS PANEL:
  [ ] Opens on W keypress or weapon tag click
  [ ] Shows performance specs with confidence indicators
  [ ] Shows cost data with year and source citation
  [ ] Shows stockpile estimates per holder
  [ ] Shows combat record (launched/hit/intercepted)
  [ ] Shows manufacturer with sanctions status
  [ ] Links to all incidents where used

WAR COST PAGE:
  [ ] /cost page renders
  [ ] Shows aggregate costs per actor
  [ ] Shows burn rate + runway estimate
  [ ] Depletion curves render in recharts

Zero placeholders. Zero TODOs.
GLM-5 via ZaiClient is the only AI. No Vercel SDK anywhere.
