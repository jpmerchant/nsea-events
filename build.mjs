// Reads data/events.csv + data/venues.csv -> site/index.html, site/events.json, site/feeds/*.ics
import fs from 'node:fs';
const CAL_NAME = 'NSEA Swim 2026-27';
const GROUPS = ['Splash','Tidepool','Riptide','Breakers','Surge','Senior'];
const COLORS=['teal','teal-dark','coral','gray'];
const typeRows=fs.existsSync('data/types.csv')?parseCSV(fs.readFileSync('data/types.csv','utf8')):[{key:'meet',label:'Meet',color:'teal'},{key:'team-event',label:'Team event',color:'teal-dark'},{key:'deadline',label:'Deadline',color:'coral'},{key:'schedule',label:'Schedule',color:'gray'},{key:'camp',label:'Camp / zone',color:'teal'}];
const TYPE_LABEL=Object.fromEntries(typeRows.map(t=>[t.key,t.label]));
const TYPE_COLOR=Object.fromEntries(typeRows.map(t=>[t.key,COLORS.includes(t.color)?t.color:'teal']));
for(const k of ['meet','deadline'])if(!TYPE_LABEL[k]){console.error('types.csv must keep the "'+k+'" type (feeds and widget depend on it)');process.exit(1)}

function parseCSV(t){const rows=[];let row=[],f='',q=false;
  for(let i=0;i<t.length;i++){const c=t[i];
    if(q){if(c=='"'){if(t[i+1]=='"'){f+='"';i++}else q=false}else f+=c}
    else if(c=='"')q=true; else if(c==','){row.push(f);f=''}
    else if(c=='\n'){row.push(f);rows.push(row);row=[];f=''} else if(c!='\r')f+=c}
  if(f||row.length){row.push(f);rows.push(row)}
  const [h,...b]=rows;return b.filter(r=>r.some(x=>x)).map(r=>Object.fromEntries(h.map((k,i)=>[k,(r[i]||'').trim()])))}
const list=s=>s?s.split(';').map(x=>x.trim()).filter(Boolean):[];

const EVENTS_CSV=fs.readFileSync('data/events.csv','utf8'),VENUES_CSV=fs.readFileSync('data/venues.csv','utf8');
const venues=Object.fromEntries(parseCSV(VENUES_CSV).map(v=>[v.key,v]));
const rows=parseCSV(EVENTS_CSV);
const standardsList=fs.existsSync('data/standards.csv')?parseCSV(fs.readFileSync('data/standards.csv','utf8')):[];
const settings=fs.existsSync('data/settings.json')?JSON.parse(fs.readFileSync('data/settings.json','utf8')):{};
const stdByKey=Object.fromEntries(standardsList.map(s=>[s.key,s]));
const toolUrl=(keys)=>{const u=(settings.standards_tool_url||'').trim();if(!u||!keys.length)return u;
  return u+(u.includes('?')?'&':'?')+'std='+encodeURIComponent(keys.map(k=>stdByKey[k].name).join('|'))};
const isUrl=s=>!s||/^https?:\/\//.test(s);
// ---- change visibility: diff data/events.csv across recent commits (needs full git history; skipped quietly if unavailable)
const RECENT_DAYS=7;
const FIELD_LABEL={title:'name',start:'dates',end:'dates',precision:'dates',month_hint:'dates',type:'type',groups:'groups',eligibility:'eligibility',venue:'venue',status:'status',signup_deadline:'sign-up deadline',signup_link:'sign-up link',has_selection:'selection process',selection_link:'selection process',selection_notes:'selection process',has_standards:'standards',standards:'standards',standards_link:'standards',volunteer_link:'volunteer link',volunteer_deadline:'volunteer deadline',description:'details',link:'details link'};
const changeInfo={};
let recentChanges=[];
try{
  const {execFileSync}=await import('node:child_process');
  const git=(...a)=>execFileSync('git',a,{encoding:'utf8',stdio:['ignore','pipe','ignore'],maxBuffer:64e6});
  const since=new Date(Date.now()-RECENT_DAYS*864e5).toISOString();
  const commits=git('log','--reverse','--since='+since,'--format=%H %cI','--','data/events.csv').trim().split('\n').filter(Boolean).map(l=>l.split(' '));
  for(const [h,when] of commits){
    let before=[];try{before=parseCSV(git('show',h+'^:data/events.csv'))}catch{continue}
    const after=parseCSV(git('show',h+':data/events.csv'));
    const prev=Object.fromEntries(before.map(r=>[r.id,r]));
    const touched=after.filter(r=>!prev[r.id]||Object.keys(FIELD_LABEL).some(k=>(prev[r.id][k]||'')!==(r[k]||''))).length;
    if(touched>12)continue; // bulk import/re-seed, not an edit worth flagging
    for(const r of after){const o=prev[r.id];
      if(!o){changeInfo[r.id]={kind:'new',when,what:[]};continue}
      const what=[...new Set(Object.keys(FIELD_LABEL).filter(k=>(o[k]||'')!==(r[k]||'')).map(k=>FIELD_LABEL[k]))];
      if(what.length){const old=changeInfo[r.id];changeInfo[r.id]={kind:old&&old.kind==='new'?'new':'updated',when,what:[...new Set([...(old?old.what:[]),...what])]}}}
    for(const o of before)if(!after.some(r=>r.id===o.id))recentChanges.push({id:o.id,title:o.title,kind:'removed',when,what:[]})}
}catch(e){console.warn('change history unavailable:',e.message)}

