# TMT Legal Intelligence

A comprehensive legal intelligence system for tracking **Technology, Media & Telecom (TMT)** law developments across India and globally. Built for a senior associate at a top-tier Indian law firm.

**709 sources. 5 priority tiers. One unified database. Fully automated.**

---

## What It Does

TMT Legal Intelligence continuously monitors legal sources — government gazettes, regulators, courts, legal blogs, think tanks, and international bodies — and surfaces relevant developments through a clean dashboard.

- **Automated fetching** of RSS feeds and page changes every 6 hours
- **Single SQLite database** as the sole source of truth
- **Next.js dashboard** for browsing, filtering, starring, and managing sources
- **Claude-powered analysis** via CLI for briefs, research, and content generation
- **32 focus areas** from Data Protection & AI Regulation to Drones & Space Tech

## Source Coverage

| Tier | Frequency | Sources | Coverage |
|------|-----------|---------|----------|
| 1 - Critical | Every run | 25 | Must-check: MeitY, TRAI, Supreme Court, MediaNama, IFF, etc. |
| 2 - High | Every 3 hours | 65 | High Courts, TDSAT, SEBI, IRDAI, EU DPAs, US FCC |
| 3 - Standard | Daily | 180 | Remaining HCs, ENISA, BEREC, ET Tech, Mint, Inc42 |
| 4 - Regular | Weekly | 220 | SSRN, law reviews, law firm publications, NASSCOM |
| 5 - Periodic | Monthly | 248 | Niche sectors: drones, space, blockchain, quantum |

### Categories

| Category | Sources |
|----------|---------|
| Indian Government & Legislative | 52 |
| Indian Judiciary | 32 |
| Indian Legal News | 42 |
| Indian Regulators | 28 |
| Think Tanks & Advocacy | 40 |
| International (EU, US, UK, APAC) | 88 |
| Academic & Research | 105 |
| Specialized Sectors | 208 |
| Business News & Law Firms | 46 |

## Architecture

```
                    ┌─────────────────────────────┐
                    │  Local launchd (every 6h)   │
                    │  scripts/run-fetch.sh        │
                    │  fetch_rss.py + monitor_pages│
                    └──────────┬──────────────────┘
                               │ writes
                               ▼
                    ┌─────────────────────────────┐
                    │   tmt_intelligence.db        │
                    │   - items (7,200+)           │
                    │   - sources (709)            │
                    │   - page_hashes              │
                    │   - brief_state              │
                    └──────┬──────────┬───────────┘
                           │          │
                    reads  │          │  reads/writes
                           ▼          ▼
              ┌────────────────┐  ┌──────────────────┐
              │ Claude CLI     │  │ Dashboard        │
              │ /gather /brief │  │ localhost:3000   │
              │ /search /blog  │  │ Next.js + SQLite │
              └────────────────┘  └──────────────────┘
```

**Key design decisions:**
- Single SQLite DB with WAL mode for concurrent Python + Node.js access
- Python scripts write directly to DB (no intermediate JSON files)
- Dashboard reads the same DB via `better-sqlite3`
- Claude CLI queries DB for recent items, only uses WebSearch for ~6 sources that can't be automated

## Getting Started

### Prerequisites

- **Python 3.11+** with `pip`
- **Node.js 18+** with `npm`
- **SQLite 3** (included with macOS/most Linux)

### Setup

