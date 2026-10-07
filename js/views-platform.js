/* =====================================================================
   Companies (owner), the company switcher, and the Audit log.
   - Companies: list, Add company (the same sections as the edit form, minus the
     ones that need an existing company), delete with type-to-confirm
   - Audit log: Object ID, Actor, Type, Source (Active / Archive), From / To, then
     Object ID, Class Name, Actor, Event Name, Property Name, Old / New Value
   ===================================================================== */
const cmpOf=id=>S.companies.find(c=>c.id===+id);
/* Multi-company is not part of SiteOS yet: one account is one company, no switcher in the sidebar, no "All companies" button.
   The shipped portal only has /companies for SiteOS platform staff. These two pages are kept in this file as a dormant design; the routes are removed below while MULTI_COMPANY is false,
   so #/companies and #/companies/new are unknown addresses (Page not found). The full working version lives on the git branch multi-company. */
const MULTI_COMPANY=false;
const onlyOwner=(v,what)=>`<div class="page"><section class="qv-card">${emptyBlock('key','Only the owner can '+what,'Ask the account owner to do this, or to grant you access from Roles.',`<button type="button" class="btn btn-ghost" data-go="company">Back to My Company</button>`)}</section></div>`;

/* ---------- Companies ---------- */
VIEWS.companies={path:'companies',parent:'company',perm:'view:company',title:'Companies',sub:'Every company you run. Switch between them from the sidebar.',crumbs:()=>[['My Company','company'],['Companies']],
 act:()=>isOwnerAcct()?`<button type="button" class="btn" data-go="companies/new">${ICON('plus')}<span class="lb">Add company</span></button>`:'',
 render(){
  if(!isOwnerAcct())return onlyOwner(null,'manage companies');
  const rows=S.companies;
  return `<div class="page"><section class="qv-card"><div class="qv-hd"><div class="grow"><h3>${rows.length} companies</h3><div class="s">You own all of these. The current one is the one you are signed in to.</div></div></div>
   <div class="tblwrap"><table class="tbl" style="min-width:860px"><thead><tr><th>Company</th><th>Owner</th><th>Status</th><th class="r">Employees</th><th class="r">Jobs</th><th class="r">Customers</th><th>KYC</th><th>Created</th><th class="act"></th></tr></thead><tbody>${rows.map(c=>{
    const cur_=c.id===S.currentCompanyId;
    return `<tr${cur_?' class="link" data-href="company"':''}><td><div class="cell"><span class="av sq" style="border-radius:10px">${esc(ini(c.name))}</span><span class="tx"><b>${esc(c.name)}${cur_?' '+pill('info','Current'):''}</b><small class="mono">${esc(c.code)}</small></span></div></td><td>${esc(c.owner)}</td><td>${pill(c.status==='active'?'ok':'neutral',cap(c.status),1)}</td><td class="r num">${c.employees}</td><td class="r num">${c.jobs}</td><td class="r num">${c.customers}</td><td>${pill(c.kyc==='verified'?'ok':'warn',cap(c.kyc),1)}</td><td>${esc(dateOnly(c.created))}</td>
     <td><div class="acts">${cur_?`<button type="button" class="btn btn-sm btn-ghost" data-go="company">Open</button>`:`<button type="button" class="btn btn-sm btn-ghost" data-do="cmp-switch" data-id="${c.id}">Switch</button>`}<button type="button" class="rowbtn" data-do="row-menu" data-kind="cmp" data-id="${c.id}" data-items="${cur_?'edit:Edit company|':''}del:Delete:danger" aria-label="More actions" aria-haspopup="menu">${ICON('more')}</button></div></td></tr>`;}).join('')}</tbody></table></div></section></div>`;
 }};
