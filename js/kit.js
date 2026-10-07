/* =====================================================================
   Kit: forms, drawer, dialogs, alerts, detail shell, tabs
   Everything new screens are built from. Loaded after data.js.
   ===================================================================== */
const UI={tab:{},sel:{}};          // per-view UI state that survives re-render
const GUARD={dirty:false};         // unsaved-changes guard for full-page forms
const DO={};                       // data-do="name" action registry

/* ---------- form fields ---------- */
const CC=[['+61','AU'],['+64','NZ'],['+44','UK'],['+1','US'],['+91','IN'],['+63','PH']];
const natPhone=v=>String(v||'').replace(/^\+?61\s?/,'').replace(/^0/,'');
function fld(o){
 const t=o.type||'text',v=o.value==null?'':o.value,id=o.name,req=o.req?'<span class="req" aria-hidden="true">*</span>':'';
 const a=`id="f-${id}" name="${id}"${o.req?' required':''}${o.disabled?' disabled':''}${o.ph?` placeholder="${esc(o.ph)}"`:''}${o.max?` maxlength="${o.max}"`:''}${o.inputmode?` inputmode="${o.inputmode}"`:''}${o.autocomplete?` autocomplete="${o.autocomplete}"`:''}${o.list?` list="${o.list}"`:''}`;
 let ctl;
 if(t==='select')ctl=`<select ${a}>${(o.opts||[]).map(x=>{const[val,l]=Array.isArray(x)?x:[x,x];return `<option value="${esc(val)}"${String(val)===String(v)?' selected':''}>${esc(l)}</option>`;}).join('')}</select>`;
 else if(t==='textarea')ctl=`<textarea ${a} rows="${o.rows||3}">${esc(v)}</textarea>`;
 else if(t==='phone')ctl=`<div class="inp phone"><select name="${id}_cc" aria-label="Country code">${CC.map(c=>`<option value="${c[0]}"${c[0]===(o.cc||'+61')?' selected':''}>${c[1]} ${c[0]}</option>`).join('')}</select><input type="tel" ${a} value="${esc(natPhone(v))}" inputmode="tel"></div>`;
 else ctl=`<input type="${t==='money'?'text':t}" ${a} value="${esc(v)}"${t==='money'?' inputmode="decimal"':''}>`;
 if(t!=='phone'&&(o.prefix||o.suffix||t==='money'))ctl=`<div class="inp">${o.prefix||t==='money'?`<i class="pre">${o.prefix||'$'}</i>`:''}${ctl}${o.suffix?`<i class="suf">${esc(o.suffix)}</i>`:''}</div>`;
 const lock=o.locked?`<span class="lockchip" title="${esc(o.locked)}">${ICON('key')}${esc(o.locked)}</span>`:'';
 return `<div class="fld${o.span?' s'+o.span:''}${o.locked?' locked':''}"><label for="f-${id}">${esc(o.label)}${req}${lock}</label>${ctl}${o.help?`<div class="fhelp">${esc(o.help)}</div>`:''}<div class="ferr" id="e-${id}" role="alert"></div></div>`;
}
function tgl(o){ // switch row bound to a hidden input
 const on=!!o.value;
 return `<div class="setrow fswitch${o.span?' s'+o.span:''}"><span class="grow"><b>${esc(o.label)}</b>${o.help?`<small>${esc(o.help)}</small>`:''}</span><input type="hidden" name="${o.name}" value="${on?1:0}"><button type="button" class="tog${on?' on':''}" data-ftog="${o.name}" role="switch" aria-checked="${on}" aria-label="${esc(o.label)}"${o.disabled?' disabled':''}><i></i></button></div>`;
}
function seg(o){ // segmented choice bound to a hidden input
 return `<div class="fld${o.span?' s'+o.span:''}"><label>${esc(o.label)}</label><input type="hidden" name="${o.name}" value="${esc(o.value)}"><div class="segc" role="radiogroup" aria-label="${esc(o.label)}">${o.opts.map(([k,l])=>`<button type="button" role="radio" aria-checked="${k===o.value}" class="${k===o.value?'on':''}" data-fseg="${o.name}" data-v="${esc(k)}">${esc(l)}</button>`).join('')}</div>${o.help?`<div class="fhelp">${esc(o.help)}</div>`:''}</div>`;
}
const fsec=(title,sub,body,o)=>`<section class="qv-card fsec"${o&&o.id?` id="${o.id}"`:''}><div class="qv-hd"><div class="grow"><h3>${esc(title)}</h3>${sub?`<div class="s">${esc(sub)}</div>`:''}</div>${o&&o.meta?`<div class="meta">${o.meta}</div>`:''}</div><div class="qv-body fgrid">${body}</div></section>`;
const readForm=root=>{const o={};$$('[name]',root).forEach(el=>{if(el.type==='checkbox')o[el.name]=el.checked;else o[el.name]=el.value.trim();});return o;};
/* rules: {name:(value,all)=>'error text'|''}; required inputs are checked first */
function validate(root,rules){
 const d=readForm(root);let first=null;
 $$('.fld',root).forEach(f=>f.classList.remove('err'));$$('.ferr',root).forEach(e=>e.textContent='');
 const set=(n,m)=>{const el=$('[name="'+n+'"]',root);if(!el)return;const f=el.closest('.fld');if(f)f.classList.add('err');const e=$('#e-'+n,root);if(e)e.textContent=m;if(!first)first=el;};
 $$('[required]',root).forEach(el=>{if(!el.value.trim())set(el.name,(($('label[for="'+el.id+'"]',root)||{}).firstChild||{}).textContent+' is required');});
 Object.keys(rules||{}).forEach(n=>{if(!d[n]&&!(rules[n]&&rules[n].always))return;const m=(rules[n].fn||rules[n])(d[n],d);if(m&&!$('#e-'+n,root).textContent)set(n,m);});
 if(first){first.focus();}
 return first?null:d;
}
/* one delegated handler for toggles / segmented inputs / dirty tracking inside any [data-form] */
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-ftog]'),s=e.target.closest('[data-fseg]');
 if(t){const h=$('[name="'+t.dataset.ftog+'"]',t.closest('[data-form]')||document),on=h.value!=='1';h.value=on?1:0;t.classList.toggle('on',on);t.setAttribute('aria-checked',on);markDirty(t);if(t.dataset.fchange)DO[t.dataset.fchange]&&DO[t.dataset.fchange]({on},t);return;}
 if(s){const root=s.closest('[data-form]')||document,h=$('[name="'+s.dataset.fseg+'"]',root);h.value=s.dataset.v;$$('[data-fseg="'+s.dataset.fseg+'"]',root).forEach(b=>{const on=b===s;b.classList.toggle('on',on);b.setAttribute('aria-checked',on);});markDirty(s);if(s.dataset.fchange)DO[s.dataset.fchange]&&DO[s.dataset.fchange]({v:s.dataset.v},s);}
});
document.addEventListener('input',e=>{if(e.target.closest('[data-form]')){markDirty(e.target);const f=e.target.closest('.fld');if(f&&f.classList.contains('err')){f.classList.remove('err');const er=$('.ferr',f);if(er)er.textContent='';}}});
function markDirty(el){
 const drw=el.closest('#drawer');
 if(drw){drw.dataset.dirty='1';return;}
 const f=el.closest('[data-form]');if(!f)return;GUARD.dirty=true;
 const b=$('.fbar',document);if(b){b.classList.add('dirty');const h=$('.fbar .hint',b);if(h)h.textContent='Unsaved changes';const sv=$('[data-fsave]',b);if(sv)sv.disabled=false;}
}