const warnings=[];

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
  const sKeys=list(r.standards);
  sKeys.forEach(k=>{if(!stdByKey[k])errors.push(`${r.id}: unknown standard ${k}`)});
  if(sKeys.length&&r.has_standards!=='yes')errors.push(`${r.id}: standards listed but has_standards is not checked`);
  if(r.signup_deadline&&!/^\d{4}-\d\d-\d\d$/.test(r.signup_deadline))errors.push(`${r.id}: bad signup_deadline`);
  for(const f of ['signup_link','selection_link','standards_link','link'])if(!isUrl(r[f]))errors.push(`${r.id}: ${f} must start with http(s)`);
  if(r.volunteer_deadline&&!/^\d{4}-\d\d-\d\d$/.test(r.volunteer_deadline))errors.push(`${r.id}: bad volunteer_deadline`);
  if(!isUrl(r.volunteer_link))errors.push(`${r.id}: volunteer_link must start with http(s)`);
  if(r.volunteer_deadline&&r.start&&r.volunteer_deadline>r.start)warnings.push(`${r.id}: volunteer deadline is after the event starts`);
  if(r.signup_deadline&&r.start&&r.signup_deadline>r.start)warnings.push(`${r.id}: signup deadline is after the event starts`);
  const e={id:r.id,title:r.title,start:r.start||null,end:r.end||null,precision:r.precision,month:r.month_hint||(r.start||'').slice(0,7),
    type:r.type,typeLabel:TYPE_LABEL[r.type],typeColor:TYPE_COLOR[r.type]||'teal',groups:allGroups?['All']:groups,groupsAll:allGroups,eligibility:r.eligibility,
    venue:r.venue||'',venueName:v?v.name:'',venueCity:v?[v.city,v.state].filter(Boolean).join(', '):'',home:v?v.home==='yes':false,
    location:locText,status:r.status||'Tentative',tags:list(r.tags),description:r.description,link:r.link,
    needsReview:!!r.needs_review,reviewNote:r.review_note,
    signupDeadline:r.signup_deadline||null,signupLink:r.signup_link,volunteerDeadline:r.volunteer_deadline||null,volunteerLink:r.volunteer_link||'',
    hasSelection:r.has_selection==='yes',selectionLink:r.selection_link,selectionNotes:r.selection_notes,
    hasStandards:r.has_standards==='yes',standardsLink:r.standards_link,
    standards:sKeys.filter(k=>stdByKey[k]).map(k=>({key:k,name:stdByKey[k].name,link:stdByKey[k].link})),
    toolUrl:r.has_standards==='yes'&&sKeys.length?toolUrl(sKeys):'',
    requires:[r.signup_deadline&&'signup',(r.volunteer_deadline||r.volunteer_link)&&'volunteer',r.has_selection==='yes'&&'selection',r.has_standards==='yes'&&'standards'].filter(Boolean),
    mapGoogle:q?'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q):'',
    mapApple:q?'https://maps.apple.com/?q='+encodeURIComponent(q):''};
  if(e.precision==='day'){
    e.addToGoogle='https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent(e.title)
     +`&dates=${compact(e.start)}/${compact(addDays(e.end,1))}`
     +'&details='+encodeURIComponent([e.eligibility&&('Eligibility: '+e.eligibility),e.signupDeadline&&('Sign up by '+e.signupDeadline+(e.signupLink?': '+e.signupLink:'')),e.hasSelection&&('Selection process'+(e.selectionLink?': '+e.selectionLink:'')),e.volunteerLink&&('Volunteer: '+e.volunteerLink+(e.volunteerDeadline?' (by '+e.volunteerDeadline+')':'')),e.standards.length&&('Qualifying standards: '+e.standards.map(s=>s.name).join(', ')),e.description,e.link].filter(Boolean).join('\n')+'\n\nDates are tentative until confirmed by the team.')
     +(locText?'&location='+encodeURIComponent(locText):'');}
  if(e.volunteerDeadline)e.volunteerAddToGoogle='https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent('Volunteer sign-up deadline: '+e.title)+`&dates=${compact(e.volunteerDeadline)}/${compact(addDays(e.volunteerDeadline,1))}`+'&details='+encodeURIComponent((e.volunteerLink?'Volunteer: '+e.volunteerLink+'\n':'')+'Event: '+e.title);
  if(e.signupDeadline)e.signupAddToGoogle='https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent('Sign-up deadline: '+e.title)+`&dates=${compact(e.signupDeadline)}/${compact(addDays(e.signupDeadline,1))}`+'&details='+encodeURIComponent((e.signupLink?'Sign up: '+e.signupLink+'\n':'')+'Event: '+e.title);
  return e}).sort((a,b)=>(a.start||a.month+'-99').localeCompare(b.start||b.month+'-99'));
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
warnings.forEach(w=>console.warn('WARN '+w));

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
    const desc=[e.eligibility&&'Eligibility: '+e.eligibility,e.signupDeadline&&('Sign up by '+e.signupDeadline+(e.signupLink?': '+e.signupLink:'')),e.hasSelection&&('Selection process'+(e.selectionLink?': '+e.selectionLink:'')),(e.volunteerLink||e.volunteerDeadline)&&('Volunteer'+(e.volunteerDeadline?' by '+e.volunteerDeadline:'')+(e.volunteerLink?': '+e.volunteerLink:'')),e.standards.length&&('Qualifying standards: '+e.standards.map(s=>s.name).join(', ')+(e.standardsLink?' ('+e.standardsLink+')':'')),'Groups: '+(e.groupsAll?'All groups':e.groups.join(', ')),e.description,e.link&&'More: '+e.link,
      e.status==='Tentative'?'Dates are tentative and subject to change.':''].filter(Boolean).join('\n');
    L.push('BEGIN:VEVENT','UID:'+e.id+'@nseaswimteam.com','DTSTAMP:'+stamp,
      'DTSTART;VALUE=DATE:'+compact(e.start),'DTEND;VALUE=DATE:'+compact(addDays(e.end,1)),
      'SUMMARY:'+esc(e.title),'STATUS:'+(e.status==='Tentative'?'TENTATIVE':'CONFIRMED'),'TRANSP:TRANSPARENT',
      'CATEGORIES:'+[e.typeLabel,...e.tags].map(esc).join(','),'DESCRIPTION:'+esc(desc));
    if(e.location)L.push('LOCATION:'+esc(e.location));
    if(e.link)L.push('URL:'+e.link);
    L.push('END:VEVENT')}
  for(const e of evs.filter(e=>e.signupDeadline)){
    L.push('BEGIN:VEVENT','UID:'+e.id+'-signup@nseaswimteam.com','DTSTAMP:'+stamp,
      'DTSTART;VALUE=DATE:'+compact(e.signupDeadline),'DTEND;VALUE=DATE:'+compact(addDays(e.signupDeadline,1)),
      'SUMMARY:'+esc('Sign-up deadline: '+e.title),'STATUS:CONFIRMED','TRANSP:TRANSPARENT','CATEGORIES:Deadline',
      'DESCRIPTION:'+esc([e.signupLink&&'Sign up: '+e.signupLink,'Event: '+e.title+' ('+(e.start||'date TBD')+')'].filter(Boolean).join('\n')));
    if(e.signupLink)L.push('URL:'+e.signupLink);
    L.push('END:VEVENT')}
  for(const e of evs.filter(e=>e.volunteerDeadline)){
    L.push('BEGIN:VEVENT','UID:'+e.id+'-volunteer@nseaswimteam.com','DTSTAMP:'+stamp,
      'DTSTART;VALUE=DATE:'+compact(e.volunteerDeadline),'DTEND;VALUE=DATE:'+compact(addDays(e.volunteerDeadline,1)),
      'SUMMARY:'+esc('Volunteer sign-up deadline: '+e.title),'STATUS:CONFIRMED','TRANSP:TRANSPARENT','CATEGORIES:Deadline,Volunteer',
      'DESCRIPTION:'+esc([e.volunteerLink&&'Volunteer: '+e.volunteerLink,'Event: '+e.title+' ('+(e.start||'date TBD')+')'].filter(Boolean).join('\n')));
    if(e.volunteerLink)L.push('URL:'+e.volunteerLink);
    L.push('END:VEVENT')}
  L.push('END:VCALENDAR');return L.map(fold).join('\r\n')+'\r\n'}

