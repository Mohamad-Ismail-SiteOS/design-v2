/* =====================================================================
   Customers: list actions, detail page, add/edit page.
   Lives under User management > Customers.
   Field order and behaviour follow the shipped New customer form:
   ABN first (checked automatically), first name, last name, company name,
   email (they get an invite), mobile, address.
   Detail tabs follow the shipped page: Overview, Collaboration, Activity, Note.
   ===================================================================== */
const finJob=()=>can('view:job:financials');
const custPill=c=>c.st==='active'?pill('ok','Active',1):pill('neutral','Archived',1);
const CS={accepted:['ok','Accepted'],pending:['warn','Invitation sent'],none:['neutral','Not shared']};
const abnDigits=v=>String(v||'').replace(/\D/g,'');
const abnOk=v=>/^\d{11}$/.test(abnDigits(v));
const abnFmt=v=>{const d=abnDigits(v);return d.length===11?d.replace(/(\d{2})(\d{3})(\d{3})(\d{3})/,'$1 $2 $3 $4'):v;};
/* demo lookups: the public ABN register, and companies that already exist on SiteOS under someone else */
const ABN_REG={'51824753556':'Harbourline Plumbing Pty Ltd','34999111222':'Coastline Paving Pty Ltd'};
const ABN_SITEOS={'29443120118':{name:'Ridgeview Developments Pty Ltd',first:'Dana',last:'Cho',email:'dana@ridgeview.example',phone:'+61 4 1200 3344',address:'8 Ridge Rd, Castle Hill NSW 2154'}};

UMT.customers.sub='Clients you run jobs for, with contacts and billing.';
UMT.customers.act=()=>can('add:customer')?`<button type="button" class="btn" data-go="user-management/customers/new">${ICON('plus')}<span class="lb">Add customer</span></button>`:'';

const custJobs=c=>S.jobs.filter(j=>j.cust===c.name);
const custTabs=c=>[{k:'overview',l:'Overview'},{k:'collab',l:'Collaboration',n:custJobs(c).filter(j=>!j.arch).length},{k:'activity',l:'Activity'},{k:'notes',l:'Note',n:(c.notes||[]).length}];

