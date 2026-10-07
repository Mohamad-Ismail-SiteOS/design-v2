/* =====================================================================
   Jobs: list (Jobs / Shared with me), detail page, add / edit page.
   Structure follows the shipped screens:
   - list: Job name, Description, Address, Supervisors, Geofence, Costs, Status, Created; row menu Edit / Archive / Delete
   - detail: collapsible sections (Financial Information, Basic Information, Location, Customer,
     Supervisors, Qualified Users, Qualified Groups, JSA, Documents) with Expand all + Edit
   - form: Job name, number, color, description, address; location; costs; people; customers; daily JSA; documents
   ===================================================================== */
const canFin=()=>can('view:job:financials');
const aud=v=>v==null?'<span class="dash">—</span>':'A$'+Number(v).toLocaleString('en-AU',{minimumFractionDigits:2,maximumFractionDigits:2});
const jobPill=j=>pill(JOBST[j.status][0],JOBST[j.status][1],1);
const jobCustomers=j=>(j.custIds||[]).map(custBy).filter(Boolean);
const jobStaff=names=>names.map(n=>S.employees.find(e=>e.name===n)).filter(Boolean);

/* ---------- list ---------- */
function jobMenuBtn(r){
 const items=[can('edit:job')&&'edit:Edit job',can('edit:job')&&'archive:'+(r.arch?'Unarchive':'Archive'),can('delete:job')&&'delete:Delete:danger'].filter(Boolean);
 return items.length?`<button type="button" class="rowbtn" data-do="row-menu" data-kind="job" data-id="${r.id}" data-items="${items.join('|')}" aria-label="More actions" aria-haspopup="menu">${ICON('more')}</button>`:'';
}
const JOBS_CORE=VIEWS.jobs.render;
VIEWS.jobs.sub='Manage jobs, locations, and assignments for your company.';
VIEWS.jobs.act=()=>btn('Export','download','Export|A CSV of all jobs would download',1)+(can('add:job')?`<button type="button" class="btn" data-go="jobs/new">${ICON('plus')}<span class="lb">Add job</span></button>`:'');
VIEWS.dash.act=()=>btn('Customise','sliders','Customise|Drag cards to reorder the dashboard',1)+(can('add:job')?`<button type="button" class="btn" data-go="jobs/new">${ICON('plus')}<span class="lb">New job</span></button>`:'');
const jobsTabsBar=()=>{const t=UI.jobsTab||'jobs';return `<div class="tabs ptabs" role="tablist">${[['jobs','Jobs',S.jobs.filter(j=>!j.arch).length],['shared','Shared with me',S.sharedJobs.length]].map(([k,l,n])=>`<button type="button" role="tab" class="tab${t===k?' on':''}" aria-selected="${t===k}" data-do="jobs-tab" data-t="${k}">${l}<span class="tc num">${n}</span></button>`).join('')}</div>`;};
VIEWS.jobs.render=function(){
 if((UI.jobsTab||'jobs')==='shared')return `<div class="page">${jobsTabsBar()}${sharedJobsCard()}</div>`;
 return `<div class="page">${jobsTabsBar()}${JOBS_CORE.call(this).replace(/^\s*<div class="page">/,'').replace(/<\/div>\s*$/,'')}</div>`;
};
DO['jobs-tab']=d=>{UI.jobsTab=d.t;rerender(true);};
function sharedJobsCard(){
 const rows=S.sharedJobs,st={pending:['warn','Waiting for you'],accepted:['ok','Accepted'],declined:['neutral','Declined']};
 return `<section class="qv-card"><div class="qv-hd"><div class="grow"><h3>Shared with me</h3><div class="s">Jobs other companies have invited you to work on. You see their progress, never their pricing.</div></div></div>${rows.length?`<div class="tblwrap"><table class="tbl" style="min-width:820px"><thead><tr><th>Job</th><th>Shared by</th><th>Your role</th><th>Shared on</th><th>Status</th><th class="act"></th></tr></thead><tbody>${rows.map(r=>`<tr><td>${titled(r.name,r.addr,null,0)}</td><td>${esc(r.by)}</td><td>${esc(r.role)}</td><td>${esc(r.date)}</td><td>${pill(st[r.state][0],st[r.state][1],1)}</td><td>${r.state==='pending'?`<div class="acts"><button type="button" class="btn btn-ghost btn-sm" data-do="shared-decline" data-id="${r.id}">Decline</button><button type="button" class="btn btn-sm" data-do="shared-accept" data-id="${r.id}">Accept</button></div>`:''}</td></tr>`).join('')}</tbody></table></div>`:emptyBlock('jobs','Nothing shared with you yet','When a customer shares a job with your company it appears here.')}</section>`;
}
DO['shared-accept']=d=>{const r=S.sharedJobs.find(x=>x.id===d.id);r.state='accepted';rerender(true);toast('Job accepted',r.name+' · you can now invite your people');};
DO['shared-decline']=async d=>{const r=S.sharedJobs.find(x=>x.id===d.id);if(!(await dialog({title:'Decline this job?',body:`<b>${esc(r.name)}</b> from ${esc(r.by)} will be removed from your list. They are told you declined.`,okLabel:'Decline',danger:true})))return;r.state='declined';rerender(true);toast('Job declined',r.name);};

