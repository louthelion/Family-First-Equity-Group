const SOURCES = [
 {name:'Federal Reserve monetary policy',url:'https://www.federalreserve.gov/feeds/press_monetary.xml'},
 {name:'Census housing and construction',url:'https://www.census.gov/economic-indicators/indicator.xml',housingOnly:true}
];
export function parseFeed(xml, source) {
 if (xml.length > 1000000 || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('Unsupported XML');
 const decode = value => value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);/gi, token => {
  const named={'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'"};
  if (named[token]) return named[token];
  const n=token.startsWith('&#x') ? parseInt(token.slice(3,-1),16) : parseInt(token.slice(2,-1),10);
  return n>0 && n<=0x10ffff ? String.fromCodePoint(n) : '';
 }).replace(/<[^>]*>/g,'').trim();
 const tag=(item,name)=>decode(item.match(new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)</'+name+'>','i'))?.[1]||'');
 return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].slice(0,50).flatMap(match=>{
  const title=tag(match[1],'title'), raw=tag(match[1],'link'), date=tag(match[1],'pubDate');
  let url;try{url=new URL(raw);}catch{return [];}
  if (!title || url.protocol!=='https:' || !['www.federalreserve.gov','www.census.gov','census.gov'].includes(url.hostname)) return [];
  const timestamp=Date.parse(date);
  return [{title:title.slice(0,300),url:url.href,source,publishedAt:Number.isFinite(timestamp)?new Date(timestamp).toISOString():null}];
 });
}
export default async function (request) {
 if (request.method !== 'GET') return new Response('Method not allowed',{status:405,headers:{Allow:'GET'}});
 const results=await Promise.allSettled(SOURCES.map(async source=>{
  const response=await fetch(source.url,{signal:AbortSignal.timeout(8000),redirect:'error',headers:{Accept:'application/rss+xml, application/xml, text/xml'}});
  if (!response.ok) throw new Error('Source unavailable');
  const bytes=await response.arrayBuffer();
  if(bytes.byteLength>1000000)throw new Error('Feed too large');
  const preview=new TextDecoder().decode(bytes.slice(0,120));
  const xml=new TextDecoder(/ISO-8859-1/i.test(preview)?'iso-8859-1':'utf-8').decode(bytes);
  return parseFeed(xml,source.name).filter(item=>item.publishedAt && (!source.housingOnly || /construction|home sales|housing|rental vacancy/i.test(item.title)));
 }));
 const seen=new Set(),items=[];
 for(const result of results) if(result.status==='fulfilled') for(const item of result.value) if(!seen.has(item.url)){seen.add(item.url);items.push(item);}
 items.sort((a,b)=>(Date.parse(b.publishedAt)||0)-(Date.parse(a.publishedAt)||0));
 const failedSources=SOURCES.filter((_,i)=>results[i].status==='rejected').map(s=>s.name);
 return Response.json({fetchedAt:new Date().toISOString(),items:items.slice(0,18),failedSources}, {status:items.length?200:503,headers:{'Cache-Control':items.length?'public, max-age=60':'no-store','Netlify-CDN-Cache-Control':items.length?'public, s-maxage=900':'no-store','X-Content-Type-Options':'nosniff'}});
}
