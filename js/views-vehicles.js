/* =====================================================================
   Vehicles. Follows the shipped screens:
   - list: search, status filter, Add Vehicle; Registration / Service / Insurance / Inspection due
   - row actions: Check out / Check in, Edit, History, Inspections, Delete
   - detail: overview, service records, assignment history, incident reports
   - form: Make, Model, year, terrain, plate, ID, VIN, roadside, status (select + Add), dates, documents, service records
   - Check Out / Return pages; Inspections (Inspections | Video Inspection) and the comparison report
   The designer's KPI cards and charts stay on the list page (wrapped, not rebuilt).
   ===================================================================== */
const TERRAIN=[['on_road','On road'],['off_road','Off road'],['all_terrain','All terrain']];
const terrainName=k=>(TERRAIN.find(t=>t[0]===k)||[0,'—'])[1];
const vstat=v=>VST[v.status]||['neutral',v.status];
const vstatLabel=v=>vstat(v)[1];
const dateOnly=iso=>iso?fmtDL(iso.slice(0,10)).replace(/^\w+ /,''):'';
const fmtDT=s=>s?fmtDL(s.slice(0,10))+' · '+s.slice(11,16):'—';
const regoIso=v=>addDays(TODAY_ISO,v.regoDays);
const dueCell=iso=>{
 if(!iso)return '<span class="dash">—</span>';
 const d=daysTo(iso),t=dateOnly(iso);
 return d<0?`<b style="color:var(--bad)">${t}</b> <small class="subtle">overdue</small>`:d<=30?`<b style="color:var(--warn)">${t}</b> <small class="subtle">in ${d} d</small>`:t;
};
const kmToSvc=v=>Math.max(v.svc-v.odo,0);
function vehFlags(v){
 const f=[],r=v.regoDays,i=daysTo(v.insExp),n=v.inspDue?daysTo(v.inspDue):999,s=daysTo(v.svcDate);
 if(r<0)f.push(['bad','Registration expired']);else if(r<=30)f.push(['warn','Registration due in '+r+' d']);
 if(i<0)f.push(['bad','Insurance expired']);else if(i<=30)f.push(['warn','Insurance due in '+i+' d']);
 if(n<0)f.push(['bad','Inspection overdue']);else if(n<=7)f.push(['warn','Inspection due in '+n+' d']);
 if(s<0||kmToSvc(v)<1000)f.push(['warn',s<0?'Service overdue':'Service due']);
 if(!v.ok)f.push(['bad','Inspection issue']);
 return f;
}
const vehOut=v=>[...v.history].reverse().find(h=>!h.returned)||null;
const incOf=id=>S.incidents.filter(i=>i.car===id);
const openInc=id=>incOf(id).filter(i=>!i.reviewedBy).length;
const canAssignV=()=>can('assign:vehicle');

/* ---------- list config ---------- */
function vehRowActions(r){
 const b=(p,ic,l)=>`<button type="button" class="btn btn-sm btn-sq ${p==='checkout'?'':'btn-ghost'}" data-go="vehicles/${r.id}/${p}" aria-label="${l}" title="${l}">${ICON(ic)}</button>`;
 const main=!canAssignV()?'':r.status==='available'?b('checkout','next','Check out'):r.status==='in_use'?b('return','download','Check in'):'';
 const items=[can('edit:vehicle')&&'edit:Edit vehicle','hist:Assignment history',can('inspect:vehicle')&&'insp:Inspections',can('delete:vehicle')&&'del:Delete:danger'].filter(Boolean);
 return `<div class="acts">${main}<button type="button" class="rowbtn" data-do="row-menu" data-kind="veh" data-id="${r.id}" data-items="${items.join('|')}" aria-label="More actions" aria-haspopup="menu">${ICON('more')}</button></div>`;
}
function VEHICLE_LIST(){
 return {href:r=>'vehicles/'+r.id,rows:S.vehicles,
  tabs:[{key:'all',label:'All'},{key:'road',label:'In use'},{key:'parked',label:'Available'},{key:'attn',label:'Needs attention'}],
  tabOf:(r,k)=>k==='all'||(k==='road'&&r.status==='in_use')||(k==='parked'&&r.status==='available')||(k==='attn'&&(vehFlags(r).length>0||r.status==='maintenance')),
  search:'Search by name, plate or model',filters:[{label:'Registration due soon',test:r=>r.regoDays<=30},{label:'Service due',test:r=>kmToSvc(r)<1000||daysTo(r.svcDate)<=14},{label:'Inspection overdue',test:r=>r.inspDue&&daysTo(r.inspDue)<0},{label:'Open incident',test:r=>openInc(r.id)>0}],
  text:r=>r.name+' '+r.rego+' '+r.model+' '+(r.outTo||'')+' '+r.vin,minW:1280,
  cols:[
   {h:'Vehicle',v:r=>{const fl=vehFlags(r),bad=fl.some(f=>f[0]==='bad');return `<div class="cell"><i class="sq" style="background:${r.c}"></i><span class="tx"><b>${esc(r.name)}${fl.length?` <span class="flagdot ${bad?'bad':'warn'}" title="${esc(fl.map(f=>f[1]).join(', '))}"></span>`:''}</b><small>${esc(r.model)}</small></span></div>`;}},
   {h:'Number plate',v:r=>`<span class="mono plate">${esc(r.rego)}</span>`},
   {h:'Status',v:r=>pill(vstat(r)[0],vstat(r)[1],1)},
   {h:'Deployed to',v:r=>{const h=vehOut(r);return h?person(h.who,'since '+fmtD(h.taken).replace(/^\w+ /,'')):'<span class="dash">—</span>';}},
   {h:'Odometer',r:1,v:r=>N(r.odo)+' km'},
   {h:'Service due',v:r=>`${dueCell(r.svcDate)}<small class="subtle" style="display:block">${N(kmToSvc(r))} km to go</small>`},
   {h:'Registration',v:r=>dueCell(regoIso(r))},{h:'Insurance',v:r=>dueCell(r.insExp)},{h:'Inspection',v:r=>dueCell(r.inspDue)}],
  action:r=>vehRowActions(r)};
}