/* ---------- detail ---------- */
function geoMap(j){
 const rad=24+Math.min(Math.max(j.geo||0,0),500)/500*56;
 return `<div class="gmap" role="img" aria-label="Map pin${j.geo?' with a '+j.geo+' metre geofence':''}"><svg viewBox="0 0 320 170" preserveAspectRatio="xMidYMid slice"><rect width="320" height="170" fill="var(--mapland)"/><path d="M-10 128 Q110 104 330 136" stroke="var(--mapriver)" stroke-width="16" fill="none" opacity=".7"/><path d="M0 62H320M0 128H320M84 0V170M214 0V170" stroke="var(--maproad)" stroke-width="7"/>${j.geo?`<circle cx="160" cy="85" r="${rad}" fill="${j.c}" fill-opacity=".14" stroke="${j.c}" stroke-width="1.6" stroke-dasharray="4 4"/>`:''}<circle cx="160" cy="85" r="8" fill="${j.c}"/><circle cx="160" cy="85" r="3.2" fill="#fff"/></svg><span class="gm-l">${j.geo?'Geofence '+j.geo+' m':'Geofence off'}</span></div>`;
}
const jobKeys=j=>['fin','basic','loc','cust','sup','qual','grp','jsa','docs'].map(k=>'job:'+j.id+':'+k);
function jobPm(j){
 const cs=jobCustomers(j);if(!cs.length)return '<span class="dash">No project manager invited yet</span>';
 const c=cs[0];return c.collab.state==='accepted'?`${person(c.contact,c.name)}`:c.collab.state==='pending'?`${esc(c.contact)} ${pill('warn','Pending approval')}`:'<span class="dash">No project manager invited yet</span>';
}
function jobJsa(j){
 const today=S.jsas.find(x=>x.job===j.name),auto=j.jsaOn?`Sent to the crew every day at <b>${esc(j.jsaTime)}</b> from <b>${esc(j.jsaTpl)}</b>.`:'Not sent automatically. You can start one by hand.';
 const head='TODAY · THU 1 OCT';
 return `<div class="jsa-today"><span class="eyebrow">${head}</span>${today?`<div class="setrow" style="border:0;padding:6px 0"><span class="grow"><b>${esc(today.tpl)}</b><small>${esc(today.id)} · ${today.ans}/${today.q} answered · ${esc(today.resp.join(', '))}</small></span>${pill(JS[today.st][0],JS[today.st][1],1)}<button type="button" class="btn btn-ghost btn-sm" data-go="jsas">Open</button></div>`
  :`<b style="display:block;font-size:14px;margin-top:6px">No JSA for today yet</b><div class="subtle" style="font-size:13px;margin:2px 0 12px">Start with a standard safety form you can change to suit this job.</div>${can('edit:jsa')?`<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn btn-sm" data-do="job-jsa" data-id="${j.id}" data-when="today">${ICON('shield')}Start today’s JSA</button><button type="button" class="btn btn-ghost btn-sm" data-do="job-jsa" data-id="${j.id}" data-when="tomorrow">Prepare tomorrow’s JSA now</button></div>`:''}`}<div class="fhelp" style="margin-top:12px">${auto}</div></div>`;
}
function jobDocsBody(j){
 const rows=j.docs.map(d=>{
  const files=d.files>1?' <span class="subtle" style="font-weight:500">\u00b7 '+d.files+' files</span>':'';
  const del=can('edit:job')?'<button type="button" class="rowbtn" data-do="jobdoc-del" data-job="'+j.id+'" data-id="'+d.id+'" aria-label="Delete" title="Delete">'+ICON('trash')+'</button>':'';
  return '<div class="docrow" style="padding:11px 0"><span class="ft">DOC</span><div class="grow"><b>'+esc(d.name)+files+'</b><small>Uploaded '+esc(d.added)+' by '+esc(d.by)+'</small></div><div class="x"><button type="button" class="rowbtn" data-do="jobdoc-view" data-id="'+d.id+'" aria-label="View" title="View">'+ICON('eye')+'</button>'+del+'</div></div>';
 }).join('');
 const add=can('edit:job')?'<div style="margin-top:12px"><button type="button" class="btn btn-ghost btn-sm" data-do="jobdoc-add" data-job="'+j.id+'">'+ICON('plus')+'Add document</button></div>':'';
 return (rows||'<div class="subtle">No documents attached yet</div>')+add;
}
function jobSections(j){
 const fin=canFin(),spentPct=j.est?Math.round((j.spent||0)/j.est*100):0,over=spentPct>100;
 const cs=jobCustomers(j),staff=jobStaff(j.sups),qual=jobStaff(j.qual);
 return [
  acc('job:'+j.id+':fin','card','Financial Information',
   `<div class="kvl"><small>Estimated cost</small><b>${aud(j.est)}</b></div>`
   +(fin?(j.est?`<div class="spentbar"><div class="bar thick"><i style="width:${Math.min(spentPct,100)}%;--c:${over?'var(--bad-dot)':spentPct>=85?'var(--warn-dot)':'var(--brand)'}"></i></div><div class="sb-l"><span class="${over?'bad':''}">${spentPct}% of estimated cost</span><b class="num">${aud(j.spent)} so far</b></div></div>`:'')
    +`<div class="kvl"><small>Sell price</small><b>${aud(j.sell)}</b></div>`+(j.est&&j.sell?`<div class="kvl"><small>Margin</small><b class="${j.sell<j.est?'bad':''}">${aud(j.sell-j.est)} <span class="subtle" style="font-weight:500">(${pctT(pct(j.sell-j.est,j.sell),0)})</span></b></div>`:'')
    :gatedBlock('Cost so far and sell price are hidden')),{open:true,meta:fin?'':'<span class="lockchip">'+ICON('key')+'Owner-only</span>'}),
  acc('job:'+j.id+':basic','doc','Basic Information',kv([['Job name',esc(j.name)],['Job number',j.num?`<span class="mono">${esc(j.num)}</span>`:'<span class="dash">—</span>'],['Description',esc(j.desc||'—')],['Color',`<span class="cswatch" style="--c:${j.c}"></span>${cap(j.cname)}`],['Status',jobPill(j)],['Created',esc(j.created)]]),{open:true}),
  acc('job:'+j.id+':loc','pin','Location',`<div class="two-col">${kv([['Address',esc(j.addr)],['Coordinates',`<span class="mono">${j.lat.toFixed(6)}, ${j.lng.toFixed(6)}</span>`],['Geofence radius',j.geo?j.geo+' m':'Off']])}${geoMap(j)}</div>`,{open:true}),
  acc('job:'+j.id+':cust','building','Customer',(cs.length?cs.map(c=>`<div class="setrow link" data-go="user-management/customers/${c.id}" role="button" tabindex="0"><span class="thumb">${ini(c.name)}</span><span class="grow"><b>${esc(c.name)}</b><small>${esc(c.contact)} · ${esc(c.email)}</small></span>${ICON('next')}</div>`).join(''):'<div class="subtle">No customers assigned</div>')+`<div class="kvl" style="margin-top:12px"><small>Project manager</small><span>${jobPm(j)}</span></div>`,{meta:cs.length?'<span class="tc num">'+cs.length+'</span>':''}),
  acc('job:'+j.id+':sup','users','Supervisors',staff.length?staff.map(e=>`<div class="avrow" style="padding:10px 0">${person(e.name,e.role)}</div>`).join(''):'<div class="subtle">No supervisors assigned</div>',{meta:staff.length?'<span class="tc num">'+staff.length+'</span>':''}),
  acc('job:'+j.id+':qual','users','Qualified Users',qual.length?qual.map(e=>`<div class="avrow" style="padding:10px 0">${person(e.name,'Email: '+e.email)}</div>`).join(''):'<div class="subtle">No qualified users</div>',{meta:qual.length?'<span class="tc num">'+qual.length+'</span>':''}),
  acc('job:'+j.id+':grp','users','Qualified Groups','<div class="subtle">No qualified groups</div>'),
  acc('job:'+j.id+':jsa','shield','JSA — Job Safety Analysis',jobJsa(j),{open:true}),
  acc('job:'+j.id+':docs','file','Documents',jobDocsBody(j),{meta:j.docs.length?'<span class="tc num">'+j.docs.length+'</span>':''})
 ].join('');
}
VIEWS['job-detail']={path:'jobs/:id',parent:'jobs',perm:'view:job',
 title:()=>{const j=jobBy(P.id);return j?j.name:'Job';},sub:()=>{const j=jobBy(P.id);return j?j.code+' · '+j.addr:'';},
 crumbs:()=>{const j=jobBy(P.id);return [['Jobs','jobs'],[j?j.name:'Not found']];},
 act:()=>{const j=jobBy(P.id);if(!j)return '';const keys=jobKeys(j).join(',');
  return `<button type="button" class="btn btn-ghost" data-do="acc-all" data-keys="${keys}">${ICON('sliders')}<span class="lb">${jobKeys(j).every(k=>accIsOpen(k))?'Collapse all':'Expand all'}</span></button>`
   +(can('edit:job')?`<button type="button" class="btn btn-ghost" data-go="jobs/${j.id}/edit">${ICON('edit')}<span class="lb">Edit</span></button>`:'')
   +jobMenuBtn(j).replace('class="rowbtn"','class="iconbtn"');},
 render(){
  const j=jobBy(P.id);if(!j)return notFound('Job','jobs');
  const fin=canFin(),pctUsed=j.est?Math.round((j.spent||0)/j.est*100):null;
  return `<div class="page">
   ${strip('four',[
    {k:'Status',icon:'jobs',tone:j.c,v:`<span style="font-size:22px">${JOBST[j.status][1]}</span>`,d:j.arch?'Archived':'Created '+j.created},
    {k:'On site now',icon:'users',tone:'var(--s3)',v:j.crew,d:j.crew?'people clocked in':'nobody clocked in'},
    {k:'Estimated cost',icon:'receipt',tone:'var(--s6)',v:j.est?short(j.est):'—',d:fin&&j.sell?'Sell price '+short(j.sell):'Sell price hidden'},
    {k:'Budget used',icon:'trend',tone:pctUsed>100?'var(--bad-dot)':pctUsed>=85?'var(--warn-dot)':'var(--brand)',v:fin&&pctUsed!=null?pctUsed+'%':'•••',d:fin?(pctUsed>100?'over budget':'of the estimate'):'Owner-only'}])}
   ${jobSections(j)}</div>`;
 }};
