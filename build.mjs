// Reads data/events.csv + data/venues.csv -> site/index.html, site/events.json, site/feeds/*.ics
import fs from 'node:fs';
const CAL_NAME = 'NSEA Swim 2026-27';
const GROUPS = ['Splash','Tidepool','Riptide','Breakers','Surge','Senior'];
const TYPE_LABEL = {meet:'Meet','team-event':'Team event',deadline:'Deadline',schedule:'Schedule',camp:'Camp / zone'};

function parseCSV(t){const rows=[];let row=[],f='',q=false;
  for(let i=0;i<t.length;i++){const c=t[i];
    if(q){if(c=='"'){if(t[i+1]=='"'){f+='"';i++}else q=false}else f+=c}
    else if(c=='"')q=true; else if(c==','){row.push(f);f=''}
    else if(c=='\n'){row.push(f);rows.push(row);row=[];f=''} else if(c!='\r')f+=c}
  if(f||row.length){row.push(f);rows.push(row)}
  const [h,...b]=rows;return b.filter(r=>r.some(x=>x)).map(r=>Object.fromEntries(h.map((k,i)=>[k,(r[i]||'').trim()])))}
const list=s=>s?s.split(';').map(x=>x.trim()).filter(Boolean):[];

// Optional: pull from published Google Sheet CSVs (File > Share > Publish to web > CSV)
async function src(env,file){const u=process.env[env];if(!u)return fs.readFileSync(file,'utf8');
  const r=await fetch(u);if(!r.ok){console.error('Fetch failed for '+env+': '+r.status);process.exit(1)}const t=await r.text();fs.writeFileSync(file,t);return t}
const EVENTS_CSV=await src('EVENTS_CSV_URL','data/events.csv'),VENUES_CSV=await src('VENUES_CSV_URL','data/venues.csv');
const venues=Object.fromEntries(parseCSV(VENUES_CSV).map(v=>[v.key,v]));
const rows=parseCSV(EVENTS_CSV);