/* ---------- page header ---------- */
VIEWS.vehicles.act=()=>(can('inspect:vehicle')?`<button type="button" class="btn btn-ghost" data-go="vehicles/inspections">${ICON('shield')}<span class="lb">Inspections</span></button>`:'')+(can('add:vehicle')?`<button type="button" class="btn" data-go="vehicles/new">${ICON('plus')}<span class="lb">Add vehicle</span></button>`:'');
DO['veh-edit']=d=>go('vehicles/'+d.id+'/edit');
DO['veh-hist']=d=>{UI.acc=UI.acc||{};UI.acc['veh:'+d.id+':history']=true;go('vehicles/'+d.id);};
DO['veh-insp']=d=>{UI.inspCar=d.id;UI.inspTab='inspections';go('vehicles/inspections');};
DO['veh-del']=async d=>{
 const v=vehBy(d.id);if(v.status==='in_use'){toastErr('Can’t delete a vehicle that is in use','Check '+v.name+' in first.');return;}
 if(!(await dialog({title:'Delete vehicle?',body:`<b>${esc(v.name)}</b> (${esc(v.rego)}), its service records, assignment history and incident reports are removed.`,okLabel:'Delete',danger:true})))return;
 S.vehicles=S.vehicles.filter(x=>x!==v);S.incidents=S.incidents.filter(i=>i.car!==v.id);rerender(true);toast('Vehicle deleted',v.name);
};

/* ---------- detail ---------- */
const vKeys=v=>['overview','dates','service','history','incidents','images','docs','notes'].map(k=>'veh:'+v.id+':'+k);
function vehHero(v){
 const fl=vehFlags(v),h=vehOut(v);
 return hero({sq:true,ini:((v.make[0]||'V')+(v.mdl[0]||'')).toUpperCase(),c:v.c,title:v.name,pills:[pill(vstat(v)[0],vstat(v)[1],1),...fl.slice(0,2).map(f=>pill(f[0],f[1]))],sub:`<span class="mono plate">${esc(v.rego)}</span> · ${esc(v.model)}${v.vin?' · VIN '+esc(v.vin):''}`,
  meta:[...(h?[['user','With '+esc(h.who)+' since '+esc(fmtD(h.taken).replace(/^\w+ /,''))]]:[['pin','At the yard']]),['route',N(v.odo)+' km'],['shield','Roadside '+esc(v.roadsideCo)+' '+esc(v.roadsidePh)]],
  actions:(canAssignV()&&v.status==='available'?`<button type="button" class="btn" data-go="vehicles/${v.id}/checkout">${ICON('next')}<span class="lb">Check Out</span></button>`:'')
   +(canAssignV()&&v.status==='in_use'?`<button type="button" class="btn" data-go="vehicles/${v.id}/return">${ICON('download')}<span class="lb">Return</span></button>`:'')
   +(can('inspect:vehicle')?`<button type="button" class="btn btn-ghost" data-do="veh-insp" data-id="${v.id}">${ICON('shield')}<span class="lb">Inspections</span></button>`:'')
   +(can('edit:vehicle')?`<button type="button" class="btn btn-ghost" data-go="vehicles/${v.id}/edit">${ICON('edit')}<span class="lb">Edit</span></button>`:'')
   +(can('delete:vehicle')?`<button type="button" class="btn btn-danger" data-do="veh-del" data-id="${v.id}" aria-label="Delete vehicle">${ICON('trash')}</button>`:'')});
}
const incCard=(i,v)=>{
 const rev=i.reviewedBy;
 return `<div class="inc"><div class="inch"><b>${esc(fmtDT(i.occurred))}</b>${rev?pill('ok','Reviewed by '+rev,1):pill('warn','Needs review',1)}</div>
  ${kv([['Reported by',esc(i.by)],['Filed',esc(fmtDT(i.filed))],['Accident location',esc(i.loc)],['Other driver',i.other?esc(i.other.name)+' · '+esc(i.other.phone)+' · '+i.other.licence+' licence photo'+(i.other.licence===1?'':'s'):'None involved'],['Photos and videos',i.media?i.media+' attached':'None']])}
  <p class="incd">${esc(i.desc)}</p>
  ${can('review:incident')?`<div class="incb">${rev?`<button type="button" class="btn btn-ghost btn-sm" data-do="inc-reopen" data-id="${i.id}">${ICON('reset')}Re-open</button>`:`<button type="button" class="btn btn-sm" data-do="inc-review" data-id="${i.id}">${ICON('check')}Mark as reviewed</button>`}</div>`:''}</div>`;
};
VIEWS['vehicle-detail']={path:'vehicles/:id',parent:'vehicles',perm:'view:vehicle',title:'Vehicle',sub:()=>{const v=vehBy(P.id);return v?v.name+' · '+v.rego:'';},
 crumbs:()=>{const v=vehBy(P.id);return [['Vehicles','vehicles'],[v?v.name:'Not found']];},
 act:()=>{const v=vehBy(P.id);return v?`<button type="button" class="btn btn-ghost" data-do="acc-all" data-keys="${vKeys(v).join(',')}">${ICON('sliders')}<span class="lb">${vKeys(v).every(k=>accIsOpen(k))?'Collapse all':'Expand all'}</span></button>`:'';},
 render(){
  const v=vehBy(P.id);if(!v)return notFound('Vehicle','vehicles');
  const fl=vehFlags(v),h=vehOut(v),hist=v.history.slice().reverse(),inc=incOf(v.id).slice().sort((a,b)=>b.occurred.localeCompare(a.occurred)),edit=can('edit:vehicle');
  return `<div class="page">${vehHero(v)}
  ${strip('four',[{k:'Status',icon:'truck',tone:'var(--s3)',v:`<span style="font-size:22px">${vstatLabel(v)}</span>`,d:h?'with '+h.who:'available at the yard'},{k:'Odometer',icon:'route',tone:'var(--s6)',v:N(v.odo),unit:'km',d:'service at '+N(v.svc)+' km'},{k:'Next service',icon:'sliders',tone:kmToSvc(v)<1000?'var(--warn-dot)':'var(--s4)',v:`<span style="font-size:22px">${esc(dateOnly(v.svcDate))}</span>`,d:N(kmToSvc(v))+' km to go'},{k:'Compliance',icon:fl.length?'alert':'checkc',tone:fl.some(f=>f[0]==='bad')?'var(--bad-dot)':fl.length?'var(--warn-dot)':'var(--ok)',v:`<span style="font-size:22px">${fl.length?fl.length+(fl.length===1?' item':' items'):'All current'}</span>`,d:fl.length?fl[0][1]:'rego, insurance, inspection'}])}
  ${acc('veh:'+v.id+':overview','truck','Vehicle overview',kv([['Name / ID',esc(v.name)],['Make',esc(v.make)],['Model',esc(v.mdl)],['Manufacture year',esc(v.year||'—')],['Number plate',`<span class="mono plate">${esc(v.rego)}</span>`],['VIN',`<span class="mono">${esc(v.vin||'—')}</span>`],['Tyre terrain',esc(terrainName(v.terrain))],['Colour',esc(v.color||'—')],['Status',pill(vstat(v)[0],vstat(v)[1],1)],['Speedometer',N(v.odo)+' km'],['Roadside assistance',esc(v.roadsideCo)+(v.roadsidePh?' · '+esc(v.roadsidePh):'')]]),{open:true})}
  ${acc('veh:'+v.id+':dates','cal','Dates and compliance',kv([['Registration due',dueCell(regoIso(v))],['Insurance expiry',dueCell(v.insExp)],['Inspection due',dueCell(v.inspDue)],['Service due date',dueCell(v.svcDate)],['Service due at',N(v.svc)+' km'],['Last inspection',esc(v.insp)+(v.ok?'':' '+pill('bad','Issue found'))]]),{open:true})}
  ${acc('veh:'+v.id+':service','sliders','Service history',(v.services.length?`<div class="tblwrap"><table class="tbl" style="min-width:600px"><thead><tr><th>Date</th><th class="r">Odometer</th><th>Description</th><th class="r">Cost</th><th>Invoices</th><th class="act"></th></tr></thead><tbody>${v.services.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(s=>`<tr><td>${esc(dateOnly(s.date))}</td><td class="r num">${N(s.km)} km</td><td class="strong" style="white-space:normal">${esc(s.desc)}</td><td class="r num">${s.cost?'A$'+N(s.cost):'—'}</td><td>${s.invoices?s.invoices+' file'+(s.invoices>1?'s':''):'—'}</td><td>${edit?`<button type="button" class="rowbtn" data-do="vsvc-del" data-v="${v.id}" data-id="${s.id}" aria-label="Delete service record" title="Delete">${ICON('trash')}</button>`:''}</td></tr>`).join('')}</tbody></table></div>`:'<div class="subtle">No service records yet</div>')+(edit?`<div style="margin-top:12px"><button type="button" class="btn btn-ghost btn-sm" data-do="vsvc-add" data-v="${v.id}">${ICON('plus')}Add Service Record</button></div>`:''),{open:true,meta:v.services.length?'<span class="tc num">'+v.services.length+'</span>':''})}
  ${acc('veh:'+v.id+':history','history','Assignment history',hist.length?`<div class="tblwrap"><table class="tbl" style="min-width:820px"><thead><tr><th>Taken by</th><th>Taken</th><th>Expected return</th><th>Returned</th><th>Check-out notes</th><th>Check-in notes</th></tr></thead><tbody>${hist.map(x=>`<tr><td class="strong">${esc(x.who)}</td><td>${esc(fmtD(x.taken))}</td><td>${x.expected?esc(fmtD(x.expected)):'—'}</td><td>${x.returned?esc(fmtD(x.returned)):pill('info','Currently out',1)}</td><td style="white-space:normal;color:var(--text-subtle)">${esc(x.out||'—')}</td><td style="white-space:normal;color:var(--text-subtle)">${esc(x.in||'—')}</td></tr>`).join('')}</tbody></table></div>`:'<div class="subtle">Not taken out yet</div>',{open:true,meta:hist.length?'<span class="tc num">'+hist.length+'</span>':''})}
  ${can('view:incident')?acc('veh:'+v.id+':incidents','alert','Incident reports',(inc.length?inc.map(i=>incCard(i,v)).join(''):'<div class="subtle">No incidents reported for this vehicle</div>')+`<div style="margin-top:12px"><button type="button" class="btn btn-ghost btn-sm" data-do="inc-add" data-v="${v.id}">${ICON('plus')}File incident report</button></div>`,{open:openInc(v.id)>0,meta:inc.length?'<span class="tc num">'+inc.length+'</span>'+(openInc(v.id)?pill('warn',openInc(v.id)+' to review'):''):''}):''}
  ${acc('veh:'+v.id+':images','eye','Vehicle images',`<div class="phg">${Array.from({length:v.images},()=>`<span class="ph">${ICON('eye')}</span>`).join('')||'<span class="subtle">No images attached yet</span>'}</div>${edit?`<div style="margin-top:12px"><button type="button" class="btn btn-ghost btn-sm" data-do="veh-img" data-id="${v.id}">${ICON('upload')}Add images</button></div>`:''}`)}
  ${acc('veh:'+v.id+':docs','file','Documents',(v.docs.map(d=>`<div class="docrow" style="padding:11px 0"><span class="ft">DOC</span><div class="grow"><b>${esc(d.name)}${d.files>1?' <span class="subtle" style="font-weight:500">· '+d.files+' files</span>':''}</b><small>Uploaded ${esc(d.added)} by ${esc(d.by)}</small></div></div>`).join('')||'<div class="subtle">No documents attached yet</div>')+(edit?`<div style="margin-top:12px"><button type="button" class="btn btn-ghost btn-sm" data-do="veh-doc" data-id="${v.id}">${ICON('plus')}Add document</button></div>`:''))}
  ${acc('veh:'+v.id+':notes','doc','Notes',v.notes?`<p style="font-size:13.5px;line-height:1.6;color:var(--text-muted)">${esc(v.notes)}</p>`:'<div class="subtle">No notes</div>')}
  </div>`;
 }};
