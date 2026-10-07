/* =====================================================================
   Journeys. Follows the shipped screens:
   - list: search, All Statuses, Create trip; Traveller, From, Departs, Status, Approved by, Edit / Delete
   - trip form: Employee, Departing from, Departure, Travelling to, Destination job (optional)
   - Journey Plan: hazard banner (Clear), weather on the route, timeline, people (can drive),
     notification channel, Trip document (Final record / Live preview, Download JSON),
     Approve journey plan, Edit trip, Cancel journey
   The designer's KPI cards, live map and status chart stay on the list page.
   ===================================================================== */
const DOWI={Mon:0,Tue:1,Wed:2,Thu:3,Fri:4,Sat:5,Sun:6};
function depIso(j){
 if(j.depIso)return j.depIso;
 const m=String(j.dep).match(/^(?:(\w{3}) )?(\d{1,2}):(\d\d)$/);if(!m)return TODAY_ISO+'T07:00';
 return (m[1]?addDays(WEEK0,DOWI[m[1]]):TODAY_ISO)+'T'+m[2].padStart(2,'0')+':'+m[3];
}
const depLabel=iso=>{const d=iso.slice(0,10),t=iso.slice(11,16);return d===TODAY_ISO?t:fmtD(d).split(' ')[0]+' '+t;};
const NOTIFY=[['app','App, email and SMS'],['sms','Email and SMS only']];
const editableTrip=j=>['draft','submitted','approved'].includes(j.status);
const jLive=j=>j.status==='in_progress'&&JR[j.st]?JR[j.st]:null;
const jStatusPills=j=>pill(JST[j.status][0],JST[j.status][1],1)+(jLive(j)?` ${pill(jLive(j)[0],jLive(j)[1])}`:'');
const nextTripNo=()=>'TRP-'+String(Math.max(...S.journeys.map(j=>+j.id.slice(4)))+1).padStart(4,'0');
const canEditJ=()=>can('edit:journey');

/* ---------- list config ---------- */
function journeyRowActions(r){
 const items=[canEditJ()&&editableTrip(r)&&'edit:Edit trip',can('delete:journey')&&r.status!=='in_progress'&&'del:Delete:danger'].filter(Boolean);
 const appr=canEditJ()&&r.status==='submitted'?`<button type="button" class="btn btn-sm" data-do="jrn-approve" data-id="${r.key}">${ICON('check')}Approve</button>`:'';
 return `<div class="acts">${appr}${items.length?`<button type="button" class="rowbtn" data-do="row-menu" data-kind="jrn" data-id="${r.key}" data-items="${items.join('|')}" aria-label="More actions" aria-haspopup="menu">${ICON('more')}</button>`:''}</div>`;
}
function JOURNEY_LIST(){
 return {href:r=>'journeys/'+r.key,rows:S.journeys,
  tabs:[{key:'all',label:'All'},{key:'active',label:'In progress'},{key:'planned',label:'Upcoming'},{key:'appr',label:'Needs approval'},{key:'done',label:'Finished'}],
  tabOf:(r,k)=>k==='all'||(k==='active'&&r.status==='in_progress')||(k==='planned'&&['draft','approved'].includes(r.status))||(k==='appr'&&r.status==='submitted')||(k==='done'&&['completed','cancelled'].includes(r.status)),
  search:'Search by traveller, place or vehicle',filters:[{label:'Running late',test:r=>r.st==='late'&&r.status==='in_progress'},{label:'Road hazard',test:r=>!!S.journeyHazards[r.key]},{label:'Has passengers',test:r=>r.pax>0}],
  text:r=>r.id+' '+r.driver+' '+r.from+' '+r.to+' '+r.veh+' '+r.rego,minW:1180,
  cols:[
   {h:'Traveller',v:r=>person(r.driver,r.pax?'+ '+r.pax+' passenger'+(r.pax>1?'s':''):'')},
   {h:'Trip',v:r=>`<div class="cell"><span class="tx"><b>${esc(r.from)}</b><small>to ${esc(r.to)} · <span class="mono">${esc(r.id)}</span></small></span></div>`},
   {h:'Vehicle',v:r=>r.veh?`${esc(r.veh)} <small class="mono subtle">${esc(r.rego)}</small>`:'<span class="dash">—</span>'},
   {h:'Departs',v:r=>esc(depLabel(depIso(r)))},{h:'ETA',v:r=>r.late&&r.status==='in_progress'?`<b style="color:var(--warn)">${esc(r.eta)}</b> <small class="subtle">+${r.late} min</small>`:esc(r.eta)},
   {h:'Check-ins',v:r=>r.chk==='—'?'<span class="dash">—</span>':esc(r.chk)},
   {h:'Status',v:r=>jStatusPills(r)+(S.journeyHazards[r.key]?` <span class="flagdot bad" title="Road hazard on the route"></span>`:'')},
   {h:'Approved by',v:r=>r.approvedBy?esc(r.approvedBy):'<span class="dash">—</span>'}],
  action:r=>journeyRowActions(r)};
}
VIEWS.journeys.sub='Trip plans, approvals, check-ins and fatigue breaks for staff driving between sites.';
VIEWS.journeys.act=()=>can('add:journey')?`<button type="button" class="btn" data-do="jrn-new">${ICON('plus')}<span class="lb">Create trip</span></button>`:'';

