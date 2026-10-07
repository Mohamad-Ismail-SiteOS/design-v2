/* =====================================================================
   Scheduler. Structure follows the shipped screen:
   - toolbar: Publish, Actions menu, Add shift; filters (Job, User, Assigned, Status, Search),
     Users / Jobs, Week / Month, date navigation
   - grid: labour-cost corner, per-day totals, one row per person (hours | shifts), shift cards
   - card menu: Edit shift, Duplicate, Assign user, Remove user, Update time, Publish / Unpublish, Delete
   - dialogs: Publish week, Copy previous week, Clear week, Change time, Assign user, Unavailability / Time off
   - weekly summary bar: Shifts, Users, Man-hours
   ===================================================================== */
const SC={view:'week',group:'users',woff:0,moff:0,job:'',user:'',assign:'',status:'',q:''};
const wkStart=()=>addDays(WEEK0,SC.woff*7);
const empByName=n=>S.employees.find(e=>e.name===n);
const rateOf=n=>{const e=empByName(n);return e?(e.cost||e.hourly||0):0;};
const fin2=()=>can('view:employee:financials');
const shStatus=s=>s.cancelled?'cancelled':s.draft?'draft':s.date<TODAY_ISO?'completed':'published';
const SHS={draft:['neutral','Draft'],published:['ok','Published'],completed:['info','Completed'],cancelled:['bad','Cancelled']};
const overlaps=(a,b)=>a.date===b.date&&a.start<b.end&&b.start<a.end;
const clashOf=(name,cand,ignore)=>S.shifts.find(s=>!s.cancelled&&s.id!==ignore&&s.users.includes(name)&&overlaps(s,cand));
const shiftBy=id=>S.shifts.find(s=>s.id===id);
const psid=id=>{const[a,b]=String(id).split('@');return {sid:a,user:b?decodeURIComponent(b):''};};
const A$=v=>'A$'+Math.round(v).toLocaleString('en-AU');
const jobCol=n=>jobColor(n);
const rangeDates=(a,b)=>{const out=[];for(let d=a;d<=b&&out.length<62;d=addDays(d,1))out.push(d);return out;};

function passes(s){
 if(SC.job&&s.job!==SC.job)return false;
 if(SC.status&&shStatus(s)!==SC.status)return false;
 if(SC.assign==='assigned'&&!s.users.length)return false;
 if(SC.assign==='unassigned'&&s.users.length)return false;
 if(SC.user){const e=empBy(SC.user);if(!e||!s.users.includes(e.name))return false;}
 const q=SC.q.trim().toLowerCase();if(q&&!(s.job+' '+s.title+' '+s.users.join(' ')).toLowerCase().includes(q))return false;
 if(!can('view:schedule')&&!s.users.includes(ME.name))return false;
 return true;
}
const unavailOn=(name,date)=>S.unavail.filter(u=>u.user===name&&date>=u.from&&date<=u.to);

/* ---------- card + cell ---------- */
function cardItems(s,user){
 const st=shStatus(s),it=[];
 if(can('edit:shift'))it.push('edit:'+(s.users.length>1?'Edit group shift':'Edit shift'));
 if(can('create:shift'))it.push('dup:Duplicate');
 if(can('edit:shift')){it.push('assign:Assign user');if(user&&s.users.includes(user))it.push('remove:Remove user');it.push('time:'+(s.users.length>1&&user?'Update time (this user)':'Change time'));}
 if(can('edit:schedule')&&st!=='completed'&&st!=='cancelled')it.push(s.draft?'pub:Publish':'unpub:Unpublish');
 if(can('delete:shift'))it.push('del:Delete shift:danger');
 return it;
}
function shiftCard(s,user,mode){
 const st=shStatus(s),items=cardItems(s,user),who=mode==='jobs'?s.users.join(', ')||'Unassigned':(s.title||s.job);
 const attrs=items.length?`data-do="row-menu" data-kind="shift" data-id="${s.id}@${encodeURIComponent(user||'')}" data-items="${items.join('|')}" aria-haspopup="menu"`:'';
 return `<button type="button" class="shift${s.draft?' draft':''}${st==='cancelled'?' cancelled':''}${st==='completed'?' done':''}" style="--c:${jobCol(s.job)}" ${attrs} title="${esc(s.job)} · ${esc(s.users.join(', ')||'Unassigned')}"><b class="num">${t12(s.start)} – ${t12(s.end)}${s.users.length>1?` <span class="gi2">${ICON('users')}</span>`:''}${s.claim?' <span class="claim">Claimable</span>':''}</b><span>${esc(who)}</span></button>`;
}
function addBtn(date,user){
 if(!can('create:shift'))return '';
 const items=['new:Add shift','tpl:Add from templates',can('edit:schedule')?'off:Add time off':'','una:Add unavailability'].filter(Boolean);
 return `<button type="button" class="add" data-do="row-menu" data-kind="addshift" data-id="${date}@${encodeURIComponent(user||'')}" data-items="${items.join('|')}" aria-label="Add shift" aria-haspopup="menu">+ Add</button>`;
}
function unaBlock(u){
 return `<button type="button" class="una" data-do="row-menu" data-kind="una" data-id="${u.id}" data-items="edit:Edit|del:Delete:danger" title="${esc(u.reason||'')}">${u.kind==='timeoff'?'Time off':'Unavailable'}${u.allDay?'':' '+t12(u.start)+'–'+t12(u.end)}<small>${esc(u.reason||'')}</small></button>`;
}