/* ---------- drawer (short forms) ---------- */
let drawerCfg=null;
function drawer(o){
 drawerCfg=o;const d=$('#drawer');d.dataset.dirty='';d.className='drawer'+(o.wide?' wide':'');
 d.innerHTML=`<header class="dh"><div class="grow"><h3>${esc(o.title)}</h3>${o.sub?`<div class="s">${esc(o.sub)}</div>`:''}</div><button type="button" class="iconbtn" data-dclose aria-label="Close">${ICON('close')}</button></header>
  <form class="db" data-form novalidate onsubmit="return false">${o.body}</form>
  <footer class="df"><span class="hint">${o.hint||''}</span><button type="button" class="btn btn-ghost" data-dclose>Cancel</button>${o.okLabel!==null?`<button type="button" class="btn${o.danger?' btn-danger':''}" data-dsave>${esc(o.okLabel||'Save')}</button>`:''}</footer>`;
 $('#drawerWrap').classList.add('on');
 if(o.mount)o.mount($('.db',d));
 setTimeout(()=>{const f=$('.db input:not([type=hidden]),.db select,.db textarea',d);if(f)f.focus();},120);
}
async function closeDrawer(force){
 const d=$('#drawer');
 if(!force&&d.dataset.dirty==='1'&&!(await dialog({title:'Discard your changes?',body:'You have unsaved changes in this panel. Closing it will lose them.',okLabel:'Discard',danger:true,keep:'Keep editing'})))return;
 $('#drawerWrap').classList.remove('on');drawerCfg=null;d.innerHTML='';
}
document.addEventListener('click',e=>{
 if(e.target.closest('[data-dclose]')||e.target.id==='drawerWrap'){closeDrawer();return;}
 if(e.target.closest('[data-dsave]')&&drawerCfg){
  const root=$('#drawer .db'),d=validate(root,drawerCfg.rules);if(!d)return;
  Promise.resolve(drawerCfg.onOk?drawerCfg.onOk(d,root):true).then(r=>{if(r!==false)closeDrawer(true);});
 }
});