```bash
# Clone the repository
git clone https://github.com/Stealthinator16/tmt-legal-intelligence.git
cd tmt-legal-intelligence

# Install Python dependencies
pip install -r scripts/requirements.txt

# Install dashboard dependencies
cd dashboard && npm install && cd ..

# Run initial fetch (populates the database)
bash scripts/run-fetch.sh

# Start the dashboard
cd dashboard && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to browse the dashboard.

### Automated Fetching (macOS)

A launchd job runs the fetch scripts every 6 hours:

```bash
cp com.tmt-legal.fetch.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.tmt-legal.fetch.plist
```

Logs go to `logs/fetch-YYYY-MM-DD.log`.

### GitHub Actions

A manual-dispatch workflow is available as a backup:

```bash
gh workflow run gather-sources.yml -f tier=1
```

## Dashboard

The Next.js dashboard provides:

- **Feed view** — browse all items chronologically, filter by source
- **Source management** — enable/disable sources, view errors, edit configs
- **Fetch triggers** — manually run fetches from the UI
- **Page monitor** — view detected page changes
- **Starred items** — bookmark items for later
- **Light/dark theme** — toggle in the sidebar footer

### Pages

| Route | Description |
|-------|-------------|
| `/` | Main feed — today's items |
| `/sources` | Manage all 709 sources by tier |
| `/fetch` | Trigger and monitor fetch jobs |
| `/monitor` | View page change detections |
| `/briefs` | Intelligence briefs |
| `/focus-areas` | Browse by focus area |

## Claude CLI Integration

This project is designed to work with [Claude Code](https://claude.com/claude-code) as an AI legal research assistant. Available commands:

| Command | Description |
|---------|-------------|
| `/gather` | Check critical sources for new developments |
| `/brief` | Generate today's intelligence brief |
| `/search <query>` | Search the repository |
| `/cases <topic>` | Find relevant case law |
| `/statute <name>` | Get statute information |
| `/blog <topic>` | Draft a blog article |
| `/week` | Generate weekly summary |
| `/month` | Generate monthly summary |
| `/sources` | List configured sources |
| `/sync` | Manually trigger source fetching |

## Focus Areas

The system tracks 32 TMT focus areas:

**Technology Law:** IT Act, Data Protection (DPDP), AI Regulation, Platform Regulation, E-Commerce, Fintech & Digital Payments

**Telecom Law:** Telecommunications Act 2023, TRAI Regulations, Satellite Communications, 5G

**Media & Entertainment:** Broadcasting & OTT, Content & IP, News & Digital Media

**Emerging Tech:** Blockchain, Metaverse, Quantum Computing, Biotech, Drones, Autonomous Vehicles, Space Tech

**Cross-Cutting:** Digital Competition, Cybersecurity, Constitutional Rights, Taxation, Labour & Gig Economy

## Project Structure

```
tmt-legal-intelligence/
├── README.md
├── CLAUDE.md                    # Claude Code instructions
├── dashboard/                   # Next.js dashboard
│   ├── app/                     # Pages and API routes
│   ├── components/              # React components
│   └── lib/                     # DB access, utilities
├── scripts/
│   ├── db.py                    # Shared Python DB module
│   ├── fetch_rss.py             # RSS feed fetcher
│   ├── monitor_pages.py         # Page change detector
│   ├── websearch.py             # WebSearch queue processor
│   ├── run-fetch.sh             # Automation wrapper
│   └── requirements.txt         # Python dependencies
├── sources/
│   ├── config/                  # 709 source configs (JSON)
│   │   ├── tier1-critical/
│   │   ├── tier2-high/
│   │   ├── tier3-standard/
│   │   ├── tier4-regular/
│   │   └── tier5-periodic/
│   ├── state/
│   │   └── tmt_intelligence.db  # Unified SQLite database
│   ├── downloaded/              # Fetched documents
│   ├── statutes/                # Organized statutes
│   └── judgements/              # Court decisions
├── summaries/                   # Daily, weekly, monthly briefs
├── com.tmt-legal.fetch.plist    # macOS launchd config
└── .github/workflows/           # GitHub Actions (manual dispatch)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Database | SQLite with WAL mode |
| Backend scripts | Python 3 (feedparser, requests, beautifulsoup4) |
| Dashboard | Next.js 16, React 19, TypeScript |
| DB access (Node) | better-sqlite3 |
| UI components | shadcn/ui, Radix UI, Tailwind CSS 4 |
| Automation | macOS launchd, GitHub Actions |
| AI integration | Claude Code CLI |

## License

Private repository. All rights reserved.