/* ---------- week grid ---------- */
function weekData(){
 const a=wkStart(),days=[0,1,2,3,4,5,6].map(i=>addDays(a,i));
 return {a,days,sh:S.shifts.filter(s=>s.date>=days[0]&&s.date<=days[6]&&passes(s))};
}
function dayTotals(sh,d){
 const list=sh.filter(s=>s.date===d&&!s.cancelled),ppl=new Set(list.flatMap(s=>s.users)),jobs=new Set(list.map(s=>s.job));
 let hrs=0,cost=0;list.forEach(s=>{const h=shiftHrs(s);hrs+=h*Math.max(s.users.length,1);s.users.forEach(u=>cost+=h*rateOf(u));});
 return {hrs,ppl:ppl.size,jobs:jobs.size,cost,n:list.length,draft:list.filter(s=>s.draft).length};
}
function rowsFor(sh){
 if(SC.group==='jobs'){
  const names=[...new Set(sh.map(s=>s.job))].sort();
  return names.map(n=>({key:n,label:n,job:true,cells:d=>sh.filter(s=>s.job===n&&s.date===d),user:''}));
 }
 const q=SC.q.trim().toLowerCase();
 const people=S.employees.filter(e=>e.st==='active'&&e.inSched&&(can('view:schedule')||e.name===ME.name)&&(!SC.user||e.id===SC.user)&&(!q||e.name.toLowerCase().includes(q)||sh.some(s=>s.users.includes(e.name)))&&SC.assign!=='unassigned');
 const rows=people.map(e=>({key:e.id,label:e.name,emp:e,user:e.name,cells:d=>sh.filter(s=>s.date===d&&s.users.includes(e.name))}));
 const open=sh.filter(s=>!s.users.length);
 if(can('view:schedule')&&!SC.user&&SC.assign!=='assigned'&&(open.length||!q))rows.unshift({key:'open',label:'Unassigned',open:true,user:'',cells:d=>open.filter(s=>s.date===d)});
 return rows;
}
function weekCard(){
 const {a,days,sh}=weekData(),rows=rowsFor(sh),tot=Object.fromEntries(days.map(d=>[d,dayTotals(sh,d)])),maxH=Math.max(...days.map(d=>tot[d].hrs),1);
 const weekCost=days.reduce((x,d)=>x+tot[d].cost,0);
 const head=`<div class="srow shead scw"><div class="lc"><small>Labour cost</small><b class="num">${fin2()?A$(weekCost):'••••'}</b></div>${days.map(d=>{const p=dparts(d),t=tot[d];return `<div class="sdh${d===TODAY_ISO?' today':''}"><div class="sdt"><span class="dw">${p.dow.toUpperCase()}</span><span class="dt num">${p.d}/${MON.indexOf(p.m)+1}</span></div><div class="sdm"><span>${ICON('clock')}${Math.round(t.hrs)}h</span><span>${ICON('users')}${t.ppl}</span><span>${ICON('jobs')}${t.jobs}</span></div><div class="bar"><i style="width:${t.hrs/maxH*100}%;--c:${t.draft?'var(--warn-dot)':'var(--brand)'}"></i></div><div class="sdc"><span>${t.draft?t.draft+' draft':'Scheduled'}</span><b class="num">${fin2()?A$(t.cost):'•••'}</b></div></div>`;}).join('')}</div>`;
 const body=rows.length?rows.map(r=>{
  const mine=days.flatMap(d=>r.cells(d)),hrs=mine.filter(s=>!s.cancelled).reduce((x,s)=>x+shiftHrs(s),0);
  const label=r.open?`<span class="av">?</span><span><b>Unassigned</b><small>${mine.length} open shift${mine.length===1?'':'s'}</small></span>`
   :r.job?`<i class="sq" style="background:${jobCol(r.label)};width:10px;height:10px;border-radius:3px"></i><span><b>${esc(r.label)}</b><small class="num">${Math.round(hrs*10)/10} h | ${mine.length} shifts</small></span>`
   :`<span class="av">${portrait(r.label)}${ini(r.label)}</span><span><b>${esc(r.label)}</b><small class="num${hrs>48?' over':''}">${Math.round(hrs*10)/10}h | ${mine.length} shifts${hrs>48?' · over 48':''}</small></span>`;
  return `<div class="srow${r.open?' open':''}"><div class="who2">${r.emp?`<button type="button" class="whoBtn" data-do="sch-stats" data-u="${esc(r.user)}" aria-label="Totals for ${esc(r.label)}">${label}</button>`:label}</div>${days.map(d=>{
   const una=r.user?unavailOn(r.user,d):[],cards=r.cells(d);
   return `<div class="scell${d===TODAY_ISO?' today':''}">${una.map(unaBlock).join('')}${cards.map(s=>shiftCard(s,r.user,SC.group)).join('')}${!cards.length&&!una.length&&!r.job?addBtn(d,r.user):''}</div>`;}).join('')}</div>`;
 }).join(''):`<div class="empty lg" style="padding:36px"><b>No shifts match</b>Change a filter, or add a shift for this week.</div>`;
 return `<section class="qv-card" id="sched"><div class="tblwrap"><div class="sched" style="min-width:1120px">${head}${body}</div></div></section>`;
}

