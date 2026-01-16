# TMT Legal Intelligence - Master Source List

**Total Sources: 738**
**Last Updated: 2025-01-12**
**Version: 2.0**

---

## Overview

This document provides a complete reference of all 738 sources monitored by the TMT Legal Intelligence System. Sources are organized into 5 priority tiers based on check frequency and importance.

## Tier Summary

| Tier | Frequency | Sources | Description |
|------|-----------|---------|-------------|
| **Tier 1** | Every run | 25 | Critical must-check sources |
| **Tier 2** | Every 3 hours | 65 | High-priority regulators & courts |
| **Tier 3** | Daily | 180 | Standard international & news |
| **Tier 4** | Weekly | 220 | Academic, law firms, industry |
| **Tier 5** | Monthly | 248 | Specialized sectors, research |

## Category Distribution

| Category | Count |
|----------|-------|
| Indian Government & Legislative | 52 |
| Indian Regulators | 28 |
| Indian Judiciary | 32 |
| Indian Legal News & Blogs | 42 |
| Indian Think Tanks | 18 |
| Indian Industry Bodies | 16 |
| Indian Law Firms | 14 |
| International - EU | 35 |
| International - US | 28 |
| International - UK & APAC | 25 |
| International Organizations | 18 |
| Global Academic | 105 |
| Global Advocacy | 22 |
| Business News | 32 |
| Specialized - Fintech | 24 |
| Specialized - Gaming | 16 |
| Specialized - Drones | 18 |
| Specialized - AI | 28 |
| Specialized - Healthtech | 18 |
| Specialized - OTT | 14 |
| Specialized - Space | 15 |
| Specialized - Blockchain | 22 |
| Specialized - Cybersecurity | 24 |
| Specialized - Other | 42 |

---

## Tier 1: Critical Sources (25)

**Check Frequency:** Every run
**Config File:** `sources/config/tier1-critical/critical-sources.json`

### Indian Government & Regulators

| ID | Name | Type | Method | Focus Areas |
|----|------|------|--------|-------------|
| egazette_india | E-Gazette of India | Official Gazette | websearch | All TMT |
| meity_main | Ministry of Electronics & IT | Ministry | webfetch | IT Act, Data Protection, AI, Cybersecurity |
| trai_main | TRAI | Regulator | webfetch | Telecom Act, Licenses, Spectrum, Net Neutrality |
| dot_main | DoT | Ministry | webfetch | Telecom Act, Licenses, Spectrum |
| supreme_court | Supreme Court of India | Court | websearch | All TMT |
| delhi_hc | Delhi High Court | Court | websearch | All TMT |
| rbi_fintech | RBI - Fintech | Regulator | webfetch | Fintech, Digital Payments, Crypto |
| cci_digital | CCI | Regulator | webfetch | Competition, Digital Markets |
| certin | CERT-In | Regulator | webfetch | Cybersecurity, Data Breach |
| pib_meity | PIB - MeitY | Government | websearch | All MeitY releases |

### Legal News & Blogs (RSS)

| ID | Name | RSS URL | Priority Score |
|----|------|---------|----------------|
| medianama | MediaNama | https://www.medianama.com/feed/ | 100 |
| iff | Internet Freedom Foundation | https://internetfreedom.in/rss/ | 95 |
| indconlaw | IndConLaw (Gautam Bhatia) | https://indconlawphil.wordpress.com/feed/ | 95 |
| livelaw | Live Law | https://www.livelaw.in/feed | 90 |
| barandbench | Bar & Bench | https://www.barandbench.com/feed | 90 |
| spicyip | SpicyIP | https://spicyip.com/feed | 85 |

### Think Tanks & Research

| ID | Name | Type | Focus Areas |
|----|------|------|-------------|
| vidhi_centre | Vidhi Centre for Legal Policy | Think Tank | All TMT |
| cis_india | Centre for Internet and Society | Think Tank | All TMT |
| the_dialogue | The Dialogue | Think Tank | All TMT |
| sflc_india | SFLC India | Advocacy | All TMT |
| prs_legislative | PRS Legislative Research | Research | All legislation |

### International (Critical)

| ID | Name | Jurisdiction | Focus Areas |
|----|------|--------------|-------------|
| edpb | European Data Protection Board | EU | Data Protection |
| ftc_tech | US FTC | US | Privacy, Competition, AI |
| ico_uk | UK ICO | UK | Data Protection |
| nlsiu_blog | NLSIU Centre for IT & Public Policy | Academic | All TMT |