const addDays=(d,n)=>{const x=new Date(d+'T00:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)};
const compact=d=>d.replace(/-/g,'');
const errors=[];
const events=rows.map(r=>{
  const v=venues[r.venue]; if(r.venue&&!v)errors.push(`${r.id}: unknown venue ${r.venue}`);
  const groups=list(r.groups); const allGroups=groups.includes('All');
  groups.forEach(g=>{if(g!=='All'&&!GROUPS.includes(g))errors.push(`${r.id}: unknown group ${g}`)});
  if(!TYPE_LABEL[r.type])errors.push(`${r.id}: unknown type ${r.type}`);
  if(r.precision==='day'&&(!r.start||r.end<r.start))errors.push(`${r.id}: bad dates`);
  const q=v&&v.map_query;
  const locText=v?[v.name,v.address||[v.city,v.state].filter(Boolean).join(', ')].filter(Boolean).join(' - '):'';
  const e={id:r.id,title:r.title,start:r.start||null,end:r.end||null,precision:r.precision,month:r.month_hint||(r.start||'').slice(0,7),
    type:r.type,typeLabel:TYPE_LABEL[r.type],groups:allGroups?['All']:groups,groupsAll:allGroups,eligibility:r.eligibility,
    venue:r.venue||'',venueName:v?v.name:'',venueCity:v?[v.city,v.state].filter(Boolean).join(', '):'',home:v?v.home==='yes':false,
    location:locText,status:r.status||'Tentative',tags:list(r.tags),description:r.description,link:r.link,
    needsReview:!!r.needs_review,reviewNote:r.review_note,
    mapGoogle:q?'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q):'',
    mapApple:q?'https://maps.apple.com/?q='+encodeURIComponent(q):''};
  if(e.precision==='day'){
    e.addToGoogle='https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent(e.title)
     +`&dates=${compact(e.start)}/${compact(addDays(e.end,1))}`
     +'&details='+encodeURIComponent([e.eligibility&&('Eligibility: '+e.eligibility),e.description,e.link].filter(Boolean).join('\n')+'\n\nDates are tentative until confirmed by the team.')
     +(locText?'&location='+encodeURIComponent(locText):'');}
  return e}).sort((a,b)=>(a.start||a.month+'-99').localeCompare(b.start||b.month+'-99'));
if(errors.length){console.error(errors.join('\n'));process.exit(1)}

// ---- ICS ----
const esc=s=>String(s).replace(/\\/g,'\\\\').replace(/;/g,'\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');
const fold=l=>{const b=Buffer.from(l);if(b.length<=75)return l;let out='',cur='',n=0;
  for(const ch of l){const w=Buffer.byteLength(ch);if(n+w>(out?74:75)){out+=(out?'\r\n ':'')+cur;cur='';n=0}cur+=ch;n+=w}
  return out+(out?'\r\n ':'')+cur};
const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+/,'');
function ics(name,evs){
  const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//NSEA Swim//Events 2026-27//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH',
   'X-WR-CALNAME:'+esc(name),'X-WR-TIMEZONE:America/New_York','REFRESH-INTERVAL;VALUE=DURATION:PT6H','X-PUBLISHED-TTL:PT6H'];
  for(const e of evs.filter(e=>e.precision==='day')){
    const desc=[e.eligibility&&'Eligibility: '+e.eligibility,'Groups: '+(e.groupsAll?'All groups':e.groups.join(', ')),e.description,e.link&&'More: '+e.link,
      e.status==='Tentative'?'Dates are tentative and subject to change.':''].filter(Boolean).join('\n');
    L.push('BEGIN:VEVENT','UID:'+e.id+'@nseaswimteam.com','DTSTAMP:'+stamp,
      'DTSTART;VALUE=DATE:'+compact(e.start),'DTEND;VALUE=DATE:'+compact(addDays(e.end,1)),
      'SUMMARY:'+esc(e.title),'STATUS:'+(e.status==='Tentative'?'TENTATIVE':'CONFIRMED'),'TRANSP:TRANSPARENT',
      'CATEGORIES:'+[e.typeLabel,...e.tags].map(esc).join(','),'DESCRIPTION:'+esc(desc));
    if(e.location)L.push('LOCATION:'+esc(e.location));
    if(e.link)L.push('URL:'+e.link);
    L.push('END:VEVENT')}
  L.push('END:VCALENDAR');return L.map(fold).join('\r\n')+'\r\n'}

fs.mkdirSync('site/feeds',{recursive:true});
for(const f of fs.readdirSync('site/feeds'))fs.unlinkSync('site/feeds/'+f);
const feeds=[{file:'all.ics',label:'Everything',n:0,evs:events},
  {file:'meets.ics',label:'Meets only',evs:events.filter(e=>e.type==='meet')},
  {file:'deadlines.ics',label:'Deadlines only',evs:events.filter(e=>e.type==='deadline')}];
for(const g of GROUPS)feeds.push({file:g.toLowerCase()+'.ics',label:g+' (group events + all-group events)',evs:events.filter(e=>e.groupsAll||e.groups.includes(g))});
for(const f of feeds){fs.writeFileSync('site/feeds/'+f.file,ics(CAL_NAME+' - '+f.label,f.evs));f.n=f.evs.filter(e=>e.precision==='day').length;delete f.evs}

const payload={built:new Date().toISOString(),groups:GROUPS,typeLabels:TYPE_LABEL,feeds,events};
fs.writeFileSync('site/events.json',JSON.stringify(payload,null,1));
const tpl=fs.readFileSync('site-src/template.html','utf8');
fs.writeFileSync('site/index.html',tpl.replace('/*EVENTS_PAYLOAD_HERE*/null',()=>JSON.stringify(payload)));
console.log(`${events.length} events (${events.filter(e=>e.precision==='day').length} dated), ${feeds.length} feeds, ${events.filter(e=>e.needsReview).length} flagged`);