DO['veh-img']=d=>{const v=vehBy(d.id);drawer({title:'Add images',sub:v.name,okLabel:'Add images',rules:{file:{always:true,fn:x=>x?'':'Choose at least one image'}},body:`<div class="fgrid">${drop('file','Images','JPG or PNG, max 50 MB each',true)}</div>`,onOk:()=>{v.images+=Math.max((($('#drawer input[type=file]')||{}).files||[]).length,1);rerender(true);toast('Images added',v.name);}});};
DO['veh-doc']=d=>{const v=vehBy(d.id);jobDocDrawer(doc=>{v.docs.push(doc);rerender(true);});};
DO['vsvc-del']=async d=>{const v=vehBy(d.v),s=v.services.find(x=>x.id===d.id);if(!(await dialog({title:'Delete service record?',body:`The ${esc(dateOnly(s.date))} record, <b>${esc(s.desc)}</b>, is removed.`,okLabel:'Delete',danger:true})))return;v.services=v.services.filter(x=>x!==s);rerender(true);toast('Service record deleted');};
function svcDrawer(onAdd,v){
 drawer({title:'Add Service Record',sub:v?v.name:'',okLabel:'Add record',rules:{km:x=>x&&(isNaN(Number(x))||Number(x)<0)?'Enter the odometer reading in km':'',cost:x=>x&&(isNaN(Number(x))||Number(x)<0)?'Enter an amount of $0 or more':'',date:x=>x>TODAY_ISO?'A service record can’t be in the future':''},
  body:`<div class="fgrid">${fld({name:'date',label:'Service date',type:'date',req:true,span:3,value:TODAY_ISO})}${fld({name:'km',label:'Odometer',span:3,value:v?v.odo:'',suffix:'km',inputmode:'numeric'})}${fld({name:'desc',label:'Description',type:'textarea',rows:3,req:true,span:6,ph:'e.g. Logbook service, oil and filters',max:300})}${fld({name:'cost',label:'Cost',type:'money',span:3,suffix:'AUD'})}${drop('invoice','Service invoice(s)','PDF or image, max 50 MB each',true)}</div>`,
  onOk:d=>{onAdd({id:'sr'+Date.now(),date:d.date,km:Number(d.km)||0,desc:d.desc,cost:Number(d.cost)||0,invoices:(($('#drawer input[type=file]')||{}).files||[]).length});toast('Service record added',d.desc);}});
}
DO['vsvc-add']=d=>{const v=vehBy(d.v);svcDrawer(s=>{v.services.push(s);rerender(true);},v);};