/* ---------- month ---------- */
function monthCard(){
 const first=new Date(Date.UTC(2026,9+SC.moff,1)),fIso=first.toISOString().slice(0,10),mi=first.getUTCMonth(),start=mondayOf(fIso);
 const cells=[];for(let i=0;i<42;i++)cells.push(addDays(start,i));
 const visible=S.shifts.filter(passes);
 return `<section class="qv-card"><div class="tblwrap"><div class="mgrid">${DOW.map(d=>`<div class="mh">${d}</div>`).join('')}${cells.map(d=>{
  const p=dparts(d),list=visible.filter(s=>s.date===d).sort((x,y)=>x.start.localeCompare(y.start)),inM=new Date(d+'T00:00:00Z').getUTCMonth()===mi;
  return `<button type="button" class="mc${inM?'':' out'}${d===TODAY_ISO?' today':''}" data-do="sch-day" data-d="${d}" aria-label="${fmtDL(d)}, ${list.length} shifts"><span class="mn num">${p.d}${p.d===1?' '+p.m:''}</span>${list.slice(0,3).map(s=>`<span class="mchipx${s.draft?' draft':''}${s.cancelled?' cancelled':''}" style="--c:${jobCol(s.job)}">${t12(s.start)} ${esc(s.job)}</span>`).join('')}${list.length>3?`<span class="mmore">+${list.length-3} more</span>`:''}</button>`;}).join('')}</div></div></section>`;
}

