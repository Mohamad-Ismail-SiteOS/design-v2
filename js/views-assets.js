/* =====================================================================
   Assets. Follows the shipped screens:
   - Assets | Locations tabs; search, status, employee filters; Import, Add Asset, Export, Delete All
   - row: Check Out, or Check In + Transfer; Edit / Delete
   - Locations: Vehicles, Job sites, Employees, Others (Add / Rename / Delete)
   - detail: collapsible sections + Expand all; Add asset (bulk: Add another asset, Add all)
   - Check Out / Transfer / Return pages; Import wizard (Upload file, Map & review, Done)
   The designer's KPI cards and charts stay on the list page (wrapped, not rebuilt).
   ===================================================================== */
const canAssign=()=>can('assign:asset');
const ttState=a=>!a.needsTT?null:a.days<0?['bad','Tag expired']:a.days<=14?['warn','Due in '+a.days+' d']:['ok','Valid'];
const ttBlocked=a=>a.needsTT&&a.days<0;
const curAssign=a=>[...a.history].reverse().find(h=>!h.returned);
const uniq=(arr)=>[...new Set(arr.filter(Boolean))];
const supplierOpts=()=>uniq(S.assets.map(a=>a.supplier)),mfrOpts=()=>uniq(S.assets.map(a=>a.mfr)),deptOpts=()=>uniq(S.assets.map(a=>a.dept));

/* ---------- list config (columns as the designer drew them, plus the shipped actions) ---------- */
function assetRowActions(r){
 const go_=(p,ic,label,dis)=>`<button type="button" class="btn btn-sm btn-sq ${p==='checkout'?'':'btn-ghost'}" data-go="assets/${r.id}/${p}" aria-label="${label}" title="${dis||label}"${dis?' disabled':''}>${ICON(ic)}</button>`;
 const items=[can('edit:asset')&&'edit:Edit asset',can('delete:asset')&&'del:Delete:danger'].filter(Boolean);
 const main=!canAssign()?'':r.st==='in'?go_('checkout','next','Check out',ttBlocked(r)?'Test & tag expired. Blocked from check-out':''):r.st==='out'?go_('return','download','Check in')+go_('transfer','route','Transfer'):'';
 return `<div class="acts">${main}${items.length?`<button type="button" class="rowbtn" data-do="row-menu" data-kind="ast" data-id="${r.id}" data-items="${items.join('|')}" aria-label="More actions" aria-haspopup="menu">${ICON('more')}</button>`:''}</div>`;
}
function ASSET_LIST(){
 return {href:r=>'assets/'+r.id,rows:S.assets,
  tabs:[{key:'all',label:'All'},{key:'out',label:'Deployed'},{key:'in',label:'Available'},{key:'svc',label:'Needs attention'}],
  tabOf:(r,k)=>k==='all'||r.st===k||(k==='svc'&&(r.st==='service'||r.st==='lost'||ttBlocked(r))),
  search:'Search by name, Asset ID or serial number',filters:[{label:'Tag due soon',test:r=>r.needsTT&&r.days<=14},{label:'Requires test & tag',test:r=>r.needsTT},{label:'Power tools',test:r=>r.cat==='Power tools'}],
  text:r=>r.name+' '+r.assetId+' '+r.serial+' '+r.holder+' '+r.cat+' '+r.mfr,minW:1180,
  cols:[{h:'Asset',v:r=>`<div class="cell"><span class="thumb">${ICON('box')}</span><span class="tx"><b>${esc(r.name)}</b><small><span class="mono">${esc(r.assetId)}</span> · ${esc(r.cat)}</small></span></div>`},{h:'Serial',v:r=>`<span class="mono" style="font-size:12px">${esc(r.serial)}</span>`},
   {h:'Deployed to',v:r=>r.holder?person(r.holder,r.since):r.veh?esc('Vehicle · '+r.veh):r.st==='in'||r.st==='service'?`<span class="dash">${esc(r.place||'Enfield store')}</span>`:'<span class="dash">—</span>'},{h:'Job site',v:r=>r.loc==='Store'?'<span class="dash">—</span>':jobTag(r.loc)},
   {h:'Test & tag',v:r=>{const t=ttState(r);return t?(r.days<0?`<b style="color:var(--bad)">${esc(r.tag)}</b>`:r.days<=14?`<b style="color:var(--warn)">${esc(r.tag)}</b> <small class="subtle">in ${r.days} d</small>`:esc(r.tag)):'<span class="dash">Not required</span>';}},
   {h:'Value',r:1,v:r=>money(r.val)},{h:'Status',v:r=>pill(AS[r.st][0],AS[r.st][1],1)}],
  action:r=>assetRowActions(r)};
}

/* ---------- page: Assets | Locations ---------- */
const ASSETS_CORE=VIEWS.assets.render;
VIEWS.assets.sub='Tools register: who has what, and when it’s due for test and tag.';
VIEWS.assets.act=()=>{
 const m=['export:Export',can('delete:asset')&&'delall:Delete all assets:danger'].filter(Boolean);
 return btn('Scan barcode','search','Scan barcode|Point the phone camera at the asset label',1)
  +(can('add:asset')?`<button type="button" class="btn btn-ghost" data-go="assets/import">${ICON('upload')}<span class="lb">Import</span></button>`:'')
  +`<button type="button" class="btn btn-ghost" data-do="row-menu" data-kind="astact" data-id="x" data-items="${m.join('|')}" aria-haspopup="menu" aria-label="More">${ICON('more')}</button>`
  +(can('add:asset')?`<button type="button" class="btn" data-go="assets/new">${ICON('plus')}<span class="lb">Add asset</span></button>`:'');
};
const astTabs=()=>{const t=UI.astTab||'assets';return `<div class="tabs ptabs" role="tablist">${[['assets','Assets',S.assets.length],['locations','Locations',null]].map(([k,l,n])=>`<button type="button" role="tab" class="tab${t===k?' on':''}" aria-selected="${t===k}" data-do="ast-tab" data-t="${k}">${l}${n!=null?`<span class="tc num">${n}</span>`:''}</button>`).join('')}</div>`;};
VIEWS.assets.render=function(){
 if((UI.astTab||'assets')==='locations')return `<div class="page">${astTabs()}${locationsTab()}</div>`;
 return `<div class="page">${astTabs()}${ASSETS_CORE.call(this).replace(/^\s*<div class="page">/,'').replace(/<\/div>\s*$/,'')}</div>`;
};
DO['ast-tab']=d=>{UI.astTab=d.t;rerender(true);};
DO['astact-export']=()=>toast('Export ready','A CSV of the register is downloading');
DO['astact-delall']=async()=>{if(!(await dialog({title:'Delete all assets?',body:`All <b>${S.assets.length}</b> assets, their history and documents are removed. This can’t be undone.`,typed:'DELETE ALL',okLabel:'Delete all',danger:true})))return;S.assets=[];rerender(true);toast('Register cleared');};
DO['ast-edit']=d=>go('assets/'+d.id+'/edit');
DO['ast-del']=async d=>{const a=astBy(d.id);if(a.st==='out'){toastErr('Can’t delete a deployed asset','Check '+a.name+' in first.');return;}if(!(await dialog({title:'Delete tool?',body:`<b>${esc(a.name)}</b> (${esc(a.assetId)}) and its history are removed.`,okLabel:'Delete',danger:true})))return;S.assets=S.assets.filter(x=>x!==a);rerender(true);toast('Tool deleted',a.name);};