fs.mkdirSync('site/feeds',{recursive:true});
for(const f of fs.readdirSync('site/feeds'))fs.unlinkSync('site/feeds/'+f);
const feeds=[{file:'all.ics',label:'Everything',n:0,evs:events},
  {file:'meets.ics',label:'Meets only',evs:events.filter(e=>e.type==='meet')},
  {file:'deadlines.ics',label:'Deadlines only (incl. sign-up deadlines)',evs:events.filter(e=>e.type==='deadline'),signupOnly:events.filter(e=>e.type!=='deadline'&&(e.signupDeadline||e.volunteerDeadline))}];
for(const g of GROUPS)feeds.push({file:g.toLowerCase()+'.ics',label:g+' (group events + all-group events)',evs:events.filter(e=>e.groupsAll||e.groups.includes(g))});
for(const f of feeds){const body=ics(CAL_NAME+' - '+f.label,f.evs.concat((f.signupOnly||[]).map(e=>({...e,precision:'skip'}))));
  fs.writeFileSync('site/feeds/'+f.file,body);f.n=(body.match(/BEGIN:VEVENT/g)||[]).length;delete f.evs;delete f.signupOnly}

for(const e of events){const c=changeInfo[e.id];if(c){e.change=c.kind;e.changedOn=c.when.slice(0,10);e.changedWhat=c.what}}
const recent=events.filter(e=>e.change).map(e=>({id:e.id,title:e.title,kind:e.change,on:e.changedOn,what:e.changedWhat,date:e.start||e.month})).concat(recentChanges.map(c=>({id:c.id,title:c.title,kind:'removed',on:c.when.slice(0,10),what:[],date:''}))).sort((a,b)=>b.on.localeCompare(a.on)||a.title.localeCompare(b.title));
// cut times for the standards actually used by events (data/standard-times.json: sex > age group > event > [name,time,...])
const stdGroups=settings.standard_groups||{};
const usedStd=new Set(events.flatMap(e=>e.standards.flatMap(x=>stdGroups[x.name]||[x.name])));
const times={};
if(fs.existsSync('data/standard-times.json')){const T=JSON.parse(fs.readFileSync('data/standard-times.json','utf8'));
  for(const sx of Object.keys(T))for(const ag of Object.keys(T[sx]))for(const ev of Object.keys(T[sx][ag]))for(const r of T[sx][ag][ev])
    if(usedStd.has(r[0])){(((times[sx]??={})[ag]??={})[ev]??={})[r[0]]=r[1]}}
