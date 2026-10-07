/* =====================================================================
   Roles tab (inside User management)
   Same structure as the shipped Roles screen, in the new look:
   role list (search, +, delete) on the left, one editor pane on the right
   (name, description, "Can be assigned by non-owners", Grant all / Revoke all,
   permission groups with Select all / Clear, footer with count + Cancel + Save).
   New role opens that same pane empty, with every permission visible.
   `permGroups` is shared with the employee Permissions tab.
   ===================================================================== */
const RS={id:'admin',prev:'admin',tab:'perms',closed:{},q:'',lq:'',draft:null,cmp:{},err:{}};
const SENSITIVE=['impersonate:user','manage:company:settings','delete:job','delete:asset','delete:vehicle','delete:journey','view:job:financials','view:employee:financials'];
const roleOf=id=>S.rbac.roles.find(r=>r.id===id);
const isNewRole=()=>RS.id==='__new';
const rsel=()=>isNewRole()?{id:'__new',name:'',desc:'',sys:false,locked:false,assignable:true,count:0,perms:[],isNew:true}:(roleOf(RS.id)||S.rbac.roles[0]);
const rdraft=()=>RS.draft&&RS.draft.id===rsel().id?RS.draft:null;
const ensureDraft=()=>{const r=rsel();if(!rdraft())RS.draft={id:r.id,name:r.name,desc:r.desc,assignable:r.assignable!==false,perms:new Set(r.perms)};return RS.draft;};
const rvals=r=>{const d=rdraft();return d||{name:r.name,desc:r.desc,assignable:r.assignable!==false,perms:new Set(r.perms)};};
const rdirty=()=>{const d=rdraft();if(!d)return false;const r=rsel();
 if(r.isNew)return !!(d.name||d.desc||d.perms.size||d.assignable!==true);
 return d.name!==r.name||d.desc!==r.desc||d.assignable!==(r.assignable!==false)||d.perms.size!==r.perms.length||r.perms.some(k=>!d.perms.has(k));};
const effPerms=()=>rvals(rsel()).perms;
const isOwnerUser=()=>ME.acct==='OWNER';
const roleCountTotal=()=>S.rbac.roles.reduce((a,r)=>a+r.count,0);
/* only the owner can hand out owner-only roles (SIT-890); everyone else sees the assignable ones */
const canAssignTo=r=>isOwnerUser()||r.assignable!==false;
const assignableRoles=cur=>S.rbac.roles.filter(r=>canAssignTo(r)||r.id===cur);