---

## Tier 2: High Priority Sources (65)

**Check Frequency:** Every 3 hours
**Config File:** `sources/config/tier2-high/high-priority-sources.json`

### Indian High Courts

| ID | Name | Method |
|----|------|--------|
| karnataka_hc | Karnataka High Court | websearch |
| bombay_hc | Bombay High Court | websearch |
| madras_hc | Madras High Court | websearch |

### Indian Tribunals

| ID | Name | Focus Areas |
|----|------|-------------|
| tdsat | TDSAT | Telecom disputes |
| nclat | NCLAT | Competition appeals |

### Indian Regulators (Additional)

| ID | Name | Focus Areas |
|----|------|-------------|
| sebi_tech | SEBI | Digital securities, Fintech |
| irdai | IRDAI | Insurtech |
| asci | ASCI | Advertising standards |
| dgca | DGCA | Drones, Aviation |
| bis | BIS | Standards |
| npci | NPCI | Digital payments |

### International - EU

| ID | Name | Focus Areas |
|----|------|-------------|
| cnil_france | CNIL (France) | Data Protection |
| bfdi_germany | BfDI (Germany) | Data Protection |
| dpc_ireland | DPC Ireland | Data Protection, Platform |
| garante_italy | Garante (Italy) | Data Protection, AI |
| aepd_spain | AEPD (Spain) | Data Protection |
| eu_commission_digital | EU Digital Strategy | AI, Platform, Data |
| eu_ai_office | EU AI Office | AI Regulation |

### International - US

| ID | Name | Focus Areas |
|----|------|-------------|
| fcc_us | FCC | Telecom |
| nist_us | NIST | AI, Cybersecurity |
| ca_ag | California AG | CCPA/CPRA |
| ny_ag | New York AG | Tech, Privacy |
| cisa_us | CISA | Cybersecurity |

### International - UK & APAC

| ID | Name | Focus Areas |
|----|------|-------------|
| ofcom_uk | Ofcom | Telecom, Broadcasting |
| cma_uk | CMA | Competition, Digital Markets |
| singapore_pdpc | Singapore PDPC | Data Protection, AI |
| australia_oaic | Australia OAIC | Data Protection |

---

## Tier 3: Standard Sources (180)

**Check Frequency:** Daily
**Config File:** `sources/config/tier3-standard/standard-sources.json`

### All Remaining High Courts (21)

| ID | Name |
|----|------|
| calcutta_hc | Calcutta High Court |
| gujarat_hc | Gujarat High Court |
| mp_hc | Madhya Pradesh High Court |
| allahabad_hc | Allahabad High Court |
| punjab_haryana_hc | Punjab & Haryana High Court |
| kerala_hc | Kerala High Court |
| rajasthan_hc | Rajasthan High Court |
| orissa_hc | Orissa High Court |
| andhra_hc | Andhra Pradesh High Court |
| telangana_hc | Telangana High Court |
| jharkhand_hc | Jharkhand High Court |
| patna_hc | Patna High Court |
| chhattisgarh_hc | Chhattisgarh High Court |
| uttarakhand_hc | Uttarakhand High Court |
| himachal_hc | Himachal Pradesh High Court |
| jk_hc | J&K High Court |
| gauhati_hc | Gauhati High Court |
| manipur_hc | Manipur High Court |
| meghalaya_hc | Meghalaya High Court |
| tripura_hc | Tripura High Court |
| sikkim_hc | Sikkim High Court |

### International - EU (Additional)

| ID | Name | Focus Areas |
|----|------|-------------|
| eurlex | EUR-Lex | EU Law |
| edps | EDPS | Data Protection |
| enisa | ENISA | Cybersecurity |
| berec | BEREC | Telecom |
| ap_netherlands | AP (Netherlands) | Data Protection |
| apd_belgium | APD (Belgium) | Data Protection |
| cnpd_luxembourg | CNPD (Luxembourg) | Data Protection |
| dsb_austria | DSB (Austria) | Data Protection |

### International - US (Additional)

| ID | Name | Focus Areas |
|----|------|-------------|
| sec_digital | SEC | Digital Assets, Blockchain |
| cfpb_us | CFPB | Fintech |
| congress_gov | Congress.gov | Legislation |