/* ---------- trip form (drawer) ---------- */
function tripDrawer(j){
 const nw=!j,empOpts=[['','Select employee'],...S.employees.filter(e=>e.st==='active').map(e=>[e.name,e.name+' · '+e.role])],
  jobOpts=[['','No destination job'],...S.jobs.filter(x=>!x.arch).map(x=>[x.name,x.name])],vehOpts_=[['','No vehicle yet'],...S.vehicles.map(v=>[v.name,v.name+' · '+v.rego+(v.status==='maintenance'?' (maintenance)':'')])];
 drawer({title:nw?'Create trip':'Edit trip',sub:nw?'The traveller fills in the journey plan in the SiteOS app':j.id,okLabel:nw?'Create trip':'Save changes',wide:true,
  rules:{to:(x,a)=>x.trim().toLowerCase()===a.from.trim().toLowerCase()?'Destination can’t be the same as where the trip starts':'',dep:x=>nw&&x.slice(0,10)<TODAY_ISO?'Departure can’t be in the past':'',veh:x=>x&&(vehBy(slug(x))||{}).status==='maintenance'?'This vehicle is in maintenance':''},
  body:`${addrList}<div class="fgrid">${fld({name:'emp',label:'Employee',type:'select',req:true,span:6,value:nw?'':j.driver,opts:empOpts,help:'The person making the trip'})}
   ${fld({name:'from',label:'Departing from',req:true,span:3,value:nw?'Enfield yard':j.from,list:'addrs',max:150})}${fld({name:'dep',label:'Departure',type:'datetime-local',req:true,span:3,value:nw?addDays(TODAY_ISO,1)+'T07:00':depIso(j)})}
   ${fld({name:'to',label:'Travelling to',req:true,span:3,value:nw?'':j.to,list:'addrs',max:150})}${fld({name:'job',label:'Destination job (optional)',type:'select',span:3,value:nw?'':(S.jobs[j.dest]||{}).name||'',opts:jobOpts})}
   ${fld({name:'veh',label:'Vehicle (optional)',type:'select',span:6,value:nw?'':j.veh,opts:vehOpts_.map(([k,l])=>[k?k:'',l])})}</div>`,
  onOk:d=>{
   const job=S.jobs.findIndex(x=>x.name===d.job),veh=S.vehicles.find(v=>v.name===d.veh),dep=d.dep;
   const rec={driver:d.emp,from:d.from,to:d.to,dest:job>=0?job:null,veh:veh?veh.name:'',rego:veh?veh.rego:'',depIso:dep,dep:depLabel(dep)};
   if(nw){const id=nextTripNo();S.journeys.unshift({id,key:id.toLowerCase(),pax:0,eta:'—',km:0,chk:'—',st:'planned',status:'draft',approvedBy:'',plan:{},notify:'sms',people:[{name:d.emp,canDrive:true}],events:[],...rec});toast('Trip created',id+' · '+d.emp);go('journeys/'+id.toLowerCase());return;}
   Object.assign(j,rec);j.people[0]={...j.people[0],name:d.emp};rerender(true);toast('Trip updated',j.id);}});
}
DO['jrn-new']=()=>tripDrawer(null);
DO['jrn-edit']=d=>{const j=jrnBy(d.id);if(!editableTrip(j)){toastErr('Can’t edit this trip','A trip that has started or finished can’t be changed.');return;}tripDrawer(j);};
DO['jrn-del']=async d=>{const j=jrnBy(d.id);if(!(await dialog({title:'Delete trip?',body:`<b>${esc(j.id)}</b>, ${esc(j.driver)} from ${esc(j.from)} to ${esc(j.to)}, is removed along with its plan and history.`,okLabel:'Delete',danger:true})))return;S.journeys=S.journeys.filter(x=>x!==j);delete S.journeyHazards[j.key];toast('Trip deleted',j.id);if(cur()==='journey-detail')go('journeys');else rerender(true);};
DO['jrn-approve']=async d=>{
 const j=jrnBy(d.id);
 if(j.driver===ME.name){toastErr('You can’t approve your own journey plan','Another manager needs to approve '+j.id+'.');return;}
 if(!(await dialog({title:'Approve journey plan?',body:`<b>${esc(j.driver)}</b> drives from ${esc(j.from)} to ${esc(j.to)} on <b>${esc(fmtDT(depIso(j)))}</b>. They are told straight away and can start the trip.`,okLabel:'Approve'})))return;
 j.status='approved';j.approvedBy=ME.name;rerender(true);toast('Journey plan approved',j.id+' · '+j.driver+' has been notified');
};
DO['jrn-cancel']=d=>{
 const j=jrnBy(d.id);
 drawer({title:'Cancel journey',sub:j.id+' · '+j.driver,okLabel:'Cancel journey',danger:true,body:`<div class="fgrid"><div class="banner warn" style="grid-column:1/-1">${ICON('alert')}<span>${esc(j.driver)}${j.pax?' and '+j.pax+' passenger'+(j.pax>1?'s':''):''} will be told the trip is off.${j.status==='in_progress'?' The trip is under way, so check they are safe first.':''}</span></div>${fld({name:'reason',label:'Reason',type:'textarea',rows:3,span:6,max:300,ph:'Optional. Shown on the trip record.'})}</div>`,
  onOk:x=>{j.status='cancelled';j.events.push({t:new Date().toTimeString().slice(0,5),ev:'Cancelled',d:x.reason||'No reason given'});rerender(true);toast('Journey cancelled',j.id);}});
};