DO['job-edit']=d=>go('jobs/'+d.id+'/edit');
DO['job-archive']=async d=>{
 const j=jobBy(d.id),arch=!j.arch;
 if(!(await dialog({title:arch?`Archive ${j.name}?`:`Unarchive ${j.name}?`,body:arch?'It moves to the Archived list and can’t be rostered. Hours and history are kept. You can unarchive it later.':'It goes back to the Active list and can be rostered again.',okLabel:arch?'Archive':'Unarchive',danger:arch})))return;
 j.arch=arch;j.status=arch?'archived':'active';rerender(true);toast(arch?'Job archived':'Job unarchived',j.name);
};
DO['job-delete']=async d=>{
 const j=jobBy(d.id);
 if(!(await dialog({title:`Delete ${j.name}?`,body:`This permanently removes the job, its shifts and documents. Time already worked stays on timesheets. <b>This can’t be undone.</b> Archive it instead if you may need it again.`,typed:j.code,okLabel:'Delete job',danger:true})))return;
 S.jobs=S.jobs.filter(x=>x!==j);toast('Job deleted',j.name);go('jobs');
};
DO['job-jsa']=d=>{
 const j=jobBy(d.id),n=nextJsaNo(),tpl=S.jsaTpls.find(t=>t.jobs.includes(j.name))||S.jsaTpls.find(t=>t.name===j.jsaTpl)||S.jsaTpls.find(t=>t.def),crew=j.qual.length?j.qual.slice(0,4):[ME.name];
 S.jsas.unshift({tpl:tpl.name,tplId:tpl.id,id:'JSA-'+n,job:j.name,resp:j.sups.length?j.sups.slice(0,1):crew.slice(0,1),crew,approver:tpl.approver||ME.name,shift:d.when==='today'?'Today':'Tomorrow',ans:0,q:tpl.fields.filter(f=>f.type!=='heading').length,haz:0,photos:0,st:'sent'});
 S.jsaAnswers['JSA-'+n]={};rerender(true);toast(d.when==='today'?'JSA sent to the crew':'Tomorrow’s JSA prepared',j.name+' · '+j.jsaTpl);};