function custHero(c){
 const jobs=custJobs(c),active=jobs.filter(j=>!j.arch).length;
 return hero({sq:true,ini:ini(c.name),title:c.name,pills:[custPill(c),`<span class="rego">ABN ${esc(c.abn)}</span>`],sub:esc(c.contact)+' · '+esc(c.email),
  meta:[['phone',esc(c.phone)],['pin',esc(c.address)]],
  actions:(can('edit:customer')?`<button type="button" class="btn btn-ghost" data-go="user-management/customers/${c.id}/edit">${ICON('edit')}<span class="lb">Edit</span></button>`:'')+(can('archive:customer')?`<button type="button" class="btn btn-danger" data-do="cust-archive" data-id="${c.id}">${ICON('archive')}<span class="lb">${c.st==='archived'?'Reactivate':'Archive'}</span></button>`:''),
  foot:`<div><b class="num">${active}</b>active jobs</div><div><b class="num">${jobs.length}</b>jobs in total</div><div><b class="num">${finJob()?short(c.ytd):'•••'}</b>billed this year</div>`});
}
function custOverview(c){
 const edit=can('edit:customer')?`<button type="button" class="btn btn-ghost btn-sm" data-go="user-management/customers/${c.id}/edit">${ICON('edit')}Edit</button>`:'';
 const js=custJobs(c);
 return `<div class="two"><div class="g">
  ${card({title:'Profile',meta:edit,body:`<div style="margin-bottom:12px">${custPill(c)}</div>`+kv([['First name',esc(c.first)],['Last name',esc(c.last)],['Company name',esc(c.name)],['ABN number',`<span class="mono">${esc(c.abn)}</span>`]])})}
  ${card({title:'Contact',body:kv([['Email',`<a href="mailto:${esc(c.email)}" style="color:var(--brand)">${esc(c.email)}</a>`],['Mobile',esc(c.phone)],['Address',esc(c.address)]])})}</div>
  <div class="g">${card({title:'Jobs',sub:js.length?js.length+' for this customer':'',body:js.length?js.map(j=>`<div class="setrow"><span class="grow"><b>${esc(j.name)}</b><small>${esc(j.code)}${finJob()&&j.sell?' · '+money(j.sell):''}</small></span>${j.arch?pill('neutral','Archived'):pill('ok','Active')}</div>`).join(''):'<div class="subtle">No jobs yet. Jobs you create for this customer appear here.</div>'})}
  ${card({title:'Billing',body:finJob()?figs([{k:'Billed this year',v:'$'+N(c.ytd)},{k:'Jobs',v:js.length}]):gatedBlock('Billing is hidden')})}</div></div>`;
}
function custCollab(c){
 const js=custJobs(c).filter(j=>!j.arch),st=CS[c.collab.state]||CS.none;
 return `<section class="qv-card"><div class="qv-hd"><div class="grow"><h3>Jobs shared with this customer</h3><div class="s">Jobs created for this customer are shared with their company. Once the customer accepts a job, invite the people who will work on it. They join the customer’s company, never yours.</div></div></div><div class="qv-body">
  ${js.length?js.map(j=>`<div class="setrow"><span class="grow"><b>${esc(j.name)}</b><small>${esc(j.code)} · ${c.collab.state==='accepted'?'Customer accepted. You can invite their people.':'Invitation sent to '+esc(c.email)}</small></span>${pill(st[0],st[1])}${c.collab.state==='pending'&&can('edit:customer')?`<button type="button" class="btn btn-ghost btn-sm" data-toast="Invitation resent|${esc(c.email)}">Resend</button>`:''}${c.collab.state==='accepted'&&can('edit:customer')?`<button type="button" class="btn btn-sm" data-do="collab-people" data-id="${c.id}" data-job="${esc(j.code)}">${ICON('plus')}Invite people</button>`:''}</div>`).join(''):`<div class="empty"><b>No jobs shared with this customer yet</b>Create a job for this customer and an invitation is sent to their company automatically.</div>`}
  </div></section>`;
}
function custNotes(c){
 c.notes=c.notes||[];
 return `<section class="qv-card"><div class="qv-hd"><div class="grow"><h3>Notes</h3><div class="s">Internal. The customer can’t see these.</div></div><div class="meta">${can('edit:customer')?`<button type="button" class="btn btn-sm" data-do="note-new" data-id="${c.id}">${ICON('plus')}Add note</button>`:''}</div></div>
  <div class="qv-body" style="padding-top:4px">${c.notes.length?c.notes.map(n=>noteRow(n,can('edit:customer'))).join(''):'<div class="empty"><b>No notes yet</b>Notes you add show up here, newest first.</div>'}</div></section>`;
}
function custActivity(c){
 return `<section class="qv-card"><div class="qv-hd"><div class="grow"><h3>Activity</h3><div class="s">Audit history for this customer</div></div></div><div class="qv-body">${timeline([
  tlItem('edit','Contact updated','Mobile changed by Hamish Reid','20 Aug 2026'),
  tlItem('building','Job added',esc((custJobs(c)[0]||{name:'First job'}).name),'12 Aug 2026','brand'),
  tlItem('send','Invitation sent',esc(c.email),'3 Mar 2026'),
  tlItem('user','Customer created','By Alex Morgan',c.since)])}</div></section>`;
}
VIEWS['customer-detail']={path:'user-management/customers/:id',parent:'um',perm:'view:customer',title:'Customer',sub:'Profile, collaboration and notes.',
 crumbs:()=>{const c=custBy(P.id);return umCrumbs('customers','Customers',c?c.name:'Not found');},
 render(){
  const c=custBy(P.id);if(!c)return notFound('Customer','user-management/customers');
  const tabs=custTabs(c),k=curTab(tabs);
  return `<div class="page">${custHero(c)}${ptabs(tabs)}${{overview:custOverview,collab:custCollab,activity:custActivity,notes:custNotes}[k](c)}</div>`;
 }};