/* ---------- detail: Journey Plan ---------- */
function weatherFor(j){
 if(j.key==='trp-0913')return S.journeyWeather;
 let h=0;(j.id+j.to).split('').forEach(c=>h=(h*31+c.charCodeAt(0))%97);
 const t=14+h%9,r=10+h%45,w=14+h%22;
 return {avgTemp:t+'°C',rain:r+'%',wind:w+' km/h',points:[{place:j.from,t:j.dep.slice(-5),temp:(t-1)+'°C',rain:Math.max(r-8,0)+'%',wind:(w-3)+' km/h'},{place:j.to,t:j.eta==='—'?'—':j.eta,temp:(t+2)+'°C',rain:(r+6)+'%',wind:(w+4)+' km/h'}],bom:''};
}
const jKeys=j=>['plan','weather','people','timeline'].map(k=>'jrn:'+j.key+':'+k);
function tripDoc(j,kind){
 const w=weatherFor(j);
 return {kind:kind==='final'?'final_record':'live_preview',generatedAt:TODAY_ISO,trip:{id:j.id,status:j.status,traveller:j.driver,passengers:j.pax,vehicle:j.veh?{name:j.veh,registration:j.rego}:null,from:j.from,to:j.to,destinationJob:(S.jobs[j.dest]||{}).name||null,departs:depIso(j),eta:j.eta,distanceKm:j.km,checkIns:j.chk,approvedBy:j.approvedBy||null},plan:j.plan,people:j.people,notify:(NOTIFY.find(n=>n[0]===j.notify)||[0,''])[1],hazards:S.journeyHazards[j.key]?[S.journeyHazards[j.key]]:[],weather:{average:{temperature:w.avgTemp,rain:w.rain,wind:w.wind},points:w.points,warning:w.bom||null},events:j.events};
}
VIEWS['journey-detail']={path:'journeys/:key',parent:'journeys',perm:'view:journey',title:'Journey Plan',sub:()=>{const j=jrnBy(P.key);return j?j.id+' · '+j.driver:'';},
 crumbs:()=>{const j=jrnBy(P.key);return [['Journeys','journeys'],[j?j.id:'Not found']];},
 act:()=>{const j=jrnBy(P.key);return j?`<button type="button" class="btn btn-ghost" data-do="acc-all" data-keys="${jKeys(j).join(',')}">${ICON('sliders')}<span class="lb">${jKeys(j).every(k=>accIsOpen(k))?'Collapse all':'Expand all'}</span></button>`:'';},
 render(){
  const j=jrnBy(P.key);if(!j)return notFound('Journey','journeys');
  const hz=S.journeyHazards[j.key],w=weatherFor(j),started=['in_progress','completed'].includes(j.status),job=S.jobs[j.dest],pl=j.plan||{};
  const docKind=j.status==='completed'?'final':j.status==='in_progress'?'live':null;
  const ev=[];
  if(j.status!=='draft')ev.push(tlItem('send','Plan submitted','by '+esc(j.driver),'Before departure',''));
  if(j.approvedBy&&['approved','in_progress','completed'].includes(j.status))ev.push(tlItem('checkc','Plan approved','by '+esc(j.approvedBy),'Before departure','ok'));
  j.events.forEach(e=>ev.push(tlItem(e.ev==='Cancelled'?'close':e.ev==='Running late'?'timer':e.ev==='Rest break'?'hour':e.ev==='Arrived'||e.ev==='Trip completed'?'checkc':'route',esc(e.ev),esc(e.d),e.t,e.ev==='Running late'?'warn':e.ev==='Cancelled'?'bad':'')));
  return `<div class="page">
  ${hz?`<div class="banner bad hazb">${ICON('alert')}<span class="grow"><b>${esc(hz.kind)} ${hz.km} km ahead</b><br>${esc(hz.desc)} Reported by ${esc(hz.by)} · ${esc(hz.source)}. ${esc(j.driver)} has been warned and can re-route.</span>${canEditJ()?`<button type="button" class="btn btn-ghost btn-sm" data-do="jrn-clear" data-id="${j.key}">Clear</button>`:''}</div>`:''}
  ${hero({sq:true,ini:'→',title:j.from+' to '+j.to,pills:[jStatusPills(j)],sub:`<span class="mono">${esc(j.id)}</span> · ${esc(j.driver)}${j.pax?' + '+j.pax+' passenger'+(j.pax>1?'s':''):''}${j.veh?' · '+esc(j.veh)+' <span class="mono">'+esc(j.rego)+'</span>':''}`,
   meta:[['cal',esc(fmtDT(depIso(j)))],...(j.km?[['route',j.km+' km']]:[]),...(job?[['jobs',esc(job.name)]]:[]),...(j.approvedBy?[['checkc','Approved by '+esc(j.approvedBy)]]:[])],
   actions:(canEditJ()&&j.status==='submitted'?`<button type="button" class="btn" data-do="jrn-approve" data-id="${j.key}">${ICON('check')}<span class="lb">Approve journey plan</span></button>`:'')
    +`<button type="button" class="btn btn-ghost" data-do="trip-doc" data-id="${j.key}"${docKind?'':' disabled title="Available once the trip departs"'}>${ICON('file')}<span class="lb">Trip document</span></button>`
    +(canEditJ()&&editableTrip(j)?`<button type="button" class="btn btn-ghost" data-do="jrn-edit" data-id="${j.key}">${ICON('edit')}<span class="lb">Edit trip</span></button>`:'')
    +(canEditJ()&&!['completed','cancelled'].includes(j.status)?`<button type="button" class="btn btn-danger" data-do="jrn-cancel" data-id="${j.key}">${ICON('close')}<span class="lb">Cancel journey</span></button>`:'')})}
  ${j.status==='draft'?`<div class="banner info">${ICON('phone')}<span>${esc(j.driver)} hasn’t submitted the journey plan yet. They fill it in on the SiteOS app, then it comes here for approval.</span></div>`:''}
  ${j.status==='cancelled'?`<div class="banner bad">${ICON('close')}<span><b>This trip was cancelled.</b> ${esc((j.events.find(e=>e.ev==='Cancelled')||{}).d||'')}</span></div>`:''}
  ${strip('four',[{k:'Departs',icon:'cal',tone:'var(--s3)',v:`<span style="font-size:22px">${esc(depLabel(depIso(j)))}</span>`,d:fmtD(depIso(j).slice(0,10))},{k:'ETA',icon:'timer',tone:j.late&&j.status==='in_progress'?'var(--warn-dot)':'var(--s6)',v:`<span style="font-size:22px">${esc(j.eta)}</span>`,d:j.late&&j.status==='in_progress'?'+'+j.late+' min behind plan':'on plan'},{k:'Distance',icon:'route',tone:'var(--s4)',v:j.km?N(j.km):'—',unit:j.km?'km':'',d:'planned route'},{k:'Check-ins',icon:'checkc',tone:'var(--ok)',v:`<span style="font-size:22px">${j.chk==='—'?'None yet':esc(j.chk)}</span>`,d:'on the way'}])}
  ${acc('jrn:'+j.key+':plan','doc','Journey plan',Object.keys(pl).length?kv([['Fatigue check',esc(pl.fatigue||'—')],['Route',esc(pl.route||'—')],['Planned breaks',esc(pl.breaks||'—')],['Destination job',job?esc(job.name):'—'],['Approved by',j.approvedBy?esc(j.approvedBy):'Not yet'],['Notify on delay',`<select class="selc" data-jnotify="${j.key}"${canEditJ()?'':' disabled'} aria-label="Notification channel">${NOTIFY.map(([k,l])=>`<option value="${k}"${j.notify===k?' selected':''}>${l}</option>`).join('')}</select>`]]):`<div class="subtle">No plan yet. It appears here once ${esc(j.driver)} submits it.</div>`,{open:true})}
  ${acc('jrn:'+j.key+':weather','sun','Weather on the route',(w.bom?`<div class="banner warn" style="margin-bottom:12px">${ICON('alert')}<span><b>BOM warning.</b> ${esc(w.bom)}</span></div>`:'')+figs([{k:'Avg temperature',v:w.avgTemp},{k:'Chance of rain',v:w.rain},{k:'Wind',v:w.wind}])+`<div class="tblwrap" style="margin-top:12px"><table class="tbl" style="min-width:480px"><thead><tr><th>Place</th><th>Time</th><th>Temp</th><th>Rain</th><th>Wind</th></tr></thead><tbody>${w.points.map(p=>`<tr><td class="strong">${esc(p.place)}</td><td>${esc(p.t)}</td><td>${esc(p.temp)}</td><td>${esc(p.rain)}</td><td>${esc(p.wind)}</td></tr>`).join('')}</tbody></table></div>`,{open:!!w.bom||started})}
  ${acc('jrn:'+j.key+':people','users','People',`<div class="tblwrap"><table class="tbl" style="min-width:420px"><thead><tr><th>Name</th><th>Role</th><th>Can drive</th></tr></thead><tbody>${j.people.map((p,i)=>`<tr><td>${person(p.name)}</td><td>${i===0?'Traveller':'Passenger'}</td><td>${p.canDrive?pill('ok','Can drive',1):pill('neutral','Passenger only')}</td></tr>`).join('')}</tbody></table></div><div class="fhelp" style="margin-top:8px">If the driver needs a rest, anyone marked “can drive” can take over.</div>`,{open:true,meta:'<span class="tc num">'+j.people.length+'</span>'})}
  ${acc('jrn:'+j.key+':timeline','history','Timeline',ev.length?timeline(ev):'<div class="subtle">Nothing has happened yet</div>',{open:started||j.status==='cancelled'})}
  </div>`;
 }};