function jobDocDrawer(onAdd){
 drawer({title:'Add document',okLabel:'Add document',rules:{file:{always:true,fn:v=>v?'':'Choose at least one file'}},
  body:`<div class="fgrid">${fld({name:'name',label:'Document name',req:true,span:6,ph:'e.g. Site induction pack'})}${drop('file','Files','PDF, JPG or PNG, up to 50 MB each. Add several for one document.',true)}</div>`,
  onOk:d=>{onAdd({id:'jd'+Date.now(),name:d.name,files:Math.max((($('#drawer input[type=file]')||{}).files||[]).length,1),added:'1 Oct 2026',by:ME.name});toast('Document added',d.name);}});
}
DO['jobdoc-add']=d=>{const j=jobBy(d.job);jobDocDrawer(doc=>{j.docs.push(doc);rerender(true);});};
DO['jobdoc-view']=()=>toast('Opening document','The file would open in the viewer');
DO['jobdoc-del']=async d=>{const j=jobBy(d.job),x=j.docs.find(y=>y.id===d.id);if(!(await dialog({title:'Delete document?',body:`<b>${esc(x.name)}</b> will be removed from this job.`,okLabel:'Delete',danger:true})))return;j.docs=j.docs.filter(y=>y!==x);rerender(true);toast('Document deleted',x.name);};