/* ---------- incident reports ---------- */
const tglRev=o=>tgl(o).replace('data-ftog="'+o.name+'"','data-ftog="'+o.name+'" data-fchange="rev"');
DO['inc-add']=d=>{
 const v=vehBy(d.v);
 drawer({title:'File incident report',sub:v.name+' · '+v.rego,okLabel:'File report',wide:true,
  rules:{occurred:x=>x.slice(0,10)>TODAY_ISO?'The incident can’t be in the future':'',desc:x=>x.length>1000?'Keep it to 1000 characters or fewer':'',ophone:(x,a)=>a.other==='1'&&x&&!phoneValid(x,a.ophone_cc)?'Enter a valid mobile number':'',oname:{always:true,fn:(x,a)=>a.other==='1'&&!x?'Other driver’s name is required':''}},
  body:`${addrList}<div class="fgrid">${fld({name:'occurred',label:'When did it happen',type:'datetime-local',req:true,span:3,value:TODAY_ISO+'T08:00'})}${fld({name:'by',label:'Reported by',type:'select',span:3,value:ME.name,opts:S.employees.filter(e=>e.st==='active').map(e=>[e.name,e.name])})}
   ${fld({name:'loc',label:'Accident location',req:true,span:6,list:'addrs',ph:'Search for address…'})}
   ${fld({name:'desc',label:'Description',type:'textarea',rows:4,req:true,span:6,max:1000,ph:'What happened, who was involved, any damage or injuries'})}
   ${tglRev({name:'other',label:'Another driver was involved',help:'Their details and licence photos help the insurer.',value:false})}
   <div class="fgrid s6" data-rev="other" hidden style="grid-column:span 6;padding:0">${fld({name:'oname',label:'Other driver’s name',span:3})}${fld({name:'ophone',label:'Other driver’s mobile',type:'phone',span:3})}${drop('olic','Licence photos','Front and back, JPG or PNG',true)}</div>
   ${drop('media','Photos and videos','Damage, scene and plates. Max 50 MB each.',true)}</div>`,
  onOk:x=>{const files=n=>(($('#drawer input[name="'+n+'"]')||{}).files||[]).length;
   S.incidents.unshift({id:'inc'+Date.now(),car:v.id,by:x.by,occurred:x.occurred,filed:TODAY_ISO+'T'+new Date().toTimeString().slice(0,5),reviewedBy:'',loc:x.loc,desc:x.desc,other:x.other==='1'?{name:x.oname,phone:x.ophone,licence:files('olic')}:null,media:files('media')});
   UI.acc=UI.acc||{};UI.acc['veh:'+v.id+':incidents']=true;rerender(true);toast('Incident report filed',v.name+' · supervisors will review it');}});
};
DO['inc-review']=d=>{const i=S.incidents.find(x=>x.id===d.id);i.reviewedBy=ME.name;rerender(true);toast('Marked as reviewed',fmtDT(i.occurred));};
DO['inc-reopen']=async d=>{const i=S.incidents.find(x=>x.id===d.id);if(!(await dialog({title:'Re-open this report?',body:'It goes back to “Needs review” and supervisors are notified again.',okLabel:'Re-open'})))return;i.reviewedBy='';rerender(true);toast('Report re-opened',fmtDT(i.occurred));};