/* ---------- add / edit page: same layout and bar as Add employee ---------- */
function custFormHtml(c){
 const nw=!c,x=c||{abn:'',name:'',first:'',last:'',email:'',phone:'',address:''};
 const back=nw?'user-management/customers':'user-management/customers/'+c.id;
 return `${addrList}<form class="formpage" data-form novalidate onsubmit="return false" id="custForm" data-id="${nw?'':c.id}">
  ${fsec('Company',nw?'Enter the ABN first. We check it for you.':'The business this customer runs jobs for',
   fld({name:'abn',label:'ABN number',req:true,value:x.abn,span:6,inputmode:'numeric',ph:'11 digits',help:'The ABN is checked automatically. If a company with this ABN already exists, you can link it as your customer instead of creating a duplicate.'})
   +`<div class="s6" id="abnNote" style="grid-column:span 6" aria-live="polite"></div>`
   +fld({name:'name',label:'Company name',req:true,value:x.name,span:6}))}
  ${fsec('Main contact',nw?'We email them an invitation to set their own password.':'Who we deal with',
   fld({name:'first',label:'First name',req:true,value:x.first,autocomplete:'off'})+fld({name:'last',label:'Last name',req:true,value:x.last})
   +fld({name:'email',label:'Email',type:'email',req:true,value:x.email,span:3,ph:'name@company.com',help:nw?'We’ll email an invitation to this address. The customer sets their own password from that link.':'Changing it sends them a new invitation.'})
   +fld({name:'phone',label:'Mobile',type:'phone',req:true,value:x.phone,span:3}))}
  ${fsec('Address','Optional',addrFld({name:'address',value:x.address}))}
  <div class="fbar"><span class="hint">${nw?'Nothing saved yet':'No changes yet'}</span><button type="button" class="btn btn-ghost" data-go="${back}">Cancel</button><button type="button" class="btn" data-do="cust-save" data-fsave${nw?'':' disabled'}>${ICON('check')}${nw?'Create':'Save changes'}</button></div></form>`;
}
VIEWS['customer-new']={path:'user-management/customers/new',parent:'um',perm:'add:customer',title:'New customer',sub:'Add a client you run jobs for.',
 crumbs:()=>umCrumbs('customers','Customers','New customer'),render(){return custFormHtml(null);}};
VIEWS['customer-edit']={path:'user-management/customers/:id/edit',parent:'um',perm:'edit:customer',title:'Edit customer',sub:'Changes apply straight away.',
 crumbs:()=>{const c=custBy(P.id);return [['User management','user-management/customers'],['Customers','user-management/customers'],[c?c.name:'Not found','user-management/customers/'+P.id],['Edit']];},
 render(){const c=custBy(P.id);return c?custFormHtml(c):notFound('Customer','user-management/customers');}};

/* ABN check: runs as soon as 11 digits are typed */
function abnCheck(){
 const f=$('#custForm'),note=$('#abnNote');if(!f||!note)return;
 const d=abnDigits($('#f-abn',f).value),self=f.dataset.id;note.innerHTML='';
 if(d.length!==11)return;
 const mine=S.customers.find(c=>abnDigits(c.abn)===d&&c.id!==self);
 const banner=(k,html)=>note.innerHTML=`<div class="banner ${k}">${html}</div>`;
 if(mine&&mine.st==='active')return banner('warn',`${ICON('alert')}<span><b>${esc(mine.name)}</b> is already your customer.</span><button type="button" class="btn btn-ghost btn-sm" data-go="user-management/customers/${mine.id}">Open</button>`);
 if(mine)return banner('warn',`${ICON('archive')}<span><b>${esc(mine.name)}</b> was archived. Reactivate them instead of creating a duplicate.</span><button type="button" class="btn btn-sm" data-do="cust-react" data-id="${mine.id}">Reactivate</button>`);
 const so=ABN_SITEOS[d];
 if(so)return banner('info',`${ICON('shield')}<span>A company with this ABN already exists on SiteOS: <b>${esc(so.name)}</b>. Link it as your customer instead of creating a duplicate.</span><button type="button" class="btn btn-sm" data-do="cust-link" data-abn="${d}">Link as customer</button>`);
 if(ABN_REG[d])return banner('ok',`${ICON('checkc')}<span>Found on the ABN register: <b>${esc(ABN_REG[d])}</b></span><button type="button" class="btn btn-ghost btn-sm" data-do="abn-use" data-abn="${d}">Use this name</button>`);
}
document.addEventListener('input',e=>{if(e.target.id==='f-abn'&&e.target.closest('#custForm'))abnCheck();});
DO['abn-use']=d=>{const n=$('#f-name');n.value=ABN_REG[d.abn];n.dispatchEvent(new Event('input',{bubbles:true}));toast('Company name filled',ABN_REG[d.abn]);};
DO['cust-react']=d=>{const c=custBy(d.id);c.st='active';GUARD.dirty=false;toast('Customer reactivated','Their existing details were kept.');go('user-management/customers/'+c.id);};
DO['cust-link']=d=>{const so=ABN_SITEOS[d.abn];
 const n={id:slug(so.name),name:so.name,abn:abnFmt(d.abn),first:so.first,last:so.last,contact:so.first+' '+so.last,title:'Main contact',email:so.email,phone:so.phone,address:so.address,jobs:0,ytd:0,st:'active',notes:[],collab:{state:'none'},since:'2026',linked:true};
 S.customers.push(n);GUARD.dirty=false;toast('Customer linked','Their existing company details were kept. No invitation was needed.');go('user-management/customers/'+n.id);};