DO['jrn-clear']=async d=>{const j=jrnBy(d.id),h=S.journeyHazards[j.key];if(!(await dialog({title:'Clear this hazard?',body:`Mark <b>${esc(h.kind.toLowerCase())}</b> as no longer a problem. ${esc(j.driver)} is told the route is clear.`,okLabel:'Clear hazard'})))return;delete S.journeyHazards[j.key];j.events.push({t:new Date().toTimeString().slice(0,5),ev:'Hazard cleared',d:h.kind+' removed by '+ME.name});rerender(true);toast('Hazard cleared',j.id);};
document.addEventListener('change',e=>{const s=e.target.closest('[data-jnotify]');if(!s)return;const j=jrnBy(s.dataset.jnotify);j.notify=s.value;toast('Notification channel saved',(NOTIFY.find(n=>n[0]===s.value)||[0,''])[1]);});

/* ---------- Trip document: Final record / Live preview, Download JSON ---------- */
DO['trip-doc']=d=>{
 const j=jrnBy(d.id),kind=j.status==='completed'?'final':'live';
 drawer({title:'Trip document',sub:j.id+' · '+j.driver,okLabel:null,wide:true,
  body:`<div class="fgrid"><div class="fld s6"><div class="segc" role="tablist"><button type="button" role="tab" class="${kind==='final'?'on':''}" data-do="tdoc-tab" data-k="final"${j.status==='completed'?'':' disabled title="Written when the trip completes"'}>Final record</button><button type="button" role="tab" class="${kind==='live'?'on':''}" data-do="tdoc-tab" data-k="live"${j.status==='in_progress'?'':' disabled title="Only while the trip is under way"'}>Live preview</button></div><div class="fhelp">${kind==='final'?'The record written when the trip completed. It is kept for the company retention period.':'A snapshot of the trip so far. It updates as the traveller checks in.'}</div></div>
   <div class="fld s6"><pre class="jsonbox" id="tdocJson">${esc(JSON.stringify(tripDoc(j,kind),null,2))}</pre></div>
   <div class="fld s6"><button type="button" class="btn btn-ghost" data-do="tdoc-dl" data-id="${j.key}" data-k="${kind}">${ICON('download')}Download JSON</button></div></div>`});
};
DO['tdoc-tab']=()=>{};
DO['tdoc-dl']=d=>{
 const j=jrnBy(d.id),blob=new Blob([JSON.stringify(tripDoc(j,d.k),null,2)],{type:'application/json'}),a=document.createElement('a');
 a.href=URL.createObjectURL(blob);a.download=j.id+'-'+(d.k==='final'?'final-record':'live-preview')+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),500);toast('Download started',a.download);
};