/* ---------- add / edit ---------- */
const VF={services:[]};
const VSTATUS_BASE=['Available','Maintenance'];
function vehSvcList(){
 return VF.services.length?`<div class="tblwrap"><table class="tbl" style="min-width:560px"><thead><tr><th>Date</th><th class="r">Odometer</th><th>Description</th><th class="r">Cost</th><th class="act"></th></tr></thead><tbody>${VF.services.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(s=>`<tr><td>${esc(dateOnly(s.date))}</td><td class="r num">${N(s.km)} km</td><td class="strong" style="white-space:normal">${esc(s.desc)}</td><td class="r num">${s.cost?'A$'+N(s.cost):'—'}</td><td><button type="button" class="rowbtn" data-do="vf-svc-rm" data-id="${s.id}" aria-label="Remove service record">${ICON('trash')}</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="subtle" style="padding:2px 0 4px">No service records yet</div>';
}
function vehForm(v){
 const nw=!v,x=v||{make:'',mdl:'',year:'',terrain:'on_road',rego:'',name:'',vin:'',roadsideCo:'',roadsidePh:'',status:'available',odo:'',color:'',insExp:'',inspDue:'',svcDate:'',svc:'',notes:''};
 VF.services=nw?[]:v.services.map(s=>({...s}));
 const inUse=!nw&&v.status==='in_use',customs=Object.keys(VST).filter(k=>!['available','in_use','maintenance'].includes(k)).map(k=>VST[k][1]),curLabel=nw?'Available':vstatLabel(v);
 const sopts=uniq([...VSTATUS_BASE,...customs]);if(!sopts.includes(curLabel)&&!inUse)sopts.push(curLabel);
 return `<form class="formpage" data-form novalidate onsubmit="return false" id="vehForm" data-id="${nw?'':v.id}" style="max-width:980px">
  ${fsec('Vehicle details',nw?'Make, model and plate are required':'',
   fld({name:'make',label:'Make',req:true,value:x.make,span:2,ph:'e.g. Toyota',max:60})+fld({name:'mdl',label:'Model',req:true,value:x.mdl,span:2,ph:'e.g. HiLux SR5',max:60})+fld({name:'year',label:'Manufacture year',value:x.year,span:2,inputmode:'numeric',max:4,ph:'e.g. 2023'})
   +fld({name:'terrain',label:'Tyre terrain',type:'select',value:x.terrain,span:2,opts:TERRAIN})+fld({name:'rego',label:'Number plate',req:true,value:x.rego,span:2,ph:'e.g. DBX-71K',max:12})+fld({name:'name',label:'ID',value:x.name,span:2,ph:'e.g. Ute 07',max:40,help:'Your own fleet number. Leave empty to use make and model.'})
   +fld({name:'vin',label:'VIN',value:x.vin,span:3,max:17,ph:'17 characters'})+fld({name:'color',label:'Colour',value:x.color,span:3,max:30})
   +fld({name:'roadsideCo',label:'Roadside assistance',value:x.roadsideCo,span:3,ph:'e.g. NRMA',max:60})+fld({name:'roadsidePh',label:'Roadside assistance phone #',value:x.roadsidePh,span:3,inputmode:'tel',max:20,ph:'e.g. 13 11 22'})
   +(inUse?fld({name:'status',label:'Status',type:'select',value:'In use',span:3,opts:['In use'],disabled:true,help:'Checked out. Return the vehicle to change its status.'}):selAdd({name:'status',label:'Status',value:curLabel,opts:sopts,span:3,what:'Status'}))
   +fld({name:'odo',label:'Speedometer',value:x.odo,span:3,suffix:'km',inputmode:'numeric',help:'Current odometer reading'}))}
  ${fsec('Dates and service','Reminders are sent before each date',
   fld({name:'rego_due',label:'Registration due',type:'date',value:nw?'':regoIso(v),span:2})+fld({name:'insExp',label:'Insurance expiry',type:'date',value:x.insExp,span:2})+fld({name:'inspDue',label:'Inspection due',type:'date',value:x.inspDue,span:2})
   +fld({name:'svcDate',label:'Service due date',type:'date',value:x.svcDate,span:3})+fld({name:'svc',label:'Service due at',value:x.svc,span:3,suffix:'km',inputmode:'numeric',help:'Odometer reading for the next service'}))}
  ${fsec('Documents and images','Max 50 MB per file',
   drop('regdoc','Registration document','PDF or image',true)+drop('insdoc','Insurance policy','PDF or image',true)+drop('slip','Green slip','PDF or image',true)+drop('images','Vehicle images','JPG or PNG',true)+drop('docs','Documents','Any files',true)
   +fld({name:'notes',label:'Notes',type:'textarea',rows:3,value:x.notes,span:6,max:500}))}
  ${fsec('Service history','Past services and invoices',`<div style="grid-column:1/-1" id="vfSvc">${vehSvcList()}</div><div style="grid-column:1/-1"><button type="button" class="btn btn-ghost btn-sm" data-do="vf-svc-add">${ICON('plus')}Add Service Record</button></div>`)}
  <div class="fbar"><span class="hint">${nw?'Nothing saved yet':'No changes yet'}</span><button type="button" class="btn btn-ghost" data-go="${nw?'vehicles':'vehicles/'+v.id}">Cancel</button><button type="button" class="btn" data-do="vf-save" data-fsave${nw?'':' disabled'}>${ICON('check')}${nw?'Add vehicle':'Save changes'}</button></div></form>`;
}
VIEWS['vehicle-new']={path:'vehicles/new',parent:'vehicles',perm:'add:vehicle',title:'Add Vehicle',sub:'Register a vehicle with its plate, dates and documents.',crumbs:()=>[['Vehicles','vehicles'],['Add vehicle']],render(){return vehForm(null);}};
VIEWS['vehicle-edit']={path:'vehicles/:id/edit',parent:'vehicles',perm:'edit:vehicle',title:'Edit vehicle',sub:'Changes apply straight away.',crumbs:()=>{const v=vehBy(P.id);return [['Vehicles','vehicles'],[v?v.name:'Not found','vehicles/'+P.id],['Edit']];},render(){const v=vehBy(P.id);return v?vehForm(v):notFound('Vehicle','vehicles');}};
DO['vf-svc-add']=()=>{svcDrawer(s=>{VF.services.push(s);$('#vfSvc').innerHTML=vehSvcList();markDirty($('#vehForm'));});};
DO['vf-svc-rm']=d=>{VF.services=VF.services.filter(s=>s.id!==d.id);$('#vfSvc').innerHTML=vehSvcList();markDirty($('#vehForm'));};
DO['vf-save']=()=>{
 const form=$('#vehForm'),id=form.dataset.id,edit=id?vehBy(id):null;
 const d=validate(form,{
  year:x=>x&&(!/^\d{4}$/.test(x)||+x<1950||+x>2027)?'Enter a 4-digit year, e.g. 2023':'',
  rego:(x)=>S.vehicles.some(a=>a!==edit&&a.rego.toLowerCase()===x.toLowerCase())?'Another vehicle already uses this number plate':'',
  vin:x=>x&&!/^[A-HJ-NPR-Z0-9]{17}$/i.test(x)?'A VIN is 17 letters and numbers (no I, O or Q)':'',
  roadsidePh:x=>x&&!/^\+?[\d][\d\s()-]{4,19}$/.test(x)?'Enter a valid phone number':'',
  odo:x=>x&&(isNaN(Number(x))||Number(x)<0)?'Enter the odometer reading in km':'',
  svc:x=>x&&(isNaN(Number(x))||Number(x)<0)?'Enter a reading in km':''});
 if(!d)return toastErr('Can’t save yet','Fix the highlighted fields.');
 const label=d.status,key=Object.keys(VST).find(k=>VST[k][1]===label)||label;if(!VST[key])VST[key]=['neutral',label];
 const odo=Number(d.odo)||0,rd=d.rego_due||addDays(TODAY_ISO,365),rec={make:d.make,mdl:d.mdl,year:d.year,terrain:d.terrain,rego:d.rego.toUpperCase(),name:d.name||(d.make+' '+d.mdl),vin:d.vin.toUpperCase(),color:d.color,roadsideCo:d.roadsideCo,roadsidePh:d.roadsidePh,odo,insExp:d.insExp||addDays(TODAY_ISO,365),inspDue:d.inspDue,svcDate:d.svcDate||addDays(TODAY_ISO,180),svc:Number(d.svc)||odo+10000,notes:d.notes,model:(d.make+' '+d.mdl+(d.year?' '+d.year:'')).trim(),regoExp:dateOnly(rd),regoDays:daysTo(rd),services:VF.services.map(s=>({...s}))};
 if(edit){if(edit.status!=='in_use'){rec.status=key;edit.st=key==='maintenance'?'service':edit.st==='road'?'parked':edit.st;}Object.assign(edit,rec);}
 else{let nid=slug(rec.name),n=2;while(vehBy(nid))nid=slug(rec.name)+'-'+n++;S.vehicles.push({...rec,id:nid,c:JC[['blue','teal','green','orange','slate','red'][S.vehicles.length%6]],driver:'',insp:'Not yet',ok:true,st:key==='maintenance'?'service':'parked',status:key,outTo:'',images:0,docs:[],history:[]});}
 GUARD.dirty=false;toast(edit?'Vehicle updated':'Vehicle added',rec.name+' · '+rec.rego);go(edit?'vehicles/'+edit.id:'vehicles');
};