/* One grouped permission editor. o.state(k)->{on,disabled:reason|false,badge}. o.open: group key -> bool */
function permGroups(o){
 const q=(o.q||'').trim().toLowerCase();
 const out=PERM_GROUPS.map(g=>{
  const rows=g.perms.filter(p=>!q||(p[1]+' '+p[2]+' '+p[0]).toLowerCase().includes(q));
  if(!rows.length)return '';
  const on=g.perms.filter(p=>o.state(p[0]).on).length,tot=g.perms.length,open=q?true:o.open(g.key);
  const editable=g.perms.some(p=>!o.state(p[0]).disabled)&&!o.readonly;
  return `<div class="pgroup${open?' open':''}"><div class="pgh" role="button" tabindex="0" data-do="${o.grp}" data-g="${g.key}" aria-expanded="${open}"><span class="gi">${ICON(g.icon)}</span><span class="grow"><b>${esc(g.label)}</b><small>${esc(g.desc)}</small></span><span class="cnt num">${on} of ${tot}</span>${editable?`<span class="pgacts"><button type="button" data-do="${o.all}" data-g="${g.key}" data-on="1">Select all</button><i>|</i><button type="button" data-do="${o.all}" data-g="${g.key}" data-on="0">Clear all</button></span>`:''}${ICON('next').replace('<svg','<svg class="chev"')}</div>
   <div class="pgbody"><div class="pgrid">${rows.map(p=>{const s=o.state(p[0]),crit=SENSITIVE.includes(p[0])&&s.on;return `<div class="prow${s.on?'':' off'}" title="${esc(p[2])}"><span class="grow"><b>${esc(p[1])}${p[3]==='owner'?`<span class="tier">${ICON('key')}Owner only</span>`:p[3]==='platform'?'<span class="tier plat">SiteOS staff</span>':''}${crit?`<span class="tier crit" title="Critical permission: grant only to admins">${ICON('alert')}Critical</span>`:''}${s.badge||''}</b><span class="mono">${p[0]}</span>${s.disabled&&!o.readonly?`<small class="why">${esc(s.disabled)}</small>`:''}</span><button type="button" class="tog${s.on?' on':''}" role="switch" aria-checked="${s.on}" aria-label="${esc(p[1])}" ${s.disabled?`disabled title="${esc(s.disabled)}"`:`data-do="${o.tog}" data-k="${p[0]}"`}><i></i></button></div>`;}).join('')}</div></div></div>`;
 }).join('');
 return out||`<div class="empty"><b>No permissions match</b>Try a different word.</div>`;
}
/* why a toggle can't be changed, or false */
function permLock(k,roleLocked){
 const t=(PERM_BY[k]||{}).tier;
 if(roleLocked)return 'Owner always has every permission.';
 if(t==='platform')return 'Only SiteOS support staff can hold this.';
 if(t==='owner'&&!isOwnerUser())return 'Only the company owner can grant or remove this permission.';
 return false;
}

/* ---------- left: role list ---------- */
function roleList(){
 const q=RS.lq.trim().toLowerCase(),all=S.rbac.roles,rs=all.filter(r=>!q||(r.name+' '+r.desc).toLowerCase().includes(q));
 const draftName=(rdraft()||{}).name;
 return `<section class="qv-card rlist"><div class="rl-top"><label class="field">${ICON('search')}<input type="search" id="rlq" placeholder="Search roles…" value="${esc(RS.lq)}" aria-label="Search roles"></label>${can('manage:roles')?`<button type="button" class="btn btn-sq" style="width:36px;min-height:36px" data-do="role-new" aria-label="Add role" title="Add role">${ICON('plus')}</button>`:''}</div>
  <div>${isNewRole()?`<div class="ritem on new"><span class="rg">${ICON('plus')}</span><span class="grow"><b>${esc(draftName||'New role')}</b><small>Not saved yet</small></span></div>`:''}
  ${rs.map(r=>`<div class="ritem${r.id===RS.id?' on':''}" data-do="role-pick" data-id="${r.id}" role="button" tabindex="0" aria-current="${r.id===RS.id}"><span class="rg">${ICON(r.sys?'shield':'usercog')}</span><span class="grow"><b>${esc(r.name)}${r.assignable===false?`<span class="lk" title="Only the company owner can assign this role">${ICON('lock')}</span>`:''}</b><small>${r.locked?'All permissions':r.perms.length+' permissions'} · ${r.count} ${r.count===1?'person':'people'}</small></span>${can('manage:roles')?`<button type="button" class="rowbtn del" data-do="role-del" data-id="${r.id}" aria-label="Delete ${esc(r.name)}" title="Delete role">${ICON('trash')}</button>`:''}</div>`).join('')}
  ${!rs.length&&!isNewRole()?`<div class="empty"><b>${all.length?'No roles match your search':'No roles yet'}</b>${all.length?'Try a different name.':'Add the first one with the + button.'}</div>`:''}</div><div class="qv-foot acctnote">${ICON('key')}<span><b>Owners and superusers aren\u2019t roles.</b> They are account types and always hold every permission. Only the owner can set them.</span></div></section>`;
}