/* ---------- toolbar + summary ---------- */
function rangeLabel(){
 if(SC.view==='month'){const f=new Date(Date.UTC(2026,9+SC.moff,1));return MON[f.getUTCMonth()]+' '+f.getUTCFullYear();}
 const a=wkStart(),b=addDays(a,6),pa=dparts(a),pb=dparts(b);return pa.d+' '+pa.m+' – '+pb.d+' '+pb.m+' '+pb.y;
}
const selF=(key,label,opts)=>`<label class="scsel"><span class="sr">${label}</span><select data-scf="${key}" aria-label="${label}">${opts.map(([v,l])=>`<option value="${esc(v)}"${SC[key]===v?' selected':''}>${esc(l)}</option>`).join('')}</select></label>`;
function toolbarCard(){
 const filtersOn=SC.job||SC.user||SC.assign||SC.status||SC.q;
 return `<section class="qv-card sctool"><div class="sc-r"><span class="eyebrow">Filters</span>
  ${selF('job','Job',[['','All jobs'],...S.jobs.filter(j=>!j.arch).map(j=>[j.name,j.name])])}
  ${selF('user','User',[['','All users'],...S.employees.filter(e=>e.st==='active'&&e.inSched).map(e=>[e.id,e.name])])}
  ${selF('assign','Assigned',[['','Assigned / Unassigned'],['assigned','Assigned'],['unassigned','Unassigned']])}
  ${selF('status','Status',[['','All Status'],['draft','Draft'],['published','Published'],['completed','Completed'],['cancelled','Cancelled']])}
  <label class="field" style="width:200px">${ICON('search')}<input type="search" id="scq" placeholder="Search…" value="${esc(SC.q)}" aria-label="Search"></label>
  ${filtersOn?`<button type="button" class="btn btn-ghost btn-sm" data-do="sch-reset">Reset all</button>`:''}</div>
  <div class="sc-r"><div class="segc" role="radiogroup" aria-label="Group by">${[['users','Users'],['jobs','Jobs']].map(([k,l])=>`<button type="button" role="radio" aria-checked="${SC.group===k}" class="${SC.group===k?'on':''}" data-do="sch-group" data-g="${k}">${l}</button>`).join('')}</div>
  <div class="segc" role="radiogroup" aria-label="View">${[['week','Week'],['month','Month']].map(([k,l])=>`<button type="button" role="radio" aria-checked="${SC.view===k}" class="${SC.view===k?'on':''}" data-do="sch-view" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="scnav"><button type="button" class="iconbtn" data-do="sch-nav" data-dir="-1" aria-label="Previous ${SC.view}"><span style="display:inline-flex;transform:scaleX(-1)">${ICON('next')}</span></button><b>${rangeLabel()}</b><button type="button" class="iconbtn" data-do="sch-nav" data-dir="1" aria-label="Next ${SC.view}">${ICON('next')}</button><button type="button" class="btn btn-ghost btn-sm" data-do="sch-today">Today</button></div></div></section>`;
}
function summaryBar(){
 const {days,sh}=weekData(),live=sh.filter(s=>!s.cancelled),ppl=new Set(live.flatMap(s=>s.users));
 const mh=live.reduce((x,s)=>x+shiftHrs(s)*Math.max(s.users.length,1),0),rows=live.reduce((x,s)=>x+Math.max(s.users.length,1),0);
 return `<section class="qv-card sumbar" aria-label="Weekly summary"><b>Weekly summary</b><span title="Shift cards shown on the grid. A shift shared by several people counts once per row it appears on.">Shifts <strong class="num">${rows}</strong></span><span title="People with at least one shift this week.">Users <strong class="num">${ppl.size}</strong></span><span title="Hours x people, matching the day headers above: an 8h shift shared by two people is 16 man-hours.">Man-hours <strong class="num">${Math.round(mh*10)/10}</strong></span>${fin2()?`<span>Labour cost <strong class="num">${A$(days.reduce((x,d)=>x+dayTotals(sh,d).cost,0))}</strong></span>`:''}</section>`;
}

/* the designer's KPI cards and charts (restored): shifts, hours, assigned, unassigned, drafts; hours by day; hours by job */
function schedOverview(){
 const month=SC.view==='month';let live,days;
 if(month){const first=new Date(Date.UTC(2026,9+SC.moff,1)),a=first.toISOString().slice(0,10),b=new Date(Date.UTC(2026,10+SC.moff,0)).toISOString().slice(0,10);live=S.shifts.filter(s=>s.date>=a&&s.date<=b&&!s.cancelled&&passes(s));}
 else{const w=weekData();days=w.days;live=w.sh.filter(s=>!s.cancelled);}
 const mh=s=>shiftHrs(s)*Math.max(s.users.length,1),n=live.length,hours=live.reduce((a,s)=>a+mh(s),0),open=live.filter(s=>!s.users.length).length,dr=live.filter(s=>s.draft).length;
 const kp=strip('five',[
  {k:month?'Shifts this month':'Shifts this week',icon:'cal',v:n,spark:[52,55,51,58,56,54,Math.max(n,1)],act:{scroll:'#sched'}},
  {k:'Rostered hours',icon:'clock',tone:'var(--s3)',v:N(Math.round(hours)),unit:'h',d:month?'this month':'this roster',act:{scroll:'#qvDay'}},
  {k:'Assigned',icon:'users',tone:'var(--ok)',v:n-open,chip:chip('up',pctT(pct(n-open,n),0)+' filled'),act:{scroll:'#sched'}},
  {k:'Unassigned',icon:'alert',tone:'var(--warn-dot)',v:open,chip:open?chip('warn','Needs crew'):chip('up','All filled'),act:{scroll:'#sched'}},
  {k:'Drafts',icon:'send',tone:'var(--s7)',v:dr,d:'not sent to staff',act:{scroll:'#sched'}}]);
 if(month)return kp;
 const dayH=days.map(d=>Math.round(live.filter(s=>s.date===d).reduce((a,s)=>a+mh(s),0)));
 const byJob={};live.forEach(s=>{byJob[s.job]=(byJob[s.job]||0)+mh(s);});
 const jobSeg=Object.keys(byJob).sort((a,b)=>byJob[b]-byJob[a]).map(k=>({k,v:Math.round(byJob[k]),c:jobColor(k),vh:Math.round(byJob[k])+' h'}));
 const labels=days.map(d=>{const p=dparts(d);return p.dow+' '+p.d;});
 return kp+`<div class="g wl">${card({title:'Hours by day',sub:'Rostered hours across the week \u00b7 today highlighted',id:'qvDay',body:cols(labels,dayH,{hi:days.indexOf(TODAY_ISO),unit:' h'})})}${card({title:'Hours by job',sub:'Where this week\u2019s labour goes',cls:'aside',body:donut(jobSeg,{n:N(Math.round(hours)),l:'hours'},{sw:15})+legend(jobSeg)})}</div>`;
}
VIEWS.scheduler.sub=()=>SC.view==='week'?'Week of '+rangeLabel()+'. Drafts stay private until you publish.':'Month view. Pick a day to open its week.';
VIEWS.scheduler.count=()=>drafts()||null;
VIEWS.scheduler.act=()=>{
 const n=S.shifts.filter(s=>s.draft&&!s.cancelled&&s.date>=wkStart()&&s.date<=addDays(wkStart(),6)).length;
 const items=[can('edit:schedule')&&'copy:Copy previous week',can('edit:schedule')&&'clear:Clear week',can('edit:schedule')&&'clearua:Clear unavailabilities','off:Add time off','una:Add unavailability'].filter(Boolean);
 return (can('edit:schedule')?`<button type="button" class="btn btn-ghost" data-do="sch-publish"${n?'':' disabled'}>${ICON('send')}<span class="lb">Publish${n?' ('+n+')':''}</span></button>`:'')
  +`<button type="button" class="btn btn-ghost" data-do="row-menu" data-kind="schact" data-id="w" data-items="${items.join('|')}" aria-haspopup="menu">${ICON('more')}<span class="lb">Actions</span></button>`
  +(can('create:shift')?`<button type="button" class="btn" data-do="addshift-new" data-id="${wkStart()}@">${ICON('plus')}<span class="lb">Add shift</span></button>`:'');
};
VIEWS.scheduler.render=function(){return `<div class="page">${schedOverview()}${toolbarCard()}${SC.view==='week'?weekCard()+summaryBar():monthCard()}</div>`;};
VIEWS.scheduler.mount=function(root){
 const q=$('#scq',root);if(q)q.addEventListener('input',()=>{const pos=q.selectionStart;SC.q=q.value;rerender(true);setTimeout(()=>{const n=$('#scq');if(n){n.focus();try{n.setSelectionRange(pos,pos);}catch(e){}}});});
};
document.addEventListener('change',e=>{const s=e.target.closest('[data-scf]');if(!s)return;SC[s.dataset.scf]=s.value;rerender(true);});
DO['sch-reset']=()=>{Object.assign(SC,{job:'',user:'',assign:'',status:'',q:''});rerender(true);};
DO['sch-group']=d=>{SC.group=d.g;rerender(true);};
DO['sch-view']=d=>{SC.view=d.v;rerender(true);};
DO['sch-nav']=d=>{if(SC.view==='week')SC.woff+=+d.dir;else SC.moff+=+d.dir;rerender(true);};
DO['sch-today']=()=>{SC.woff=0;SC.moff=0;rerender(true);};
DO['sch-day']=d=>{SC.woff=Math.round((new Date(mondayOf(d.d)+'T00:00:00Z')-new Date(WEEK0+'T00:00:00Z'))/6048e5);SC.view='week';rerender(true);};
DO['sch-stats']=(d,el)=>{
 closeMenu();const u=d.u,mine=S.shifts.filter(s=>s.date>=wkStart()&&s.date<=addDays(wkStart(),6)&&s.users.includes(u)&&!s.cancelled),hrs=mine.reduce((x,s)=>x+shiftHrs(s),0),r=el.getBoundingClientRect(),m=document.createElement('div');
 m.id='pmenu';m.className='pmenu stats';m.dataset.for='stats'+u;
 m.innerHTML=`<b>${esc(u)}</b><div class="sr2"><span>Draft shifts</span><b class="num">${mine.filter(s=>s.draft).length}</b></div><div class="sr2"><span>Published shifts</span><b class="num">${mine.filter(s=>!s.draft).length}</b></div><div class="sr2"><span>Hourly rate</span><b>${fin2()?'A$'+(rateOf(u)||0).toFixed(2):'•••'}</b></div><div class="sr2 tot"><span>Totals</span><b class="num">${Math.round(hrs*10)/10}h${fin2()?' · '+A$(hrs*rateOf(u)):''}</b></div>`;
 document.body.appendChild(m);m.style.left=Math.max(8,Math.min(innerWidth-m.offsetWidth-8,r.left))+'px';m.style.top=Math.min(r.bottom+6,innerHeight-m.offsetHeight-8)+'px';
};

/* ---------- shift form (drawer, like the shipped right-hand panel) ---------- */
function shiftDrawer(o){
 const e=o.shift,nw=!e,d0=e?e.date:(o.date||wkStart()),tpl=o.tpl;
 const jobs=S.jobs.filter(j=>!j.arch).map(j=>[j.name,j.name]);
 const userOpts=S.employees.filter(x=>x.st==='active'&&x.inSched).map(x=>[x.id,x.name,x.role]);
 const pre=e?e.users.map(n=>(empByName(n)||{}).id).filter(Boolean):(o.user?[(empByName(o.user)||{}).id].filter(Boolean):[]);
 drawer({title:nw?'Add shift':'Edit '+(e.users.length>1?'group shift':'shift'),sub:fmtDL(d0),wide:true,okLabel:nw?'Add shift':'Update shift',
  mount:root=>mselInit(root),
  rules:{to:(v,a)=>v<a.from?'The end date can’t be before the start date':'',end:(v,a)=>v<=a.start?'End time must be after the start time':'',
   users:{always:true,fn:(v,a)=>!v&&a.claim!=='1'?'Select at least one user for the shift':''},weeks:(v,a)=>a.repeat==='1'&&(!/^\d+$/.test(v)||+v<1||+v>12)?'Enter 1 to 12 weeks':''},
  body:`<div class="shdr"><span class="eyebrow">Shift details</span></div><div class="fgrid">
   ${fld({name:'from',label:'Shift dates',type:'date',req:true,value:d0,span:3,disabled:!nw})}${fld({name:'to',label:'to',type:'date',req:true,value:d0,span:3,disabled:!nw})}
   ${fld({name:'start',label:'Start time',type:'time',req:true,value:e?e.start:(tpl?tpl.start:'07:00'),span:3})}${fld({name:'end',label:'End time',type:'time',req:true,value:e?e.end:(tpl?tpl.end:'15:30'),span:3})}
   ${nw?tgl({name:'repeat',label:'Repeat weekly',help:'Copies this shift onto the same days in the following weeks.',value:false}).replace('data-ftog="repeat"','data-ftog="repeat" data-fchange="rev"')+`<div class="fgrid s6" data-rev="repeat" hidden style="grid-column:span 6;padding:0">${fld({name:'weeks',label:'Additional weeks',type:'number',value:'1',span:3,inputmode:'numeric',help:'1 to 12. The first week is the one you picked.'})}</div>`:''}
   ${fld({name:'title',label:'Shift title',value:e?e.title:(tpl?tpl.name:''),span:6,ph:'Type here',max:80})}
   ${fld({name:'job',label:'Job',type:'select',req:true,value:e?e.job:'',span:6,opts:[['','Search jobs…'],...jobs],help:'Crews clock in to this job. The address comes from the job.'})}
   ${msel({name:'users',label:'Users',opts:userOpts,value:pre,span:6,ph:'Search and select users…'})}
   ${tgl({name:'claim',label:'Enable users to claim this shift',help:'Anyone qualified for the job can take it from the app.',value:e?e.claim:false})}
   ${e&&e.users.length>1?`<div class="banner info" style="grid-column:1/-1">${ICON('users')}<span>This is a group shift. Changes apply to everyone on it. Use <b>Update time (this user)</b> from the card menu to change one person.</span></div>`:''}</div>`,
  onOk:d=>{
   if(!d.job){const f=$('#f-job');f.closest('.fld').classList.add('err');$('#e-job').textContent='Job is required';f.focus();return false;}
   const users=(d.users?d.users.split(','):[]).map(i=>empBy(i).name),dates=nw?rangeDates(d.from,d.to):[e.date],weeks=d.repeat==='1'?+d.weeks:0;
   const all=[];dates.forEach(dt=>{for(let w=0;w<=weeks;w++)all.push(addDays(dt,w*7));});
   for(const dt of all){const cand={date:dt,start:d.start,end:d.end};for(const u of users){const c=clashOf(u,cand,e&&e.id);if(c){toastErr(u+' already works '+t12(c.start)+'–'+t12(c.end)+' on '+fmtD(dt),'Change the time or remove them from this shift.');return false;}}}
   if(nw){all.forEach(dt=>S.shifts.push({id:sid(),date:dt,start:d.start,end:d.end,job:d.job,users:users.slice(),title:d.title,draft:true,claim:d.claim==='1',cancelled:false}));rerender(true);toast(all.length+' shift'+(all.length===1?'':'s')+' added',users.length?users.join(', ')+' · drafts until you publish':'Unassigned · drafts until you publish');}
   else{Object.assign(e,{start:d.start,end:d.end,job:d.job,users,title:d.title,claim:d.claim==='1',draft:e.draft||false});e.changedBy=ME.name;rerender(true);toast('Shift updated',e.job);}
  }});
}
DO['addshift-new']=d=>{const{sid:date,user}=psid(d.id);shiftDrawer({date:date||wkStart(),user});};
DO['addshift-tpl']=d=>{const{sid:date,user}=psid(d.id);
 drawer({title:'Add from templates',sub:fmtDL(date),okLabel:null,body:`<label class="field" style="width:100%">${ICON('search')}<input type="search" placeholder="Search templates" aria-label="Search templates"></label><div>${S.shiftTpls.map(t=>`<button type="button" class="setrow link" style="width:100%;text-align:left" data-do="tpl-pick" data-id="${t.id}" data-date="${date}" data-user="${encodeURIComponent(user)}"><span class="grow"><b>${esc(t.name)}</b><small>${t12(t.start)} – ${t12(t.end)}</small></span>${ICON('next')}</button>`).join('')}</div><div class="fhelp">Template management is coming soon.</div>`});};
DO['tpl-pick']=d=>{const t=S.shiftTpls.find(x=>x.id===d.id);closeDrawer(true);setTimeout(()=>shiftDrawer({date:d.date,user:decodeURIComponent(d.user),tpl:t}),60);};
DO['addshift-off']=d=>{const{sid:date,user}=psid(d.id);unavailDrawer({kind:'timeoff',date,user});};
DO['addshift-una']=d=>{const{sid:date,user}=psid(d.id);unavailDrawer({kind:'unavail',date,user});};
DO['schact-off']=()=>unavailDrawer({kind:'timeoff',date:wkStart()});
DO['schact-una']=()=>unavailDrawer({kind:'unavail',date:wkStart()});
DO['shift-edit']=d=>shiftDrawer({shift:shiftBy(psid(d.id).sid)});
DO['shift-dup']=d=>{const s=shiftBy(psid(d.id).sid);S.shifts.push({...s,id:sid(),users:s.users.slice(),draft:true,cancelled:false});rerender(true);toast('Shift duplicated','A draft copy is on the same day.');};
DO['shift-pub']=d=>{const s=shiftBy(psid(d.id).sid);s.draft=false;rerender(true);toast('Shift published',s.users.length?s.users.join(', ')+' notified':'Open to claim');};
DO['shift-unpub']=d=>{const s=shiftBy(psid(d.id).sid);s.draft=true;rerender(true);toast('Shift unpublished','Back to a draft. Staff no longer see it.');};
DO['shift-del']=async d=>{const s=shiftBy(psid(d.id).sid);if(!(await dialog({title:'Delete shift?',body:`<b>${esc(s.title||s.job)}</b> on ${fmtD(s.date)}, ${t12(s.start)} – ${t12(s.end)}${s.users.length?' for '+esc(s.users.join(', ')):''}. ${s.draft?'':'People on it are told it was removed. '}This can’t be undone.`,okLabel:'Delete shift',danger:true})))return;S.shifts=S.shifts.filter(x=>x!==s);rerender(true);toast('Shift deleted',s.job);};
DO['shift-remove']=async d=>{const{sid:i,user}=psid(d.id),s=shiftBy(i);if(!(await dialog({title:`Remove ${user}?`,body:s.users.length>1?`They come off this group shift. ${s.users.length-1} other${s.users.length>2?'s':''} keep it.`:'The shift becomes unassigned.',okLabel:'Remove',danger:true})))return;s.users=s.users.filter(u=>u!==user);rerender(true);toast('Removed from shift',user);};
DO['shift-time']=d=>{
 const{sid:i,user}=psid(d.id),s=shiftBy(i),group=s.users.length>1&&user;
 drawer({title:'Change time',sub:(group?user+' · ':'')+fmtDL(s.date),okLabel:'Save',rules:{end:(v,a)=>v<=a.start?'End time must be after the start time':''},
  body:`<div class="fgrid">${fld({name:'start',label:'Start time',type:'time',req:true,value:s.start,span:3})}${fld({name:'end',label:'End time',type:'time',req:true,value:s.end,span:3})}${group?tgl({name:'own',label:'Move to own shift',help:'Takes '+user+' off the group shift and gives them one with these times.',value:true}):''}</div>${s.changedBy?`<div class="banner warn">${ICON('alert')}<span>This shift was changed by someone else. Save to overwrite their changes, or cancel and reopen it to see them.</span></div>`:''}`,
  onOk:v=>{
   if(group&&v.own==='1'){s.users=s.users.filter(u=>u!==user);S.shifts.push({...s,id:sid(),users:[user],start:v.start,end:v.end,draft:true});toast('Moved to their own shift',user+' · '+t12(v.start)+'–'+t12(v.end));}
   else{s.start=v.start;s.end=v.end;toast('Time changed',t12(v.start)+' – '+t12(v.end));}
   rerender(true);}});
};
DO['shift-assign']=d=>{
 const s=shiftBy(psid(d.id).sid);
 const avail=e=>{const u=unavailOn(e.name,s.date).find(x=>x.allDay||(x.start<s.end&&s.start<x.end));if(u)return ['bad','Unavailable'];const c=clashOf(e.name,s,s.id);if(c)return ['warn','Already scheduled that day'];return ['ok','Available'];};
 const list=S.employees.filter(e=>e.st==='active'&&e.inSched);
 drawer({title:'Assign user to shift',sub:s.job+' · '+fmtD(s.date)+' · '+t12(s.start)+'–'+t12(s.end),okLabel:'Assign',
  body:`<div class="subtle" style="font-size:13px">${s.users.length?'Currently assigned to this shift: <b>'+esc(s.users.join(', '))+'</b>':'No one is assigned yet.'}</div><div class="eyebrow">Select users to assign</div><div class="alist">${list.map(e=>{const a=avail(e),has=s.users.includes(e.name);return `<label class="arow${a[0]==='bad'?' off':''}"><input type="checkbox" name="u_${e.id}"${has?' checked':''}${a[0]==='bad'&&!has?' disabled':''}><span class="av">${portrait(e.name)}${ini(e.name)}</span><span class="grow"><b>${esc(e.name)}</b><small>${esc(e.role)}</small></span>${pill(a[0],a[1])}</label>`;}).join('')}</div>`,
  onOk:v=>{const ids=Object.keys(v).filter(k=>k.startsWith('u_')&&v[k]).map(k=>k.slice(2)),names=ids.map(i=>empBy(i).name);s.users=names;rerender(true);toast('Assignment saved',names.length?names.join(', '):'Now unassigned');}});
};
function unavailDrawer(o){
 const people=S.employees.filter(e=>e.st==='active'&&e.inSched),u=o.rec,kind=u?u.kind:o.kind,pre=u?empByName(u.user):(o.user?empByName(o.user):null);
 drawer({title:u?'Edit '+(kind==='timeoff'?'time off':'unavailability'):(kind==='timeoff'?'Add time off':'Add unavailability'),okLabel:'Save',
  rules:{to:(v,a)=>v<a.from?'The end date can’t be before the start date':'',user:v=>v?'':'Select a user'},
  body:`<div class="fgrid">${fld({name:'user',label:'User',type:'select',req:true,span:6,value:pre?pre.id:'',opts:[['','Select a user'],...people.map(e=>[e.id,e.name])]})}${fld({name:'from',label:'From',type:'date',req:true,span:3,value:u?u.from:o.date})}${fld({name:'to',label:'To',type:'date',req:true,span:3,value:u?u.to:o.date})}
   ${tgl({name:'allDay',label:'All day',value:u?u.allDay:true}).replace('data-ftog="allDay"','data-ftog="allDay" data-fchange="rev"')}
   <div class="fgrid s6" data-revnot="allDay"${(u?u.allDay:true)?' hidden':''} style="grid-column:span 6;padding:0">${fld({name:'start',label:'From time',type:'time',span:3,value:u&&u.start||'07:00'})}${fld({name:'end',label:'To time',type:'time',span:3,value:u&&u.end||'15:30'})}</div>
   ${fld({name:'reason',label:'Reason (optional)',span:6,value:u?u.reason:'',ph:'e.g. Annual leave, sick, personal',max:120})}</div>`,
  onOk:d=>{const rec={kind,user:empBy(d.user).name,from:d.from,to:d.to,allDay:d.allDay==='1',start:d.start,end:d.end,reason:d.reason};
   if(u)Object.assign(u,rec);else S.unavail.push({id:'ua'+Date.now(),...rec});
   const hit=S.shifts.filter(s=>!s.cancelled&&s.users.includes(rec.user)&&s.date>=rec.from&&s.date<=rec.to).length;
   rerender(true);toast(kind==='timeoff'?'Time off added':'Unavailability added',rec.user+(hit?' · '+hit+' shift'+(hit>1?'s':'')+' now clash. Reassign them.':''));}});
}
DO['una-edit']=d=>unavailDrawer({rec:S.unavail.find(x=>x.id===d.id)});
DO['una-del']=async d=>{const u=S.unavail.find(x=>x.id===d.id);if(!(await dialog({title:'Remove this '+(u.kind==='timeoff'?'time off':'unavailability')+'?',body:esc(u.user)+', '+fmtD(u.from)+(u.to!==u.from?' to '+fmtD(u.to):'')+'.',okLabel:'Remove',danger:true})))return;S.unavail=S.unavail.filter(x=>x!==u);rerender(true);toast('Removed',u.user);};

/* ---------- week-level actions ---------- */
DO['sch-publish']=async()=>{
 const a=wkStart(),b=addDays(a,6),drafts_=S.shifts.filter(s=>s.draft&&!s.cancelled&&s.date>=a&&s.date<=b);
 const clash=[];drafts_.forEach(s=>s.users.forEach(u=>{const c=S.shifts.find(x=>x!==s&&!x.cancelled&&x.users.includes(u)&&overlaps(x,s));if(c&&!clash.some(k=>k.s===s&&k.u===u))clash.push({s,u,c});}));
 const blocked=new Set(clash.map(k=>k.s)),ok=drafts_.filter(s=>!blocked.has(s));
 const body=`<div style="font-size:13.5px;line-height:1.6">This will publish <b>${ok.length}</b> draft shift${ok.length===1?'':'s'} in the current week (${esc(rangeLabel())}). People on them get a push and SMS. Only draft shifts in the week shown are published. Other weeks are not affected.</div>${clash.length?`<div class="banner warn" style="margin-top:12px">${ICON('alert')}<span><b>Overlapping shifts. These will NOT be published</b><br>${clash.map(k=>esc(k.u)+' · '+fmtD(k.s.date)+' '+t12(k.s.start)+'–'+t12(k.s.end)).join('<br>')}</span></div>`:''}`;
 if(!(await dialog({title:'Publish week',body,okLabel:'Publish'})))return;
 ok.forEach(s=>s.draft=false);rerender(true);toast(ok.length+' shift'+(ok.length===1?'':'s')+' published',clash.length?clash.length+' overlapping not published':'Staff notified by push and SMS');
};
DO['schact-copy']=async()=>{
 const a=wkStart(),prev=S.shifts.filter(s=>s.date>=addDays(a,-7)&&s.date<=addDays(a,-1)&&!s.cancelled);
 const there=S.shifts.filter(s=>s.date>=a&&s.date<=addDays(a,6)&&!s.cancelled).length;
 if(!prev.length){toastErr('Nothing to copy','The previous week has no shifts.');return;}
 if(!(await dialog({title:'Copy previous week',body:`<div style="font-size:13.5px;line-height:1.6">This will copy all <b>${prev.length}</b> shifts from the previous week into the current week as drafts.<div class="kvl" style="margin-top:10px"><small>From</small><b>${esc(fmtD(addDays(a,-7))+' – '+fmtD(addDays(a,-1)))}</b></div><div class="kvl"><small>To</small><b>${esc(fmtD(a)+' – '+fmtD(addDays(a,6)))}</b></div>${there?`<div class="fhelp" style="margin-top:6px">${there} shift${there===1?' is':'s are'} already in this week and stay as they are.</div>`:''}</div>`,okLabel:'Copy shifts'})))return;
 prev.forEach(s=>S.shifts.push({...s,id:sid(),date:addDays(s.date,7),users:s.users.slice(),draft:true,cancelled:false}));rerender(true);toast(prev.length+' shifts copied','They are drafts. Review, then publish.');
};
DO['schact-clear']=()=>{
 const a=wkStart(),b=addDays(a,6),wk=S.shifts.filter(s=>s.date>=a&&s.date<=b),dr=wk.filter(s=>s.draft).length;
 drawer({title:'Clear week',sub:rangeLabel(),okLabel:'Clear shifts',danger:true,
  body:`<div class="fgrid">${seg({name:'scope',label:'What to clear',span:6,value:'draft',opts:[['draft','Unpublished only ('+dr+')'],['all','Everything ('+wk.length+')']],help:'Published shifts are already with staff. Clearing them tells those people.'})}</div><div class="banner warn">${ICON('alert')}<span>This can’t be undone.</span></div>`,
  onOk:d=>{const rm=d.scope==='draft'?wk.filter(s=>s.draft):wk;S.shifts=S.shifts.filter(s=>!rm.includes(s));rerender(true);toast(rm.length+' shifts cleared',rangeLabel());}});
};
DO['schact-clearua']=async()=>{const a=wkStart(),b=addDays(a,6),list=S.unavail.filter(u=>u.to>=a&&u.from<=b);if(!list.length){toastErr('Nothing to clear','No time off or unavailability this week.');return;}if(!(await dialog({title:'Clear unavailabilities?',body:`Removes <b>${list.length}</b> time off and unavailability entr${list.length===1?'y':'ies'} that touch this week.`,okLabel:'Clear',danger:true})))return;S.unavail=S.unavail.filter(u=>!list.includes(u));rerender(true);toast('Cleared',list.length+' entries');};
