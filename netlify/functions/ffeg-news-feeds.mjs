// Shared feed configuration, parsing and fetching for the FFEG newsroom.
// Used by ffeg-market-news.mjs (live page) and ffeg-news-archive-capture.mjs
// (scheduled archive) so both read the exact same sources and allowlists.
// House rule: headlines + short teasers + links only — never article text.
export const SOURCES = [
 {name:'Mortgage News Daily — Rate Watch',short:'MND Rate Watch',section:'rates',url:'https://www.mortgagenewsdaily.com/rss/rates',hosts:['www.mortgagenewsdaily.com','mortgagenewsdaily.com']},
 {name:'Federal Reserve monetary policy',short:'Federal Reserve',section:'rates',url:'https://www.federalreserve.gov/feeds/press_monetary.xml',hosts:['www.federalreserve.gov','federalreserve.gov']},
 {name:'Realtor.com Research',short:'Realtor.com',section:'market',url:'https://www.realtor.com/research/feed/',hosts:['www.realtor.com','realtor.com']},
 {name:'Mortgage News Daily — NewsWire',short:'MND NewsWire',section:'market',url:'https://www.mortgagenewsdaily.com/rss/news',hosts:['www.mortgagenewsdaily.com','mortgagenewsdaily.com']},
 {name:'Census housing and construction',short:'U.S. Census Bureau',section:'market',url:'https://www.census.gov/economic-indicators/indicator.xml',hosts:['www.census.gov','census.gov'],housingOnly:true},
 {name:'NAHB — Eye on Housing',short:'NAHB',section:'economy',url:'https://eyeonhousing.org/feed/',hosts:['eyeonhousing.org','www.eyeonhousing.org']}
];
export const SECTION_CAPS = {rates:6,market:6,economy:6};
export const ALL_HOSTS = [...new Set(SOURCES.flatMap(source=>source.hosts))];

function decodeEntities(value) {
 return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&(?:amp|lt|gt|quot|apos|nbsp|#\d+|#x[0-9a-f]+);/gi, token => {
  const named={'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '};
  const lower=token.toLowerCase();
  if (named[lower]) return named[lower];
  const n=lower.startsWith('&#x') ? parseInt(lower.slice(3,-1),16) : parseInt(lower.slice(2,-1),10);
  return n>0 && n<=0x10ffff ? String.fromCodePoint(n) : '';
 });
}
function cleanText(value) {
 return decodeEntities(value).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
}
function makeTeaser(value) {
 const text=cleanText(value||'');
 if (!text) return '';
 return text.length>160 ? text.slice(0,157).trimEnd()+'…' : text;
}
export function parseFeed(xml, source) {
 if (xml.length > 1000000 || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('Unsupported XML');
 const tag=(item,name)=>{
  const match=item.match(new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)</'+name+'>','i'));
  return match ? match[1] : '';
 };
 return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].slice(0,50).flatMap(match=>{
  const title=cleanText(tag(match[1],'title')), raw=cleanText(tag(match[1],'link')), date=cleanText(tag(match[1],'pubDate'));
  let url;try{url=new URL(raw);}catch{return [];}
  if (!title || url.protocol!=='https:' || !source.hosts.includes(url.hostname)) return [];
  const timestamp=Date.parse(date);
  return [{title:title.slice(0,300),teaser:makeTeaser(tag(match[1],'description')),url:url.href,source:source.name,section:source.section,publishedAt:Number.isFinite(timestamp)?new Date(timestamp).toISOString():null}];
 });
}
export async function fetchAllFeeds() {
 const results=await Promise.allSettled(SOURCES.map(async source=>{
  const response=await fetch(source.url,{signal:AbortSignal.timeout(8000),redirect:'error',headers:{Accept:'application/rss+xml, application/xml, text/xml'}});
  if (!response.ok) throw new Error('Source unavailable');
  const bytes=await response.arrayBuffer();
  if(bytes.byteLength>1000000)throw new Error('Feed too large');
  const preview=new TextDecoder().decode(bytes.slice(0,120));
  const xml=new TextDecoder(/ISO-8859-1/i.test(preview)?'iso-8859-1':'utf-8').decode(bytes);
  return parseFeed(xml,source).filter(item=>item.publishedAt && (!source.housingOnly || /construction|home sales|housing|rental vacancy/i.test(item.title)));
 }));
 const failedSources=SOURCES.filter((_,i)=>results[i].status==='rejected').map(s=>s.name);
 const seen=new Set(),items=[];
 for(const result of results) if(result.status==='fulfilled') for(const item of result.value) if(!seen.has(item.url)){seen.add(item.url);items.push(item);}
 items.sort((a,b)=>(Date.parse(b.publishedAt)||0)-(Date.parse(a.publishedAt)||0));
 return {items,failedSources};
}
export function applySectionCaps(items, caps=SECTION_CAPS) {
 const counts={},capped=[];
 for(const item of items){
  const cap=caps[item.section] ?? 6;
  counts[item.section]=(counts[item.section]||0)+1;
  if(counts[item.section]<=cap) capped.push(item);
 }
 return capped;
}
