/* =====================================================================
   Employees: list actions, detail page, add/edit form, drawers.
   Lives under User management > Employees.
   ===================================================================== */
const EMP_BASES=['Full time','Part time','Casual','Contractor','Apprentice','Full time salaried','Owner'];
const DOC_TYPES=['Licence','Ticket','Certificate','Contract','Other'];
const VIS={everyone:'Everyone','owner+admin':'Owner + Admin',me:'Only me'};
const fin=()=>can('view:employee:financials');
const roleHas=(rid,k)=>{const r=roleOf(rid);return !!r&&r.perms.includes(k);};
const isAdminish=()=>ME.bypass||ME.roleId==='admin';
/* only the owner can manage a superuser (edit, set password, archive, change type) */
const mayManage=e=>e.acct!=='SUPERUSER'||isOwnerAcct();
const effHas=(e,k)=>e.ovr&&k in e.ovr?e.ovr[k]:roleHas(e.roleId,k);
const empPill=e=>e.st==='active'?pill('ok','Active',1):e.st==='invited'?pill('info','Invite sent',1):pill('neutral','Archived',1);
const seeded=n=>{let h=0;for(const c of n)h=(h*31+c.charCodeAt(0))>>>0;return h;};
const money2=v=>v==null||v===''?'<span class="dash">—</span>':'$'+Number(v).toFixed(2);
const docPill=d=>d.days==null?pill('neutral','No expiry'):d.days<0?pill('bad','Expired',1):d.days<=30?pill('warn','Expires in '+d.days+' days',1):pill('ok','Valid to '+d.exp,1);
const ownDoc=(d,e)=>ME.name===e.name;
const docShown=(d,e)=>d.vis==='everyone'||ownDoc(d,e)||(d.vis==='owner+admin'&&isAdminish());
const phoneOk=v=>/^(\+?61|0)4\d{2}\s?\d{3}\s?\d{3}$/.test(v.replace(/[^\d+\s]/g,''));
const emailOk=v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

UMT.employees.sub='Everyone who works shifts, with roles, contacts and documents.';
UMT.employees.act=()=>`<button type="button" class="btn btn-ghost" data-do="emp-import">${ICON('upload')}<span class="lb">Import CSV</span></button>`+(can('add:employee')?`<button type="button" class="btn" data-go="user-management/employees/new">${ICON('plus')}<span class="lb">Add employee</span></button>`:'');

/* ---------- detail page ---------- */
/* tab names and order follow the shipped employee page (Overview, Work Rules, Activity, Time off, Notes, Documents, Timeline, Payslips) */
const empTabs=e=>[
 {k:'overview',l:'Overview'},{k:'rules',l:'Work rules'},{k:'docs',l:'Documents',n:e.docList.length},{k:'notes',l:'Notes',n:e.notes.length},
 {k:'pay',l:'Payslips'},{k:'perms',l:'Permissions',hide:!can(['manage:permissions','view:employee:data'])},{k:'activity',l:'Activity'},
 {k:'off',l:'Time off',soon:1},{k:'tline',l:'Timeline',soon:1}];

function empHero(e){
 const expiring=e.docList.filter(d=>d.days!=null&&d.days<=30).length;
 return hero({name:e.name,ini:ini(e.name),title:e.name,pills:[empPill(e),acctPill(e)],sub:esc(e.role)+' · '+esc(e.basis),
  meta:[['mail',esc(e.email)],['phone',esc(e.phone)],['clock',e.started?'Started '+esc(e.started):'Not started yet'],...(e.inSched?[['cal','Appears in the scheduler']]:[])],
  actions:(can('edit:employee:data')&&mayManage(e)?`<button type="button" class="btn btn-ghost" data-go="user-management/employees/${e.id}/edit">${ICON('edit')}<span class="lb">Edit</span></button>`:'')
   +(can('edit:employee:data')&&mayManage(e)&&e.st!=='invited'?`<button type="button" class="btn btn-ghost" data-do="emp-pwd" data-id="${e.id}">${ICON('lock')}<span class="lb">Set password</span></button>`:'')
   +(e.st==='invited'?`<button type="button" class="btn" data-do="emp-resend" data-id="${e.id}">${ICON('send')}<span class="lb">Resend invite</span></button>`:'')
   +(can('archive:employee')&&e.acct!=='OWNER'&&mayManage(e)?`<button type="button" class="btn btn-danger" data-do="emp-archive" data-id="${e.id}">${ICON('archive')}<span class="lb">${e.st==='archived'?'Restore':'Archive'}</span></button>`:''),
  foot:`<div><b class="num">${e.hrs==null?'—':e.hrs+' h'}</b>this week</div><div><b class="num">${e.st==='active'?(88+seeded(e.name)%11)+'%':'—'}</b>on time, 30 days</div><div><b class="num${expiring?'" style="color:var(--warn)':''}">${e.docList.length}${expiring?' ('+expiring+' expiring)':''}</b>documents</div><div><b>${e.mfa?'On':'Off'}</b>two-factor</div>`});
}