DO['cust-save']=()=>{
 const root=$('#custForm'),id=root.dataset.id,c=id?custBy(id):null;
 const d=validate(root,{
  abn:v=>abnOk(v)?(S.customers.find(x=>abnDigits(x.abn)===abnDigits(v)&&x!==c)?'This ABN is already used by one of your customers':''):'ABN must be 11 digits',
  email:v=>emailOk(v)?'':'Enter a valid email address',
  phone:(v,a)=>phoneValid(v,a.phone_cc)?'':'Enter a valid mobile number'
 });
 if(!d)return toastErr('Can’t save yet','Fix the highlighted fields and try again.');
 const patch={name:d.name,abn:abnFmt(d.abn),first:d.first,last:d.last,contact:d.first+' '+d.last,email:d.email,phone:d.phone_cc+' '+d.phone.replace(/^0/,''),address:addrValue(d)};
 GUARD.dirty=false;
 if(c){const mailChanged=c.email.toLowerCase()!==d.email.toLowerCase();Object.assign(c,patch);toast('Customer updated',c.name+(mailChanged?' · new invitation sent':''));go('user-management/customers/'+c.id);}
 else{const n={...patch,id:slug(d.name),title:'Main contact',jobs:0,ytd:0,st:'active',notes:[],collab:{state:'none'},since:'2026'};S.customers.push(n);toast('Customer created','An invitation to set a password has been emailed.');go('user-management/customers/'+n.id);}
};
DO['cust-archive']=async d=>{
 const c=custBy(d.id),arch=c.st!=='archived',n=custJobs(c).filter(j=>!j.arch).length;
 if(!(await dialog({title:arch?`Archive ${c.name}?`:`Reactivate ${c.name}?`,body:arch?`They move to the Archived tab and can’t be picked for new jobs.${n?` <b>${n} active job${n>1?'s':''}</b> keep running.`:''} Their history is kept.`:'They will appear in the Active tab and can be picked for jobs again.',okLabel:arch?'Archive':'Reactivate',danger:arch})))return;
 c.st=arch?'archived':'active';rerender(true);toast(arch?'Customer archived':'Customer reactivated',c.name);
};
DO['collab-people']=d=>{const c=custBy(d.id);drawer({title:'Invite people to '+d.job,sub:'They join '+c.name+'’s company, never yours.',okLabel:'Send invites',rules:{emails:v=>v.split(/[,\s]+/).filter(Boolean).every(emailOk)?'':'Enter valid email addresses, separated by commas'},
 body:`<div class="fgrid">${fld({name:'emails',label:'Email addresses',type:'textarea',req:true,span:6,rows:3,ph:'name@company.com, name2@company.com',help:'Each person gets a link to join this job.'})}</div>`,
 onOk:v=>toast('Invitations sent',v.emails.split(/[,\s]+/).filter(Boolean).length+' people invited to '+d.job)});};
