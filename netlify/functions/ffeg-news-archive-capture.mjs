import {getStore} from '@netlify/blobs';
import {fetchAllFeeds} from './ffeg-news-feeds.mjs';

// Scheduled capture for the News Archive (design §5.4). Runs every 6 hours,
// merges the current wire into Netlify Blobs keyed by month (YYYY-MM), deduped
// by URL and never overwritten. Stores headline records ONLY (title, teaser,
// url, source, section, publishedAt, capturedAt) — never article text.
export const config = {schedule:'0 */6 * * *'};

export function monthKey(iso) {
 const d=new Date(iso);
 return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0');
}
export function mergeRecords(existing, incoming, capturedAt) {
 const byUrl=new Map();
 for(const record of existing||[]) if(record && record.url) byUrl.set(record.url, record);
 for(const item of incoming||[]){
  if(!item || !item.url || byUrl.has(item.url)) continue;
  byUrl.set(item.url,{title:item.title,teaser:item.teaser||'',url:item.url,source:item.source,section:item.section,publishedAt:item.publishedAt,capturedAt});
 }
 return [...byUrl.values()].sort((a,b)=>(Date.parse(b.publishedAt)||0)-(Date.parse(a.publishedAt)||0));
}
export async function captureNewsArchive(store, now=new Date()) {
 const {items,failedSources}=await fetchAllFeeds();
 const capturedAt=now.toISOString();
 const byMonth=new Map();
 for(const item of items){
  const key=monthKey(item.publishedAt||capturedAt);
  if(!byMonth.has(key)) byMonth.set(key,[]);
  byMonth.get(key).push(item);
 }
 const summary={};
 for(const [key,monthItems] of byMonth){
  const existing=(await store.get(key,{type:'json'}))||[];
  const merged=mergeRecords(existing,monthItems,capturedAt);
  await store.setJSON(key,merged);
  summary[key]={before:existing.length,after:merged.length,added:merged.length-existing.length};
 }
 return {capturedAt,months:summary,failedSources};
}
export default async function () {
 const store=getStore('ffeg-news-archive');
 const result=await captureNewsArchive(store);
 console.log('ffeg-news-archive-capture', JSON.stringify(result));
 return new Response('OK',{status:200});
}
