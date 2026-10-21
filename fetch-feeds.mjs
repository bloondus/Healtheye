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
];
const KEV_URL = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 Healtheye/1.0';

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
function parseFeed(xml, feed){
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  return blocks.slice(0,15).map(b => {
    let link = '';
    const lm = b.match(/<link\s[^>]*href=["']([^"']+)["']/i);
    if(lm) link = lm[1]; else link = tag(b,'link');
    const desc = tag(b,'description','summary','content','content:encoded')
      .replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').slice(0,220);
    return {
      title: tag(b,'title'),
      link: link.trim(),
      date: tag(b,'pubDate','published','updated','dc:date'),
      desc, source: feed.name
    };
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
  items.sort((a,b) => new Date(b.date) - new Date(a.date));

  let kev = null;
  try{
    const d = await get(KEV_URL, true);
    kev = d.vulnerabilities.sort((a,b)=>b.dateAdded.localeCompare(a.dateAdded)).slice(0,6);
    console.log('OK   KEV: ' + kev.length + ' entries');
  }catch(e){ console.log('FAIL KEV: ' + e.message); }

  fs.writeFileSync('data.json', JSON.stringify({ ts: Date.now(), items, kev, feedStatus }));
  console.log(`=> data.json geschrieben: ${items.length} Meldungen, ${feedStatus.filter(f=>f.ok).length}/${FEEDS.length} Quellen, KEV ${kev?'ok':'fehlt'}`);
})();
