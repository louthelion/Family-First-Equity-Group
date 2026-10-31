import {getStore} from '@netlify/blobs';

// Read path for the News Archive page. GET ?month=YYYY-MM returns that month's
// stored headline records; defaults to the current month. Records are headline
// + teaser + link only — article text is never stored (design §5.4).
export default async function (request) {
 if (request.method !== 'GET') return new Response('Method not allowed',{status:405,headers:{Allow:'GET'}});
 const url=new URL(request.url);
 const now=new Date();
 const currentMonth=now.getUTCFullYear()+'-'+String(now.getUTCMonth()+1).padStart(2,'0');
 const monthParam=url.searchParams.get('month')||'';
 const month=/^\d{4}-(0[1-9]|1[0-2])$/.test(monthParam)?monthParam:currentMonth;
 const store=getStore('ffeg-news-archive');
 const records=(await store.get(month,{type:'json'}))||[];
 const {blobs}=await store.list();
 const months=[...new Set(blobs.map(b=>b.key).filter(k=>/^\d{4}-\d{2}$/.test(k)))].sort();
 return Response.json({month,months,records},{status:200,headers:{'Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'}});
}