### International - APAC (Additional)

| ID | Name | Focus Areas |
|----|------|-------------|
| singapore_imda | IMDA | Telecom, AI |
| australia_acma | ACMA | Telecom, Broadcasting |
| japan_ppc | Japan PPC | Data Protection |
| korea_pipc | Korea PIPC | Data Protection |
| hong_kong_pcpd | Hong Kong PCPD | Data Protection |

### International Organizations

| ID | Name | Focus Areas |
|----|------|-------------|
| itu | ITU | Telecom, AI |
| oecd_digital | OECD Digital | AI, Data, Platform |
| wipo | WIPO | IP, AI |
| icann | ICANN | Platform |
| un_tech_envoy | UN Tech Envoy | AI |

### Indian Ministries (Additional)

| ID | Name | Focus Areas |
|----|------|-------------|
| ib_ministry | I&B Ministry | Broadcasting, OTT |
| dpiit | DPIIT | IP, E-Commerce |
| consumer_affairs | Consumer Affairs | E-Commerce |

### Business News

| ID | Name | Focus Areas |
|----|------|-------------|
| et_tech | ET Tech | All |
| mint_tech | Mint Tech | All |
| inc42 | Inc42 | Fintech, E-Commerce, AI |
| techcrunch_india | TechCrunch India | All |
| entrackr | Entrackr | Fintech, E-Commerce |
| yourstory | YourStory | All |
| moneycontrol_tech | Moneycontrol Tech | Fintech, E-Commerce |
| business_standard_tech | Business Standard Tech | All |

### Legal News (Additional)

| ID | Name | Focus Areas |
|----|------|-------------|
| legally_india | Legally India | All |
| the_leaflet | The Leaflet | Constitutional, Platform |
| scroll_tech | Scroll Tech | All |
| the_wire_tech | The Wire Tech | All |
| quint_tech | The Quint Tech | All |

### Think Tanks (Additional)

| ID | Name | Focus Areas |
|----|------|-------------|
| orf | Observer Research Foundation | AI, Cybersecurity |
| icrier | ICRIER | E-Commerce |
| cuts_international | CUTS International | Competition, E-Commerce |
| data_governance_network | Data Governance Network | Data Protection, AI |
| it_for_change | IT for Change | Platform, Data |

### Indian Academic

| ID | Name |
|----|------|
| nlu_delhi_ccl | NLU Delhi CCL |
| nalsar_clt | NALSAR Centre for Law & Technology |
| nujs_blog | NUJS Law Review Blog |
| iitb_tech_policy | IIT Bombay Tech Policy |
| iiitb_itlaw | IIIT Bangalore IT Law |

---

## Tier 4: Regular Sources (220)

**Check Frequency:** Weekly
**Config File:** `sources/config/tier4-regular/regular-sources.json`

### Academic Repositories

| ID | Name | Focus Areas |
|----|------|-------------|
| ssrn_law | SSRN - Law | All |
| ssrn_tech | SSRN - Technology | All |
| arxiv_cs_cy | arXiv - CS/CY | AI, Privacy |

### Academic Centers (International)

| ID | Name | Focus Areas |
|----|------|-------------|
| stanford_hai | Stanford HAI | AI |
| harvard_berkman | Berkman Klein Center | Platform, Data |
| oxford_internet | Oxford Internet Institute | Platform, AI |
| mit_media_lab | MIT Media Lab | AI |
| yale_isp | Yale ISP | Platform |
| nyu_engelberg | NYU Engelberg | IP, AI |
| carnegie_mellon | CMU CyLab | Cybersecurity, AI |

### Advocacy Organizations

| ID | Name | Focus Areas |
|----|------|-------------|
| eff | EFF | Privacy, Constitutional |
| access_now | Access Now | Data, Rights |
| article_19 | Article 19 | Constitutional, Platform |
| privacy_international | Privacy International | Data Protection |
| future_of_life | Future of Life Institute | AI |
| ai_now | AI Now Institute | AI |
| partnership_ai | Partnership on AI | AI |
| cdt | CDT | Data, Platform |

### Academic Journals

| ID | Name | Focus Areas |
|----|------|-------------|
| journal_ilr_delhi | Indian Law Review | All |
| journal_nujs | NUJS Law Review | All |
| journal_nlsir | NLSIR | All |
| journal_jili | Journal of ILI | All |
| journal_ijlt | IJLT | All |
| journal_clpr | CLPR | Constitutional, Data |
| journal_scc | SCC Online Blog | All |

