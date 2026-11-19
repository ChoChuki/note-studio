const CACHE='note-studio-v2.0.0';
const ASSETS=[
 './','./index.html','./styles.css','./app.js','./i18n.js','./music-core.js','./symbol-paths.js','./audio.js',
 './manifest.webmanifest','./icon-192.png','./icon-512.png',
 './vendor/WebAudioFontPlayer.js','./vendor/0000_JCLive_sf2_file.js','./vendor/0400_JCLive_sf2_file.js',
 './ap-audio/sources.json',
 './ap-audio/piano-4.bin','./ap-audio/piano-5.bin','./ap-audio/piano-6.bin',
 './ap-audio/violin-4.bin','./ap-audio/violin-5.bin','./ap-audio/violin-6.bin'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('note-studio-')&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}return res;})));
});