/* ---------- dialogs: confirm and type-to-confirm. Resolves true/false. ---------- */
let dlgRes=null;
function dialog(o){
 return new Promise(res=>{
  dlgRes=res;const w=$('#modalWrap'),m=$('#modal');
  m.innerHTML=`<div class="mh">${esc(o.title)}</div><div class="mb">${o.body||''}${o.typed?`<div class="fld" style="margin-top:14px"><label for="dlgT">Type <b class="mono">${esc(o.typed)}</b> to confirm</label><input id="dlgT" autocomplete="off" spellcheck="false"></div>`:''}</div>
   <div class="mf"><button type="button" class="btn btn-ghost" data-dlg="0">${esc(o.keep||'Cancel')}</button><button type="button" class="btn${o.danger?' btn-danger':''}" data-dlg="1"${o.typed?' disabled':''}>${esc(o.okLabel||'Confirm')}</button></div>`;
  w.classList.add('on');w.dataset.mine='1';
  const t=$('#dlgT',m),ok=$('[data-dlg="1"]',m);
  if(t){t.addEventListener('input',()=>{ok.disabled=t.value.trim().toLowerCase()!==o.typed.toLowerCase();});t.focus();}else $('[data-dlg="0"]',m).focus();
 });
}
function dlgDone(v){const w=$('#modalWrap');w.classList.remove('on');delete w.dataset.mine;const r=dlgRes;dlgRes=null;if(r)r(v);}
document.addEventListener('click',e=>{const b=e.target.closest('[data-dlg]');if(b&&dlgRes){dlgDone(b.dataset.dlg==='1');return;}if(e.target.id==='modalWrap'&&dlgRes)dlgDone(false);},true);
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(dlgRes){dlgDone(false);return;}if(drawerCfg&&!$('#pal').classList.contains('on'))closeDrawer();});