/* ---------- right: editor ---------- */
function detailsCard(r){
 const v=rvals(r),editable=can('manage:roles')&&!r.locked,nameLocked=r.sys||r.locked;
 const asgDis=!editable||!isOwnerUser();
 return `<div class="rform">
  <div class="fld${RS.err.name?' err':''}"><label for="rn">Role name<span class="req">*</span>${nameLocked&&!r.isNew?`<span class="lockchip" title="Built-in roles keep their name">${ICON('lock')}Built in</span>`:''}</label><input id="rn" value="${esc(v.name)}" placeholder="Enter role name" maxlength="40" ${editable&&!nameLocked?'':'readonly'} autocomplete="off"><div class="ferr" id="e-rn" role="alert">${esc(RS.err.name||'')}</div></div>
  <div class="fld"><label for="rd">Description</label><textarea id="rd" rows="2" placeholder="Enter role description" maxlength="200" ${editable?'':'readonly'}>${esc(v.desc)}</textarea></div>
  <div class="setrow fswitch asg"><span class="grow"><b>Can be assigned by non-owners</b><small>${r.locked?'The Owner role is always given by an owner.':v.assignable?'People with the assign role permission can give this role to employees.':'Only the company owner can assign this role to an employee. It is hidden from role pickers for everyone else.'}${editable&&!isOwnerUser()?' <i class="why">Only the company owner can change who may assign this role.</i>':''}</small></span><button type="button" class="tog${v.assignable&&!r.locked?' on':''}" role="switch" aria-checked="${v.assignable&&!r.locked}" aria-label="Can be assigned by non-owners" data-do="role-assignable" ${asgDis?'disabled':''}><i></i></button></div>
  ${r.isNew?`<div class="fld"><label for="rstart">Start from</label><select id="rstart" data-rstart><option value="">Blank (no permissions)</option>${S.rbac.roles.filter(x=>!x.locked).map(x=>`<option value="${x.id}">Copy of ${esc(x.name)} (${x.perms.length} permissions)</option>`).join('')}</select><div class="fhelp">Optional. You can change every permission below.</div></div>`:''}
 </div>`;
}
function permsPane(r){
 const eff=effPerms(),locked=!!r.locked||!can('manage:roles');
 return `<div class="ptools"><div class="pt-h"><h4>Permissions</h4>${locked?'':`<button type="button" class="btn btn-sm gbtn ok" data-do="role-grant-all">${ICON('checkc')}Grant all permissions</button><button type="button" class="btn btn-sm gbtn no" data-do="role-revoke-all">${ICON('closec')}Revoke all permissions</button>`}<button type="button" class="btn btn-ghost btn-sm" data-do="role-collapse">${PERM_GROUPS.every(g=>!RS.closed[g.key])?'Collapse all':'Expand all'}</button></div>
  <label class="field" style="width:100%">${ICON('search')}<input type="search" id="rq" placeholder="Search permissions…" value="${esc(RS.q)}" aria-label="Search permissions"></label></div>
  ${r.locked?`<div style="padding:0 18px 12px">${lockNote('The owner always has every permission, including the owner-only financial ones. This role cannot be edited or deleted.')}</div>`:''}
  ${permGroups({q:RS.q,open:k=>!RS.closed[k],grp:'perm-group',all:'perm-all',tog:'perm-tog',readonly:locked,state:k=>({on:r.locked?(PERM_BY[k].tier!=='platform'):eff.has(k),disabled:locked&&!r.locked?'You need the manage roles permission.':permLock(k,r.locked)})})}`;
}
function roleBar(r){
 const dirty=rdirty();if(!dirty&&!r.isNew)return '';
 const v=rvals(r),was=new Set(r.perms),n=r.locked?PERM_ALL.length:v.perms.size;
 const parts=[];
 if(!r.isNew){const gain=[...v.perms].filter(k=>!was.has(k)).length,lose=r.perms.filter(k=>!v.perms.has(k)).length;
  if(v.name!==r.name)parts.push('renamed');if(v.desc!==r.desc)parts.push('description edited');if(gain)parts.push('+'+gain+' granted');if(lose)parts.push('−'+lose+' removed');if(v.assignable!==(r.assignable!==false))parts.push('assignment rule changed');}
 return `<div class="rbar"><span class="hint"><b class="num">${n}</b> permission${n===1?'':'s'} selected${parts.length?` · <span class="chg">${parts.join(', ')}</span>`:''}</span><button type="button" class="btn btn-ghost" data-do="${r.isNew?'role-cancel':'role-discard'}">Cancel</button><button type="button" class="btn" data-do="role-save">${ICON('check')}${r.isNew?'Create role':'Update role'}</button></div>`;
}
function membersTab(r){
 const people=S.employees.filter(e=>e.roleId===r.id),more=Math.max(r.count-people.length,0),canMove=can('assign:role')&&r.id!=='owner';
 return `${people.length?people.map(e=>`<div class="avrow">${person(e.name,e.role)}<span class="grow"></span>${canMove&&canAssignTo(r)?`<label class="sr" for="mv-${e.id}">Role</label><select id="mv-${e.id}" class="chipf" style="height:34px;padding:0 10px" data-chrole="${e.id}">${assignableRoles(r.id).map(x=>`<option value="${x.id}"${x.id===r.id?' selected':''}>${esc(x.name)}</option>`).join('')}</select>`:`<span class="subtle" style="font-size:12.5px">${canMove?'Owner-assigned role':esc(r.name)}</span>`}</div>`).join(''):`<div class="empty"><b>Nobody holds this role yet</b>Assign it from an employee's profile.</div>`}
  ${more?`<div class="tblfoot"><span>+ ${more} more ${more===1?'person':'people'} not shown in this preview</span></div>`:''}
  <div class="tblfoot"><span class="hint" style="margin-left:0">Everyone holds exactly one role. Moving someone clears their personal permission overrides.</span></div>`;
}
function compareTab(){
 const rs=S.rbac.roles,has=(r,k)=>r.locked?PERM_BY[k].tier!=='platform':r.perms.includes(k);
 return `<div class="tblwrap"><table class="tbl cmp" style="min-width:${300+rs.length*130}px"><thead><tr><th>Permission</th>${rs.map(r=>`<th class="c">${esc(r.name)}</th>`).join('')}</tr></thead><tbody>
  <tr><td class="strong">Can be assigned by non-owners</td>${rs.map(r=>`<td class="c">${r.assignable!==false&&!r.locked?`<span class="dotc">${ICON('check',2.6)}</span>`:'<span class="dotn">–</span>'}</td>`).join('')}</tr>
  ${PERM_GROUPS.map(g=>{
  const open=!!RS.cmp[g.key],list=g.perms.filter(p=>p[3]!=='platform');
  return `<tr class="grp" style="cursor:pointer" data-do="cmp-group" data-g="${g.key}"><td>${esc(g.label)} <span class="subtle" style="text-transform:none;letter-spacing:0;font-weight:500">${open?'· hide':'· show'}</span></td>${rs.map(r=>{const n=list.filter(p=>has(r,p[0])).length;return `<td class="c num" style="color:${n===list.length?'var(--brand)':n?'var(--text)':'var(--text-faint)'}">${n} / ${list.length}</td>`;}).join('')}</tr>${open?list.map(p=>`<tr><td>${esc(p[1])}</td>${rs.map(r=>`<td class="c">${has(r,p[0])?`<span class="dotc">${ICON('check',2.6)}</span>`:'<span class="dotn">–</span>'}</td>`).join('')}</tr>`).join(''):''}`;}).join('')}</tbody></table></div>
  <div class="tblfoot"><span>Read-only overview. Open a role to change what it grants.</span></div>`;
}

/* the designer's KPI cards and charts (restored), from the saved roles */
function rolesOverview(){
 const rs=S.rbac.roles,cells=rs.length*PERM_ALL.length,granted=rs.reduce((a,r)=>a+r.perms.length,0),seg=[{k:'Granted',v:granted,c:'var(--s1)'},{k:'Not accessible',v:cells-granted,c:'var(--s7)'}];
 return strip('four',[
  {k:'Roles',icon:'key',v:rs.length,d:rs.filter(x=>x.sys).length+' built in, '+rs.filter(x=>!x.sys).length+' custom',act:{scroll:'#roleEditor'}},
  {k:'Permissions',icon:'shield',tone:'var(--s3)',v:PERM_ALL.length,d:'in '+PERM_GROUPS.length+' groups',act:{scroll:'#roleEditor'}},
  {k:'People with a role',icon:'users',tone:'var(--s6)',v:roleCountTotal(),d:'one role each',act:{nav:'employees'}},
  {k:'Owner-only',icon:'lock',tone:'var(--warn-dot)',v:PERM_FLAT.filter(p=>p.tier==='owner').length,d:'only the owner can grant'}])
 +`<div class="g wl">${card({title:'Reach by role',sub:'Permissions each role holds',body:bars(rs.map(r=>({k:r.name,v:r.perms.length,vh:r.perms.length+' / '+PERM_ALL.length,c:'var(--brand)'})),{max:PERM_ALL.length,thick:true})})}${card({title:'Permission coverage',sub:'Every role against every permission',cls:'aside',body:donut(seg,{n:pctT(pct(granted,cells),0),l:'granted'},{sw:15})+legend(seg)})}</div>`;
}
UMT.roles={sub:'Who can see and do what in SiteOS. Every employee holds exactly one role.',
 act:()=>(isOwnerUser()?`<button type="button" class="btn btn-ghost" data-do="role-reset">${ICON('reset')}<span class="lb">Reset Admin & Employee to defaults</span></button>`:''),
 render(){
  const r=rsel(),tabs=[['perms',r.isNew?'New role':'Details & permissions'],...(r.isNew?[]:[['members','Members',r.count],['compare','Compare roles']])];
  if(r.isNew)RS.tab='perms';
  const dirty=rdirty();
  return `<div class="page">
   ${rolesOverview()}<div class="rolesplit">${roleList()}
    <section class="qv-card" id="roleEditor"><div class="qv-hd rtitle"><div class="grow"><h3>${r.isNew?'New role':'Edit role: '+esc(rvals(r).name||r.name)}</h3><div class="s">${r.isNew?'Name it, then choose what it can do.':r.locked?'Locked':(r.sys?'Built in':'Custom')+' · '+r.count+' '+(r.count===1?'person':'people')}</div></div>${dirty&&!r.isNew?pill('warn','Unsaved changes',1):''}${r.isNew?pill('info','Not saved yet'):''}</div>
     <div class="tabs" role="tablist">${tabs.map(t=>`<button type="button" role="tab" class="tab${RS.tab===t[0]?' on':''}" aria-selected="${RS.tab===t[0]}" data-do="role-tab" data-t="${t[0]}">${t[1]}${t[2]!=null?`<span class="tc num">${t[2]}</span>`:''}</button>`).join('')}</div>
     ${RS.tab==='perms'?detailsCard(r)+permsPane(r):RS.tab==='members'?membersTab(r):compareTab()}
     ${roleBar(r)}
    </section></div></div>`;
 },
 mount(root){
  const bind=(id,fn)=>{const el=$('#'+id,root);if(!el)return;el.addEventListener('input',()=>{const pos=el.selectionStart;fn(el.value);rerender(true);setTimeout(()=>{const n=$('#'+id);if(n){n.focus();try{n.setSelectionRange(pos,pos);}catch(e){}}});});};
  bind('rn',v=>{ensureDraft().name=v;RS.err={};GUARD.dirty=rdirty();});
  bind('rd',v=>{ensureDraft().desc=v;GUARD.dirty=rdirty();});
  bind('rq',v=>{RS.q=v;});
  bind('rlq',v=>{RS.lq=v;});
 }};

/* ---------- actions ---------- */
function afterDraft(){GUARD.dirty=rdirty();rerender(true);}
DO['perm-group']=d=>{RS.closed[d.g]=!RS.closed[d.g];rerender(true);};
DO['role-collapse']=()=>{const allOpen=PERM_GROUPS.every(g=>!RS.closed[g.key]);PERM_GROUPS.forEach(g=>RS.closed[g.key]=allOpen);rerender(true);};
DO['perm-tog']=d=>{const dr=ensureDraft();dr.perms.has(d.k)?dr.perms.delete(d.k):dr.perms.add(d.k);afterDraft();};
DO['perm-all']=d=>{const dr=ensureDraft(),g=PERM_GROUPS.find(x=>x.key===d.g);g.perms.forEach(p=>{if(permLock(p[0],false))return;d.on==='1'?dr.perms.add(p[0]):dr.perms.delete(p[0]);});afterDraft();};
DO['role-grant-all']=()=>{const dr=ensureDraft();PERM_FLAT.forEach(p=>{if(!permLock(p.k,false))dr.perms.add(p.k);});afterDraft();};
DO['role-revoke-all']=()=>{const dr=ensureDraft();PERM_FLAT.forEach(p=>{if(!permLock(p.k,false))dr.perms.delete(p.k);});afterDraft();};
DO['role-assignable']=()=>{const dr=ensureDraft();dr.assignable=!dr.assignable;afterDraft();};
DO['role-tab']=d=>{RS.tab=d.t;rerender(true);};
DO['cmp-group']=d=>{RS.cmp[d.g]=!RS.cmp[d.g];rerender(true);};
async function leaveRole(){
 if(!rdirty())return true;
 const r=rsel();
 return dialog({title:'Discard unsaved changes?',body:r.isNew?'This new role hasn’t been created yet. Leaving will lose it.':`You changed <b>${esc(r.name)}</b> but haven’t saved. Switching roles will lose those edits.`,okLabel:'Discard',danger:true,keep:'Keep editing'});
}
function openRole(id){RS.id=id;RS.draft=null;RS.q='';RS.err={};RS.tab='perms';GUARD.dirty=false;rerender(true);}
DO['role-pick']=async d=>{if(d.id===RS.id)return;if(!(await leaveRole()))return;if(!isNewRole())RS.prev=RS.id;openRole(d.id);};
DO['role-new']=async()=>{
 if(isNewRole()&&!rdirty()){return;}
 if(!(await leaveRole()))return;
 if(!isNewRole())RS.prev=RS.id;
 RS.id='__new';RS.draft={id:'__new',name:'',desc:'',assignable:true,perms:new Set()};RS.closed={};RS.q='';RS.err={};RS.tab='perms';GUARD.dirty=false;rerender(true);
 setTimeout(()=>{const n=$('#rn');if(n)n.focus();},60);
};
DO['role-cancel']=async()=>{if(!(await leaveRole()))return;openRole(S.rbac.roles.find(r=>r.id===RS.prev)?RS.prev:'admin');};
DO['role-discard']=()=>{RS.draft=null;RS.err={};GUARD.dirty=false;rerender(true);};
document.addEventListener('change',e=>{const s=e.target.closest('[data-rstart]');if(!s)return;const src=roleOf(s.value),dr=ensureDraft();dr.perms=new Set(src?src.perms.filter(k=>!permLock(k,false)):[]);afterDraft();});
DO['role-save']=()=>{
 const r=rsel(),d=rdraft();if(!d)return;
 const name=d.name.trim();let err='';
 if(!name)err='Role name is required';
 else if(S.rbac.roles.some(x=>x.name.toLowerCase()===name.toLowerCase()&&x.id!==r.id))err='A role with this name already exists';
 if(err){RS.err={name:err};rerender(true);setTimeout(()=>{const n=$('#rn');if(n)n.focus();});toastErr('Can’t save the role',err);return;}
 if(r.isNew){
  const id=slug(name)+'-'+Math.random().toString(36).slice(2,5);
  S.rbac.roles.push({id,name,desc:d.desc.trim()||'Custom role.',sys:false,count:0,assignable:d.assignable,perms:[...d.perms]});
  RS.prev=id;RS.id=id;RS.draft=null;RS.err={};GUARD.dirty=false;rerender(true);toast('Role created',name+' · '+d.perms.size+' permissions');return;
 }
 const was=new Set(r.perms),gain=[...d.perms].filter(k=>!was.has(k)).length,lose=r.perms.filter(k=>!d.perms.has(k)).length;
 if(!r.sys)r.name=name;r.desc=d.desc.trim();r.assignable=d.assignable;r.perms=[...d.perms];
 RS.draft=null;RS.err={};GUARD.dirty=false;rerender(true);
 toast('Role updated',`${r.name}: ${gain} granted, ${lose} removed. ${r.count} ${r.count===1?'person gets':'people get'} it on their next page load.`);
};
DO['role-del']=async d=>{
 const r=roleOf(d.id);
 if(r.count>0){toastErr('Can’t delete '+r.name,'Still held by '+r.count+' '+(r.count===1?'person':'people')+'. Move them to another role first, then delete it.');return;}
 if(!(await dialog({title:'Delete role?',body:`<b>${esc(r.name)}</b> will be removed. Nobody holds it, so no one loses access. This can’t be undone.`,okLabel:'Delete role',danger:true})))return;
 S.rbac.roles=S.rbac.roles.filter(x=>x!==r);if(RS.id===r.id){RS.draft=null;GUARD.dirty=false;RS.id=S.rbac.roles.find(x=>x.id==='admin')?'admin':S.rbac.roles[0].id;}rerender(true);toast('Role deleted',r.name);
};
DO['role-reset']=async()=>{
 if(!(await dialog({title:'Reset Admin & Employee to defaults?',body:'Both built-in roles go back to the permissions SiteOS ships with. Custom roles are not touched. People keep their role.',okLabel:'Reset defaults',danger:true})))return;
 S.rbac.roles.filter(r=>r.sys&&!r.locked).forEach(r=>{const o=INIT.rbac.roles.find(x=>x.id===r.id);r.perms=o.perms.slice();r.assignable=o.assignable;});RS.draft=null;GUARD.dirty=false;rerender(true);toast('Defaults restored','Admin and Employee are back to their original permissions.');
};
/* one role per person; switching it clears personal overrides */
async function moveRole(empId,toId){
 const e=empBy(empId),from=roleOf(e.roleId),to=roleOf(toId);
 if(!canAssignTo(to)){toastErr('Only the owner can assign '+to.name,'This role isn’t open to non-owners. Ask the company owner.');return false;}
 if(!canAssignTo(from)){toastErr('Only the owner can change this role','Ask the company owner to move '+e.name+'.');return false;}
 const n=Object.keys(e.ovr||{}).length;
 const ok=await dialog({title:`Move ${e.name} to ${to.name}?`,body:`They will have exactly what <b>${esc(to.name)}</b> grants.${n?` Their ${n} personal permission override${n>1?'s':''} will be cleared.`:' Any personal permission overrides would be cleared.'}`,okLabel:'Move',keep:'Cancel'});
 if(!ok)return false;
 from.count=Math.max(from.count-1,0);to.count++;e.roleId=toId;e.ovr={};
 toast('Role changed',e.name+' is now '+to.name);return true;
}
document.addEventListener('change',async e=>{
 const s=e.target.closest('[data-chrole]');if(!s)return;
 const emp=empBy(s.dataset.chrole);if(!(await moveRole(emp.id,s.value)))s.value=emp.roleId;rerender(true);
});