/* ---------- add / edit page: grouped cards in the shipped order ---------- */
const JF={docs:[]};
const staffOpts=()=>S.employees.filter(e=>e.st==='active').map(e=>[e.id,e.name,e.role]);
const idsOf=names=>names.map(n=>(S.employees.find(e=>e.name===n)||{}).id).filter(Boolean);
function jobFormHtml(j){
 const nw=!j,x=j||{name:'',num:'',cname:'red',desc:'',addr:'',lat:-33.8688,lng:151.2093,geo:100,est:0,sell:0,qual:[],sups:[],custIds:[],jsaOn:false,jsaTpl:JSA_TPLS[0],jsaTime:'06:00'};
 const back=nw?'jobs':'jobs/'+j.id,fin=canFin();
 JF.docs=nw?[]:j.docs.slice();
 return `${addrList}<form class="formpage" data-form novalidate onsubmit="return false" id="jobForm" data-id="${nw?'':j.id}">
  ${fsec('Job details',nw?'The basics crews and customers will see':'',
   fld({name:'name',label:'Job name',req:true,value:x.name,span:2,ph:'Enter job name',max:120})+fld({name:'num',label:'Job number',value:x.num,span:2,ph:'Enter job number',max:30})+swatches({name:'cname',value:x.cname,span:2})
   +`<div class="fld s6"><label for="f-desc">Description<span class="req">*</span><button type="button" class="linkbtn mic" data-do="job-mic" aria-pressed="false" title="Dictate">${ICON('phone').replace('<svg','<svg style="width:13px;height:13px"')}Dictate</button></label><textarea id="f-desc" name="desc" rows="3" placeholder="Enter job description" required maxlength="500">${esc(x.desc)}</textarea><div class="ferr" id="e-desc" role="alert"></div></div>`
   +addrFld({name:'address',label:'Address *',value:x.addr}))}
  ${fsec('Location','Pin and geofence. Crews clock in only inside the geofence when it is on.',
   `<div class="s6 locbtns" style="grid-column:span 6;display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end"><button type="button" class="btn btn-ghost btn-sm" data-do="job-here">${ICON('pin')}My current location</button><button type="button" class="btn btn-ghost btn-sm" data-do="job-geocode">${ICON('search')}Get address from coordinates</button></div>`
   +fld({name:'lat',label:'GPS latitude',req:true,value:x.lat,span:3,inputmode:'decimal'})+fld({name:'lng',label:'GPS longitude',req:true,value:x.lng,span:3,inputmode:'decimal'})
   +fld({name:'geo',label:'Geofence radius (meters)',req:true,value:x.geo,span:3,inputmode:'numeric',suffix:'m',help:'0 turns the geofence off.'}))}
  ${fsec('Costs','Estimated cost is visible to everyone who can edit jobs. Sell price needs the owner-only financial permission.',
   fld({name:'est',label:'Estimated cost (AUD)',type:'money',req:true,value:x.est,span:3,inputmode:'decimal'})+fld({name:'sell',label:'Sell price (AUD)',type:'money',req:true,value:fin?x.sell:'',span:3,inputmode:'decimal',disabled:!fin,locked:!fin?'Owner-only':''}))}
  ${fsec('People','Who can work on this job and who runs it',
   msel({name:'qual',label:'Qualified',opts:staffOpts(),value:idsOf(x.qual),ph:'Search and select users…',help:'Only qualified people can be rostered and can clock in.'})
   +msel({name:'sups',label:'Site supervisors',opts:staffOpts(),value:idsOf(x.sups),ph:'Search and select supervisors…'})
   +msel({name:'custIds',label:'Customers',opts:S.customers.filter(c=>c.st==='active').map(c=>[c.id,c.name,c.contact]),value:x.custIds||[],ph:'Search and select customers…',help:'We invite each customer’s company to this job automatically.'})
   +`<div class="s6" style="grid-column:span 6;margin-top:-6px"><button type="button" class="btn btn-ghost btn-sm" data-do="job-newcust">${ICON('plus')}New customer</button></div>`)}
  ${fsec('Daily JSA','Send the crew a safety form every day',
   fld({name:'jsaTpl',label:'JSA template',type:'select',span:6,value:x.jsaTpl,opts:JSA_TPLS,help:'The form this job’s JSAs are made from.'})
   +tgl({name:'jsaOn',label:'Send a JSA to the crew every day',value:x.jsaOn}).replace('data-ftog="jsaOn"','data-ftog="jsaOn" data-fchange="rev"')
   +`<div class="fgrid s6" data-rev="jsaOn"${x.jsaOn?'':' hidden'} style="grid-column:span 6;padding:0">`+fld({name:'jsaTime',label:'Send time',type:'time',value:x.jsaTime||'06:00',span:3,help:'Use a 5-minute step, e.g. 7:00 or 7:05.'})+`</div>`)}
  ${fsec('Documents','Attach plans, permits and site packs',`<div class="s6" style="grid-column:span 6"><div id="jobDocs"></div><button type="button" class="btn btn-ghost btn-sm" data-do="jobform-doc">${ICON('plus')}Add document</button></div>`)}
  <div class="fbar"><span class="hint">${nw?'Nothing saved yet':'No changes yet'}</span><button type="button" class="btn btn-ghost" data-go="${back}">Cancel</button><button type="button" class="btn" data-do="job-save" data-fsave${nw?'':' disabled'}>${ICON('check')}${nw?'Add job':'Update job'}</button></div></form>`;
}
function paintJobDocs(){const el=$('#jobDocs');if(!el)return;el.innerHTML=JF.docs.length?JF.docs.map(d=>`<div class="docrow" style="padding:10px 0"><span class="ft">DOC</span><div class="grow"><b>${esc(d.name)}${d.files>1?` <span class="subtle" style="font-weight:500">· ${d.files} files</span>`:''}</b><small>${esc(d.added)}</small></div><button type="button" class="rowbtn" data-do="jobform-docdel" data-id="${d.id}" aria-label="Remove" title="Remove">${ICON('trash')}</button></div>`).join(''):'<div class="subtle" style="margin-bottom:12px">No documents added yet. Use “Add document” to attach one or more files.</div>';}
const jobFormMount=root=>{mselInit(root);paintJobDocs();};
VIEWS['job-new']={path:'jobs/new',parent:'jobs',perm:'add:job',title:'Add job',sub:'Name it, place it on the map and choose who can work on it.',crumbs:()=>[['Jobs','jobs'],['Add job']],render(){return jobFormHtml(null);},mount:jobFormMount};
VIEWS['job-edit']={path:'jobs/:id/edit',parent:'jobs',perm:'edit:job',title:'Edit job',sub:'Changes apply straight away.',
 crumbs:()=>{const j=jobBy(P.id);return [['Jobs','jobs'],[j?j.name:'Not found','jobs/'+P.id],['Edit']];},
 render(){const j=jobBy(P.id);return j?jobFormHtml(j):notFound('Job','jobs');},mount:jobFormMount};