const payload={built:new Date().toISOString(),times,stdGroups,recent,standardsToolUrl:settings.standards_tool_url||'',groups:GROUPS,typeLabels:TYPE_LABEL,feeds,events};
fs.writeFileSync('site/events.json',JSON.stringify(payload,null,1));
const widgetItems=[];
for(const e of events){
  if(e.type==='deadline'&&e.precision==='day')widgetItems.push({title:e.title,date:e.start,link:e.signupLink||''});
  if(e.volunteerDeadline)widgetItems.push({title:'Volunteer: '+e.title,date:e.volunteerDeadline,link:e.volunteerLink,cta:'Volunteer',sub:e.start?'Event starts '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+e.start.slice(5,7)-1]+' '+(+e.start.slice(8)):''});
  if(e.signupDeadline)widgetItems.push({title:'Sign up: '+e.title,date:e.signupDeadline,link:e.signupLink,sub:e.start?'Event starts '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+e.start.slice(5,7)-1]+' '+(+e.start.slice(8))+(e.start.slice(0,4)!==e.signupDeadline.slice(0,4)?', '+e.start.slice(0,4):''):''});
}
const wtpl=fs.readFileSync('site-src/widget.html','utf8');
fs.mkdirSync('site/widget',{recursive:true});
fs.writeFileSync('site/widget/index.html',wtpl.replace('/*WIDGET_DATA_HERE*/null',()=>JSON.stringify(widgetItems)));
const stpl=fs.readFileSync('site-src/subscribe.html','utf8');
fs.mkdirSync('site/subscribe',{recursive:true});
fs.writeFileSync('site/subscribe/index.html',stpl.replace('/*FEEDS_HERE*/null',()=>JSON.stringify(feeds)).replace('/*GROUPS_HERE*/null',()=>JSON.stringify(GROUPS)));
const tpl=fs.readFileSync('site-src/template.html','utf8');
fs.writeFileSync('site/index.html',tpl.replace('/*EVENTS_PAYLOAD_HERE*/null',()=>JSON.stringify(payload)));
fs.mkdirSync('site/admin',{recursive:true});fs.copyFileSync('site-src/admin.html','site/admin/index.html');
console.log(`${events.length} events (${events.filter(e=>e.precision==='day').length} dated), ${feeds.length} feeds, ${events.filter(e=>e.needsReview).length} flagged`);