/* Overview: the shipped page shows a User Profile card and a Work Profile card; same here, plus emergency contacts and access */
function empOverview(e){
 const nok=e.nok&&e.nok[0],edit=can('edit:employee:data')?`<button type="button" class="btn btn-ghost btn-sm" data-go="user-management/employees/${e.id}/edit">${ICON('edit')}Edit</button>`:'';
 return `<div class="two"><div class="g">
  ${card({title:'User profile',meta:edit,body:`<div style="display:flex;gap:6px;margin-bottom:12px">${empPill(e)}${acctPill(e)}</div>`+kv([['First name',esc(e.first)],['Last name',esc(e.last)],['Username',`<span class="mono">${esc(e.username)}</span>`],['Email',`${esc(e.email)} ${e.verified?pill('ok','Verified'):pill('warn','Not verified')}`],['Mobile phone',esc(e.phone)],['Address',e.address?esc(e.address):'<span class="dash">—</span>']])})}
  <div class="g c2">
   ${card({title:'Next of kin',body:nok?kv([['Name',esc(e.nok[0])],['Relationship',esc(e.nok[1])],['Phone',esc(e.nok[2])]]):'<div class="subtle">None recorded.</div>'})}
   ${card({title:'Emergency contact',body:e.emerg?kv([['Name',esc(e.emerg[0])],['Phone',esc(e.emerg[1])]]):(nok?`<div class="subtle">Using the next of kin details.</div>`:'<div class="subtle">None recorded.</div>')})}
  </div></div>
  <div class="g">
   ${card({title:'Work profile',meta:edit,body:kv([['Display name',esc(e.display||e.first+' '+e.last)],['Job title',e.role?esc(e.role):'<span class="dash">—</span>'],['Employment basis',esc(e.basis)],['Site worker',e.inSched?'Yes':'No'],e.acct==='EMPLOYEE'?['Role',esc(roleName(e.roleId))]:['Account type',esc(ACCT[e.acct])],['Hourly rate',fin()?(e.hourly?'A$'+Number(e.hourly).toFixed(2):'<span class="dash">—</span>'):'<span class="mask">••••</span>'],['Cost rate',fin()?(e.cost?'A$'+Number(e.cost).toFixed(2):'<span class="dash">—</span>'):'<span class="mask">••••</span>']])+(fin()?'':`<div class="fhelp" style="margin-top:10px">Pay and cost rates need the owner-only financial permission.</div>`)})}
   ${card({title:'Access',sub:'What they can do in SiteOS',body:kv([['Account type',acctPill(e)],e.acct==='EMPLOYEE'?['Role',`${esc(roleName(e.roleId))} <a class="lnk" href="#/user-management/roles" style="font-size:12.5px;margin-left:6px">View role</a>`]:['Permissions','Every permission, by account type'],['Two-factor',e.mfa?pill('ok','On',1):pill('warn','Not set up',1)],...(e.acct==='EMPLOYEE'?[['Personal overrides',Object.keys(e.ovr||{}).length?pill('info',Object.keys(e.ovr).length+' override'+(Object.keys(e.ovr).length>1?'s':'')):'None']]:[])])})}
  </div></div>`;
}

/* Documents: Active / Expired toggle, a document can hold several files */
function empDocs(e){
 const f=UI.docf||'active',shownAll=e.docList.filter(d=>docShown(d,e)),hidden=e.docList.length-shownAll.length;
 const isExp=d=>d.days!=null&&d.days<0,shown=shownAll.filter(d=>f==='expired'?isExp(d):!isExp(d));
 const canEd=can('edit:employee:data')||ownDoc(null,e);
 return `<section class="qv-card"><div class="qv-hd"><div class="grow"><h3>Documents</h3><div class="s">Licences, tickets and contracts. Visibility decides who can open each one.</div></div><div class="meta"><div class="segc" role="radiogroup" aria-label="Show">${[['active','Active'],['expired','Expired']].map(([k,l])=>`<button type="button" role="radio" aria-checked="${f===k}" class="${f===k?'on':''}" data-do="doc-filter" data-f="${k}">${l}<span class="tc num" style="margin-left:6px;opacity:.7">${shownAll.filter(d=>k==='expired'?isExp(d):!isExp(d)).length}</span></button>`).join('')}</div>${canEd?`<button type="button" class="btn btn-sm" data-do="doc-add" data-id="${e.id}">${ICON('plus')}Add document</button>`:''}</div></div>
  <div style="padding-top:8px">${shown.length?shown.map(d=>`<div class="docrow"><span class="ft">${esc(d.type.slice(0,3).toUpperCase())}</span><div class="grow"><b>${esc(d.name)}${d.files>1?` <span class="subtle" style="font-weight:500">· ${d.files} files</span>`:''}</b><small>${esc(d.type)} · uploaded ${esc(d.added)} by ${esc(d.by)}</small></div><div class="x">${docPill(d)}${pill('neutral',VIS[d.vis])}<button type="button" class="rowbtn" data-do="doc-view" data-id="${d.id}" aria-label="View" title="View">${ICON('eye')}</button>${canEd?`<button type="button" class="rowbtn" data-do="doc-edit" data-id="${d.id}" aria-label="Edit" title="Edit">${ICON('edit')}</button><button type="button" class="rowbtn" data-do="doc-del" data-id="${d.id}" aria-label="Delete" title="Delete">${ICON('trash')}</button>`:''}</div></div>`).join(''):emptyBlock('file',f==='expired'?'No expired documents':'No documents yet',f==='expired'?'Nothing has run out.':'Add licences, tickets and the signed contract.',f==='active'&&canEd?`<button type="button" class="btn" data-do="doc-add" data-id="${e.id}">${ICON('plus')}Add document</button>`:'')}</div>
  ${hidden?`<div class="tblfoot"><span>${hidden} document${hidden>1?'s are':' is'} hidden by visibility settings.</span></div>`:''}</section>`;
}