DO['job-mic']=(d,el)=>{const on=el.getAttribute('aria-pressed')!=='true';el.setAttribute('aria-pressed',on);el.classList.toggle('on',on);toast(on?'Listening…':'Dictation stopped',on?'Prototype: speak and the text would be added to the description.':'');};
DO['job-here']=()=>{const set=(n,v)=>{const el=$('#jobForm [name="'+n+'"]');el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));};set('lat','-33.867487');set('lng','151.206990');toast('Location found','Latitude and longitude filled from this device');};
DO['job-geocode']=()=>{const lat=$('#jobForm [name="lat"]').value,lng=$('#jobForm [name="lng"]').value;if(isNaN(parseFloat(lat))||isNaN(parseFloat(lng))){toastErr('Enter latitude and longitude first','We need both to look up the address.');return;}const a=$('#jobForm [name="address"]');a.value='12 Quay Street, Sydney NSW 2000';a.dispatchEvent(new Event('input',{bubbles:true}));toast('Address found','Address and coordinates updated');};
DO['jobform-doc']=()=>jobDocDrawer(doc=>{JF.docs.push(doc);paintJobDocs();markDirty($('#jobForm'));});
DO['jobform-docdel']=d=>{JF.docs=JF.docs.filter(x=>x.id!==d.id);paintJobDocs();markDirty($('#jobForm'));};
DO['job-newcust']=()=>drawer({title:'New customer',sub:'Quick add. You can fill in the rest later.',okLabel:'Add customer',
 rules:{abn:v=>abnOk(v)?'':'ABN must be 11 digits',email:v=>emailOk(v)?'':'Enter a valid email address',phone:(v,a)=>phoneValid(v,a.phone_cc)?'':'Enter a valid mobile number'},
 body:`<div class="fgrid">${fld({name:'abn',label:'ABN number',req:true,span:6,inputmode:'numeric',help:'The ABN is checked automatically.'})}${fld({name:'first',label:'First name',req:true})}${fld({name:'last',label:'Last name',req:true})}${fld({name:'name',label:'Company name',req:true,span:6})}${fld({name:'email',label:'Email',type:'email',req:true,span:6,help:'We’ll email an invitation to this address.'})}${fld({name:'phone',label:'Mobile',type:'phone',req:true,span:6})}</div>`,
 onOk:d=>{
  if(S.customers.some(c=>abnDigits(c.abn)===abnDigits(d.abn))){toastErr('Already your customer','A customer with this ABN exists. Pick them from the list.');return false;}
  const n={id:slug(d.name),name:d.name,abn:abnFmt(d.abn),first:d.first,last:d.last,contact:d.first+' '+d.last,title:'Main contact',email:d.email,phone:d.phone_cc+' '+d.phone.replace(/^0/,''),address:'',jobs:0,ytd:0,st:'active',notes:[],collab:{state:'none'},since:'2026',others:[]};
  S.customers.push(n);
  const box=$('[data-msel="custIds"]');if(box){MSEL.custIds.opts.push([n.id,n.name,n.contact]);mselSet(box,[...mselIds(box),n.id]);}
  toast('Customer added',n.name+' · invitation emailed');
 }});