### Indian Law Firms

| ID | Name |
|----|------|
| trilegal | Trilegal |
| azbpartners | AZB & Partners |
| cyrilshroff | Cyril Amarchand Mangaldas |
| khaitan | Khaitan & Co |
| jsalaw | JSA Law |
| luthra | Luthra & Luthra |
| singhania | Singhania & Partners |
| nishith_desai | Nishith Desai Associates |
| ikigai | Ikigai Law |
| sng_partners | SNG & Partners |
| anand_anand | Anand and Anand |
| lakshmikumaran | Lakshmikumaran & Sridharan |
| samvad_partners | Samvad Partners |

### International Law Firms

| ID | Name |
|----|------|
| dla_piper | DLA Piper |
| clifford_chance | Clifford Chance |
| linklaters | Linklaters |
| freshfields | Freshfields |
| baker_mckenzie | Baker McKenzie |
| white_case | White & Case |

### Industry Bodies

| ID | Name | Focus Areas |
|----|------|-------------|
| nasscom | NASSCOM | AI, Data, E-Commerce |
| iamai | IAMAI | Platform, E-Commerce |
| ficci | FICCI | All |
| cii | CII | All |
| assocham | ASSOCHAM | All |
| coai | COAI | Telecom |
| ispai | ISPAI | Telecom |
| dsci | DSCI | Data, Cybersecurity |
| payments_council | Payments Council of India | Fintech |
| fintech_convergence | Fintech Convergence Council | Fintech |
| iapp | IAPP | Data Protection |

### Fintech Sources

| ID | Name | Focus Areas |
|----|------|-------------|
| rbi_fintech_dept | RBI Fintech Department | Fintech |
| npci | NPCI | Digital Payments |
| sebi_fintech | SEBI - Fintech | Fintech |
| irdai_insurtech | IRDAI - Insurtech | Fintech, Healthtech |
| fintech_india | Fintech News India | Fintech |
| bfsi_et | ET BFSI | Fintech |

### Gaming Sources

| ID | Name | Focus Areas |
|----|------|-------------|
| egr_gaming | eGaming Review | Gaming |
| igf_india | Indian Gaming Federation | Gaming |
| aigf | AIGF | Gaming |
| gaming_matters | Gaming Matters | Gaming |
| pocket_gamer | Pocket Gamer | Gaming |
| glaws_blog | GLaws Blog | Gaming |

### Healthtech Sources

| ID | Name | Focus Areas |
|----|------|-------------|
| healthtech_et | ET Healthworld | Healthtech |
| nha_india | National Health Authority | Healthtech |
| abdm | ABDM | Healthtech, Data |
| telemedicine_sbi | Telemedicine Society of India | Healthtech |

### OTT & Broadcasting

| ID | Name | Focus Areas |
|----|------|-------------|
| ott_coalition | IBF | Broadcasting, OTT |
| isan | ISAN | OTT |
| exchange4media | Exchange4Media | Broadcasting, OTT |
| afaqs | afaqs! | Broadcasting, OTT |

### Additional International

| ID | Name | Focus Areas |
|----|------|-------------|
| brazil_anpd | Brazil ANPD | Data Protection |
| south_africa_ic | South Africa IR | Data Protection |
| canada_opc | Canada OPC | Data Protection, AI |
| uae_dp | UAE Data Protection | Data Protection |
| kenya_dpc | Kenya ODPC | Data Protection |
| nigeria_nitda | Nigeria NITDA | Data Protection |
| indonesia_kominfo | Indonesia Kominfo | Data, Platform |
| thailand_pdpc | Thailand PDPC | Data Protection |
| philippines_npc | Philippines NPC | Data Protection |
| malaysia_pdp | Malaysia PDPD | Data Protection |
| new_zealand_opc | New Zealand OPC | Data Protection |

---

## Tier 5: Periodic Sources (248)

**Check Frequency:** Monthly
**Config File:** `sources/config/tier5-periodic/periodic-sources.json`

### Drones & eVTOL (18)