/* ---------- alerts: errors persist until closed, long text truncates, hover shows all ---------- */
function toastErr(h,b){
 $$('#toasts .toast.persist').forEach(x=>{if(($('b',x)||{}).textContent===h)x.remove();});
 const el=document.createElement('div');el.className='toast bad persist';el.setAttribute('role','alert');
 el.innerHTML=ICON('alert')+`<div class="grow"><b>${esc(h)}</b>${b?`<span title="${esc(b)}">${esc(b)}</span>`:''}</div><button type="button" class="x" aria-label="Dismiss">${ICON('close')}</button>`;
 $('.x',el).addEventListener('click',()=>el.remove());$('#toasts').appendChild(el);
}

/* ---------- unsaved-changes guard for full-page forms (capture phase so it runs first) ---------- */
document.addEventListener('click',async e=>{
 if(!GUARD.dirty)return;
 const el=e.target.closest('a[href^="#/"],[data-go],[data-nav]');if(!el||el.closest('[data-form]')&&el.matches('[data-fsave]'))return;
 e.preventDefault();e.stopImmediatePropagation();
 if(await dialog({title:'Leave without saving?',body:'You have unsaved changes on this page. If you leave, they are lost.',okLabel:'Leave page',danger:true,keep:'Stay'})){
  GUARD.dirty=false;
  if(el.dataset.go)go(el.dataset.go);else if(el.dataset.nav)go(el.dataset.nav);else location.hash=el.getAttribute('href');
 }
},true);
addEventListener('beforeunload',e=>{if(GUARD.dirty){e.preventDefault();e.returnValue='';}});

/* ---------- page tabs inside a detail page ---------- */
const tabKey=()=>cur()+':'+(P.id||'');
function curTab(tabs){const k=UI.tab[tabKey()];return tabs.find(t=>t.k===k&&!t.soon&&!t.hide)?k:tabs.find(t=>!t.hide).k;}
function ptabs(tabs){
 const c=curTab(tabs);
 return `<div class="tabs ptabs" role="tablist">${tabs.filter(t=>!t.hide).map(t=>`<button type="button" role="tab" class="tab${c===t.k?' on':''}${t.soon?' soon':''}" aria-selected="${c===t.k}" ${t.soon?'disabled title="Coming soon"':`data-ptab="${t.k}"`}>${esc(t.l)}${t.n!=null?`<span class="tc num">${t.n}</span>`:''}${t.soon?'<span class="soonchip">Soon</span>':''}</button>`).join('')}</div>`;
}

/* ---------- detail hero ---------- */
function hero(o){
 return `<section class="qv-card dhero"><div class="dh-main">
  <span class="av xl${o.sq?' sq':''}" ${o.c?`style="background:${o.c};color:#fff"`:''}>${o.sq?esc(o.ini):portrait(o.name||'')+esc(o.ini)}</span>
  <div class="grow"><div class="dh-t"><h2>${esc(o.title)}</h2>${(o.pills||[]).join('')}</div>
   ${o.sub?`<div class="dh-s">${o.sub}</div>`:''}
   ${o.meta?`<div class="dh-m">${o.meta.map(([ic,t])=>`<span>${ICON(ic)}${t}</span>`).join('')}</div>`:''}</div>
  ${o.actions?`<div class="dh-a">${o.actions}</div>`:''}</div>
  ${o.foot?`<div class="dh-f">${o.foot}</div>`:''}</section>`;
}