/* ---------- Check Out / Return ---------- */
const vBlocked=(title,msg,cta)=>`<div class="page"><section class="qv-card">${emptyBlock('alert',title,msg,cta)}</section></div>`;
VIEWS['vehicle-checkout']={path:'vehicles/:id/checkout',parent:'vehicles',perm:'assign:vehicle',title:'Check Out Vehicle',sub:'Who is taking it, and when it should be back.',
 crumbs:()=>{const v=vehBy(P.id);return [['Vehicles','vehicles'],[v?v.name:'Not found','vehicles/'+P.id],['Check out']];},
 render(){
  const v=vehBy(P.id);if(!v)return notFound('Vehicle','vehicles');
  if(v.status==='in_use')return vBlocked('This vehicle is already checked out','Return it before it can go out again.',`<button type="button" class="btn" data-go="vehicles/${v.id}/return">Return vehicle</button>`);
  if(v.status!=='available')return vBlocked('This vehicle isn’t available','It is marked '+vstatLabel(v).toLowerCase()+'. Change its status first.',can('edit:vehicle')?`<button type="button" class="btn btn-ghost" data-go="vehicles/${v.id}/edit">Edit vehicle</button>`:'');
  const fl=vehFlags(v).filter(f=>f[0]==='bad');
  return `<form class="formpage" data-form novalidate onsubmit="return false" id="vcoForm" data-id="${v.id}" style="max-width:760px">${fsec('Check Out Vehicle',v.name+' · '+v.rego,
   (fl.length?`<div class="banner warn" style="grid-column:1/-1">${ICON('alert')}<span><b>Heads up:</b> ${esc(fl.map(f=>f[1]).join(', '))}. You can still check it out.</span></div>`:'')
   +fld({name:'who',label:'Employee',type:'select',req:true,span:6,value:'',opts:[['','Select employee'],...S.employees.filter(e=>e.st==='active').map(e=>[e.name,e.name+' · '+e.role])]})
   +fld({name:'date',label:'Checkout date',type:'date',req:true,span:3,value:TODAY_ISO})+fld({name:'expected',label:'Expected return date',type:'date',span:3})
   +fld({name:'notes',label:'Check-out notes',type:'textarea',rows:3,span:6,max:400,ph:'Fuel level, condition, anything the next person should know'}))}
   <div class="fbar"><span class="hint">Nothing checked out yet</span><button type="button" class="btn btn-ghost" data-go="vehicles/${v.id}">Cancel</button><button type="button" class="btn" data-do="vco-save" data-fsave>${ICON('check')}Check Out</button></div></form>`;
 }};
DO['vco-save']=()=>{
 const form=$('#vcoForm'),v=vehBy(form.dataset.id),d=validate(form,{expected:(x,a)=>x&&x<a.date?'Expected return can’t be before the checkout date':''});if(!d)return toastErr('Can’t save yet','Fix the highlighted fields.');
 v.status='in_use';v.outTo=d.who;v.driver=d.who;v.st='road';v.history.push({who:d.who,taken:d.date,expected:d.expected,returned:'',out:d.notes,in:''});
 GUARD.dirty=false;toast('Vehicle checked out',v.name+' · '+d.who);go('vehicles/'+v.id);
};
VIEWS['vehicle-return']={path:'vehicles/:id/return',parent:'vehicles',perm:'assign:vehicle',title:'Return Vehicle',sub:'Check it back in and note its condition.',
 crumbs:()=>{const v=vehBy(P.id);return [['Vehicles','vehicles'],[v?v.name:'Not found','vehicles/'+P.id],['Return']];},
 render(){
  const v=vehBy(P.id);if(!v)return notFound('Vehicle','vehicles');const h=vehOut(v);
  if(!h)return vBlocked('This vehicle isn’t checked out','There is nothing to return.',`<button type="button" class="btn btn-ghost" data-go="vehicles/${v.id}">Back to the vehicle</button>`);
  return `<form class="formpage" data-form novalidate onsubmit="return false" id="vrtForm" data-id="${v.id}" style="max-width:760px">${fsec('Return Vehicle',v.name+' · '+v.rego,
   `<div style="grid-column:1/-1">${kv([['Checked out to',esc(h.who)],['Checkout date',esc(fmtDL(h.taken))],['Expected return date',h.expected?esc(fmtDL(h.expected)):'—'],['Check-out notes',esc(h.out||'—')]])}</div>`
   +fld({name:'date',label:'Checkin date',type:'date',req:true,span:3,value:TODAY_ISO})+fld({name:'status',label:'Status',type:'select',span:3,value:'available',opts:[['available','Available'],['maintenance','Maintenance']]})
   +fld({name:'notes',label:'Check-in notes',type:'textarea',rows:3,span:6,max:400,ph:'Condition, fuel, damage, anything needing attention'}))}
   <div class="fbar"><span class="hint">Nothing returned yet</span><button type="button" class="btn btn-ghost" data-go="vehicles/${v.id}">Cancel</button><button type="button" class="btn" data-do="vrt-save" data-fsave>${ICON('check')}Return Vehicle</button></div></form>`;
 }};
DO['vrt-save']=()=>{
 const form=$('#vrtForm'),v=vehBy(form.dataset.id),h=vehOut(v),d=validate(form,{date:x=>h&&x<h.taken?'Checkin can’t be before the checkout date':''});if(!d)return;
 Object.assign(h,{returned:d.date,in:d.notes});v.status=d.status;v.outTo='';v.driver='';v.st=d.status==='maintenance'?'service':'parked';
 GUARD.dirty=false;toast('Vehicle returned',v.name+' · '+vstatLabel(v));go('vehicles/'+v.id);
};