/* ---------- Locations tab ---------- */
const inLoc=(type,key)=>S.assets.filter(a=>type==='vehicle'?a.veh===key:type==='job'?a.loc===key&&!a.veh:type==='employee'?a.holder===key:a.place===key&&!a.holder&&!a.veh&&a.loc==='Store');
function locSection(title,type,rows,empty,extra){
 return `<section class="qv-card"><div class="qv-hd"><div class="grow"><h3>${title}</h3><div class="s">${rows.length} ${rows.length===1?extra[0]:extra[1]}</div></div>${type==='other'&&can('edit:asset')?`<div class="meta"><button type="button" class="btn btn-sm" data-do="loc-new">${ICON('plus')}Add Location</button></div>`:''}</div>
  ${rows.length?`<div class="tblwrap"><table class="tbl" style="min-width:560px"><thead><tr><th>Name</th><th class="r">Tools</th><th class="act"></th></tr></thead><tbody>${rows.map(r=>`<tr class="link" data-href="assets/locations/${type}/${encodeURIComponent(r.key)}"><td class="strong">${r.dot?`<i class="sq" style="background:${r.dot};display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:8px"></i>`:''}${esc(r.name)}${r.sub?` <small class="subtle">${esc(r.sub)}</small>`:''}</td><td class="r num">${inLoc(type,r.key).length}</td><td>${type==='other'&&can('edit:asset')?`<button type="button" class="rowbtn" data-do="row-menu" data-kind="loc" data-id="${r.key}" data-items="rename:Rename|del:Delete:danger" aria-label="More actions" aria-haspopup="menu">${ICON('more')}</button>`:''}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty"><b>${empty}</b></div>`}</section>`;
}
function locationsTab(){
 const veh=S.vehicles.map(v=>({key:v.name,name:v.name,sub:v.rego})),jobs=S.jobs.filter(j=>!j.arch).map(j=>({key:j.name,name:j.name,sub:j.code,dot:j.c}));
 const emp=uniq(S.assets.map(a=>a.holder)).map(n=>({key:n,name:n})),oth=S.locations.map(l=>({key:l.name,name:l.name}));
 return `${locSection('Vehicles','vehicle',veh,'No vehicles yet',['vehicle','vehicles'])}${locSection('Job sites','job',jobs,'No job sites yet',['site','sites'])}${locSection('Employees','employee',emp,'No assets checked out to employees',['employee','employees'])}${locSection('Others','other',oth,'No other locations yet',['location','locations'])}`;
}
DO['loc-new']=()=>locDrawer();
function locDrawer(l){drawer({title:l?'Rename Location':'Add Location',okLabel:'Save',rules:{name:v=>S.locations.some(x=>x!==l&&x.name.toLowerCase()===v.toLowerCase())?'A location with this name already exists':''},
 body:`<div class="fgrid">${fld({name:'name',label:'Location',req:true,span:6,value:l?l.name:'',ph:'e.g. Main Warehouse',max:80})}</div>`,
 onOk:d=>{if(l){S.assets.forEach(a=>{if(a.place===l.name)a.place=d.name;});l.name=d.name;}else S.locations.push({id:'l'+Date.now(),name:d.name});rerender(true);toast(l?'Location renamed':'Location added',d.name);}});}
DO['loc-rename']=d=>locDrawer(S.locations.find(l=>l.name===d.id));
DO['loc-del']=async d=>{const l=S.locations.find(x=>x.name===d.id),n=inLoc('other',l.name).length;if(n){toastErr('Can’t delete '+l.name,n+' asset'+(n>1?'s are':' is')+' stored here. Move '+(n>1?'them':'it')+' first.');return;}if(!(await dialog({title:'Delete Location',body:`<b>${esc(l.name)}</b> will be removed.`,okLabel:'Delete',danger:true})))return;S.locations=S.locations.filter(x=>x!==l);rerender(true);toast('Location deleted',l.name);};
VIEWS['asset-location']={path:'assets/locations/:type/:id',parent:'assets',perm:'view:asset',
 title:()=>decodeURIComponent(P.id),sub:()=>({vehicle:'Vehicle',job:'Job site',employee:'Employee',other:'Location'})[P.type]+' · assets held here',
 crumbs:()=>[['Assets','assets'],['Locations','assets'],[decodeURIComponent(P.id)]],
 render(){
  UI.astTab='locations';const list=inLoc(P.type,decodeURIComponent(P.id));
  return `<div class="page"><section class="qv-card"><div class="qv-hd"><div class="grow"><h3>${list.length} tool${list.length===1?'':'s'}</h3><div class="s">Select one to see its history</div></div></div>${list.length?`<div class="tblwrap"><table class="tbl" style="min-width:760px"><thead><tr><th>Asset</th><th>Category</th><th>Test & tag</th><th>Status</th><th class="act"></th></tr></thead><tbody>${list.map(r=>`<tr class="link" data-href="assets/${r.id}"><td><div class="cell"><span class="thumb">${ICON('box')}</span><span class="tx"><b>${esc(r.name)}</b><small class="mono">${esc(r.assetId)}</small></span></div></td><td>${esc(r.cat)}</td><td>${(()=>{const t=ttState(r);return t?pill(t[0],t[1]):'<span class="dash">Not required</span>';})()}</td><td>${pill(AS[r.st][0],AS[r.st][1],1)}</td><td>${assetRowActions(r)}</td></tr>`).join('')}</tbody></table></div>`:emptyBlock('box','No tools here','Check a tool in to this location and it appears here.')}</section></div>`;
 }};

/* ---------- detail ---------- */
const astKeys=a=>['details','history','images','docs','notes'].map(k=>'ast:'+a.id+':'+k);
function astHero(a){
 const t=ttState(a);
 return hero({sq:true,ini:'⚒',title:a.name,pills:[pill(AS[a.st][0],AS[a.st][1],1),...(t?[pill(t[0],'Test & tag · '+t[1])]:[])],sub:`<span class="mono">${esc(a.assetId)}</span> · ${esc(a.cat)} · ${esc(a.serial)}`,
  meta:[['pin',esc(locName(a))],...(a.mfr?[['box',esc(a.mfr)]]:[]),...(a.needsTT?[['timer','Next test '+esc(a.tag)]]:[])],
  actions:(canAssign()&&a.st==='in'?`<button type="button" class="btn" data-go="assets/${a.id}/checkout"${ttBlocked(a)?' disabled title="Test & tag expired. Blocked from check-out"':''}>${ICON('next')}<span class="lb">Check Out</span></button>`:'')
   +(canAssign()&&a.st==='out'?`<button type="button" class="btn btn-ghost" data-go="assets/${a.id}/transfer">${ICON('route')}<span class="lb">Transfer</span></button><button type="button" class="btn" data-go="assets/${a.id}/return">${ICON('download')}<span class="lb">Check In</span></button>`:'')
   +(can('edit:asset')?`<button type="button" class="btn btn-ghost" data-go="assets/${a.id}/edit">${ICON('edit')}<span class="lb">Edit</span></button>`:'')
   +(can('delete:asset')?`<button type="button" class="btn btn-danger" data-do="ast-del" data-id="${a.id}" aria-label="Delete">${ICON('trash')}</button>`:'')});
}
VIEWS['asset-detail']={path:'assets/:id',parent:'assets',perm:'view:asset',title:'Asset details',sub:()=>{const a=astBy(P.id);return a?a.assetId+' · '+a.name:'';},
 crumbs:()=>{const a=astBy(P.id);return [['Assets','assets'],[a?a.name:'Not found']];},
 act:()=>{const a=astBy(P.id);return a?`<button type="button" class="btn btn-ghost" data-do="acc-all" data-keys="${astKeys(a).join(',')}">${ICON('sliders')}<span class="lb">${astKeys(a).every(k=>accIsOpen(k))?'Collapse all':'Expand all'}</span></button>`:'';},
 render(){
  UI.astTab='assets';const a=astBy(P.id);if(!a)return notFound('Asset','assets');
  const t=ttState(a),hist=a.history.slice().reverse();
  return `<div class="page">${astHero(a)}
   ${strip('four',[{k:'Status',icon:'box',tone:'var(--s3)',v:`<span style="font-size:22px">${AS[a.st][1]}</span>`,d:a.st==='out'?'since '+(a.since||'recently').replace('since ',''):'in the register'},{k:'Where it is',icon:'pin',tone:'var(--s6)',v:`<span style="font-size:18px;line-height:1.2;display:block">${esc(a.holder||a.veh||(a.loc!=='Store'?a.loc:a.place)||'—')}</span>`,d:locName(a)},{k:'Test & tag',icon:'timer',tone:t?(t[0]==='bad'?'var(--bad-dot)':t[0]==='warn'?'var(--warn-dot)':'var(--ok)'):'var(--s7)',v:t?`<span style="font-size:20px">${t[1]}</span>`:'<span style="font-size:20px">Not required</span>',d:a.needsTT?'Next due '+a.tag:'This asset isn’t tagged'},{k:'Replacement value',icon:'card',tone:'var(--s4)',v:money(a.val),d:'purchase cost '+(a.cost?'A$'+N(a.cost):'on file')}])}
   ${acc('ast:'+a.id+':details','box','Details',kv([['Asset ID',`<span class="mono">${esc(a.assetId)}</span>`],['Name',esc(a.name)],['Serial number',`<span class="mono">${esc(a.serial)}</span>`],['Status',pill(AS[a.st][0],AS[a.st][1],1)],['Manufacturer',esc(a.mfr||'—')],['Supplier',esc(a.supplier||'—')],['Department',esc(a.dept||'—')],['Location',esc(locName(a))],['Order number',esc(a.orderNo||'—')],['Purchase date',a.bought?esc(fmtDL(a.bought)):'—'],['Purchase cost',money(a.val)],['Warranty expiry',a.warranty?esc(fmtDL(a.warranty))+(daysTo(a.warranty)<0?' '+pill('bad','Expired'):''):'—'],['Requires test & tag',a.needsTT?'Yes':'No'],['Next test due',a.needsTT?esc(a.tag):'—']]),{open:true})}
   ${acc('ast:'+a.id+':history','history','Assignment history',hist.length?`<div class="tblwrap"><table class="tbl" style="min-width:640px"><thead><tr><th>Taken</th><th>Returned</th><th>Who / where</th><th>Condition</th><th>Notes</th></tr></thead><tbody>${hist.map(h=>`<tr><td>${esc(fmtDL(h.taken))}</td><td>${h.returned?esc(fmtDL(h.returned)):pill('info','Currently out',1)}</td><td class="strong">${esc(h.target||h.who)}</td><td>${pill(h.cond==='good'?'ok':h.cond==='fair'?'warn':'bad',cap(h.cond))}</td><td style="white-space:normal;color:var(--text-subtle)">${esc(h.notes||'—')}</td></tr>`).join('')}</tbody></table></div>`:'<div class="subtle">No assignment history yet</div>',{open:true,meta:hist.length?'<span class="tc num">'+hist.length+'</span>':''})}
   ${acc('ast:'+a.id+':images','eye','Images',`<div class="phg">${Array.from({length:a.images},(_,i)=>`<span class="ph">${ICON('eye')}</span>`).join('')||'<span class="subtle">No images attached yet</span>'}</div>${can('edit:asset')?`<div style="margin-top:12px"><button type="button" class="btn btn-ghost btn-sm" data-do="ast-img" data-id="${a.id}">${ICON('upload')}Add images</button></div>`:''}`)}
   ${acc('ast:'+a.id+':docs','file','Invoice and documents',(a.docs.map(d=>`<div class="docrow" style="padding:11px 0"><span class="ft">DOC</span><div class="grow"><b>${esc(d.name)}${d.files>1?' <span class="subtle" style="font-weight:500">· '+d.files+' files</span>':''}</b><small>Uploaded ${esc(d.added)} by ${esc(d.by)}</small></div></div>`).join('')||'<div class="subtle">No documents attached yet</div>')+(can('edit:asset')?`<div style="margin-top:12px"><button type="button" class="btn btn-ghost btn-sm" data-do="ast-doc" data-id="${a.id}">${ICON('plus')}Add document</button></div>`:''))}
   ${acc('ast:'+a.id+':notes','doc','Notes',a.notes?`<p style="font-size:13.5px;line-height:1.6;color:var(--text-muted)">${esc(a.notes)}</p>`:'<div class="subtle">No notes</div>')}
  </div>`;
 }};
DO['ast-img']=d=>{const a=astBy(d.id);drawer({title:'Add images',sub:a.name,okLabel:'Add images',rules:{file:{always:true,fn:v=>v?'':'Choose at least one image'}},body:`<div class="fgrid">${drop('file','Images','JPG or PNG, max 50 MB each',true)}</div>`,onOk:()=>{a.images+=Math.max((($('#drawer input[type=file]')||{}).files||[]).length,1);rerender(true);toast('Images added',a.name);}});};
DO['ast-doc']=d=>{const a=astBy(d.id);jobDocDrawer(doc=>{a.docs.push(doc);rerender(true);});};

/* ---------- add / edit (bulk on add) ---------- */
const AF={n:0};
function assetCard(idx,x,nw,deployed){
 const p='a'+idx+'_',sel=(k,l,opts,v)=>selAdd({name:p+k,label:l,value:v||'Select',opts:['Select',...opts],span:3,what:l});
 return `<section class="qv-card fsec afcard" data-p="${p}"><div class="qv-hd"><div class="grow"><h3>${nw?'Asset '+(idx+1):'Asset details'}</h3><div class="s">${nw?'Enter an Asset ID or a Serial Number. Every asset needs at least one.':'Changes apply straight away.'}</div></div>${nw&&idx>0?`<div class="meta"><button type="button" class="btn btn-ghost btn-sm" data-do="af-rm" data-p="${p}">${ICON('trash')}Remove</button></div>`:''}</div><div class="qv-body fgrid">
  ${fld({name:p+'assetId',label:'Asset ID',value:x.assetId,span:3,ph:'e.g. DSC-00379',max:40})}${fld({name:p+'name',label:'Asset name',req:true,value:x.name,span:3,ph:'e.g. Cordless Drill',max:150,help:'150 characters or fewer'})}
  ${fld({name:p+'serial',label:'Serial number',value:x.serial,span:3,max:60})}
  ${fld({name:p+'status',label:'Status',type:'select',value:x.st,span:3,opts:deployed?[['out','Deployed']]:[['in','Available'],['service','Maintenance'],['retired','Retired'],['lost','Lost']],disabled:deployed,help:deployed?'In use. Return the tool to change its status.':''})}
  ${sel('supplier','Supplier',supplierOpts(),x.supplier)}${sel('mfr','Manufacturer',mfrOpts(),x.mfr)}${sel('place','Location',S.locations.map(l=>l.name),x.place)}${sel('dept','Department',deptOpts(),x.dept)}
  ${fld({name:p+'notes',label:'Notes',type:'textarea',rows:2,value:x.notes,span:6,max:500})}
  ${fld({name:p+'orderNo',label:'Order number',value:x.orderNo,span:2,ph:'e.g. PO-1042',max:40})}${fld({name:p+'bought',label:'Purchase date',type:'date',value:x.bought,span:2})}${fld({name:p+'cost',label:'Purchase cost',type:'money',value:x.val||'',span:2,suffix:'AUD'})}
  ${fld({name:p+'warranty',label:'Warranty expiry',type:'date',value:x.warranty,span:3})}
  ${tgl({name:p+'tt',label:'Requires Test & Tag',help:'Electrical tools are tagged on a schedule. Expired tags block check-out.',value:x.needsTT}).replace('data-ftog="'+p+'tt"','data-ftog="'+p+'tt" data-fchange="rev"')}
  <div class="fgrid s6" data-rev="${p}tt"${x.needsTT?'':' hidden'} style="grid-column:span 6;padding:0">${fld({name:p+'next',label:'Next test due',type:'date',value:x.nextDue||'',span:3,help:'Leave empty to use today + the company interval.'})}</div>
  ${drop(p+'images','Images','JPG or PNG, max 50 MB',true)}${drop(p+'invoice','Invoice','PDF or image, max 50 MB',true)}${drop(p+'docs','Documents','Any files, max 50 MB each',true)}</div></section>`;
}
const blankAsset=()=>({assetId:'',name:'',serial:'',st:'in',supplier:'',mfr:'',place:'',dept:'',notes:'',orderNo:'',bought:'',val:'',warranty:'',needsTT:false,nextDue:''});
function assetForm(a){
 const nw=!a;AF.n=1;
 return `<form class="formpage" data-form novalidate onsubmit="return false" id="astForm" data-id="${nw?'':a.id}" style="max-width:980px">
  <div id="afCards">${assetCard(0,a?{...a,nextDue:a.needsTT?addDays(TODAY_ISO,a.days):'',place:a.place||''}:blankAsset(),nw,a&&a.st==='out')}</div>
  <div class="fbar"><span class="hint">${nw?'Nothing saved yet':'No changes yet'}</span>${nw?`<button type="button" class="btn btn-ghost" data-do="af-add">${ICON('plus')}Add another asset</button>`:''}<button type="button" class="btn btn-ghost" data-go="assets">Cancel</button><button type="button" class="btn" data-do="af-save" data-fsave${nw?'':' disabled'}>${ICON('check')}<span id="afLbl">${nw?'Add asset':'Save changes'}</span></button></div></form>`;
}
VIEWS['asset-new']={path:'assets/new',parent:'assets',perm:'add:asset',title:'Add Asset',sub:'Add one tool, or several at once with “Add another asset”.',crumbs:()=>[['Assets','assets'],['Add asset']],
 render(){return assetForm(null);}};
VIEWS['asset-edit']={path:'assets/:id/edit',parent:'assets',perm:'edit:asset',title:'Edit asset',sub:'Changes apply straight away.',crumbs:()=>{const a=astBy(P.id);return [['Assets','assets'],[a?a.name:'Not found','assets/'+P.id],['Edit']];},render(){const a=astBy(P.id);return a?assetForm(a):notFound('Asset','assets');}};
DO['af-add']=()=>{const box=$('#afCards');if(!box)return;const i=AF.n++;box.insertAdjacentHTML('beforeend',assetCard(i,blankAsset(),true,false));const c=$$('.afcard').length;$('#afLbl').textContent=c>1?'Add '+c+' assets':'Add asset';markDirty($('#astForm'));const f=$('[name="a'+i+'_assetId"]');if(f){f.scrollIntoView({block:'center'});f.focus();}};
DO['af-rm']=d=>{const c=$('.afcard[data-p="'+d.p+'"]');if(c)c.remove();const n=$$('.afcard').length;$('#afLbl').textContent=n>1?'Add '+n+' assets':'Add asset';markDirty($('#astForm'));};
DO['af-save']=()=>{
 const form=$('#astForm'),id=form.dataset.id,edit=id?astBy(id):null,cards=$$('.afcard',form),out=[];let bad=0;
 cards.forEach(card=>{
  const p=card.dataset.p,rules={};rules[p+'name']=v=>v.length>150?'Keep it to 150 characters or fewer':'';
  rules[p+'cost']=v=>v&&(isNaN(Number(v))||Number(v)<0)?'Enter an amount of $0 or more':'';
  const d=validate(card,rules);let ok=!!d;const g=k=>(d||readForm(card))[p+k];
  if(!g('assetId')&&!g('serial')){['assetId','serial'].forEach(k=>{const el=$('[name="'+p+k+'"]',card),f=el.closest('.fld');f.classList.add('err');$('#e-'+p+k,card).textContent='Enter an Asset ID or a Serial Number. Every asset needs at least one.';});ok=false;}
  const dup=S.assets.find(a=>a!==edit&&((g('assetId')&&a.assetId.toLowerCase()===g('assetId').toLowerCase())||(g('serial')&&a.serial.toLowerCase()===g('serial').toLowerCase())));
  if(dup){const k=g('assetId')&&dup.assetId.toLowerCase()===g('assetId').toLowerCase()?'assetId':'serial';const el=$('[name="'+p+k+'"]',card);el.closest('.fld').classList.add('err');$('#e-'+p+k,card).textContent='Another asset already uses this '+(k==='assetId'?'Asset ID':'serial number');ok=false;}
  if(!ok){bad++;return;}
  out.push({p,d:readForm(card)});
 });
 if(bad)return toastErr('Can’t save yet','Fix the highlighted fields'+(cards.length>1?' in '+bad+' of '+cards.length+' assets':'')+'.');
 const val=(d,p,k)=>{const v=d[p+k];return v==='Select'?'':v;};
 out.forEach(({p,d})=>{
  const tt=d[p+'tt']==='1',next=d[p+'next']||addDays(TODAY_ISO,180),rec={assetId:d[p+'assetId'],name:d[p+'name'],serial:d[p+'serial'],supplier:val(d,p,'supplier'),mfr:val(d,p,'mfr'),place:val(d,p,'place'),dept:val(d,p,'dept'),notes:d[p+'notes'],orderNo:d[p+'orderNo'],bought:d[p+'bought'],val:d[p+'cost']?Number(d[p+'cost']):0,warranty:d[p+'warranty'],needsTT:tt,tag:tt?fmtDL(next).replace(/^\w+ /,''):'—',days:tt?daysTo(next):999};
  if(edit){if(edit.st!=='out')rec.st=d[p+'status'];Object.assign(edit,rec);}
  else S.assets.unshift({...rec,id:'ast-'+(rec.assetId||rec.serial).replace(/\W/g,'').toLowerCase(),cat:'General',holder:'',since:'',loc:'Store',st:d[p+'status'],veh:'',images:0,docs:[],history:[{who:ME.name,type:'Location',target:rec.place||'Enfield store',taken:TODAY_ISO,returned:TODAY_ISO,cond:'good',notes:'Added to the register'}]});
 });
 GUARD.dirty=false;toast(edit?'Asset updated':out.length+' asset'+(out.length>1?'s':'')+' added',edit?edit.name:out.map(o=>o.d[o.p+'name']).slice(0,2).join(', ')+(out.length>2?' and '+(out.length-2)+' more':''));go(edit?'assets/'+edit.id:'assets');
};

/* ---------- Check Out / Transfer / Return pages ---------- */
function targetField(type,val){
 const lists={employee:S.employees.filter(e=>e.st==='active').map(e=>[e.name,e.name+' · '+e.role]),job:S.jobs.filter(j=>!j.arch).map(j=>[j.name,j.name]),vehicle:S.vehicles.map(v=>[v.name,v.name+' · '+v.rego]),other:S.locations.map(l=>[l.name,l.name])};
 const lab={employee:'Employee',job:'Job site',vehicle:'Vehicle',other:'Location'};
 return fld({name:'target',label:lab[type],type:'select',req:true,span:6,value:val||'',opts:[['','Select '+lab[type].toLowerCase()],...lists[type]]});
}
function moveForm(a,mode){
 const tr=mode==='transfer',cur=a.holder?a.holder+(a.loc!=='Store'?' · '+a.loc:''):a.veh?a.veh:a.loc;
 return `<form class="formpage" data-form novalidate onsubmit="return false" id="mvForm" data-mode="${mode}" data-id="${a.id}" style="max-width:760px">
  ${fsec(tr?'Transfer Asset':'Check Out Asset',a.name+' · '+a.assetId,(tr?`<div class="banner info" style="grid-column:1/-1">${ICON('pin')}<span>Currently checked out to <b>${esc(cur)}</b></span></div>`:'')
   +seg({name:'type',label:tr?'Transfer to':'Checkout to',span:6,value:'employee',opts:[['employee','Employee'],['job','Job site'],['vehicle','Vehicle'],['other','Location']]}).replace('class="segc"','class="segc" data-segtype')
   +`<div class="s6" id="mvTarget" style="grid-column:span 6">${targetField('employee')}</div>`
   +fld({name:'date',label:tr?'Transfer date':'Checkout date',type:'date',req:true,span:3,value:TODAY_ISO})+fld({name:'expected',label:'Expected return date',type:'date',span:3})
   +seg({name:'cond',label:'Condition',span:6,value:'good',opts:CONDITIONS})+drop('photos','Photos','JPG or PNG, max 50 MB each',true)
   +fld({name:'notes',label:'Notes',type:'textarea',rows:3,span:6,max:400}))}
  <div class="fbar"><span class="hint">${tr?'Nothing moved yet':'Nothing checked out yet'}</span><button type="button" class="btn btn-ghost" data-go="assets/${a.id}">Cancel</button><button type="button" class="btn" data-do="mv-save" data-fsave>${ICON('check')}${tr?'Transfer':'Check Out'}</button></div></form>`;
}
const blockedPage=(a,title,msg,cta)=>`<div class="page"><section class="qv-card">${emptyBlock('alert',title,msg,cta)}</section></div>`;
const assetMove=mode=>({path:'assets/:id/'+(mode==='transfer'?'transfer':'checkout'),parent:'assets',perm:'assign:asset',title:mode==='transfer'?'Transfer Asset':'Check Out Asset',sub:'Who has it, where, and when it should come back.',
 crumbs:()=>{const a=astBy(P.id);return [['Assets','assets'],[a?a.name:'Not found','assets/'+P.id],[mode==='transfer'?'Transfer':'Check out']];},
 render(){const a=astBy(P.id);if(!a)return notFound('Asset','assets');
  if(mode==='checkout'&&a.st==='out')return blockedPage(a,'This asset is already checked out','Check it in before it can go out again, or transfer it.',`<button type="button" class="btn btn-ghost" data-go="assets/${a.id}/transfer">Transfer instead</button>`);
  if(mode==='transfer'&&a.st!=='out')return blockedPage(a,'This asset isn’t checked out','There is nothing to transfer. Check it out first.',`<button type="button" class="btn btn-ghost" data-go="assets/${a.id}/checkout">Check out</button>`);
  if(mode==='checkout'&&a.st!=='in')return blockedPage(a,'This asset isn’t available','It is '+AS[a.st][1].toLowerCase()+'. Change its status first.',can('edit:asset')?`<button type="button" class="btn btn-ghost" data-go="assets/${a.id}/edit">Edit asset</button>`:'');
  if(ttBlocked(a))return blockedPage(a,'Test & tag has expired','Expired tags block check-out. Retest the tool and update its next test date, then check it out.',can('edit:asset')?`<button type="button" class="btn" data-go="assets/${a.id}/edit">Update test date</button>`:'');
  return moveForm(a,mode);}});
VIEWS['asset-checkout']=assetMove('checkout');VIEWS['asset-transfer']=assetMove('transfer');
document.addEventListener('click',e=>{const b=e.target.closest('[data-segtype] [data-fseg]');if(!b)return;const box=$('#mvTarget');if(box)box.innerHTML=targetField(b.dataset.v);});
DO['mv-save']=()=>{
 const form=$('#mvForm'),a=astBy(form.dataset.id),tr=form.dataset.mode==='transfer',d=validate(form,{expected:(v,x)=>v&&v<x.date?'Expected return can’t be before the checkout date':''});if(!d)return toastErr('Can’t save yet','Fix the highlighted fields.');
 const t=d.type,tgt=d.target,from=a.holder||a.veh||a.loc;
 const cu=curAssign(a);if(tr&&cu)Object.assign(cu,{returned:d.date,cond:d.cond});
 a.holder=t==='employee'?tgt:'';a.veh=t==='vehicle'?tgt:'';a.loc=t==='job'?tgt:'Store';a.place=t==='other'?tgt:'';a.st='out';a.since='since '+fmtD(d.date).replace(/^\w+ /,'');
 a.history.push({who:tgt,type:({employee:'Employee',job:'Job site',vehicle:'Vehicle',other:'Location'})[t],target:tgt,taken:d.date,expected:d.expected,returned:'',cond:d.cond,notes:d.notes});
 GUARD.dirty=false;toast(tr?'Asset transferred':'Asset checked out',a.name+' · '+tgt);go('assets/'+a.id);
};
VIEWS['asset-return']={path:'assets/:id/return',parent:'assets',perm:'assign:asset',title:'Return Asset',sub:'Check it back in and say what state it’s in.',
 crumbs:()=>{const a=astBy(P.id);return [['Assets','assets'],[a?a.name:'Not found','assets/'+P.id],['Check in']];},
 render(){
  const a=astBy(P.id);if(!a)return notFound('Asset','assets');if(a.st!=='out')return blockedPage(a,'This asset isn’t checked out','There is nothing to return.',`<button type="button" class="btn btn-ghost" data-go="assets/${a.id}">Back to the asset</button>`);
  const h=curAssign(a)||{};
  return `<form class="formpage" data-form novalidate onsubmit="return false" id="rtForm" data-id="${a.id}" style="max-width:760px">${fsec('Return Asset',a.name+' · '+a.assetId,
   `<div style="grid-column:1/-1">${kv([['Checked out to',esc(h.target||locName(a))],['Checkout date',h.taken?esc(fmtDL(h.taken)):'—'],['Expected return date',h.expected?esc(fmtDL(h.expected)):'—'],['Notes',esc(h.notes||'—')]])}</div>`
   +fld({name:'date',label:'Checkin date',type:'date',req:true,span:3,value:TODAY_ISO})+fld({name:'status',label:'Status',type:'select',span:3,value:'in',opts:[['in','Available'],['service','Maintenance'],['retired','Retired'],['lost','Lost']]})
   +fld({name:'place',label:'Return to location',type:'select',span:6,value:a.place||'Enfield store',opts:S.locations.map(l=>[l.name,l.name])})
   +seg({name:'cond',label:'Condition',span:6,value:'good',opts:CONDITIONS})+drop('photos','Photos','JPG or PNG, max 50 MB each',true)+fld({name:'notes',label:'Notes',type:'textarea',rows:3,span:6,max:400}))}
   <div class="fbar"><span class="hint">Nothing returned yet</span><button type="button" class="btn btn-ghost" data-go="assets/${a.id}">Cancel</button><button type="button" class="btn" data-do="rt-save" data-fsave>${ICON('check')}Return Asset</button></div></form>`;
 }};
DO['rt-save']=()=>{
 const form=$('#rtForm'),a=astBy(form.dataset.id),d=validate(form,{});if(!d)return;
 const h=curAssign(a);if(h)Object.assign(h,{returned:d.date,cond:d.cond,notes:(h.notes?h.notes+' · ':'')+(d.notes||'')});
 a.st=d.status;a.holder='';a.veh='';a.loc='Store';a.since='';a.place=d.status==='lost'?'':d.place;
 GUARD.dirty=false;toast('Asset returned',a.name+' · '+AS[a.st][1]);go('assets/'+a.id);
};

/* ---------- Import wizard: Upload file, Map & review, Done ---------- */
const IM={step:1,name:'',headers:[],rows:[],map:{},smap:{},result:null};
const IM_FIELDS=[['','Don’t import'],['assetId','Asset ID'],['name','Asset Name'],['serial','Serial Number'],['st','Status'],['mfr','Manufacturer'],['supplier','Supplier'],['place','Location'],['dept','Department'],['bought','Purchase date'],['val','Purchase cost'],['notes','Notes']];
const IM_GUESS={assetid:'assetId',id:'assetId',tag:'assetId',name:'name',toolname:'name',assetname:'name',itemname:'name',tool:'name',description:'name',state:'st',serial:'serial',serialnumber:'serial',status:'st',condition:'st',maker:'mfr',manufacturer:'mfr',brand:'mfr',supplier:'supplier',vendor:'supplier',location:'place',place:'place',department:'dept',purchasedate:'bought',cost:'val',price:'val',notes:'notes'};
const IM_SAMPLE='Tool name,Tag,Serial,State,Maker,Place,Cost\nAngle grinder 125mm,NL-3001,BS-GWS-3001,Ready,Bosch,Enfield store,189\nCordless drill kit,NL-3002,DW-DCD-3002,Ready,DeWalt,Enfield store,329\nSite radio,NL-3003,MT-DP-3003,In repair,Motorola,Dubbo depot cage,260\nExtension lead 15 m,NL-0915,EL-25M-0915,Ready,Pro-Lead,Enfield store,85\nLaser distance meter,,LD-BO-3005,Ready,Bosch,,240\n,NL-3006,,Ready,Leica,Enfield store,\nSurvey tripod,NL-3007,SV-TR-3007,Gone,Leica,Orange site container,310';
function parseCSV(text){
 const rows=[];let row=[],cur='',q=false;
 for(let i=0;i<text.length;i++){const c=text[i];
  if(q){if(c==='"'&&text[i+1]==='"'){cur+='"';i++;}else if(c==='"')q=false;else cur+=c;}
  else if(c==='"')q=true;else if(c===','){row.push(cur);cur='';}else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cur);cur='';if(row.some(x=>x!==''))rows.push(row);row=[];}else cur+=c;}
 row.push(cur);if(row.some(x=>x!==''))rows.push(row);return rows;
}
function imLoad(name,text){
 const r=parseCSV(text);if(r.length<2){toastErr('Could not read this file','It needs a header row and at least one asset.');return;}
 IM.name=name;IM.headers=r[0].map(h=>h.trim());IM.rows=r.slice(1);IM.map={};
 IM.headers.forEach((h,i)=>{const g=IM_GUESS[h.toLowerCase().replace(/[^a-z]/g,'')];if(g&&!Object.values(IM.map).includes(g))IM.map[i]=g;});
 imStatusMap();IM.step=2;rerender(true);
}
const imCol=k=>{const i=Object.keys(IM.map).find(x=>IM.map[x]===k);return i==null?-1:+i;};
function imStatusMap(){
 IM.smap={};const c=imCol('st');if(c<0)return;
 uniq(IM.rows.map(r=>(r[c]||'').trim())).forEach(v=>{const l=v.toLowerCase();IM.smap[v]=/repair|maint|service/.test(l)?'service':/retire|scrap/.test(l)?'retired':/lost|gone|missing/.test(l)?'lost':'in';});
}
function imRows(){
 const get=(r,k)=>{const c=imCol(k);return c<0?'':(r[c]||'').trim();},seenId=new Set(S.assets.map(a=>a.assetId.toLowerCase())),seenSn=new Set(S.assets.map(a=>a.serial.toLowerCase()));
 return IM.rows.map((r,i)=>{
  const o={assetId:get(r,'assetId'),name:get(r,'name'),serial:get(r,'serial'),st:IM.smap[get(r,'st')]||'in',mfr:get(r,'mfr'),supplier:get(r,'supplier'),place:get(r,'place'),dept:get(r,'dept'),bought:get(r,'bought'),val:Number(get(r,'val'))||0,notes:get(r,'notes')};
  let err='';if(!o.name)err='Asset name is missing';else if(!o.assetId&&!o.serial)err='Needs an Asset ID or a serial number';
  else if(o.assetId&&seenId.has(o.assetId.toLowerCase()))err='Asset ID already in the register';else if(o.serial&&seenSn.has(o.serial.toLowerCase()))err='Serial number already in the register';
  if(!err){if(o.assetId)seenId.add(o.assetId.toLowerCase());if(o.serial)seenSn.add(o.serial.toLowerCase());}
  return {i:i+2,o,err};});
}
const IM_STEPS=['Upload file','Map & review','Done'];
VIEWS['asset-import']={path:'assets/import',parent:'assets',perm:'add:asset',title:'Import Assets',sub:'Bring a spreadsheet of tools into the register.',crumbs:()=>[['Assets','assets'],['Import']],
 render(){
  const stp=`<div class="wizsteps">${IM_STEPS.map((s,i)=>`<div class="st${IM.step>i+1?' done':IM.step===i+1?' now':''}"><div class="dot">${IM.step>i+1?ICON('check'):'<b>'+(i+1)+'</b>'}</div><div class="nm">${s}</div></div>`).join('')}</div>`;
  let body='';
  if(IM.step===1)body=`<div class="two"><section class="qv-card"><div class="qv-hd"><div class="grow"><h3>Upload a spreadsheet</h3><div class="s">CSV with a header row. Excel files: save as CSV first.</div></div></div><div class="qv-body"><div class="fgrid">${drop('impfile','Spreadsheet','CSV, up to 5 MB')}</div><div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button type="button" class="btn btn-ghost btn-sm" data-do="im-sample">${ICON('file')}Use a sample file</button><button type="button" class="btn btn-ghost btn-sm" data-toast="Template|asset-import-template.csv would download">${ICON('download')}Download template</button></div></div></section>
   <section class="qv-card"><div class="qv-hd"><div class="grow"><h3>Before you import</h3></div></div><div class="qv-body"><ul class="tips"><li>Every row needs an <b>Asset name</b> and an <b>Asset ID</b> or a <b>Serial number</b>.</li><li>Asset IDs and serial numbers can’t repeat what is already in the register.</li><li>You choose how your columns and status words map to SiteOS on the next step.</li><li>Nothing is imported until you review the mapping and confirm on the last step.</li></ul></div></section></div>`;
  else if(IM.step===2){
   const rows=imRows(),bad=rows.filter(r=>r.err).length,good=rows.length-bad,sc=imCol('st');
   body=`<section class="qv-card"><div class="qv-hd"><div class="grow"><h3>Map columns</h3><div class="s">${esc(IM.name)} · ${IM.rows.length} rows</div></div><div class="meta"><button type="button" class="btn btn-ghost btn-sm" data-do="im-reset">Reset to suggested</button></div></div>
    ${Object.keys(IM.map).length?'':`<div style="padding:0 18px 10px"><div class="banner warn">${ICON('alert')}<span>No columns could be matched to a field automatically. Set each one below.</span></div></div>`}
    <div class="tblwrap"><table class="tbl" style="min-width:640px"><thead><tr><th>Sheet column</th><th>Sample value</th><th>Import as</th></tr></thead><tbody>${IM.headers.map((h,i)=>`<tr><td class="strong">${esc(h)}</td><td>${esc((IM.rows.find(r=>r[i])||[])[i]||'—')}</td><td><select class="selc" data-immap="${i}" aria-label="Import ${esc(h)} as">${IM_FIELDS.map(([k,l])=>`<option value="${k}"${(IM.map[i]||'')===k?' selected':''}>${l}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div></section>
    ${sc>=0?`<section class="qv-card"><div class="qv-hd"><div class="grow"><h3>Map status values</h3><div class="s">What each word in your file means in SiteOS</div></div></div><div class="tblwrap"><table class="tbl" style="min-width:420px"><thead><tr><th>Value in your file</th><th>Maps to</th></tr></thead><tbody>${Object.keys(IM.smap).map(v=>`<tr><td class="strong">${esc(v||'(empty)')}</td><td><select class="selc" data-imsm="${esc(v)}">${[['in','Available'],['service','Maintenance'],['retired','Retired'],['lost','Lost']].map(([k,l])=>`<option value="${k}"${IM.smap[v]===k?' selected':''}>${l}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div></section>`:''}
    <section class="qv-card"><div class="qv-hd"><div class="grow"><h3>Preview</h3><div class="s"><b class="num">${good}</b> ready to import${bad?', <b class="num" style="color:var(--bad)">'+bad+'</b> with a problem (skipped)':''}</div></div></div><div class="tblwrap"><table class="tbl" style="min-width:760px"><thead><tr><th>Row</th><th>Asset Name</th><th>Asset ID</th><th>Serial</th><th>Status</th><th>Problem</th></tr></thead><tbody>${rows.map(r=>`<tr${r.err?' style="background:var(--bad-soft)"':''}><td class="num">${r.i}</td><td class="strong">${esc(r.o.name||'—')}</td><td class="mono">${esc(r.o.assetId||'—')}</td><td class="mono">${esc(r.o.serial||'—')}</td><td>${pill(AS[r.o.st][0],AS[r.o.st][1])}</td><td>${r.err?`<b style="color:var(--bad)">${esc(r.err)}</b>`:pill('ok','OK')}</td></tr>`).join('')}</tbody></table></div></section>
    <div class="rbar" style="position:static;border:1px solid var(--border);border-radius:14px"><span class="hint">Nothing has been added to your register yet. Click Done to import these.</span><button type="button" class="btn btn-ghost" data-do="im-back">Back</button><button type="button" class="btn" data-do="im-done"${good?'':' disabled'}>${ICON('check')}Done${good?' ('+good+')':''}</button></div>`;
  }else body=`<section class="qv-card"><div class="qv-body">${emptyBlock('checkc',IM.result.n+' asset'+(IM.result.n===1?'':'s')+' imported',IM.result.skipped?IM.result.skipped+' row'+(IM.result.skipped===1?' was':'s were')+' skipped because of problems.':'Every row went in.',`<button type="button" class="btn" data-go="assets">View assets</button> <button type="button" class="btn btn-ghost" data-do="im-again">Import another file</button>`)}</div></section>`;
  return `<div class="page">${stp}${body}</div>`;
 }};
document.addEventListener('change',e=>{
 const f=e.target.closest('input[name="impfile"]');
 if(f&&f.files[0]){const file=f.files[0];if(file.size>5e6){toastErr('File is too large','Keep it under 5 MB.');return;}const rd=new FileReader();rd.onload=()=>imLoad(file.name,String(rd.result));rd.readAsText(file);return;}
 const m=e.target.closest('[data-immap]');if(m){const i=+m.dataset.immap;Object.keys(IM.map).forEach(k=>{if(IM.map[k]===m.value&&m.value)delete IM.map[k];});if(m.value)IM.map[i]=m.value;else delete IM.map[i];imStatusMap();rerender(true);return;}
 const s=e.target.closest('[data-imsm]');if(s){IM.smap[s.dataset.imsm]=s.value;rerender(true);}
});
DO['im-sample']=()=>imLoad('sample-assets.csv',IM_SAMPLE);
DO['im-reset']=()=>{IM.map={};IM.headers.forEach((h,i)=>{const g=IM_GUESS[h.toLowerCase().replace(/[^a-z]/g,'')];if(g&&!Object.values(IM.map).includes(g))IM.map[i]=g;});imStatusMap();rerender(true);};
DO['im-back']=()=>{IM.step=1;rerender(true);};
DO['im-again']=()=>{Object.assign(IM,{step:1,name:'',headers:[],rows:[],map:{},smap:{},result:null});rerender(true);};
DO['im-done']=()=>{
 const rows=imRows(),ok=rows.filter(r=>!r.err);
 ok.forEach(r=>S.assets.push({...r.o,id:'ast-'+(r.o.assetId||r.o.serial).replace(/\W/g,'').toLowerCase(),cat:'General',holder:'',since:'',loc:'Store',veh:'',needsTT:false,tag:'—',days:999,warranty:'',orderNo:'',images:0,docs:[],place:r.o.place||'Enfield store',history:[{who:ME.name,type:'Location',target:r.o.place||'Enfield store',taken:TODAY_ISO,returned:TODAY_ISO,cond:'good',notes:'Imported from '+IM.name}]}));
 IM.result={n:ok.length,skipped:rows.length-ok.length};IM.step=3;rerender(true);toast('Import complete',ok.length+' assets added');
};