/* ---------- small shared blocks ---------- */
const emptyBlock=(icon,title,body,cta)=>`<div class="stateblk"><span class="sg">${ICON(icon)}</span><b>${esc(title)}</b>${body?`<p>${esc(body)}</p>`:''}${cta?`<div class="sact">${cta}</div>`:''}</div>`;
function deniedState(v){
 return `<div class="page"><section class="qv-card">${emptyBlock('key','You don’t have access to this page','Your role does not include the permission it needs. Ask an owner or admin to grant it from Roles.',`<button type="button" class="btn btn-ghost" data-go="${allowed(VIEWS.dash)?'dash':'my-profile'}">Go to ${allowed(VIEWS.dash)?'dashboard':'my profile'}</button>`)}</section></div>`;
}
const notFound=(what,back)=>`<div class="page"><section class="qv-card">${emptyBlock('search',what+' not found','It may have been archived or you followed an old link.',`<button type="button" class="btn btn-ghost" data-go="${back}">Back to the list</button>`)}</section></div>`;
const tlItem=(ic,title,sub,when,tone)=>`<li class="tl ${tone||''}"><span class="tld">${ICON(ic)}</span><div class="grow"><b>${title}</b>${sub?`<small>${sub}</small>`:''}</div><time>${esc(when)}</time></li>`;
const timeline=items=>`<ul class="timeline">${items.join('')}</ul>`;
const noteRow=(n,canEdit)=>`<div class="note"><span class="av">${ini(n.by)}</span><div class="grow"><div class="nh"><b>${esc(n.by)}</b><small>${esc(n.when)}</small>${n.vis?`<span class="pill neutral" style="margin-left:auto">${esc(({me:'Only me',everyone:'Everyone','owner+admin':'Owner + Admin'})[n.vis]||n.vis)}</span>`:''}</div><p>${esc(n.text)}</p></div>${canEdit?`<button type="button" class="rowbtn" data-do="note-del" data-id="${n.id}" aria-label="Delete note" title="Delete note">${ICON('close')}</button>`:''}</div>`;
const lockNote=(txt)=>`<div class="banner lock">${ICON('key')}<span>${esc(txt)}</span></div>`;
const gatedBlock=(txt)=>`<div class="gated">${ICON('key')}<b>${esc(txt)}</b><small>Needs the owner-only financial permission.</small></div>`;

/* ---------- extra icons ---------- */
Object.assign(IC,{
 edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
 trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="2.4"/><path d="m3.5 7 8.5 6 8.5-6"/>',
 phone:'<rect x="7" y="2.5" width="10" height="19" rx="2.4"/><path d="M11 18.5h2"/>',
 upload:'<path d="M12 15.5V4M7.7 8.3 12 4l4.3 4.3M4.5 20h15"/>',
 file:'<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>',
 lock:'<rect x="5" y="10.5" width="14" height="10" rx="2.4"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
 archive:'<rect x="3" y="4" width="18" height="5" rx="1.6"/><path d="M5 9v10h14V9M10 13h4"/>',
 user:'<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5c.8-3.6 3.8-5.5 7.5-5.5s6.7 1.9 7.5 5.5"/>',
 history:'<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.5 4.5v4h4M12 7.5V12l3 1.8"/>',
 copy:'<rect x="8.5" y="8.5" width="12" height="12" rx="2.4"/><path d="M15.5 8.5V5.9a2.4 2.4 0 0 0-2.4-2.4H5.9a2.4 2.4 0 0 0-2.4 2.4v7.2a2.4 2.4 0 0 0 2.4 2.4h2.6"/>',
 chat:'<path d="M4 5.5h16v11H9.5L5 20.5v-4H4z"/>'
});