DO['job-save']=()=>{
 const root=$('#jobForm'),id=root.dataset.id,j=id?jobBy(id):null,fin=canFin();
 const d=validate(root,{
  address:(v,a)=>'' ,
  num:v=>S.jobs.some(x=>x.num&&x.num.toLowerCase()===v.toLowerCase()&&x!==j)?'A job with this number already exists':'',
  lat:v=>isNaN(parseFloat(v))||Math.abs(parseFloat(v))>90?'Latitude must be between -90 and 90':'',
  lng:v=>isNaN(parseFloat(v))||Math.abs(parseFloat(v))>180?'Longitude must be between -180 and 180':'',
  geo:v=>!/^\d+$/.test(v)||+v>5000?'Enter a whole number of metres, 0 to 5000':'',
  est:v=>isNaN(Number(v))||Number(v)<0?'Enter an amount of $0 or more':'',
  sell:v=>fin&&(isNaN(Number(v))||Number(v)<0)?'Enter an amount of $0 or more':''
 });
 if(!d)return toastErr('Can’t save yet','Fix the highlighted fields and try again.');
 const addr=addrValue(d);
 if(!addr){const f=$('#f-address').closest('.fld');f.classList.add('err');toastErr('Address is required','Search for an address or enter it manually.');$('#f-address').focus();return;}
 if(d.jsaOn==='1'){const m=(d.jsaTime||'').split(':');if(!d.jsaTime){toastErr('Pick a send time','Choose a time for the daily JSA.');return;}if(+m[1]%5){toastErr('Use a 5-minute step','For example 7:00 or 7:05.');return;}}
 const names=ids=>(ids?ids.split(','):[]).map(i=>(empBy(i)||{}).name).filter(Boolean);
 const custIds=d.custIds?d.custIds.split(','):[];
 const f={name:d.name,num:d.num,cname:d.cname,c:JC[d.cname],desc:d.desc,addr,lat:parseFloat(d.lat),lng:parseFloat(d.lng),geo:+d.geo,est:Number(d.est),qual:names(d.qual),sups:names(d.sups),custIds,cust:custIds.length?custBy(custIds[0]).name:'Internal',jsaOn:d.jsaOn==='1',jsaTpl:d.jsaTpl,jsaTime:d.jsaOn==='1'?d.jsaTime:'',docs:JF.docs.slice()};
 if(fin)f.sell=Number(d.sell);
 GUARD.dirty=false;
 if(j){Object.assign(j,f);if(j.est)j.spent=Math.round(j.est*(j.pct||0)/100);toast('Job updated',j.name);go('jobs/'+j.id);}
 else{
  const n=Math.max(...S.jobs.map(x=>+x.code.slice(4)))+1,nj={...f,code:'JOB-'+n,id:'job-'+n,status:'active',arch:false,crew:0,pct:0,spent:0,created:'1 Oct 2026',pt:[300,200],groups:[],sell:fin?f.sell:null};
  S.jobs.unshift(nj);toast('Job added',nj.name+(custIds.length?' · invitation sent to the customer’s company':''));go('jobs/'+nj.id);
 }
};