| ID | Name | Focus Areas |
|----|------|-------------|
| dgca_drones | DGCA Drone Rules | Drones |
| digitalsky | Digital Sky Platform | Drones |
| drone_federation | Drone Federation of India | Drones |
| ficci_drones | FICCI Drones Committee | Drones |
| suas_news | sUAS News | Drones |
| drone_life | DroneLife | Drones |
| evtol_insights | eVTOL Insights | Drones |
| faa_drones | FAA UAS | Drones (International) |
| easa_drones | EASA Drones | Drones (International) |

### Space Technology (15)

| ID | Name | Focus Areas |
|----|------|-------------|
| in_space | IN-SPACe | Space |
| isro_news | ISRO | Space |
| indian_space_assoc | Indian Space Association | Space |
| space_news | SpaceNews | Space |
| space_policy_online | Space Policy Online | Space |
| un_oosa | UN OOSA | Space (International) |

### Blockchain & Crypto (22)

| ID | Name | Focus Areas |
|----|------|-------------|
| bacc_india | BACC India | Blockchain |
| nasscom_blockchain | NASSCOM Blockchain | Blockchain |
| coindesk_india | CoinDesk India | Blockchain |
| cointelegraph_india | Cointelegraph India | Blockchain |
| the_block | The Block | Blockchain |
| crypto_briefing | Crypto Briefing | Blockchain |
| rbi_crypto | RBI Crypto/CBDC | Blockchain |
| fatf_virtual | FATF Virtual Assets | Blockchain |
| bis_cbdc | BIS CBDC | Blockchain, Fintech |

### Cybersecurity (24)

| ID | Name | Focus Areas |
|----|------|-------------|
| cert_in_advisories | CERT-In Advisories | Cybersecurity |
| nciipc | NCIIPC | Cybersecurity, Critical Infrastructure |
| dsci_reports | DSCI Reports | Cybersecurity, Data |
| nasscom_cyber | NASSCOM Cybersecurity | Cybersecurity |
| krebs_security | Krebs on Security | Cybersecurity |
| dark_reading | Dark Reading | Cybersecurity |
| threatpost | Threatpost | Cybersecurity |
| bleeping_computer | Bleeping Computer | Cybersecurity |
| security_week | SecurityWeek | Cybersecurity |
| enisa_reports | ENISA Reports | Cybersecurity |

### AI & ML (28)

| ID | Name | Focus Areas |
|----|------|-------------|
| niti_aayog_ai | NITI Aayog AI | AI |
| nvidia_ai_india | NVIDIA AI India | AI |
| google_ai_india | Google AI India | AI |
| microsoft_ai_india | Microsoft AI India | AI |
| openai_blog | OpenAI Blog | AI |
| anthropic_blog | Anthropic Blog | AI |
| deepmind_blog | DeepMind Blog | AI |
| mit_tech_review_ai | MIT Tech Review AI | AI |
| wired_ai | Wired AI | AI |
| venture_beat_ai | VentureBeat AI | AI |
| the_gradient | The Gradient | AI |
| distill_pub | Distill | AI |

### Autonomous Vehicles (12)

| ID | Name | Focus Areas |
|----|------|-------------|
| morth_av | MoRTH - Autonomous | Autonomous Vehicles |
| siam_india | SIAM | Autonomous Vehicles |
| nhtsa_av | NHTSA AV | Autonomous Vehicles |
| autonomous_vehicle_intl | AV International | Autonomous Vehicles |

### Quantum Computing (8)

| ID | Name | Focus Areas |
|----|------|-------------|
| dst_quantum | DST - Quantum | Quantum |
| qci_india | Quantum Computing India | Quantum |
| nist_quantum | NIST Quantum | Quantum |

### Biotechnology (14)

| ID | Name | Focus Areas |
|----|------|-------------|
| dbt_biotech | DBT | Biotechnology |
| birac | BIRAC | Biotechnology |
| able_india | ABLE India | Biotechnology |
| geac | GEAC | Biotechnology |
| fssai_gm | FSSAI - GM Foods | Biotechnology |

### Academic Journals (Additional)

