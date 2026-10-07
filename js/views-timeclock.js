/* =====================================================================
   Time Clock + Time Requests.
   Follows the shipped structure:
   - Time Clock: tabs Today | Timesheets, "View requests (n)"
   - Today: your clock card (status, location, big timer, job, Clock In / Clock Out),
     Today actions report, Man-days / Active jobs / First check-in / Last check-out / Worked hours, who is clocked in
   - Timesheets: payroll period, job, user, search, Clear, Export view, records
   - Time Requests (/pending-requests): Pending / Approved / Declined counters, search, status, review queue
   - Request correction form: shift date, recorded shifts, new times, note
   ===================================================================== */
const CLK={sim:'inside',state:'ready',since:null,breakAt:null,breakMs:0,job:'',log:[],t:null};
const TS={from:'2026-09-28',to:'2026-10-04',job:'',user:'',q:''};
const isoOf=lbl=>{const m=String(lbl).match(/(\d{1,2})\s([A-Za-z]{3})/);if(!m)return '';return '2026-'+String(MON.indexOf(m[2])+1).padStart(2,'0')+'-'+String(+m[1]).padStart(2,'0');};
const hms=ms=>{const s=Math.max(0,Math.floor(ms/1000));return [Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(n=>String(n).padStart(2,'0')).join(':');};
const nowHM=()=>{const d=new Date();return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');};
const canViewAllTime=()=>can('view:time:entries');
const finT=()=>can('view:employee:financials');
const myJobs=()=>S.jobs.filter(j=>!j.arch&&(ME.bypass||can('view:job')||j.qual.includes(ME.name)));
const elapsed=()=>CLK.since?Date.now()-CLK.since-CLK.breakMs-(CLK.breakAt?Date.now()-CLK.breakAt:0):0;
const entriesFor=(user,iso)=>S.time.filter(t=>t.name===user&&isoOf(t.date)===iso);
const REQ_T={correction:['info','Correction'],add_shift:['brand','Add shift'],remove_shift:['bad','Remove shift']};
const REQ_S={pending:['warn','Pending'],approved:['ok','Approved'],declined:['bad','Declined'],withdrawn:['neutral','Withdrawn']};

/* ---------- Today tab ---------- */
function clockCard(){
 const st=CLK.state,jobs=myJobs(),j=jobs.find(x=>x.name===CLK.job),chip=st==='in'?pill('ok','On the clock',1):st==='break'?pill('warn','On break',1):pill('neutral','Ready');
 const loc=CLK.sim==='unavailable'?['warn','Location unavailable']:CLK.sim==='outside'?['bad','Outside the geofence']:['ok','Inside the geofence'];
 return `<section class="qv-card clockcard"><div class="qv-body"><div class="cc-h"><span class="av xl">${portrait(ME.name)}${ini(ME.name)}</span><div class="grow"><b>${esc(ME.name)}</b><div class="cc-loc">${pill(loc[0],loc[1],1)}</div></div>${chip}</div>
  <div class="cc-t" role="timer" aria-live="off"><small>Clock status time</small><b id="clkTimer" class="num">${hms(elapsed())}</b></div>
  <div class="fld"><label for="clkJob">Job</label><select id="clkJob" data-clkjob ${st!=='ready'?'disabled':''}><option value="">${jobs.length?'Select':'No jobs found'}</option>${jobs.map(x=>`<option${x.name===CLK.job?' selected':''}>${esc(x.name)}</option>`).join('')}</select></div>
  <div class="cc-a">${ICON('pin')}<span>${j?esc(j.addr):'No address available'}</span>${j&&j.geo?`<small>Geofence ${j.geo} m</small>`:''}</div>
  ${CLK.sim==='unavailable'?`<div class="banner warn" style="margin-top:12px">${ICON('alert')}<span>Location is unavailable. Enable location services to record exact clock activity.</span></div>`:''}
  <div class="cc-b"><button type="button" class="btn" data-do="clk-in"${st!=='ready'?' disabled':''}>${ICON('next')}Clock In</button>${st==='in'?`<button type="button" class="btn btn-ghost" data-do="clk-break">${ICON('timer')}Start break</button>`:st==='break'?`<button type="button" class="btn btn-ghost" data-do="clk-break">${ICON('timer')}End break</button>`:''}<button type="button" class="btn btn-danger" data-do="clk-out"${st==='ready'?' disabled':''}>${ICON('close')}Clock Out</button></div>
  <div class="cc-sim"><span>Prototype: where is this phone?</span><div class="segc" role="radiogroup" aria-label="Simulated location">${[['inside','Inside'],['outside','Outside'],['unavailable','Off']].map(([k,l])=>`<button type="button" role="radio" aria-checked="${CLK.sim===k}" class="${CLK.sim===k?'on':''}" data-do="clk-sim" data-v="${k}">${l}</button>`).join('')}</div></div></div></section>`;
}
function actionsReport(){
 const mine=CLK.log.slice().reverse().map(a=>({who:ME.name,t:a.hm,ev:a.ev,job:a.job,mine:true}));
 const all=canViewAllTime()?S.today.filter(r=>r.in).map(r=>({who:r.name,t:r.in,ev:r.st==='late'?'late':'in',job:r.job,late:r.late})):[];
 const rows=[...mine,...all.sort((a,b)=>b.t.localeCompare(a.t))].slice(0,12);
 const label={in:'Clocked in',out:'Clocked out',break:'Started break',resume:'Ended break',late:'Clocked in late'};
 return `<section class="qv-card"><div class="qv-hd"><div class="grow"><h3>Today actions report</h3><div class="s">${canViewAllTime()?'Everyone on the clock today':'Your clock actions today'}</div></div></div><div class="qv-body">${rows.length?timeline(rows.map(r=>tlItem(r.ev==='out'?'close':r.ev==='break'?'timer':'clock',esc(label[r.ev]||r.ev)+(r.mine?'':' · '+esc(r.who)),r.job?esc(r.job)+(r.late?' · '+r.late+' min late':''):'',r.t,r.ev==='late'?'warn':r.mine?'brand':'ok'))):'<div class="empty"><b>No clock actions recorded today</b>Clock in to start your day.</div>'}${canViewAllTime()?todayFigs():''}</div></section>`;
}
/* the shipped five figures (man-days ... worked hours) live in the actions report card */
function todayFigs(){
 const on=S.today.filter(r=>['on','late','break'].includes(r.st)),jobs=new Set(on.map(r=>r.job)),first=on.map(r=>r.in).filter(Boolean).sort()[0]||'--',mine=CLK.log.find(a=>a.ev==='in');
 if(CLK.state!=='ready')jobs.add(CLK.job);
 const hrs=on.reduce((x,r)=>{const[h,m]=r.in.split(':').map(Number);return x+Math.max((7*60+42-(h*60+m))/60,0);},0)+elapsed()/36e5;
 return figs([{k:'Man-days',v:on.length+(CLK.state!=='ready'?1:0)},{k:'Active jobs',v:jobs.size},{k:'First check in',v:mine&&mine.hm<first?mine.hm:first},{k:'Last check out',v:(CLK.log.slice().reverse().find(a=>a.ev==='out')||{}).hm||'--'},{k:'Worked hours',v:(Math.round(hrs*10)/10).toFixed(1)}]);
}
function todayStats(){
 const on=S.today.filter(r=>['on','late','break'].includes(r.st)),jobs=new Set(on.map(r=>r.job)),first=on.map(r=>r.in).filter(Boolean).sort()[0]||'--';
 const mine=CLK.log.find(a=>a.ev==='in');if(CLK.state!=='ready')jobs.add(CLK.job);
 const hrs=on.reduce((x,r)=>{const[h,m]=r.in.split(':').map(Number);return x+Math.max((7*60+42-(h*60+m))/60,0);},0)+elapsed()/36e5;
 const k=(l,v,i,t)=>({k:l,icon:i,tone:t,v});
 return strip('five',[k('Man-days',on.length+(CLK.state!=='ready'?1:0),'users'),k('Active jobs',jobs.size,'jobs','var(--s3)'),k('First check in',mine&&mine.hm<first?mine.hm:first,'clock','var(--s6)'),k('Last check out',CLK.log.slice().reverse().find(a=>a.ev==='out')?.hm||'--','timer','var(--s7)'),k('Worked hours',(Math.round(hrs*10)/10).toFixed(1),'trend','var(--warn-dot)')]);
}
function clockedInCard(){
 if(!canViewAllTime())return '';
 const on=S.today.filter(r=>['on','late','break'].includes(r.st)),more=UI.clockAll;
 return `<section class="qv-card"><div class="qv-hd"><div class="grow"><h3>Clocked in</h3><div class="s">${on.length} employees currently working</div></div><div class="meta"><button type="button" class="viewall" data-do="clk-all">${more?'Show less':'View All'}${ICON('next')}</button></div></div>
  <div style="padding:4px 18px 12px">${(more?on:on.slice(0,4)).map(r=>`<div class="avrow" style="padding:10px 0">${person(r.name,r.job)}<span class="grow"></span><small class="subtle">since ${esc(r.in)}</small>${pill(TODAY_ST[r.st][0],r.st==='late'?'Late '+r.late+' min':TODAY_ST[r.st][1],1)}</div>`).join('')||'<div class="empty"><b>No employees are clocked in right now</b></div>'}</div></section>`;
}
/* the designer's KPI cards and charts (restored) */
function tcOverview(){
 const src={};S.time.forEach(t=>{const k=t.src.startsWith('App')?'App':t.src;src[k]=(src[k]||0)+1;});
 const srcSeg=[{k:'App',v:src.App||0,c:'var(--s1)'},{k:'Kiosk',v:src.Kiosk||0,c:'var(--s3)'},{k:'Manual edit',v:src['Manual edit']||0,c:'var(--warn-dot)'}];
 const series=[{name:'Clock-ins',c:'var(--s1)',v:H.clockins,area:true},{name:'On time %',c:'var(--s4)',v:H.ontime,axis:'r',dash:true,dots:false,w:2}];
 const onNow=S.today.filter(r=>['on','late','break'].includes(r.st)),jobs=new Set(onNow.map(r=>r.job)),on=onNow.length+(CLK.state!=='ready'?1:0);
 const over=S.time.filter(t=>t.st==='live'&&t.hrs>12);
 return strip('five',[
  {k:'On the clock now',icon:'clock',v:on,spark:[26,28,30,27,31,29,on],d:'across '+Math.max(jobs.size,1)+' jobs',act:{scroll:'#qvClock'}},
  {k:'Hours logged today',icon:'timer',tone:'var(--s3)',v:'186.5',unit:'h',chip:chip('up','+12 h'),act:{scroll:'#qvClock'}},
  {k:'Correction requests',icon:'doc',tone:'var(--warn-dot)',v:pendingTime(),chip:pendingTime()?chip('warn','Oldest 2 days'):chip('up','All clear'),act:{nav:'pending-requests'}},
  {k:'Clocked in over 12 h',icon:'alert',tone:'var(--bad-dot)',v:over.length,d:over.length?over.map(t=>t.name).join(', '):'nobody',act:{scroll:'#qvSrc'}},
  {k:'Manual edits',icon:'sliders',tone:'var(--s7)',v:src['Manual edit']||0,d:'this week',act:{scroll:'#qvSrc'}}])
 +`<div class="g trend">${card({title:'Clock-ins',sub:'Last 7 days · count and punctuality',id:'qvClock',body:trend({x:DAYS,series,right:true,minR:80,maxR:100,h:230})+keys(series)})}${card({title:'How time was captured',sub:'Source of each entry this week',id:'qvSrc',body:donut(srcSeg,{n:S.time.length,l:'entries'},{sw:15})+legend(srcSeg)})}</div>`;
}
function todayTab(){
 return `<div class="two tc2"><div class="g">${clockCard()}</div><div class="g">${actionsReport()}</div></div>${canViewAllTime()?tcOverview()+clockedInCard():''}`;
}

/* ---------- Timesheets tab ---------- */
function tsRows(){
 const q=TS.q.trim().toLowerCase();
 return S.time.filter(t=>{const d=isoOf(t.date);return d>=TS.from&&d<=TS.to&&(!TS.job||t.job===TS.job)&&(!TS.user||t.name===(empBy(TS.user)||{}).name)&&(!q||(t.name+' '+t.job+' '+t.role).toLowerCase().includes(q))&&(canViewAllTime()||t.name===ME.name);});
}
function timesheetsTab(){
 const over=canViewAllTime()?tcOverview():'';
 const rows=tsRows().sort((a,b)=>isoOf(b.date).localeCompare(isoOf(a.date))||a.name.localeCompare(b.name)),emp=new Set(rows.map(r=>r.name));
 const hrs=rows.reduce((x,r)=>x+r.hrs,0),cost=rows.reduce((x,r)=>x+r.hrs*rateOf(r.name),0);
 const requestOf=r=>S.requests.find(q=>q.user===r.name&&q.date===isoOf(r.date)&&q.status==='pending');
 return over+`<section class="qv-card"><div class="qv-hd"><div class="grow"><h3>Timesheets</h3><div class="s">${rows.length} records · ${emp.size} employee${emp.size===1?'':'s'}</div></div><div class="meta">${can('edit:time:entries')?`<button type="button" class="btn btn-ghost btn-sm" data-do="te-new">${ICON('plus')}Add time entry</button>`:''}${canViewAllTime()?`<button type="button" class="btn btn-ghost btn-sm" data-toast="Export view|The timesheets in view would download as a CSV">${ICON('download')}Export view</button>`:''}</div></div>
  <div class="toolbar tsf"><label class="fld" style="flex-direction:row;align-items:center;gap:8px"><span class="sr">From</span><input type="date" data-tsf="from" value="${TS.from}" aria-label="Payroll period from"><span style="font-size:12.5px;color:var(--text-subtle)">to</span><input type="date" data-tsf="to" value="${TS.to}" aria-label="Payroll period to"></label>
   <label class="scsel"><span class="sr">Job</span><select data-tsf="job" aria-label="Job"><option value="">All jobs</option>${S.jobs.filter(j=>!j.arch).map(j=>`<option${TS.job===j.name?' selected':''}>${esc(j.name)}</option>`).join('')}</select></label>
   ${canViewAllTime()?`<label class="scsel"><span class="sr">User</span><select data-tsf="user" aria-label="User"><option value="">All users</option>${S.employees.filter(e=>e.st==='active').map(e=>`<option value="${e.id}"${TS.user===e.id?' selected':''}>${esc(e.name)}</option>`).join('')}</select></label>`:''}
   <label class="field" style="width:220px">${ICON('search')}<input type="search" id="tsq" data-tsf="q" placeholder="Name, email, or job" value="${esc(TS.q)}" aria-label="Search"></label><button type="button" class="btn btn-ghost btn-sm" data-do="ts-clear">Clear</button></div>
  ${rows.length?`<div class="tblwrap"><table class="tbl" style="min-width:1040px"><thead><tr><th>Employee</th><th>Date</th><th>Job</th><th>In</th><th>Out</th><th>Break</th><th class="r">Worked</th><th class="r">Overtime</th>${finT()?'<th class="r">Cost</th>':''}<th>Source</th><th>Status</th><th class="act"></th></tr></thead><tbody>${rows.map(r=>{const pend=requestOf(r);return `<tr class="link" data-do="te-view" data-i="${S.time.indexOf(r)}"><td>${person(r.name,r.role)}</td><td>${esc(r.date)}</td><td>${jobTag(r.job)}</td><td>${esc(r.in)}</td><td>${r.out?esc(r.out):'<span class="dash">—</span>'}</td><td>${esc(r.brk)}</td><td class="r"><b class="num" style="color:${r.hrs>9?'var(--warn)':'var(--text)'}">${r.hrs.toFixed(1)} h</b></td><td class="r num">${r.hrs>8?(r.hrs-8).toFixed(1)+' h':'<span class="dash">—</span>'}</td>${finT()?`<td class="r num">${A$(r.hrs*rateOf(r.name))}</td>`:''}<td>${r.src==='Manual edit'?'<span style="color:var(--warn);font-weight:600">Manual edit</span>':esc(r.src)}</td><td>${pill(TC[r.st][0],pend?'Correction pending':TC[r.st][1],1)}</td><td>${(r.name===ME.name||can('edit:time:entries'))&&r.st!=='live'?`<button type="button" class="btn btn-ghost btn-sm" data-do="te-fix" data-i="${S.time.indexOf(r)}">${can('edit:time:entries')?'Edit':'Request correction'}</button>`:''}</td></tr>`;}).join('')}</tbody></table></div><div class="tblfoot"><span><b class="num">${rows.length}</b> records · <b class="num">${hrs.toFixed(1)}</b> h${finT()?' · <b class="num">'+A$(cost)+'</b>':''}</span><span class="hint">Select a row to see what was recorded and what changed</span></div>`
  :`<div class="empty lg"><span class="eg">${ICON('clock')}</span><b>No timesheet records found</b>Adjust the date range or filters to see more results.</div>`}</section>`;
}
document.addEventListener('change',e=>{const s=e.target.closest('[data-tsf]');if(s&&s.tagName!=='INPUT'||s&&s.type==='date'){TS[s.dataset.tsf]=s.value;rerender(true);}const j=e.target.closest('[data-clkjob]');if(j){CLK.job=j.value;rerender(true);}});
document.addEventListener('input',e=>{const s=e.target.closest('#tsq');if(!s)return;const pos=s.selectionStart;TS.q=s.value;rerender(true);setTimeout(()=>{const n=$('#tsq');if(n){n.focus();try{n.setSelectionRange(pos,pos);}catch(x){}}});});
DO['ts-clear']=()=>{Object.assign(TS,{from:'2026-09-28',to:'2026-10-04',job:'',user:'',q:''});rerender(true);};

/* ---------- Time Clock page ---------- */
const tcTab=()=>UI.tcTab||'today';
VIEWS.timeclock.sub='Clock in and out, review timesheets and handle correction requests.';
VIEWS.timeclock.act=()=>`<button type="button" class="btn btn-ghost" data-go="pending-requests">${ICON('eye')}<span class="lb">View requests</span>${pendingTime()?`<span class="tc num" style="margin-left:6px">${pendingTime()}</span>`:''}</button>`;
VIEWS.timeclock.render=function(){
 const t=tcTab();
 return `<div class="page"><div class="tabs ptabs" role="tablist">${[['today','Today'],['sheets','Timesheets']].map(([k,l])=>`<button type="button" role="tab" class="tab${t===k?' on':''}" aria-selected="${t===k}" data-do="tc-tab" data-t="${k}">${l}</button>`).join('')}</div>${t==='today'?todayTab():timesheetsTab()}</div>`;
};
VIEWS.timeclock.mount=function(){
 clearInterval(CLK.t);
 CLK.t=setInterval(()=>{const el=$('#clkTimer');if(!el){clearInterval(CLK.t);return;}el.textContent=hms(elapsed());},1000);
};
DO['tc-tab']=d=>{UI.tcTab=d.t;rerender(true);};
DO['clk-all']=()=>{UI.clockAll=!UI.clockAll;rerender(true);};
DO['clk-sim']=d=>{CLK.sim=d.v;rerender(true);};
DO['clk-in']=()=>{
 const j=myJobs().find(x=>x.name===CLK.job);
 if(!j){toastErr('Choose a job first','Pick the job you are starting on.');return;}
 if(CLK.sim==='outside'&&j.geo){toastErr('You’re outside the geofence','You’re about 340 m from '+j.name+'. Clock-in is only allowed within '+j.geo+' m of the site. Move closer, or ask your supervisor to add the shift by request.');return;}
 CLK.state='in';CLK.since=Date.now();CLK.breakMs=0;CLK.breakAt=null;CLK.log.push({ev:'in',hm:nowHM(),job:j.name});
 rerender(true);toast('Clocked in',j.name+' · '+nowHM());
};
DO['clk-break']=()=>{
 if(CLK.state==='in'){CLK.state='break';CLK.breakAt=Date.now();CLK.log.push({ev:'break',hm:nowHM(),job:CLK.job});toast('Break started');}
 else{CLK.breakMs+=Date.now()-CLK.breakAt;CLK.breakAt=null;CLK.state='in';CLK.log.push({ev:'resume',hm:nowHM(),job:CLK.job});toast('Break ended');}
 rerender(true);
};
DO['clk-out']=async()=>{
 const j=myJobs().find(x=>x.name===CLK.job);
 if(!(await dialog({title:'Clock out?',body:`You have worked <b class="num">${hms(elapsed())}</b> on ${esc(CLK.job)}.`,okLabel:'Clock out',danger:true})))return;
 const hrs=Math.max(Math.round(elapsed()/36e5*10)/10,0.1),inHM=CLK.log.find(a=>a.ev==='in').hm;
 S.time.unshift({name:ME.name,role:(empByName(ME.name)||{}).role||'',job:CLK.job,date:fmtD(TODAY_ISO),in:inHM,out:nowHM(),brk:CLK.breakMs?Math.round(CLK.breakMs/6e4)+' min':'—',hrs,src:'App',st:'ok'});
 CLK.log.push({ev:'out',hm:nowHM(),job:CLK.job});CLK.state='ready';CLK.since=null;CLK.breakMs=0;CLK.breakAt=null;rerender(true);toast('Clocked out',(j?j.name:'')+' · '+hrs.toFixed(1)+' h');
};

/* ---------- entry detail + request correction ---------- */
DO['te-view']=(d,el)=>{
 const r=S.time[+d.i],iso=isoOf(r.date),reqs=S.requests.filter(q=>q.user===r.name&&q.date===iso);
 drawer({title:'Timesheet entry',sub:r.name+' · '+r.date,okLabel:null,wide:true,
  body:`${kv([['Employee',person(r.name,r.role)],['Job',jobTag(r.job)],['Clocked in',esc(r.in)],['Clocked out',r.out?esc(r.out):'<span class="dash">still on the clock</span>'],['Break',esc(r.brk)],['Worked',`<b class="num">${r.hrs.toFixed(1)} h</b>`],['Captured by',esc(r.src)],['Status',pill(TC[r.st][0],TC[r.st][1],1)]])}
   <div class="eyebrow" style="margin-top:6px">Changes</div>${reqs.length?reqs.map(q=>`<div class="reqmini">${pill(REQ_T[q.type][0],REQ_T[q.type][1])}${pill(REQ_S[q.status][0],REQ_S[q.status][1],1)}<small>${esc(q.created)}</small><div>${diffRows(q)}</div>${q.reason?`<p class="rq-q">“${esc(q.reason)}”</p>`:''}${q.reviewedBy?`<small class="subtle">Reviewed by ${esc(q.reviewedBy)}${q.reviewNote?': '+esc(q.reviewNote):''}</small>`:''}</div>`).join(''):'<div class="subtle">Nothing has been changed on this entry. What you see is what the app or kiosk recorded.</div>'}`});
};
DO['te-fix']=d=>{const r=S.time[+d.i];requestDrawer({entry:r,date:isoOf(r.date),user:r.name});};
DO['te-new']=()=>requestDrawer({mode:'add_shift',direct:true});
function requestDrawer(o){
 const direct=can('edit:time:entries'),user=o.user||ME.name,date0=o.date||TODAY_ISO,e0=o.entry;
 const types=[['correction','Correct a shift'],['add_shift','Add a missing shift'],['remove_shift','Remove a shift']];
 const jobs=S.jobs.filter(j=>!j.arch).map(j=>j.name);
 drawer({title:direct?(e0?'Edit time entry':'Add time entry'):'Request correction',sub:direct?'Applies straight away and is recorded in the history':'Your supervisor reviews it before payroll',wide:true,okLabel:direct?'Save entry':'Send request',
  rules:{note:v=>v.trim().length<8?'Say what happened, in a few words':'',out:(v,a)=>a.type==='remove_shift'||!v||!a.in?'':(v<=a.in?'Clock out must be after clock in':''),
   in:{always:true,fn:(v,a)=>a.type==='remove_shift'||v?'':'Enter the clock in time'}},
  body:`<div class="fgrid">
   ${direct&&!e0?fld({name:'who',label:'Employee',type:'select',req:true,span:6,value:'',opts:[['','Select an employee'],...S.employees.filter(x=>x.st==='active').map(x=>[x.name,x.name])]}):`<input type="hidden" name="who" value="${esc(user)}">`}
   ${seg({name:'type',label:'What do you need?',span:6,value:o.mode||(e0?'correction':'correction'),opts:types})}
   ${fld({name:'date',label:'Shift date',type:'date',req:true,value:date0,span:3})}
   ${fld({name:'job',label:'Job',type:'select',req:true,value:e0?e0.job:'',span:3,opts:[['','Select a job'],...jobs.map(j=>[j,j])]})}
   ${fld({name:'in',label:'Clock in',type:'time',value:e0?e0.in:'07:00',span:3})}${fld({name:'out',label:'Clock out',type:'time',value:e0&&e0.out?e0.out:'15:30',span:3})}
   <div class="s6" id="rqRec" style="grid-column:span 6"></div>
   ${fld({name:'note',label:'Note',type:'textarea',req:true,rows:3,span:6,max:400,ph:'Explain what happened or add useful context…',help:direct?'Kept in the audit history next to the change.':'Your supervisor sees this when they review the request.'})}</div>`,
  mount:root=>{
   const rec=()=>{const u=$('[name="who"]',root).value||user,d=$('[name="date"]',root).value,list=entriesFor(u,d),box=$('#rqRec',root);
    box.innerHTML=list.length?`<div class="banner info">${ICON('clock')}<span><b>Recorded that day:</b> ${list.map(t=>esc(t.job)+' '+esc(t.in)+'–'+esc(t.out||'now')).join(' · ')}</span></div>`:'';};
   root.addEventListener('input',rec);root.addEventListener('click',()=>setTimeout(rec,0));rec();},
  onOk:d=>{
   const u=d.who||user;if(!u){toastErr('Choose an employee','Pick who this entry is for.');return false;}
   if(d.type!=='remove_shift'&&!d.job){toastErr('Choose a job','Pick the job for this shift.');return false;}
   const cur=entriesFor(u,d.date)[0];
   if(d.type==='correction'&&!cur&&!e0){toastErr('No recorded shift that day','Use “Add a missing shift” instead.');return false;}
   const req={id:'rq'+Date.now(),user:u,type:d.type,date:d.date,job:d.job||(cur&&cur.job),old:cur?{in:cur.in,out:cur.out,job:cur.job}:null,req:d.type==='remove_shift'?null:{in:d.in,out:d.out,job:d.job},reason:d.note,status:direct?'approved':'pending',created:'Today, '+nowHM()};
   if(direct){req.reviewedBy=ME.name;req.reviewNote='Edited directly';applyRequest(req);}
   S.requests.unshift(req);rerender(true);
   toast(direct?'Entry saved':'Request sent',direct?u+' · '+fmtD(d.date):'Your supervisor will review it. You can withdraw it until then.');}});
}
function applyRequest(q){
 const list=entriesFor(q.user,q.date),cur=list[0];
 if(q.type==='remove_shift'&&cur){S.time=S.time.filter(t=>t!==cur);return;}
 if(q.type==='add_shift'||!cur){const hrs=Math.max(shiftHrs({start:q.req.in,end:q.req.out}),0);S.time.push({name:q.user,role:(empByName(q.user)||{}).role||'',job:q.req.job,date:fmtD(q.date),in:q.req.in,out:q.req.out,brk:'30 min',hrs:Math.round(hrs*10)/10,src:'Manual edit',st:'ok'});return;}
 Object.assign(cur,{in:q.req.in,out:q.req.out,job:q.req.job,hrs:Math.round(shiftHrs({start:q.req.in,end:q.req.out})*10)/10,src:'Manual edit',st:'ok'});
}

/* ---------- Time Requests page ---------- */
const RQ={q:'',status:'pending'};
function diffRows(q){
 const row=(l,a,b)=>`<div class="df-r"><span>${l}</span>${a===undefined||a===b?`<b>${esc(b==null?'—':b)}</b>`:`<s>${esc(a==null?'—':a)}</s><i>${ICON('next')}</i><b class="chg">${esc(b==null?'—':b)}</b>`}</div>`;
 if(q.type==='remove_shift'&&q.old)return row('Clock in',q.old.in,q.old.in)+row('Clock out',q.old.out,q.old.out)+`<div class="df-r"><span>Result</span><b class="chg">Shift removed</b></div>`;
 if(!q.req)return '';
 const o=q.old||{};return row('Job',o.job,q.req.job)+row('Clock in',q.old?o.in:undefined,q.req.in)+row('Clock out',q.old?o.out:undefined,q.req.out);
}
function visibleRequests(){
 const qq=RQ.q.trim().toLowerCase();
 return S.requests.filter(r=>(can('edit:time:entries')||r.user===ME.name)&&(RQ.status==='all'||r.status===RQ.status)&&(!qq||(r.user+' '+r.job+' '+REQ_T[r.type][1]+' '+r.status+' '+(r.reason||'')).toLowerCase().includes(qq)));
}
function requestCard(r){
 const reviewer=can('edit:time:entries')&&r.status==='pending',mine=r.user===ME.name&&r.status==='pending';
 return `<article class="rqcard"><div class="rq-h"><span class="av">${portrait(r.user)}${ini(r.user)}</span><div class="grow"><b>${esc(r.user)}</b><small>${esc(fmtDL(r.date))} · ${esc(r.job||'')}</small></div>${pill(REQ_T[r.type][0],REQ_T[r.type][1])}${pill(REQ_S[r.status][0],REQ_S[r.status][1],1)}</div>
  <div class="rq-b"><div class="df">${diffRows(r)}</div><div>${r.reason?`<p class="rq-q">“${esc(r.reason)}”</p>`:''}<small class="subtle">Sent ${esc(r.created)}${r.reviewedBy?' · '+esc(r.status)+' by '+esc(r.reviewedBy):''}</small>${r.reviewNote?`<div class="rq-n"><b>Reviewer note</b> ${esc(r.reviewNote)}</div>`:''}</div></div>
  ${reviewer||mine?`<div class="rq-a">${mine?`<button type="button" class="btn btn-ghost btn-sm" data-do="rq-withdraw" data-id="${r.id}">Withdraw request</button>`:''}${reviewer?`<button type="button" class="btn btn-ghost btn-sm" data-do="rq-review" data-id="${r.id}" data-r="declined">${ICON('close')}Decline</button><button type="button" class="btn btn-sm" data-do="rq-review" data-id="${r.id}" data-r="approved">${ICON('check')}Approve</button>`:''}</div>`:''}</article>`;
}
VIEWS['pending-requests']={path:'pending-requests',parent:'timeclock',title:'Time Requests',sub:()=>can('edit:time:entries')?'Corrections, missing shifts and removals waiting for a decision.':'Your correction requests and where they are up to.',
 crumbs:()=>[['Time Clock','timeclock'],['Time requests']],
 act:()=>`<button type="button" class="btn btn-ghost" data-do="rq-refresh">${ICON('reset')}<span class="lb">Refresh</span></button>${!can('edit:time:entries')?`<button type="button" class="btn" data-do="rq-new">${ICON('plus')}<span class="lb">Request correction</span></button>`:''}`,
 render(){
  const scope=S.requests.filter(r=>can('edit:time:entries')||r.user===ME.name),c=k=>scope.filter(r=>r.status===k).length,list=visibleRequests();
  return `<div class="page">${strip('four',[{k:'Pending',icon:'timer',tone:'var(--warn-dot)',v:c('pending'),act:{}},{k:'Approved',icon:'checkc',tone:'var(--ok)',v:c('approved')},{k:'Declined',icon:'closec',tone:'var(--bad-dot)',v:c('declined')},{k:'Withdrawn',icon:'doc',tone:'var(--s7)',v:c('withdrawn')}])}
   <section class="qv-card"><div class="toolbar"><label class="field" style="width:340px">${ICON('search')}<input type="search" id="rqq" placeholder="Employee, job, request type, status…" value="${esc(RQ.q)}" aria-label="Search requests"></label>
    <label class="scsel"><span class="sr">Status</span><select data-rqs aria-label="Status">${[['pending','Pending'],['approved','Approved'],['declined','Declined'],['withdrawn','Withdrawn'],['all','All statuses']].map(([v,l])=>`<option value="${v}"${RQ.status===v?' selected':''}>${l}</option>`).join('')}</select></label><button type="button" class="btn btn-ghost btn-sm" data-do="rq-reset">Reset</button></div></section>
   <section class="qv-card"><div class="qv-hd"><div class="grow"><h3>Review queue</h3><div class="s">${list.length} request${list.length===1?'':'s'}</div></div>${pill(RQ.status==='all'?'neutral':REQ_S[RQ.status][0],RQ.status==='all'?'All':REQ_S[RQ.status][1])}</div>
    <div class="qv-body rqlist">${list.length?list.map(requestCard).join(''):`<div class="empty lg"><span class="eg">${ICON('search')}</span><b>No requests match this view</b>Adjust the search term or status filter to broaden the queue.</div>`}</div></section></div>`;
 },
 mount(root){const q=$('#rqq',root);if(q)q.addEventListener('input',()=>{const pos=q.selectionStart;RQ.q=q.value;rerender(true);setTimeout(()=>{const n=$('#rqq');if(n){n.focus();try{n.setSelectionRange(pos,pos);}catch(x){}}});});}};
document.addEventListener('change',e=>{const s=e.target.closest('[data-rqs]');if(s){RQ.status=s.value;rerender(true);}});
DO['rq-reset']=()=>{RQ.q='';RQ.status='pending';rerender(true);};
DO['rq-refresh']=()=>{rerender(true);toast('Up to date');};
DO['rq-new']=()=>requestDrawer({});
DO['rq-withdraw']=async d=>{const r=S.requests.find(x=>x.id===d.id);if(!(await dialog({title:'Cancel correction request',body:'Are you sure you want to cancel this request?',okLabel:'Cancel request',keep:'Keep request',danger:true})))return;r.status='withdrawn';rerender(true);toast('Request withdrawn');};
DO['rq-review']=d=>{
 const r=S.requests.find(x=>x.id===d.id),dec=d.r==='declined';
 drawer({title:(dec?'Decline':'Approve')+' request',sub:r.user+' · '+fmtD(r.date)+' · '+REQ_T[r.type][1],okLabel:dec?'Decline request':'Approve request',danger:dec,
  rules:{note:v=>dec&&v.trim().length<4?'Tell them why, so they can fix it':''},
  body:`<div class="df">${diffRows(r)}</div>${r.reason?`<p class="rq-q">“${esc(r.reason)}”</p>`:''}<div class="fgrid">${fld({name:'note',label:'Note'+(dec?'':' (optional)'),type:'textarea',rows:3,span:6,req:dec,max:300,ph:dec?'What needs fixing?':'Add a note for the employee'})}</div>${dec?'':`<div class="banner info">${ICON('shield')}<span>Approving changes the timesheet straight away. The original times stay in the history.</span></div>`}`,
  onOk:v=>{r.status=d.r;r.reviewedBy=ME.name;r.reviewNote=v.note;if(!dec)applyRequest(r);rerender(true);toast(dec?'Request declined':'Request approved',r.user+' is told by push and email');}});
};