/* Notes: each note has a visibility (Only me / Everyone / Owner + Admin); "Add note" opens a small form */
function empNotes(e){
 const canEd=can('edit:employee:data'),list=e.notes.filter(n=>n.vis==='everyone'||n.vis==='owner+admin'&&isAdminish()||n.by===ME.name||!n.vis);
 return `<section class="qv-card"><div class="qv-hd"><div class="grow"><h3>Notes</h3><div class="s">Internal. The employee can't see these.</div></div><div class="meta">${canEd?`<button type="button" class="btn btn-sm" data-do="note-new" data-id="${e.id}">${ICON('plus')}Add note</button>`:''}</div></div>
  <div class="qv-body" style="padding-top:4px">${list.length?list.map(n=>noteRow(n,canEd)).join(''):'<div class="empty"><b>No notes yet</b>Notes you add show up here, newest first.</div>'}</div></section>`;
}

function empPay(e){
 if(!fin())return `<section class="qv-card"><div class="qv-body">${gatedBlock('Payslips are hidden')}</div></section>`;
 const base=e.hourly||0,hrs=e.hrs||0,rows=[['14 Sep – 27 Sep',hrs*2],['31 Aug – 13 Sep',hrs*2-6],['17 Aug – 30 Aug',hrs*2+4],['3 Aug – 16 Aug',hrs*2-2]];
 return `<section class="qv-card"><div class="qv-hd"><div class="grow"><h3>Payslips</h3><div class="s">Fortnightly, from approved hours</div></div></div>${base?`<div class="tblwrap"><table class="tbl" style="min-width:640px"><thead><tr><th>Period</th><th class="r">Hours</th><th class="r">Gross</th><th class="r">Net</th><th>Status</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td class="strong">${r[0]}</td><td class="r">${f2(r[1])} h</td><td class="r">$${N(Math.round(r[1]*base))}</td><td class="r">$${N(Math.round(r[1]*base*.79))}</td><td>${i===0?pill('warn','Processing',1):pill('ok','Paid',1)}</td></tr>`).join('')}</tbody></table></div>`:emptyBlock('receipt','No payslips yet','Payslips appear once this person has approved hours.')}</section>`;
}

/* personal permission overrides: shows effective access, role default underneath */
const ED={id:null,ovr:{},open:{},q:''};
const edDraft=e=>{if(ED.id!==e.id){ED.id=e.id;ED.ovr={...(e.ovr||{})};}return ED;};
const edDirty=e=>ED.id===e.id&&JSON.stringify(ED.ovr)!==JSON.stringify(e.ovr||{});
function empPerms(e){
 const d=ED.id===e.id?ED:{ovr:e.ovr||{}},owner=holdsAll(e),canSet=can('manage:permissions')&&!owner,dirty=edDirty(e);
 const eff=k=>k in d.ovr?d.ovr[k]:roleHas(e.roleId,k);
 const n=Object.keys(d.ovr).length;
 return `<section class="qv-card"><div class="qv-hd"><div class="grow"><h3>Permissions</h3><div class="s">${owner?esc(e.first)+' is '+(e.acct==='OWNER'?'the company owner':'a superuser')+'.':esc(e.first)+' holds <b>'+esc(roleName(e.roleId))+'</b>. Switch a permission on or off to override the role for this person only.'}</div></div></div>
  <div class="toolbar">${owner?`<span style="font-size:13px"><b>Account type</b> ${acctPill(e)}</span>`:''}<label class="fld"${owner?' hidden':''} style="flex-direction:row;align-items:center;gap:10px"><span style="font-size:12.5px;font-weight:600;color:var(--text-muted)">Role</span><select data-eperm-role="${e.id}" ${can('assign:role')&&!owner&&canAssignTo(roleOf(e.roleId))?'':'disabled'} style="width:210px">${assignableRoles(e.roleId).map(r=>`<option value="${r.id}"${r.id===e.roleId?' selected':''}>${esc(r.name)}${canAssignTo(r)?'':' (owner-assigned)'}</option>`).join('')}</select></label><span class="grow"></span>${n?`<span class="ovr">${n} override${n>1?'s':''}</span>${canSet?`<button type="button" class="btn btn-ghost btn-sm" data-do="eperm-clear" data-id="${e.id}">Clear overrides</button>`:''}`:'<span class="subtle" style="font-size:12.5px">Following the role exactly</span>'}</div>
  <div style="padding:0 18px 12px">${owner?lockNote(ACCT[e.acct]+' accounts hold every permission by account type. They don\u2019t use a role and can\u2019t be overridden.'):`<div class="banner info">${ICON('shield')}<span><b>One role per person.</b> Changing ${esc(e.first)}’s role clears any overrides below.</span></div>`}</div>
  ${permGroups({q:'',open:k=>!!ED.open[k],grp:'eperm-group',all:'eperm-all',tog:'eperm-tog',readonly:!canSet,state:k=>{const lock=!canSet?(owner?'Owner has everything.':'You need the manage permissions permission.'):permLock(k,false);return {on:owner?!(PERM_BY[k].tier==='platform'):eff(k),disabled:lock,badge:k in d.ovr&&!owner?`<span class="ovr">${d.ovr[k]?'Granted for '+esc(e.first):'Removed for '+esc(e.first)}</span>`:''};}})}
  ${dirty?`<div class="savebar"><span class="hint">Unsaved permission changes</span><button type="button" class="btn btn-ghost" data-do="eperm-discard">Discard</button><button type="button" class="btn" data-do="eperm-save" data-id="${e.id}">${ICON('check')}Save overrides</button></div>`:''}</section>`;
}

function empRules(e){
 const rs=S.company.rulesets,cur=rs.find(r=>r.name.startsWith(e.rules.split(' ')[0]))||rs[0];
 return `<div class="g c2">${card({title:'Work rules',sub:'How overtime and pay rules apply to '+e.first,body:`<div class="fld"><label for="rs">Ruleset</label><select id="rs" data-erule="${e.id}" ${can('edit:employee:data')?'':'disabled'}>${rs.map(r=>`<option${r===cur?' selected':''}>${esc(r.name)}</option>`).join('')}</select><div class="fhelp">Applies from the next pay period.</div></div>`})}
  ${card({title:cur.name,sub:cur.description,body:`<div style="font-size:13.5px;color:var(--text-muted);line-height:1.6">${esc(rsSummary(cur))}</div>${cur.isDefault?`<div style="margin-top:10px">${pill('info','Company default')}</div>`:''}`})}</div>`;
}

function empActivity(e){
 const ev=[tlItem('edit','Profile updated','Phone number changed by Hamish Reid','12 Sep 2026'),
  tlItem('file','Document added',esc((e.docList[0]||{name:'Employment contract'}).name)+' by Hamish Reid','12 Feb 2026'),
  ...(e.st!=='invited'?[tlItem('clock','Clocked in','Westgate Depot Upgrade, 05:56, inside geofence','Today','ok'),tlItem('checkc','Timesheet approved','Week ending 27 Sep, '+(e.hrs||0)+' h by Priya Nair','28 Sep 2026','ok')]:[tlItem('send','Invite sent','By email and SMS','2 days ago','brand')]),
  tlItem('user','Employee created','By Alex Morgan',e.started||'Today')];
 return `<section class="qv-card"><div class="qv-hd"><div class="grow"><h3>Activity</h3><div class="s">Audit history for this profile</div></div></div><div class="qv-body">${timeline(ev)}</div></section>`;
}

VIEWS['employee-detail']={path:'user-management/employees/:id',parent:'um',perm:'view:employee:data',
 title:'Employee',sub:'Profile, documents, pay and access.',
 crumbs:()=>{const e=empBy(P.id);return umCrumbs('employees','Employees',e?e.name:'Not found');},
 act:()=>'',
 render(){
  const e=empBy(P.id);if(!e)return notFound('Employee','user-management/employees');
  const tabs=empTabs(e),c=curTab(tabs);
  const body={overview:empOverview,docs:empDocs,notes:empNotes,pay:empPay,perms:empPerms,rules:empRules,activity:empActivity}[c](e);
  return `<div class="page">${empHero(e)}${mayManage(e)?'':lockNote('Only the company owner can manage a superuser.')}${ptabs(tabs)}${body}</div>`;
 }};

/* ---------- add / edit form (full page: it is long) ----------
   Sections and order follow the shipped Add employee dialog:
   User account, Work profile, Emergency contacts, Access. */
const phoneValid=(v,cc)=>{const d=String(v).replace(/[^\d]/g,'').replace(/^0/,'');return cc==='+61'?/^[2-478]\d{8}$/.test(d):d.length>=7&&d.length<=12;};
function empFormHtml(e){
 const nw=!e,x=e||{first:'',last:'',email:'',phone:'',username:'',role:'',basis:'Full time',hourly:'',cost:'',address:'',nok:['','',''],emerg:null,inSched:true,roleId:'employee',display:''};
 const hasNok=!!(x.nok&&x.nok[0]),hasEm=!!x.emerg,finOk=fin(),canRole=can('assign:role');
 const back=nw?'user-management/employees':'user-management/employees/'+e.id;
 const roleLockedFor=!canRole||(!nw&&x.roleId&&!canAssignTo(roleOf(x.roleId)));
 return `<form class="formpage" data-form novalidate onsubmit="return false" id="empForm" data-id="${nw?'':e.id}">
  ${fsec('User account',nw?'How they sign in and how we reach them':'Their sign-in and contact details',
   fld({name:'first',label:'First name',req:true,value:x.first,autocomplete:'off'})+fld({name:'last',label:'Last name',req:true,value:x.last})
   +fld({name:'email',label:'Email',type:'email',req:true,value:x.email,span:3,ph:'name@company.com',help:nw?'We send the invite here.':'Changing it asks them to verify the new address.'})
   +fld({name:'phone',label:'Mobile',type:'phone',req:true,value:x.phone,span:3,help:'Used for the SMS invite and verification codes.'})
   +(nw?'':fld({name:'username',label:'Username',value:x.username,span:3,max:30})+fld({name:'display',label:'Display name',value:x.display||x.first,span:3,help:'What other people see in the scheduler.'}))
   +addrFld({name:'address',value:x.address}))}
  ${fsec('Work profile','Role on site, pay basis and rostering',
   fld({name:'title',label:'Job title',value:x.role,span:6,ph:'e.g. Leading hand'})
   +selAdd({name:'basis',label:'Employment basis',value:x.basis,opts:EMP_BASES,span:6,what:'Employment basis'})
   +fld({name:'hourly',label:'Hourly rate',type:'money',value:finOk?x.hourly:'',span:3,suffix:'AUD / h',disabled:!finOk,locked:!finOk?'Owner-only':'',help:finOk?'':'Pay rates need the owner-only financial permission.'})
   +fld({name:'cost',label:'Cost rate (auto)',type:'money',value:finOk?x.cost:'',span:3,suffix:'AUD / h',disabled:true,help:'Worked out from the hourly rate and company overhead (18%).'})
   +tgl({name:'inSched',label:'Site worker (appears in the scheduler)',help:'They can be rostered on shifts.',value:x.inSched})
   +(nw?tgl({name:'invite',label:'Send invite (email and SMS)',help:'They set a password and turn on two-factor when they accept.',value:true}):''))}
  ${fsec('Emergency contacts','Who we call if something happens',
   tgl({name:'hasNok',label:'This employee has a next of kin',value:hasNok}).replace('data-ftog="hasNok"','data-ftog="hasNok" data-fchange="rev"')
   +`<div class="fgrid s6" data-rev="hasNok"${hasNok?'':' hidden'} style="grid-column:span 6;padding:0">`+fld({name:'nokName',label:'Next of kin name',value:x.nok[0],span:3})+fld({name:'nokRel',label:'Relationship',value:x.nok[1],span:3,ph:'e.g. Spouse'})+fld({name:'nokPhone',label:'Next of kin contact number',type:'phone',value:x.nok[2],span:3})+`</div>`
   +tgl({name:'hasEm',label:'This employee has an emergency contact',value:hasEm}).replace('data-ftog="hasEm"','data-ftog="hasEm" data-fchange="rev"')
   +`<div class="fgrid s6" data-rev="hasEm"${hasEm?'':' hidden'} style="grid-column:span 6;padding:0">`
   +tgl({name:'emSame',label:'Same as next of kin',help:'Using the next of kin details above.',value:false}).replace('data-ftog="emSame"','data-ftog="emSame" data-fchange="rev"')
   +`<div class="fgrid s6" data-revnot="emSame" style="grid-column:span 6;padding:0">`+fld({name:'emName',label:'Emergency contact name',value:x.emerg?x.emerg[0]:'',span:3})+fld({name:'emPhone',label:'Emergency contact number',type:'phone',value:x.emerg?x.emerg[1]:'',span:3})+`</div></div>`)}
  ${fsec('Access','What they can do in SiteOS',
   (x.acct==='OWNER'?`<div class="fld s6"><label>Account type<span class="lockchip">${ICON('key')}Owner</span></label><input value="Owner" disabled><div class="fhelp">The owner holds every permission and doesn\u2019t use a role.</div></div>`
   :(isOwnerAcct()?fld({name:'acct',label:'Account type',type:'select',value:x.acct||'EMPLOYEE',span:6,opts:[['EMPLOYEE','Employee'],['SUPERUSER','Superuser']],help:'A superuser holds every permission and doesn\u2019t use a role. Only the owner can set this.'}):''))
   +(x.acct==='OWNER'?'':fld({name:'roleId',label:'Role',type:'select',value:x.roleId||'employee',span:6,req:true,opts:assignableRoles(x.roleId).map(r=>[r.id,r.name+(canAssignTo(r)?'':' (owner-assigned)')]),disabled:roleLockedFor||x.acct==='SUPERUSER',locked:roleLockedFor?(!canRole?'Needs assign role':'Owner only'):'',help:x.acct==='SUPERUSER'?'A superuser has every permission, so a role doesn\u2019t apply.':nw?'You can fine-tune individual permissions later from their profile.':'Changing the role clears personal permission overrides.'})))}
  <div class="fbar"><span class="hint">${nw?'Nothing saved yet':'No changes yet'}</span><button type="button" class="btn btn-ghost" data-go="${back}">Cancel</button><button type="button" class="btn" data-do="emp-save" data-fsave${nw?'':' disabled'}>${ICON('check')}${nw?'Create':'Save changes'}</button></div></form>`;
}
DO.rev=({on},el)=>{const n=el.dataset.ftog;$$('[data-rev="'+n+'"]').forEach(x=>x.hidden=!on);$$('[data-revnot="'+n+'"]').forEach(x=>x.hidden=on);};

VIEWS['employee-new']={path:'user-management/employees/new',parent:'um',perm:'add:employee',title:'Add employee',sub:'Create their profile. You can send the invite by email and SMS straight away.',
 crumbs:()=>umCrumbs('employees','Employees','Add employee'),render(){return empFormHtml(null);}};
VIEWS['employee-edit']={path:'user-management/employees/:id/edit',parent:'um',perm:'edit:employee:data',title:'Edit employee',sub:'Changes apply straight away.',
 crumbs:()=>{const e=empBy(P.id);return [['User management','user-management/employees'],['Employees','user-management/employees'],[e?e.name:'Not found','user-management/employees/'+P.id],['Edit']];},
 render(){const e=empBy(P.id);return e?empFormHtml(e):notFound('Employee','user-management/employees');}};

DO['emp-save']=()=>{
 const root=$('#empForm'),id=root.dataset.id,e=id?empBy(id):null;
 const d=validate(root,{
  email:v=>!emailOk(v)?'Enter a valid email address':(S.employees.find(x=>x.email.toLowerCase()===v.toLowerCase()&&x!==e)?'An employee with this email already exists':''),
  phone:(v,a)=>phoneValid(v,a.phone_cc)?'':'Enter a valid mobile number',
  nokPhone:(v,a)=>phoneValid(v,a.nokPhone_cc)?'':'Enter a valid mobile number',emPhone:(v,a)=>phoneValid(v,a.emPhone_cc)?'':'Enter a valid mobile number',
  hourly:v=>isNaN(Number(v))||Number(v)<=0?'Enter a rate above $0':''
 });
 if(!d)return toastErr('Can’t save yet','Fix the highlighted fields and try again.');
 const full=(v,cc)=>cc+' '+String(v).replace(/^0/,'');
 const hasNok=d.hasNok==='1';
 const f={first:d.first,last:d.last,name:d.first+' '+d.last,email:d.email,phone:full(d.phone,d.phone_cc),role:d.title,basis:d.basis,inSched:d.inSched==='1',address:addrValue(d),
  nok:hasNok?[d.nokName,d.nokRel,full(d.nokPhone,d.nokPhone_cc)]:['','',''],
  emerg:d.hasEm==='1'?(d.emSame==='1'&&hasNok?[d.nokName,full(d.nokPhone,d.nokPhone_cc)]:[d.emName,full(d.emPhone,d.emPhone_cc)]):null};
 if(d.display!==undefined)f.display=d.display;if(d.username)f.username=d.username;
 if(fin()&&d.hourly){f.hourly=Number(d.hourly);f.cost=f2(f.hourly*1.28);}
 GUARD.dirty=false;
 if(e){
  const oldRole=e.roleId,acct=d.acct||e.acct;let note='';Object.assign(e,f);
  if(e.acct!=='OWNER'&&isOwnerAcct()&&acct!==e.acct){
   if(acct==='SUPERUSER'){if(oldRole)roleOf(oldRole).count=Math.max(roleOf(oldRole).count-1,0);e.roleId=null;}
   else{e.roleId=d.roleId;roleOf(e.roleId).count++;}
   e.acct=acct;e.ovr={};note=' \u00b7 now a '+ACCT[acct].toLowerCase();
  }else if(e.acct==='EMPLOYEE'&&d.roleId&&d.roleId!==oldRole){const a=roleOf(oldRole),b=roleOf(d.roleId);if(a)a.count=Math.max(a.count-1,0);b.count++;e.roleId=d.roleId;e.ovr={};note=' \u00b7 role changed, overrides cleared';}
  toast('Employee updated',e.name+note);go('user-management/employees/'+e.id);
 }else{
  const n={...f,id:slug(f.name),username:d.email.split('@')[0],roleId:(d.acct==='SUPERUSER'?null:d.roleId),acct:d.acct==='SUPERUSER'&&isOwnerAcct()?'SUPERUSER':'EMPLOYEE',started:'1 Oct 2026',hrs:null,docs:'None yet',st:d.invite==='1'?'invited':'active',type:d.basis==='Casual'?'Casual':d.basis==='Contractor'?'Contractor':'Full time',verified:false,mfa:false,docList:[],notes:[],ovr:{},rules:'Standard award'};
  S.employees.push(n);if(n.roleId)roleOf(n.roleId).count++;
  toast(d.invite==='1'?'Employee created and invite sent':'Employee created',n.name+(d.invite==='1'?' · by email and SMS':''));go('user-management/employees/'+n.id);
 }
};

/* ---------- employee actions ---------- */
DO['emp-import']=()=>drawer({title:'Import employees',sub:'Add many people at once from a spreadsheet.',okLabel:'Import',rules:{file:{always:true,fn:v=>v?'':'Choose a CSV file first'}},
 body:`<div class="banner info">${ICON('doc')}<span>Columns: <b>first name, last name, email, mobile, role, job title, employment basis</b>. Each person gets an invite unless you untick it below.</span></div>
  <div class="fgrid">${drop('file','CSV file','CSV up to 5 MB')}${tgl({name:'send',label:'Send invites after import',value:true,help:'Email and SMS, one each.'})}</div>
  <div><button type="button" class="btn btn-ghost btn-sm" data-toast="Template|employees-template.csv would download">${ICON('download')}Download template</button></div>`,
 onOk:()=>{toast('Import queued','We’ll email you when it finishes. Rows with problems are listed in the report.');}});
DO['emp-resend']=d=>toast('Invite resent',empBy(d.id).name+' · email and SMS');
DO['emp-archive']=async d=>{
 const e=empBy(d.id),arch=e.st!=='archived';
 if(!(await dialog({title:arch?`Archive ${e.name}?`:`Restore ${e.name}?`,body:arch?`They can’t sign in or be rostered. Their history, hours and documents are kept, and you can restore them later.`:'They will be able to sign in and be rostered again.',okLabel:arch?'Archive':'Restore',danger:arch})))return;
 e.st=arch?'archived':'active';e.hrs=arch?null:e.hrs;rerender(true);toast(arch?'Employee archived':'Employee restored',e.name);
};
DO['emp-pwd']=d=>{const e=empBy(d.id);drawer({title:'Set password',sub:'For '+e.name,okLabel:'Set password',
 rules:{pw:v=>v.length<10?'Use at least 10 characters':/\d/.test(v)&&/[A-Za-z]/.test(v)?'':'Mix letters and numbers',pw2:(v,a)=>v!==a.pw?'Passwords don’t match':''},
 body:`<div class="banner warn">${ICON('alert')}<span>They are emailed that an admin changed it and are <b>signed out of every device</b>.</span></div>
  <div class="fgrid">${fld({name:'pw',label:'New password',type:'password',req:true,span:6,autocomplete:'new-password',help:'At least 10 characters, with letters and numbers.'})}${fld({name:'pw2',label:'Confirm new password',type:'password',req:true,span:6,autocomplete:'new-password'})}</div>`,
 onOk:()=>toast('Password set',e.name+' has been emailed and signed out.')});};
function docDrawer(e,doc,replace){
 drawer({title:replace?'Replace file':doc?'Edit document':'Add document',sub:e.name,okLabel:doc?'Save':'Add document',
  rules:replace?{file:{always:true,fn:v=>v?'':'Choose the new file'}}:(doc?{}:{file:{always:true,fn:v=>v?'':'Choose a file'}}),
  body:`<div class="fgrid">${replace?'':fld({name:'name',label:'Document name',req:true,span:6,value:doc?doc.name:'',ph:'e.g. High risk licence'})+fld({name:'type',label:'Type',type:'select',span:3,value:doc?doc.type:'Licence',opts:DOC_TYPES})+fld({name:'exp',label:'Expiry date',type:'date',span:3,help:'Leave empty if it doesn’t expire.'})
   +seg({name:'vis',label:'Who can open it',span:6,value:doc?doc.vis:'everyone',opts:[['everyone','Everyone'],['owner+admin','Owner + Admin'],['me','Only me']],help:'Everyone means anyone who can view this profile.'})}${doc&&!replace?'':drop('file',replace?'File':'Files',replace?'PDF, JPG or PNG, up to 50 MB':'PDF, JPG or PNG, up to 50 MB each. Add several for one document.',!replace)}${replace?`<div class="banner">${ICON('file')}<span>The current file for <b>${esc(doc.name)}</b> is kept in history.</span></div>`:''}</div>`,
  onOk:d=>{
   if(doc&&!replace){Object.assign(doc,{name:d.name,type:d.type,vis:d.vis});toast('Document updated',doc.name);}
   else if(replace)toast('File replaced',doc.name);
   else{e.docList.push({id:e.id+'-d'+Date.now(),name:d.name,type:d.type,exp:d.exp||'No expiry',days:d.exp?Math.round((new Date(d.exp)-new Date('2026-10-01'))/864e5):null,vis:d.vis,added:'1 Oct 2026',by:ME.name,files:Math.max((($('#drawer input[type=file]')||{}).files||[]).length,1)});toast('Document added',d.name);}
   rerender(true);}});
}
const docOwner=id=>S.employees.find(e=>e.docList.some(d=>d.id===id));
DO['doc-add']=d=>docDrawer(empBy(d.id));
DO['doc-edit']=d=>{const e=docOwner(d.id);docDrawer(e,e.docList.find(x=>x.id===d.id));};
DO['doc-view']=d=>{const e=docOwner(d.id),x=e.docList.find(y=>y.id===d.id);toast('Opening '+x.name,'The document would open in the viewer');};
DO['doc-del']=async d=>{const e=docOwner(d.id),x=e.docList.find(y=>y.id===d.id);if(!(await dialog({title:'Delete document?',body:`<b>${esc(x.name)}</b> will be removed from ${esc(e.name)}’s profile. This can’t be undone.`,okLabel:'Delete',danger:true})))return;e.docList=e.docList.filter(y=>y!==x);rerender(true);toast('Document deleted',x.name);};
DO['note-new']=d=>{const e=empBy(d.id)||custBy(d.id);drawer({title:'Add note',sub:e.name,okLabel:'Save',
 body:`<div class="fgrid">${fld({name:'text',label:'Note',type:'textarea',req:true,rows:5,span:6,max:1000,ph:'Write the note\u2026'})}${seg({name:'vis',label:'Visibility',span:6,value:'me',opts:[['me','Only me'],['everyone','Everyone'],['owner+admin','Owner + Admin']],help:'Who can read this note. Everyone means anyone who can open this profile.'})}</div>`,
 onOk:v=>{e.notes=e.notes||[];e.notes.unshift({id:e.id+'-n'+Date.now(),by:ME.name,when:'Today',text:v.text,vis:v.vis});rerender(true);toast('Note added',e.name+' \u00b7 '+VIS[v.vis]);}});};
DO['doc-filter']=d=>{UI.docf=d.f;rerender(true);};
DO['note-del']=async d=>{const e=S.employees.concat(S.customers).find(x=>(x.notes||[]).some(n=>n.id===d.id));if(!(await dialog({title:'Delete note?',body:'This can’t be undone.',okLabel:'Delete',danger:true})))return;e.notes=e.notes.filter(n=>n.id!==d.id);rerender(true);toast('Note deleted');};

DO['eperm-group']=d=>{ED.open[d.g]=!ED.open[d.g];rerender(true);};
DO['eperm-tog']=d=>{const e=empBy(P.id),dr=edDraft(e),cur=d.k in dr.ovr?dr.ovr[d.k]:roleHas(e.roleId,d.k),to=!cur;if(to===roleHas(e.roleId,d.k))delete dr.ovr[d.k];else dr.ovr[d.k]=to;GUARD.dirty=edDirty(e);rerender(true);};
DO['eperm-all']=d=>{const e=empBy(P.id),dr=edDraft(e),g=PERM_GROUPS.find(x=>x.key===d.g),to=d.on==='1';g.perms.forEach(p=>{if(permLock(p[0],false))return;if(to===roleHas(e.roleId,p[0]))delete dr.ovr[p[0]];else dr.ovr[p[0]]=to;});GUARD.dirty=edDirty(e);rerender(true);};
DO['eperm-discard']=()=>{ED.id=null;GUARD.dirty=false;rerender(true);};
DO['eperm-save']=d=>{const e=empBy(d.id);e.ovr={...ED.ovr};ED.id=null;GUARD.dirty=false;rerender(true);toast('Overrides saved',e.name+' · '+Object.keys(e.ovr).length+' personal override'+(Object.keys(e.ovr).length===1?'':'s'));};
DO['eperm-clear']=async d=>{const e=empBy(d.id);if(!(await dialog({title:'Clear all overrides?',body:`${esc(e.first)} goes back to exactly what <b>${esc(roleName(e.roleId))}</b> grants.`,okLabel:'Clear overrides',danger:true})))return;e.ovr={};ED.id=null;GUARD.dirty=false;rerender(true);toast('Overrides cleared',e.name);};
document.addEventListener('change',async ev=>{
 const s=ev.target.closest('[data-eperm-role]');
 if(s){const e=empBy(s.dataset.epermRole);if(await moveRole(e.id,s.value)){ED.id=null;}else s.value=e.roleId;rerender(true);return;}
 const r=ev.target.closest('[data-erule]');
 if(r){const e=empBy(r.dataset.erule);e.rules=r.value;toast('Work rules changed',e.name+' · '+r.value);rerender(true);}
});

document.addEventListener('change',e=>{
 const s=e.target.closest('#empForm [name="acct"]');if(!s)return;
 const r=$('#f-roleId'),help=r&&r.closest('.fld').querySelector('.fhelp');if(!r)return;
 const su=s.value==='SUPERUSER';r.disabled=su;if(help)help.textContent=su?'A superuser has every permission, so a role doesn\u2019t apply.':'What they can do in SiteOS.';
});