| ID | Name | Focus Areas |
|----|------|-------------|
| jstor_law | JSTOR Law | All |
| heinonline | HeinOnline | All |
| westlaw_india | Westlaw India | All |
| lexis_india | LexisNexis India | All |
| indian_kanoon | Indian Kanoon | All |
| cambridge_jolt | Cambridge JOLT | All |
| yale_jolt | Yale JOLT | All |
| stanford_tech_lr | Stanford Tech Law Review | All |
| berkeley_tech_lj | Berkeley Tech LJ | All |
| harvard_jolt | Harvard JOLT | All |
| columbia_stlr | Columbia STLR | All |
| nyu_jipel | NYU JIPEL | IP |
| oxford_jiplp | Oxford JIPLP | IP |
| idpl_oxford | IDPL (Oxford) | Data Protection |
| cmlj_oxford | Computer Law & Security Review | Cybersecurity |

### Research Repositories

| ID | Name |
|----|------|
| google_scholar_tmt | Google Scholar - TMT Law |
| researchgate_tmt | ResearchGate TMT |
| academia_edu_tmt | Academia.edu TMT |

### State Government IT Departments (20)

| ID | Name |
|----|------|
| karnataka_it_dept | Karnataka IT |
| maharashtra_it | Maharashtra IT |
| telangana_it | Telangana IT |
| tamil_nadu_it | Tamil Nadu IT |
| kerala_it | Kerala IT |
| gujarat_it | Gujarat IT |
| up_it | UP IT |
| delhi_it | Delhi IT |
| rajasthan_it | Rajasthan IT |
| mp_it | MP IT |
| goa_it | Goa IT |
| wb_it | West Bengal IT |
| odisha_it | Odisha IT |
| andhra_it | Andhra Pradesh IT |
| assam_it | Assam IT |

### Niche International DPAs (22)

| ID | Name | Jurisdiction |
|----|------|--------------|
| argentina_dp | Argentina Data Protection | Argentina |
| chile_dp | Chile Data Protection | Chile |
| colombia_dp | Colombia SIC | Colombia |
| mexico_inai | Mexico INAI | Mexico |
| israel_ppa | Israel PPA | Israel |
| turkey_kvkk | Turkey KVKK | Turkey |
| egypt_dp | Egypt Data Protection | Egypt |
| ghana_dp | Ghana Data Protection | Ghana |
| rwanda_dp | Rwanda Data Protection | Rwanda |
| mauritius_dp | Mauritius DPO | Mauritius |
| switzerland_fdpic | Switzerland FDPIC | Switzerland |
| norway_datatilsynet | Norway Datatilsynet | Norway |
| sweden_imy | Sweden IMY | Sweden |
| denmark_datatilsynet | Denmark Datatilsynet | Denmark |
| finland_dpa | Finland DPA | Finland |
| poland_uodo | Poland UODO | Poland |
| czech_uoou | Czech UOOU | Czech Republic |
| hungary_naih | Hungary NAIH | Hungary |
| romania_anspdcp | Romania ANSPDCP | Romania |
| greece_dpa | Greece HDPA | Greece |
| portugal_cnpd | Portugal CNPD | Portugal |

---

## Source Methods

Each source specifies a checking method:

| Method | Tool | Usage |
|--------|------|-------|
| `rss` | WebFetch | Parse RSS feed URL for recent articles |
| `webfetch` | WebFetch | Fetch specific webpage sections |
| `websearch` | WebSearch | Execute search query for recent updates |

## Focus Areas

Sources are tagged with one or more focus areas:

- `all` - Relevant to all TMT topics
- `Data-Protection` - DPDP Act, Privacy
- `AI-Regulation` - Artificial Intelligence
- `Platform-Regulation` - Intermediary liability
- `Competition-Antitrust` - CCI, Digital markets
- `Telecommunications` - TRAI, Telecom Act
- `Fintech` - Digital payments, Lending
- `Cybersecurity` - CERT-In, Security
- `Broadcasting` - OTT, Media
- `IP-Copyright` - Intellectual Property
- `Gaming-Gambling` - Online gaming
- `Drones-eVTOL` - Aviation technology
- `Space-Technology` - Satellite, Space policy
- `Blockchain-Crypto` - Web3, CBDC
- `Healthtech` - Digital health
- `Constitutional-Rights` - Fundamental rights
- `E-Commerce` - Consumer protection
- `International-Comparative` - Global developments

---

## Configuration Updates

To add, modify, or disable sources:

1. Edit the appropriate tier JSON file in `sources/config/`
2. Set `enabled: false` to disable a source
3. Add new sources following the existing format
4. Update `master-sources.json` counts if adding/removing sources

---

*Generated by TMT Legal Intelligence System*
*Last Updated: 2025-01-12*
