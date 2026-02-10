# Disabled Sources

77 sources disabled on 2026-02-10. These were failing every fetch cycle due to dead domains, expired SSL certificates, bot blocking, or invalid feeds. Set `"enabled": true` in the tier config JSON to re-enable any of them.

## Tier 2 — High Priority (4 sources)

| Source ID | Name | URL | Reason |
|-----------|------|-----|--------|
| asci | Advertising Standards Council of India | https://asci.online | Domain parked (redirects to Sedo) |
| azb_tmt | AZB & Partners - TMT | https://www.azbpartners.com | DNS failure — domain won't resolve |
| mca | Ministry of Corporate Affairs | https://www.mca.gov.in | 403 Forbidden — blocks automated requests |
| singapore_pdpc | Singapore PDPC | https://www.pdpc.gov.sg | RSS feed returns invalid XML |

## Tier 3 — Standard (14 sources)

| Source ID | Name | URL | Reason |
|-----------|------|-----|--------|
| acm_tech_news | ACM TechNews | https://technews.acm.org | 403 Forbidden |
| brookings_india | Brookings India | https://www.brookings.edu/geo/india/ | RSS returns invalid XML (undefined entity) |
| cnbc_tv18_tech | CNBC-TV18 Tech | https://www.cnbctv18.com/technology/ | 404 — RSS feed URL removed |
| digital_rights_foundation | Digital Rights Foundation | https://digitalrightsfoundation.pk | 403 Forbidden |
| dsb_austria | DSB (Austria DPA) | https://www.dsb.gv.at | 403 Forbidden |
| firstpost_tech | Firstpost Tech | https://www.firstpost.com/tech | RSS returns invalid XML |
| hong_kong_pcpd | Hong Kong PCPD | https://www.pcpd.org.hk | DNS failure |
| iim_ahmedabad_ciie | IIM Ahmedabad CIIE | https://ciie.co | Connection refused |
| iim_bangalore_nsrcel | IIM Bangalore NSRCEL | https://nsrcel.iimb.ac.in | DNS failure |
| nlsiu_citapp | NLSIU CITAPP | https://citapp.nls.ac.in | DNS failure |
| nlu_ranchi | NLU Ranchi | https://www.nluranchi.ac.in | DNS failure |
| nluja_assam | NLUJA Assam | https://www.nluja.ac.in | DNS failure |
| print_tech | The Print Tech | https://theprint.in | RSS returns invalid XML (syntax error) |
| singapore_pdpc | Singapore PDPC (webfetch) | https://www.pdpc.gov.sg | Duplicate + invalid feed |

## Tier 4 — Regular (32 sources)

| Source ID | Name | URL | Reason |
|-----------|------|-----|--------|
| agri_ministry | Ministry of Agriculture | https://agriculture.gov.in | DNS failure |
| agricultureworld | Agriculture World | https://www.agricultureworld.in | DNS failure |
| azbpartners | AZB & Partners | https://www.azbpartners.com | DNS failure (duplicate of azb_tmt) |
| bccc | BCCC | https://www.broadcastingcontentcomplaints.com | DNS failure |
| deity | DeitY Portal | https://www.deity.gov.in | DNS failure (merged into MeitY) |
| digital_payments_india | Digital Payments India | https://www.digitalpaymentsindia.com | DNS failure |
| education_world | Education World India | https://www.educationworld.in | 403 Forbidden |
| esportsobserver | Esports Observer | https://esportsobserver.com | 404 — feed URL removed |
| ficci_flo | FICCI Ladies Organisation | https://www.ficciflo.com | RSS returns invalid XML |
| fintech_convergence | Fintech Convergence Council | https://www.fintechcc.in | DNS failure |
| fintech_futures | FinTech Futures | https://www.fintechfutures.com | 403 Forbidden |
| freshfields | Freshfields | https://www.freshfields.com | DNS failure |
| healthcareitnews | Healthcare IT News | https://www.healthcareitnews.com | 403 Forbidden |
| ibdf | Indian Broadcasting Digital Foundation | https://www.ibdf.tv | DNS failure |
| ihs | Indian Health Services | https://main.mohfw.gov.in | DNS failure |
| imai | IMAI | https://imai.org.in | DNS failure |
| indian_edtech | Indian EdTech | https://www.indianedtech.com | DNS failure |
| indian_magazine_congress | Indian Magazine Congress | https://indianmagazinecongress.com | DNS failure |
| isan | ISAN (Internet & Streaming Assoc) | https://www.internetstreaming.in | DNS failure |
| krishi_jagran | Krishi Jagran | https://krishijagran.com | 404 — feed URL removed |
| majumdar_partners | Majumdar & Partners | https://www.majumdarandpartners.com | DNS failure |
| mobihealthnews | MobiHealthNews | https://www.mobihealthnews.com | 403 Forbidden |
| mobility_outlook | Mobility Outlook | https://mobilityoutlook.com | 404 — feed URL removed |
| nba_india | News Broadcasters Association | https://nba.co.in | Connection refused |
| nyu_engelberg | NYU Engelberg Center | https://www.law.nyu.edu/engelberg | 404 — page moved |
| ott_play | OTTplay | https://www.ottplay.com | RSS returns invalid XML |
| overdrive_india | Overdrive | https://www.overdrive.in | 404 — feed URL removed |
| rapidtvnews | RapidTV News | https://www.rapidtvnews.com | 404 — feed URL removed |
| saur_energy | Saur Energy | https://www.saurenergy.com | 404 — feed URL removed |
| streaming_media | Streaming Media | https://www.streamingmedia.com | DNS failure |
| supply_chain_brain | Supply Chain Brain | https://www.supplychainbrain.com | RSS returns invalid XML |
| verity | Verity Law | https://www.veritylaw.in | DNS failure |