const switchNote=c=>dialog({title:'Switch to '+c.name+'?',body:`The portal would reload with <b>${esc(c.name)}</b>’s people, jobs and settings. This prototype only holds data for Northline Civil, so the switch is not simulated.`,okLabel:'Got it',keep:'Close'});
DO['cmp-switch']=d=>{switchNote(cmpOf(d.id));};
DO['cmp-edit']=()=>go('company/edit');
DO['cmp-del']=async d=>{
 const c=cmpOf(d.id);
 if(c.id===S.currentCompanyId){toastErr('You can’t delete the company you are signed in to','Switch to another company first, then delete this one.');return;}
 if(!(await dialog({title:'Delete Company',body:`<b>${esc(c.name)}</b> and everything in it (${c.employees} employees, ${c.jobs} jobs) is removed. This can’t be undone.`,typed:c.name,okLabel:'Delete company',danger:true})))return;
 S.companies=S.companies.filter(x=>x!==c);rerender(true);toast('Company deleted successfully',c.name);
};
DO['switch-company']=()=>{
 drawer({title:'Switch company',sub:'Companies you belong to',okLabel:null,
  body:`<div class="cmplist">${S.companies.filter(c=>c.status==='active'||c.id===S.currentCompanyId).map(c=>`<button type="button" class="cmpitem${c.id===S.currentCompanyId?' on':''}" data-do="cmp-pick" data-id="${c.id}"><span class="av sq" style="border-radius:10px">${esc(ini(c.name))}</span><span class="tx"><b>${esc(c.name)}</b><small>${esc(c.code)} · ${c.employees} employees</small></span>${c.id===S.currentCompanyId?pill('info','Current'):ICON('next')}</button>`).join('')}</div>${isOwnerAcct()?`<div style="margin-top:14px"><button type="button" class="btn btn-ghost" data-do="cmp-manage">${ICON('company')}Manage companies</button></div>`:''}`});
};
DO['cmp-pick']=async d=>{const c=cmpOf(d.id);if(c.id===S.currentCompanyId){closeDrawer(true);return;}await closeDrawer(true);switchNote(c);};
DO['cmp-manage']=async()=>{await closeDrawer(true);go('companies');};

/* add company: the edit form's first five sections, blank */
const BLANK_CO=()=>({name:'',legalName:'',abn:'',phone:'',email:ME.name?'':'',address:'',website:'',logo:'',language:'en',timezone:'Australia/Sydney',currency:'AUD',startOfWeek:'monday',timeFormat:'24h',dateFormat:'DD/MM/YYYY',lengthFormat:'meter',loginSession:'one_day',overhead:'',shiftHours:8,approvalRequired:false,allowOvertime:false,multiLanguage:false,blockExpiredTT:false,minDaysTT:0,rounding:{in:{on:false,mins:15,dir:'down'},out:{on:false,mins:15,dir:'down'}},geofence:false});
VIEWS['company-new']={path:'companies/new',parent:'company',perm:'view:company',title:'Add company',sub:'A company is its own workspace. Rules, journeys and notifications are set up after it exists.',crumbs:()=>[['My Company','company'],['Companies','companies'],['Add company']],
 render(){
  if(!isOwnerAcct())return onlyOwner(null,'add companies');
  const c=BLANK_CO();
  return `<div class="page formpage" id="coPage" style="max-width:1040px"><form data-form novalidate onsubmit="return false" id="coMain" style="display:grid;gap:16px">${coBasicHtml(c,true)}${coSettingsHtml(c)}</form>
   <div class="fbar"><span class="hint">Nothing saved yet</span><button type="button" class="btn btn-ghost" data-go="companies">Cancel</button><button type="button" class="btn" data-do="co-create" data-fsave>${ICON('check')}Create Company</button></div></div>`;
 },
 mount(){coLogoPaint('');}};
DO['co-create']=()=>{
 const f=$('#coMain'),d=coCheck(f);if(!d)return coFail($('#coPage'),f);
 if(S.companies.some(c=>c.name.toLowerCase()===d.name.trim().toLowerCase())){const el=$('[name="name"]',f);el.closest('.fld').classList.add('err');$('#e-name',f).textContent='You already have a company with this name';$$('.acc',$('#coPage')).forEach(s=>{if($('.fld.err',s))s.classList.add('open');});return toastErr('Can’t save yet','Company names must be unique.');}
 const name=d.name.trim(),id=Math.max(...S.companies.map(c=>c.id))+1;
 S.companies.push({id,name,code:name.split(/\s+/).map(w=>w[0]).join('').slice(0,3).toUpperCase(),owner:ME.name,status:'active',employees:0,jobs:0,customers:0,created:TODAY_ISO,kyc:'pending'});
 GUARD.dirty=false;toast('Company created successfully',name);go('companies');
};