/* ---------- Inspections: Inspections | Video Inspection ---------- */
const VI={before:'',after:''};
const inspTabs=()=>{const t=UI.inspTab||'inspections';return `<div class="tabs ptabs" role="tablist">${[['inspections','Inspections',S.inspections.length],['video','Video Inspection',S.comparisons.length]].map(([k,l,n])=>`<button type="button" role="tab" class="tab${t===k?' on':''}" aria-selected="${t===k}" data-do="insp-tab" data-t="${k}">${l}<span class="tc num">${n}</span></button>`).join('')}</div>`;};
DO['insp-tab']=d=>{UI.inspTab=d.t;rerender(true);};
const vehOpts=(first)=>[['',first],...S.vehicles.map(v=>[v.id,v.name+' · '+v.rego])];
VIEWS['vehicle-inspections']={path:'vehicles/inspections',parent:'vehicles',perm:'inspect:vehicle',title:'Vehicle inspections',sub:'Walk-around checks and before/after video comparisons.',crumbs:()=>[['Vehicles','vehicles'],['Inspections']],
 act:()=>(UI.inspTab||'inspections')==='inspections'?`<button type="button" class="btn" data-go="vehicles/inspections/new">${ICON('plus')}<span class="lb">New inspection</span></button>`:'',
 render(){
  const tab=UI.inspTab||'inspections',car=UI.inspCar||'';
  if(tab==='inspections'){
   const rows=S.inspections.filter(i=>!car||i.car===car).slice().sort((a,b)=>b.created.localeCompare(a.created));
   return `<div class="page">${inspTabs()}<section class="qv-card"><div class="qv-hd"><div class="grow"><h3>Inspections</h3><div class="s">${rows.length} on record</div></div><div class="meta"><select class="selc" data-inspcar aria-label="Filter by vehicle">${vehOpts('All vehicles').map(([k,l])=>`<option value="${k}"${k===car?' selected':''}>${esc(l)}</option>`).join('')}</select></div></div>
    ${rows.length?`<div class="tblwrap"><table class="tbl" style="min-width:760px"><thead><tr><th>Date</th><th>License plate</th><th>Inspector</th><th>Vehicle type</th><th>Created</th><th>Status</th></tr></thead><tbody>${rows.map(i=>`<tr class="link" data-href="vehicles/inspections/${i.id}"><td class="strong">${esc(dateOnly(i.date))}</td><td><span class="mono plate">${esc(i.plate)}</span></td><td>${person(i.inspector)}</td><td>${esc(i.type)}</td><td>${esc(fmtDT(i.created))}</td><td>${pill('ok','Completed',1)}</td></tr>`).join('')}</tbody></table></div>`:emptyBlock('shield','No inspections yet','Start a walk-around check from “New inspection”.')}</section></div>`;
  }
  const done=S.comparisons.filter(c=>c.status!=='processing').length;
  return `<div class="page">${inspTabs()}<div class="two"><section class="qv-card"><div class="qv-hd"><div class="grow"><h3>Compare vehicle condition before and after use</h3><div class="s">Upload a walk-around video from check-out and one from check-in. SiteOS lists new damage it finds.</div></div></div>
   <form class="qv-body fgrid" data-form novalidate onsubmit="return false" id="cmpForm">${fld({name:'car',label:'Vehicle',type:'select',req:true,span:6,value:car,opts:vehOpts('Select vehicle')})}${drop('before','Before (check-out video)','MP4 or MOV, up to 500 MB')}${drop('after','After (check-in video)','MP4 or MOV, up to 500 MB')}
   <div class="fld s6" style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn" data-do="cmp-go">${ICON('search')}Compare</button></div></form></section>
   <section class="qv-card"><div class="qv-hd"><div class="grow"><h3>Past comparisons</h3><div class="s">${done} completed</div></div></div>${S.comparisons.length?S.comparisons.slice().sort((a,b)=>b.created.localeCompare(a.created)).map(c=>{const v=vehBy(c.car);return `<div class="docrow" data-go="vehicles/compare/${c.id}" style="cursor:pointer"><span class="ft" style="background:${c.status==='processing'?'var(--warn-soft)':c.items.length?'var(--bad-soft)':'var(--ok-soft)'};color:${c.status==='processing'?'var(--warn)':c.items.length?'var(--bad)':'var(--ok)'}">${c.status==='processing'?'…':c.items.length}</span><div class="grow"><b>${esc(v?v.name:'Vehicle')}</b><small>${esc(fmtDT(c.created))} · ${c.status==='processing'?'Analysing the videos…':c.items.length?c.items.length+' new finding'+(c.items.length>1?'s':''):'No new damage'}</small></div>${ICON('next')}</div>`;}).join(''):emptyBlock('eye','No comparisons yet','Run one on the left and the report appears here.')}</section></div></div>`;
 }};
document.addEventListener('change',e=>{const s=e.target.closest('[data-inspcar]');if(s){UI.inspCar=s.value;rerender(true);}});
VIEWS['vehicle-inspection-new']={path:'vehicles/inspections/new',parent:'vehicles',perm:'inspect:vehicle',title:'Vehicle Inspection',sub:'A walk-around check before the vehicle goes out.',crumbs:()=>[['Vehicles','vehicles'],['Inspections','vehicles/inspections'],['New inspection']],
 render(){
  const v=vehBy(UI.inspCar||'');
  return `<datalist id="plates">${S.vehicles.map(x=>`<option value="${esc(x.rego)}">`).join('')}</datalist><form class="formpage" data-form novalidate onsubmit="return false" id="inspForm" style="max-width:760px">${fsec('Vehicle Inspection','Inspector, date and plate are required',
   fld({name:'inspector',label:'Inspector Name',req:true,span:3,value:ME.name,max:80})+fld({name:'date',label:'Date',type:'date',req:true,span:3,value:TODAY_ISO})
   +fld({name:'plate',label:'License Plate No.',req:true,span:3,value:v?v.rego:'',list:'plates',max:12,ph:'e.g. DBX-71K'})+fld({name:'type',label:'Vehicle type',req:true,span:3,value:v?v.model.replace(/\s*\b20\d\d\b\s*/,'').trim():'',max:60,ph:'e.g. Toyota HiLux'})
   +drop('photos','Photos','JPG or PNG, max 50 MB in total',true))}
   <div class="fbar"><span class="hint">Nothing saved yet</span><button type="button" class="btn btn-ghost" data-go="vehicles/inspections">Cancel</button><button type="button" class="btn" data-do="insp-save" data-fsave>${ICON('check')}Save Inspection</button></div></form>`;
 }};
document.addEventListener('change',e=>{const p=e.target.closest('#inspForm [name="plate"]');if(!p)return;const v=S.vehicles.find(x=>x.rego.toLowerCase()===p.value.trim().toLowerCase()),t=$('#inspForm [name="type"]');if(v&&t&&!t.value)t.value=v.model.replace(/\s*\b20\d\d\b\s*/,'').trim();});
DO['insp-save']=()=>{
 const form=$('#inspForm'),d=validate(form,{date:x=>x>TODAY_ISO?'The inspection date can’t be in the future':'',plate:x=>S.vehicles.some(v=>v.rego.toLowerCase()===x.toLowerCase())?'':'No vehicle in the fleet has this plate'});if(!d)return toastErr('Can’t save yet','Fix the highlighted fields.');
 const v=S.vehicles.find(x=>x.rego.toLowerCase()===d.plate.toLowerCase());
 S.inspections.unshift({id:'vi'+Date.now(),car:v.id,date:d.date,plate:v.rego,inspector:d.inspector,type:d.type,created:TODAY_ISO+'T'+new Date().toTimeString().slice(0,5),status:'completed',photos:(($('#inspForm input[type=file]')||{}).files||[]).length});
 if(d.date>=TODAY_ISO)v.insp='Today';
 GUARD.dirty=false;UI.inspTab='inspections';toast('Inspection saved',v.name+' · '+d.inspector);go('vehicles/inspections');
};
VIEWS['vehicle-inspection']={path:'vehicles/inspections/:id',parent:'vehicles',perm:'inspect:vehicle',title:'Inspection',sub:()=>{const i=S.inspections.find(x=>x.id===P.id);return i?i.plate+' · '+dateOnly(i.date):'';},
 crumbs:()=>[['Vehicles','vehicles'],['Inspections','vehicles/inspections'],['Inspection']],
 render(){
  const i=S.inspections.find(x=>x.id===P.id);if(!i)return notFound('Inspection','vehicles/inspections');const v=vehBy(i.car);
  return `<div class="page"><section class="qv-card"><div class="qv-hd"><div class="grow"><h3>Vehicle Inspection</h3><div class="s">${esc(fmtDT(i.created))}</div></div><div class="meta">${pill('ok','Completed',1)}</div></div><div class="qv-body">${kv([['Inspector',esc(i.inspector)],['Date',esc(fmtDL(i.date))],['License plate',`<span class="mono plate">${esc(i.plate)}</span>`],['Vehicle type',esc(i.type)],['Vehicle',v?`<a class="lnk" data-go="vehicles/${v.id}">${esc(v.name)}</a>`:'—']])}<div style="margin-top:16px"><div class="subtle" style="margin-bottom:8px;font-weight:600">${i.photos} photo${i.photos===1?'':'s'}</div><div class="phg">${Array.from({length:i.photos},()=>`<span class="ph">${ICON('eye')}</span>`).join('')}</div></div></div></section></div>`;
 }};