/* ---------- file drop (prototype: remembers the chosen name only) ---------- */
const drop=(name,title,sub,multi)=>`<div class="fld s6"><label>${esc(title||'File')}</label><label class="dropzone" data-drop><input type="file" name="${name}"${multi?' multiple':''} hidden>${ICON('upload')}<b>Choose ${multi?'files':'a file'}</b><small>${esc(sub||'PDF, JPG or PNG, up to 50 MB')}</small></label><div class="ferr" id="e-${name}" role="alert"></div></div>`;
document.addEventListener('change',e=>{const i=e.target.closest('[data-drop] input[type=file]');if(!i)return;const z=i.closest('[data-drop]'),f=i.files[0];z.classList.toggle('has',!!f);$('b',z).textContent=i.files.length>1?i.files.length+' files selected':f?f.name:(i.multiple?'Choose files':'Choose a file');markDirty(i);const er=$('#e-'+i.name);if(er)er.textContent='';});
const addrList=`<datalist id="addrs"><option value="9 Cosgrove Rd, Enfield NSW 2136"><option value="14 Westgate Rd, Wetherill Park NSW 2164"><option value="2 Harbour St, Wollongong NSW 2500"><option value="41 Leeds Pde, Orange NSW 2800"><option value="88 Burns Bay Rd, Lane Cove NSW 2066"></datalist>`;
Object.assign(IC,{qr:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h3M20 17v4"/>'});

/* ---------- address: search or enter manually (same pattern as the shipped forms) ---------- */
function addrFld(o){
 const v=o.value||'',m=o.manual||{};
 return `<div class="fld s6"><label for="f-${o.name}">${esc(o.label||'Address')}<button type="button" class="linkbtn" data-addr="${o.name}">Enter address manually</button></label>
  <div data-addr-search="${o.name}"><input id="f-${o.name}" name="${o.name}" value="${esc(v)}" list="addrs" autocomplete="off" placeholder="Search for address…"></div>
  <div class="fgrid addrman" data-addr-man="${o.name}" hidden><div class="fld s6"><label for="f-${o.name}_line">Address line</label><input id="f-${o.name}_line" name="${o.name}_line" value="${esc(m.line||'')}"></div><div class="fld s2"><label for="f-${o.name}_city">City</label><input id="f-${o.name}_city" name="${o.name}_city" value="${esc(m.city||'')}"></div><div class="fld s2"><label for="f-${o.name}_state">State</label><select id="f-${o.name}_state" name="${o.name}_state">${['New South Wales','Victoria','Queensland','South Australia','Western Australia','Tasmania','Northern Territory','Australian Capital Territory'].map(s=>`<option${s===(m.state||'New South Wales')?' selected':''}>${s}</option>`).join('')}</select></div><div class="fld s2"><label for="f-${o.name}_post">Postal code</label><input id="f-${o.name}_post" name="${o.name}_post" value="${esc(m.post||'')}" inputmode="numeric" maxlength="4"></div><div class="fld s6"><label for="f-${o.name}_country">Country</label><input id="f-${o.name}_country" name="${o.name}_country" value="${esc(m.country||'Australia')}"></div></div>
  <div class="fhelp">Pick a suggestion to fill street, suburb, state and postcode.</div></div>`;
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-addr]');if(!b)return;const n=b.dataset.addr,root=b.closest('[data-form]')||document,man=$('[data-addr-man="'+n+'"]',root),sr=$('[data-addr-search="'+n+'"]',root),on=man.hidden;man.hidden=!on;sr.hidden=on;b.textContent=on?'Search for address':'Enter address manually';markDirty(b);});
const addrValue=d=>{const n=Object.keys(d).find(k=>k.endsWith('_line')&&d[k]);if(n){const b=n.slice(0,-5);return [d[b+'_line'],d[b+'_city'],d[b+'_state'],d[b+'_post']].filter(Boolean).join(', ');}return d.address||'';};
/* select with an inline "Add" that creates a new option (employment basis, supplier, location ...) */
const selAdd=(o)=>`<div class="fld ${o.span?'s'+o.span:''}"><label for="f-${o.name}">${esc(o.label)}</label><div class="selrow"><select id="f-${o.name}" name="${o.name}">${o.opts.map(x=>`<option${x===o.value?' selected':''}>${esc(x)}</option>`).join('')}</select><button type="button" class="btn btn-ghost" data-seladd="${o.name}" data-what="${esc(o.what||o.label)}">${ICON('plus')}Add</button></div></div>`;
document.addEventListener('click',e=>{const b=e.target.closest('[data-seladd]');if(!b)return;const n=b.dataset.seladd;
 drawer({title:'Add '+b.dataset.what.toLowerCase(),okLabel:'Add',rules:{name:v=>v.length>40?'Keep it under 40 characters':''},body:`<div class="fgrid">${fld({name:'name',label:'Name',req:true,span:6})}</div>`,
  onOk:d=>{const s=$('#f-'+n);if(s){s.add(new Option(d.name,d.name,true,true));markDirty(s);}toast('Added',d.name);}});});