/* ---------- Audit log ---------- */
const AU={f:{objectId:'',actor:'',cls:'',source:'Active',from:'2026-09-01',to:'2026-10-31'},page:1,limit:25};
const auRows=()=>{const f=AU.f;return S.auditLogs.filter(r=>(f.source==='Archive')===r.archive&&(!f.objectId||r.objectId.includes(f.objectId))&&(!f.actor||r.actor.toLowerCase().includes(f.actor.toLowerCase()))&&(!f.cls||r.className===f.cls)&&(!f.from||r.date>=f.from)&&(!f.to||r.date<=f.to)).sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);};
const SIX=()=>addDays(TODAY_ISO,-183);
const EVT={Created:'ok',Updated:'info',Deleted:'bad'};
VIEWS['audit-log']={path:'audit-log',parent:'company',perm:'view:audit:logs',title:'Audit logs',sub:'Who changed what, and when. Active covers the last 6 months; older changes are in the archive.',crumbs:()=>[['My Company','company'],['Audit logs']],
 render(){
  const f=AU.f,rows=auRows(),n=rows.length,pages=Math.max(1,Math.ceil(n/AU.limit));if(AU.page>pages)AU.page=pages;
  const from=n?(AU.page-1)*AU.limit:0,part=rows.slice(from,from+AU.limit);
  return `<div class="page"><section class="qv-card"><form class="qv-body fgrid" novalidate onsubmit="return false" id="auForm">${fld({name:'objectId',label:'Object ID',span:2,value:f.objectId,max:38})}${fld({name:'actor',label:'Actor',span:2,value:f.actor,max:38})}${fld({name:'cls',label:'Type',type:'select',span:2,value:f.cls,opts:[['','All'],...AU_CLASSES]})}${fld({name:'source',label:'Source',type:'select',span:2,value:f.source,opts:['Active','Archive']})}
   ${fld({name:'from',label:'From',type:'date',span:2,value:f.from})}${fld({name:'to',label:'To',type:'date',span:2,value:f.to})}<div class="fld s2" style="align-self:end"><button type="button" class="btn" style="width:100%" data-do="au-filter">${ICON('search')}Filter</button></div></form></section>
  <section class="qv-card"><div class="qv-hd"><div class="grow"><h3>${n} change${n===1?'':'s'}</h3><div class="s">${esc(f.source)} · ${esc(dateOnly(f.from))} to ${esc(dateOnly(f.to))}</div></div><div class="meta"><label class="subtle" style="font-size:12.5px">Rows per page <select class="selc" data-aulimit aria-label="Rows per page">${[10,25,50].map(x=>`<option${x===AU.limit?' selected':''}>${x}</option>`).join('')}</select></label></div></div>
   ${n?`<div class="tblwrap"><table class="tbl" style="min-width:980px"><thead><tr><th>Date</th><th>Object ID</th><th>Class Name</th><th>Actor</th><th>Event Name</th><th>Property Name</th><th>Old Value</th><th>New Value</th></tr></thead><tbody>${part.map(r=>`<tr><td>${esc(dateOnly(r.date))}</td><td class="mono" style="font-size:12px">${esc(r.objectId)}</td><td class="strong">${esc(r.className)}</td><td>${esc(r.actor)}</td><td>${pill(EVT[r.event],r.event)}</td><td class="mono" style="font-size:12px">${esc(r.prop||'—')}</td><td class="aucell" title="${esc(r.old)}">${esc(r.old||'—')}</td><td class="aucell" title="${esc(r.new)}">${esc(r.new||'—')}</td></tr>`).join('')}</tbody></table></div>
   <div class="tblfoot"><span class="cnt num">Showing ${from+1}–${from+part.length} of ${n}</span><span class="grow"></span><button type="button" class="btn btn-ghost btn-sm" data-do="au-page" data-p="${AU.page-1}"${AU.page<=1?' disabled':''}>Previous</button><span class="num" style="font-size:12.5px">Page ${AU.page} of ${pages}</span><button type="button" class="btn btn-ghost btn-sm" data-do="au-page" data-p="${AU.page+1}"${AU.page>=pages?' disabled':''}>Next</button></div>`:emptyBlock('history','No changes match','Try a wider date range or clear the filters.')}</section></div>`;
 }};
DO['au-filter']=()=>{
 const root=$('#auForm'),d=validate(root,{
  from:{always:true,fn:(x,a)=>!x?'Choose a start date':a.source==='Active'&&x<SIX()?'Active logs only go back 6 months. Use the archive for older changes.':''},
  to:{always:true,fn:(x,a)=>!x?'Choose an end date':x<a.from?'To must be on or after From':a.source==='Archive'&&x>SIX()?'The archive holds changes older than 6 months':''}});
 if(!d)return;
 AU.f={objectId:d.objectId,actor:d.actor,cls:d.cls,source:d.source,from:d.from,to:d.to};AU.page=1;rerender(true);
};
DO['au-page']=d=>{AU.page=+d.p;rerender(true);scrollTo(0,0);};
document.addEventListener('change',e=>{const s=e.target.closest('[data-aulimit]');if(s){AU.limit=+s.value;AU.page=1;rerender(true);}});
if(!MULTI_COMPANY){delete VIEWS.companies;delete VIEWS['company-new'];}