## Tier 5 — Periodic (27 sources)

| Source ID | Name | URL | Reason |
|-----------|------|-----|--------|
| andhra_it | Andhra Pradesh IT Department | https://it.ap.gov.in | DNS failure |
| argo_ai | Argo AI | https://www.argo.ai | Company shut down (Oct 2022) |
| au_digital_transformation | African Union Digital | https://au.int | DNS failure |
| bacc_india | BACC (Blockchain Association) | https://bacc.co.in | DNS failure |
| bellatrix | Bellatrix Aerospace | https://www.bellatrixaerospace.com | DNS failure |
| biocon | Biocon | https://www.biocon.com | DNS failure |
| biotech_india | Biotech India | https://www.biotechindia.in | DNS failure |
| cisco_talos | Cisco Talos | https://blog.talosintelligence.com | 404 — feed URL changed |
| coindcx_blog | CoinDCX Blog | https://blog.coindcx.com | 404 — feed URL removed |
| delhi_it | Delhi IT Department | https://doitc.delhi.gov.in | DNS failure |
| drone_below | Drone Below | https://www.dronebelow.com | RSS returns invalid XML |
| drone_federation | Drone Federation of India | https://www.dronefederation.in | DNS failure |
| ethiopia_eic | Ethiopia ICT Authority | https://www.mcit.gov.et | DNS failure |
| fiercebiotech | Fierce Biotech | https://www.fiercebiotech.com | 404 — feed URL removed |
| finland_dpa | Finland DPA | https://tietosuoja.fi | 403 Forbidden |
| garuda_aerospace | Garuda Aerospace | https://garudaaerospace.com | DNS failure |
| icann_apac | ICANN APAC | https://www.icann.org | 404 — page moved |
| indian_space_assoc | Indian Space Association | https://www.indianspaceassociation.com | DNS failure |
| israel_ppa | Israel PPA | https://www.gov.il | 403 Forbidden |
| jordan_pdpc | Jordan PDPC | https://www.pdpc.gov.jo | DNS failure |
| lithuania_ada | Lithuania ADA | https://vdai.lrv.lt | 403 Forbidden |
| meta_ai | Meta AI | https://ai.meta.com | 400 Bad Request |
| ml_india | ML India | https://mlindia.org | DNS failure |
| nyu_jipel | NYU JIPEL | https://jipel.law.nyu.edu | DNS failure |
| qatar_dp | Qatar CDP | https://www.cdp.gov.qa | DNS failure |
| senegal_cdp | Senegal CDP | https://www.cdp.sn | Connection reset |
| wazirx_blog | WazirX Blog | https://blog.wazirx.com | RSS returns invalid XML |

## Failure Breakdown

| Reason | Count |
|--------|-------|
| DNS failure (domain dead/moved) | 38 |
| 403/400 Forbidden (bot blocked) | 12 |
| 404 (feed/page URL removed) | 10 |
| Invalid RSS XML | 9 |
| Connection refused/reset | 3 |
| Domain parked | 1 |
| Company shut down | 1 |
| Server error (duplicate) | 3 |
| **Total** | **77** |