const CMP_SAMPLES=[['Passenger mirror','moderate','Housing cracked, glass intact. Not present in the first video.'],['Rear step','minor','Fresh scuff on the lower edge.'],['Driver door','minor','Small dent near the handle, about the size of a coin.'],['Windscreen','minor','New chip, lower left. Not present in the first video.'],['Front bumper','major','Paint cracked and bumper displaced on the left corner.']];
function cmpItems(b,a){let h=0;(b+'>'+a).split('').forEach(c=>h=(h*31+c.charCodeAt(0))%997);const n=h%3;return Array.from({length:n},(_,k)=>{const s=CMP_SAMPLES[(h+k*2)%CMP_SAMPLES.length];return {loc:s[0],sev:s[1],note:s[2]};});}
DO['cmp-go']=()=>{
 const form=$('#cmpForm'),d0=validate(form,{}),d=d0||readForm(form);
 const bf=($('input[name="before"]',form).files||[])[0],af=($('input[name="after"]',form).files||[])[0];
 let bad=!d0;
 if(!bf){$('#e-before').textContent='Choose the check-out video';bad=true;}if(!af){$('#e-after').textContent='Choose the check-in video';bad=true;}
 if(bf&&af&&bf.name===af.name&&bf.size===af.size){$('#e-after').textContent='Choose a different video from the first one';bad=true;}
 if(bad)return toastErr('Can’t compare yet','Pick the vehicle and two different videos.');
 const c={id:'cmp'+Date.now(),car:d.car,created:TODAY_ISO+'T'+new Date().toTimeString().slice(0,5),status:'processing',before:bf.name,after:af.name,summary:'',items:[]};
 S.comparisons.unshift(c);UI.inspCar=d.car;rerender(true);toast('Comparing videos','This usually takes a minute. You can leave this page.');
 setTimeout(()=>{c.items=cmpItems(c.before,c.after);c.summary=c.items.length?c.items.length+' new area'+(c.items.length>1?'s':'')+' of damage found. Everything else matches the first video.':'No new damage found.';c.status='completed';if(location.hash.indexOf('vehicles/inspections')>=0)rerender(true);toast('Comparison ready',(vehBy(c.car)||{}).name+' · '+c.summary);},1800);
};
const SEV={minor:['info','Minor'],moderate:['warn','Moderate'],major:['bad','Major']};
VIEWS['vehicle-compare']={path:'vehicles/compare/:id',parent:'vehicles',perm:'inspect:vehicle',title:'Comparison report',sub:'Compare vehicle condition before and after use',crumbs:()=>[['Vehicles','vehicles'],['Inspections','vehicles/inspections'],['Comparison report']],
 act:()=>{const c=S.comparisons.find(x=>x.id===P.id);return c&&c.status==='completed'?`<button type="button" class="btn btn-ghost" data-do="cmp-swap" data-id="${c.id}">${ICON('reset')}<span class="lb">Swap videos</span></button>`:'';},
 render(){
  const c=S.comparisons.find(x=>x.id===P.id);if(!c)return notFound('Comparison','vehicles/inspections');const v=vehBy(c.car);
  if(c.status==='processing')return `<div class="page"><section class="qv-card">${emptyBlock('eye','Analysing the videos…','This usually takes a minute. The report appears here when it is ready.',`<button type="button" class="btn btn-ghost" data-go="vehicles/inspections">Back to inspections</button>`)}</section></div>`;
  return `<div class="page"><section class="qv-card"><div class="qv-hd"><div class="grow"><h3>${esc(v?v.name:'Vehicle')} · ${esc(v?v.rego:'')}</h3><div class="s">Report created ${esc(fmtDT(c.created))}</div></div><div class="meta">${c.items.length?pill('bad',c.items.length+' new finding'+(c.items.length>1?'s':''),1):pill('ok','No new damage',1)}</div></div>
   <div class="qv-body"><div class="two-col"><div class="vidbox"><span class="vidph">${ICON('eye')}</span><b>Before</b><small>${esc(c.before)}</small></div><div class="vidbox"><span class="vidph">${ICON('eye')}</span><b>After</b><small>${esc(c.after)}</small></div></div><p class="incd" style="margin-top:14px">${esc(c.summary)}</p></div></section>
  ${c.items.length?`<section class="qv-card"><div class="qv-hd"><div class="grow"><h3>Findings</h3><div class="s">Present in the after video, not in the before video</div></div></div><div class="tblwrap"><table class="tbl" style="min-width:560px"><thead><tr><th>Area</th><th>Severity</th><th>What changed</th></tr></thead><tbody>${c.items.map(i=>`<tr><td class="strong">${esc(i.loc)}</td><td>${pill(SEV[i.sev][0],SEV[i.sev][1],1)}</td><td style="white-space:normal;color:var(--text-muted)">${esc(i.note)}</td></tr>`).join('')}</tbody></table></div></section>`:`<section class="qv-card">${emptyBlock('checkc','Nothing new found','The vehicle looks the same in both videos.')}</section>`}
  ${v&&can('add:vehicle')?`<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn btn-ghost" data-go="vehicles/${v.id}">${ICON('truck')}Open ${esc(v.name)}</button>${c.items.length&&can('view:incident')?`<button type="button" class="btn btn-ghost" data-do="inc-add" data-v="${v.id}">${ICON('alert')}File incident report</button>`:''}</div>`:''}</div>`;
 }};
DO['cmp-swap']=d=>{const c=S.comparisons.find(x=>x.id===d.id);[c.before,c.after]=[c.after,c.before];c.items=cmpItems(c.before,c.after);c.summary=c.items.length?c.items.length+' new area'+(c.items.length>1?'s':'')+' of damage found. Everything else matches the first video.':'No new damage found.';rerender(true);toast('Videos swapped','The report was re-run with the other video as the baseline.');};
