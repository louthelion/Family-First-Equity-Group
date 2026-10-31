import {fetchAllFeeds, applySectionCaps} from './ffeg-news-feeds.mjs';

// Re-exported for tests/tools that imported parseFeed from this module before
// the shared ffeg-news-feeds.mjs extraction.
export {parseFeed} from './ffeg-news-feeds.mjs';

export default async function (request) {
 if (request.method !== 'GET') return new Response('Method not allowed',{status:405,headers:{Allow:'GET'}});
 const {items,failedSources}=await fetchAllFeeds();
 const capped=applySectionCaps(items);
 return Response.json({fetchedAt:new Date().toISOString(),items:capped,failedSources}, {status:capped.length?200:503,headers:{'Cache-Control':capped.length?'public, max-age=60':'no-store','Netlify-CDN-Cache-Control':capped.length?'public, s-maxage=900':'no-store','X-Content-Type-Options':'nosniff'}});
}
