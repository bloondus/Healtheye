#!/usr/bin/env node
/* Healtheye — Fetch-Skript (läuft in GitHub Actions, serverseitig, kein CORS).
   Holt alle RSS/Atom-Feeds + CISA KEV und schreibt data.json ins Repo-Root.
   Das Frontend lädt data.json von derselben Origin — keine Proxies nötig. */

import fs from 'fs';

const FEEDS = [
  { name:'heise Security',    url:'https://www.heise.de/security/rss/news-atom.xml' },
  { name:'The Hacker News',   url:'https://feeds.feedburner.com/TheHackersNews' },
  { name:'BleepingComputer',  url:'https://www.bleepingcomputer.com/feed/' },
  { name:'Krebs on Security', url:'https://krebsonsecurity.com/feed/' },
  { name:'SecurityWeek',      url:'https://www.securityweek.com/feed/' },
  { name:'CISA Advisories',   url:'https://www.cisa.gov/cybersecurity-advisories/all.xml' },
  { name:'HIPAA Journal',     url:'https://www.hipaajournal.com/feed/' },
  { name:'HealthcareInfoSec', url:'https://www.healthcareinfosecurity.com/rss-feeds' },
];
const KEV_URL = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 Healtheye/1.0';

// Klassifizierung (gleiche Logik wie im Frontend)
// Healthcare-Relevanz — Hersteller/Systeme des eigenen Hauses ergänzen
const HEALTH = ['hospital','healthcare','health care','patient','patients','medical','clinic','clinics',
  'radiolog','pharma','pharmacy','spital','krankenhaus','klinik','gesundheit','medizin','labor','laboratory',
  // Spital-IT-Systeme & Standards
  'dicom','hl7','fhir','pacs','ris','kis','lis','emr','ehr','epic','cerner','meditech','dedalus','agfa',
  // Medizingeräte-Hersteller & Zulieferer
  'siemens healthineers','philips','ge healthcare','dräger','draeger','medtronic','stryker','becton dickinson',
  'fresenius','baxter','b. braun','getinge','olympus','irhythm','conduent',
  // Angreifer & Angriffe auf Gesundheitswesen
  'ransomware','safepay','lockbit','blackcat','alphv','cl0p','clop','conti','ryuk','hive','chaos',
  'data breach','breach','datenleck','vishing','double extortion',
  // Regulierung & Behörden (Gesundheit)
  'hipaa','hhs','ocr','fda','mdr','medical device','medizingerät','nis2','nis-2','gdpr','dsgvo',
  'critical infrastructure','kritis','health sector','gesundheitssektor','protected health information','phi','ehealth','telehealth','telemedizin'];
const CRIT = ['zero-day','zero day','0-day','actively exploited','in the wild','ransomware','kev',
  'remote code execution','rce','supply chain','backdoor','kritisch','notfall','emergency'];
const MED  = ['vulnerability','schwachstelle','cve-','patch','update','malware','phishing','trojan',
  'botnet','exploit','breach','datenleck','leak','ddos','angriff','attack','hack'];
function classify(it){
  const text = (it.title+' '+it.desc).toLowerCase();
  const has = arr => arr.filter(k => text.includes(k)).length;
  const crit = has(CRIT), med = has(MED);
  it.health = has(HEALTH) > 0;
  it.level = crit >= 2 ? 'kritisch' : crit === 1 ? 'hoch' : med > 0 ? 'mittel' : 'info';
  return it;
}

async function get(url, asJson){
  const r = await fetch(url, { headers:{ 'User-Agent':UA, 'Accept':'*/*' }, signal: AbortSignal.timeout(25000) });
  if(!r.ok) throw new Error('HTTP '+r.status);
  return asJson ? r.json() : r.text();
}

/* --- minimalistisches RSS/Atom-Parsing (keine Deps nötig) --- */
function tag(block, ...names){
  for(const n of names){
    const m = block.match(new RegExp(`<${n}(?:\\s[^>]*)?>([\\s\\S]*?)</${n}>`, 'i'));
    if(m) return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').trim();
  }
  return '';
}
// Datum robust parsen; ungültig/leer → null (wird im Frontend ans Ende sortiert,
// statt mit falschem „jetzt" die frischen Meldungen zu verdrängen)
function parseDate(s){
  const t = new Date(s).getTime();
  return isNaN(t) ? null : new Date(t).toISOString();
}
function parseFeed(xml, feed){
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  return blocks.slice(0,15).map(b => {
    let link = '';
    const lm = b.match(/<link\s[^>]*href=["']([^"']+)["']/i);
    if(lm) link = lm[1]; else link = tag(b,'link');
    const desc = tag(b,'description','summary','content','content:encoded')
      .replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').slice(0,220);
    return classify({
      title: tag(b,'title'),
      link: link.trim(),
      date: parseDate(tag(b,'pubDate','published','updated','dc:date')),
      desc, source: feed.name
    });
  }).filter(i => i.title && i.link);
}

(async () => {
  const items = [], feedStatus = [];
  const results = await Promise.allSettled(FEEDS.map(f => get(f.url)));
  results.forEach((r,i) => {
    let parsed = [];
    if(r.status === 'fulfilled'){
      try{ parsed = parseFeed(r.value, FEEDS[i]); }catch(e){}
    }
    items.push(...parsed);
    feedStatus.push({ name: FEEDS[i].name, ok: parsed.length>0, n: parsed.length });
    console.log(`${parsed.length>0?'OK  ':'FAIL'} ${FEEDS[i].name}: ${parsed.length} items`);
  });
  items.sort((a,b) => new Date(b.date||0) - new Date(a.date||0));

  let kev = null;
  try{
    const d = await get(KEV_URL, true);
    kev = d.vulnerabilities.sort((a,b)=>b.dateAdded.localeCompare(a.dateAdded)).slice(0,6);
    console.log('OK   KEV: ' + kev.length + ' entries');
  }catch(e){ console.log('FAIL KEV: ' + e.message); }

  // Nur frische Meldungen: alles älter als 48h fällt raus; Items ohne Datum bleiben drin (werden hinten sortiert)
  const cutoff = Date.now() - 48*3600000;
  const frisch = items.filter(i => !i.date || new Date(i.date).getTime() >= cutoff);
  console.log(`Frische-Filter: ${items.length} → ${frisch.length} Meldungen (>48h entfernt: ${items.length-frisch.length}, ohne Datum: ${frisch.filter(i=>!i.date).length})`);

  fs.writeFileSync('data.json', JSON.stringify({ ts: Date.now(), items: frisch, kev, feedStatus }));
  console.log(`=> data.json geschrieben: ${frisch.length} Meldungen, ${feedStatus.filter(f=>f.ok).length}/${FEEDS.length} Quellen, KEV ${kev?'ok':'fehlt'}`);
})();
