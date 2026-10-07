/* =====================================================================
   Shell: nav, router, motion, palette, theme
   ===================================================================== */
const ORDER=['dash','company','um','jobs','jsas','jsas-today','scheduler','timeclock','assets','vehicles','journeys'];
const GRP={main:'',ops:'Operations',res:'Fleet & assets'};
/* old flat ids still work as links (cards on other pages say data-nav="employees") */
const ALIAS={um:'user-management',employees:'user-management/employees',customers:'user-management/customers',roles:'user-management/roles'};
const app=$('#app'),nav=$('#nav'),shell=$('#shell');
let P={};
/* Param routes: a view may declare path:'employees/:id'. Static patterns win over param patterns. */
function resolve(){
 const segs=(location.hash||'').replace(/^#\/?/,'').split('?')[0].split('/').filter(Boolean);
 if(!segs.length)return['dash',{}];
 if(segs.length===1&&ALIAS[segs[0]])segs.splice(0,1,...ALIAS[segs[0]].split('/'));
 for(const pass of [0,1])for(const id in VIEWS){
  const pat=(VIEWS[id].path||id).split('/');if(pat.length!==segs.length||pat.some(s=>s[0]===':')!==!!pass)continue;
  const pr={};let ok=true;pat.forEach((s,i)=>{if(s[0]===':')pr[s.slice(1)]=decodeURIComponent(segs[i]);else if(s!==segs[i])ok=false;});
  if(ok)return[id,pr];}
 return[VIEWS['not-found']?'not-found':'dash',{}];
}
const cur=()=>{const[id,pr]=resolve();P=pr;return id;};
const val=x=>typeof x==='function'?x(P):x;
const allowed=v=>!v.perm||can(v.perm);
const go=id=>{location.hash='#/'+(ALIAS[id]||id);};
let pending=null;
const ind=document.createElement('span');ind.className='ind';
/* The sidebar is built once; a render only moves the highlight and refreshes counts,
   so the highlight slides from the old section to the new one. */
function buildNav(){
 let last=null,html='';nav.innerHTML='';
 ORDER.filter(id=>allowed(VIEWS[id])).forEach(id=>{const v=VIEWS[id];if(v.grp!==last){if(GRP[v.grp])html+=`<div class="grp">${GRP[v.grp]}</div>`;last=v.grp;}
  html+=`<a href="#/${v.path||id}" data-id="${id}">${ICON(v.icon)}<span>${esc(v.label)}</span><span class="n num${v.bad?' bad':''}" hidden></span></a>`;});
 nav.innerHTML=html;nav.appendChild(ind);
}
function updateNav(){
 const c0=cur(),c=VIEWS[c0].parent||c0;
 $$('a[data-id]',nav).forEach(a=>{const id=a.dataset.id,on=id===c,v=VIEWS[id],n=v.count?v.count():null,el=$('.n',a);
  a.classList.toggle('on',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');el.hidden=!n;el.textContent=n||'';});
}
function placeInd(anim){
 const on=$('a.on',nav);if(!on){ind.classList.remove('on');return;}
 const set=()=>{ind.style.height=on.offsetHeight+'px';ind.style.transform=`translateY(${on.offsetTop}px)`;};
 if(!anim||reduced||!ind.classList.contains('on')){const t=ind.style.transition;ind.style.transition='none';set();void ind.offsetWidth;ind.style.transition=t;}else set();
 ind.classList.add('on');
}

const prog=$('#progress'),progBar=prog.firstElementChild;let progT;
function progStart(){if(reduced)return;clearTimeout(progT);prog.classList.add('on');progBar.style.transition='none';progBar.style.width='0%';void progBar.offsetWidth;progBar.style.transition='';requestAnimationFrame(()=>progBar.style.width='72%');}
function progDone(){if(reduced)return;progBar.style.width='100%';progT=setTimeout(()=>{prog.classList.remove('on');setTimeout(()=>{progBar.style.transition='none';progBar.style.width='0%';},240);},260);}

function rerender(inPlace){
 const id=cur(),v=VIEWS[id],y=scrollY,ok=allowed(v);
 if(v.auth){document.body.classList.add('authmode');if(!inPlace&&v.enter)v.enter();document.title='SiteOS · '+val(v.title);$('#authRoot').innerHTML=v.render();if(!inPlace)scrollTo(0,0);progDone();return;}
 document.body.classList.remove('authmode');
 if(typeof gateEnter==='function'&&gateEnter(id))return;
 const gu=typeof gateUnmet==='function'?gateUnmet():null;
 if(!inPlace){GUARD.dirty=false;$$('#toasts .toast.persist').forEach(x=>x.remove());}
 $('#pgTitle').textContent=ok?val(v.title):'No access';$('#pgSub').textContent=ok?val(v.sub):'';
 $('#pgAct').innerHTML=ok&&v.act?v.act():'';
 const cr=$('#pgCrumbs'),cs=ok&&v.crumbs?v.crumbs(P):null;cr.hidden=!cs;
 cr.innerHTML=cs?cs.map(([l,h],i)=>h?`<a href="#/${h}">${esc(l)}</a><span aria-hidden="true">${ICON('next')}</span>`:`<b>${esc(l)}</b>`).join(''):'';
 document.title='SiteOS · '+(v.label||val(v.title));
 app.innerHTML=(gu?gateBanner(gu):'')+(ok?bannerHtml(id,v):'')+(ok?v.render():deniedState(v));
 if(ok){mountLists(app);if(v.mount)v.mount(app);}
 app.classList.toggle('anim',!inPlace&&!reduced);
 updateNav();placeInd(!inPlace);shell.classList.remove('open');
 if(inPlace)scrollTo(0,y);else{scrollTo(0,0);progDone();}
 if(pending&&!inPlace){const p=pending;pending=null;setTimeout(()=>reveal(p.scroll),90);}
}
window.addEventListener('hashchange',()=>{progStart();rerender(false);});

/* landing: scroll to the block a card refers to, then ring it */
function reveal(sel){
 if(!sel)return;const el=$(sel,app);if(!el)return;
 const top=el.getBoundingClientRect().top+scrollY-($('#chrome').getBoundingClientRect().height+16);
 scrollTo({top:Math.max(top,0),behavior:reduced?'auto':'smooth'});
 el.classList.remove('spot');void el.offsetWidth;el.classList.add('spot');setTimeout(()=>el.classList.remove('spot'),2000);
}
function jump(el){
 const n=el.dataset.nav,t=el.dataset.ltab,s=el.dataset.scroll;
 if(t){const[lid,key]=t.split(':');(LS[lid]||(LS[lid]={tab:key,q:'',f:{}})).tab=key;}
 if(n&&n!==cur()){pending={scroll:s};go(n);return;}
 if(t){const lid=t.split(':')[0];if(LISTS[lid])fillList(lid,true);reveal(s||'#L-'+lid);return;}
 reveal(s);
}

/* one delegated click handler for the whole app */
document.addEventListener('click',e=>{
 const g=e.target.closest('[data-go]');
 if(g){e.preventDefault();go(g.dataset.go);return;}
 const d=e.target.closest('[data-do]');
 if(d){e.preventDefault();const f=DO[d.dataset.do];if(f)f(d.dataset,d);else toast('Not built yet',d.dataset.do);return;}
 const pt=e.target.closest('[data-ptab]');
 if(pt){UI.tab[cur()+':'+(P.id||'')]=pt.dataset.ptab;rerender(true);return;}
 const tr=e.target.closest('tr[data-href]');
 if(tr&&!e.target.closest('button,a,input,label,select')){go(tr.dataset.href);return;}
 const a=e.target.closest('[data-act]');
 if(a){const cfg=LISTS[a.dataset.lid];if(cfg&&cfg.onAct){cfg.onAct(a.dataset.act,cfg.rows[+a.dataset.i]);rerender(true);}return;}
 const p=e.target.closest('[data-perm]');
 if(p){const[r,i]=p.dataset.perm.split(':');S.perms[r][+i]=S.perms[r][+i]?0:1;toast('Permission '+(S.perms[r][+i]?'granted':'removed'),r+' · '+PERMS[+i]);rerender(true);return;}
 const z=e.target.closest('[data-zoom]');
 if(z){const svg=z.closest('.map').querySelector('svg');const s=Math.min(2.2,Math.max(1,(+svg.dataset.z||1)+(+z.dataset.zoom)*.25));svg.dataset.z=s;svg.style.transform=`scale(${s})`;return;}
 const c=e.target.closest('[data-cmd]');
 if(c&&c.dataset.cmd==='publish'){const n=drafts();S.sched.forEach(p=>{if(!p.open)p.days.forEach(d=>d.forEach(s=>{s.length=3;}));});toast('Shifts published',(n-drafts())+' shifts sent to staff by push and SMS');rerender(true);return;}
 const tg=e.target.closest('[data-tog]');
 if(tg){const k=tg.dataset.tog;S.company.flags[k]=!S.company.flags[k];toast('Setting saved',tg.getAttribute('aria-label')+' · '+(S.company.flags[k]?'On':'Off'));rerender(true);return;}
 const t=e.target.closest('[data-toast]');
 if(t){const[h,b]=t.dataset.toast.split('|');toast(h,b||'Prototype · not wired up');return;}
 const j=e.target.closest('[data-nav],[data-ltab],[data-scroll]');
 if(j&&!j.matches('a[href]')){e.preventDefault();jump(j);}
});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[role="button"][tabindex]')){e.preventDefault();e.target.click();}});

function toast(h,b,bad){const el=document.createElement('div');el.className='toast';el.innerHTML=ICON(bad?'alert':'checkc')+`<div><b>${esc(h)}</b>${b?`<span>${esc(b)}</span>`:''}</div>`;$('#toasts').appendChild(el);setTimeout(()=>{el.style.transition='opacity .2s';el.style.opacity='0';setTimeout(()=>el.remove(),220);},2600);}
function modal(title,body,okLabel,onOk){
 const w=$('#modalWrap');$('#modal').innerHTML=`<div class="mh">${esc(title)}</div><div class="mb">${body}</div><div class="mf"><button type="button" class="btn btn-ghost" data-m="0">Cancel</button><button type="button" class="btn btn-danger" data-m="1">${esc(okLabel)}</button></div>`;
 w.classList.add('on');$$('[data-m]',w).forEach(b=>b.onclick=()=>{w.classList.remove('on');if(b.dataset.m==='1')onOk();});$('[data-m="0"]',w).focus();
}
$('#modalWrap').addEventListener('click',e=>{if(e.target.id==='modalWrap')e.currentTarget.classList.remove('on');});

/* sticky chrome shadow */
const chrome=$('#chrome');let pinned=false;
addEventListener('scroll',()=>{const y=scrollY,n=pinned?y>24:y>58;if(n!==pinned){pinned=n;chrome.classList.toggle('pinned',pinned);}},{passive:true});
let wasN=narrow();addEventListener('resize',()=>{placeInd(false);const n=narrow();if(n!==wasN){wasN=n;rerender(true);}});

/* theme */
function setTheme(t){document.documentElement.setAttribute('data-theme',t);try{localStorage.setItem('siteos.theme',t);}catch(e){}}
try{setTheme(localStorage.getItem('siteos.theme')==='dark'?'dark':'light');}catch(e){setTheme('light');}
$('#themeBtn').innerHTML=`<span class="sun">${ICON('sun')}</span><span class="moon">${ICON('moon')}</span>`;
$('#themeBtn').addEventListener('click',()=>setTheme(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark'));
$('#bellBtn').innerHTML=ICON('bell')+'<span class="dotn"></span>';
$('#bellBtn').addEventListener('click',()=>{pending={scroll:'#alerts'};if(cur()!=='dash')go('dash');else reveal('#alerts');});

/* reset */
$('#resetBtn').innerHTML=ICON('reset');$('#resetBtn').title='Reset demo';$('#resetBtn').setAttribute('aria-label','Reset demo');
$('#menuBtn').innerHTML=ICON('dash');$('#menuBtn').addEventListener('click',()=>shell.classList.toggle('open'));
$('#scrimSide').addEventListener('click',()=>shell.classList.remove('open'));
$('#logoutBtn').innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/></svg>';
$('#resetBtn').addEventListener('click',()=>modal('Reset the demo?','Approvals, sign-offs and published shifts go back to how the demo opens. Your theme and the page you are on stay as they are.','Reset',()=>{S=structuredClone(INIT);for(const k in LS)delete LS[k];SCH.filter='all';SCH.q='';rerender(true);toast('Demo reset','Back to the opening state');}));

/* command palette */
const isMac=/Mac|iPhone|iPad/.test(navigator.platform||'');
$('#cmdBtn').innerHTML=ICON('search')+`<span class="lb">Search jobs, people, vehicles…</span><span class="kbd">${isMac?'⌘':'Ctrl'} K</span>`;$('#cmdBtn').title='Command palette';
$('#palIn').innerHTML=ICON('search')+'<input id="palQ" autocomplete="off" spellcheck="false" placeholder="Search sections, jobs, people, vehicles…" aria-label="Search"><span class="kbd">esc</span>';
const pal=$('#pal'),palQ=$('#palQ'),palList=$('#palList');let res=[],ci=0,lastF=null;
/* a section's subtitle can be a function of the current page; evaluate it, and never let it print source code */
const palSub=v=>{try{const s=val(v.sub);return typeof s==='string'?s:'';}catch(e){return '';}};
function palItems(){
 const out=ORDER.filter(id=>allowed(VIEWS[id])).map(id=>({g:'Sections',icon:VIEWS[id].icon,l:VIEWS[id].label,m:palSub(VIEWS[id]),run:()=>go(id)}));
 S.jobs.forEach(j=>out.push({g:'Jobs',icon:'jobs',l:j.name,m:j.code+(j.arch?' · archived':''),run:()=>go('jobs/'+j.id)}));
 out.push({g:'Actions',icon:'plus',l:'Add job',m:'',run:()=>go('jobs/new')});
 S.employees.forEach(p=>out.push({g:'People',icon:'users',l:p.name,m:p.role,run:()=>go('user-management/employees/'+slug(p.name))}));
 S.customers.forEach(c=>out.push({g:'Customers',icon:'building',l:c.name,m:'ABN '+c.abn,run:()=>go('user-management/customers/'+slug(c.name))}));
 out.push({g:'Actions',icon:'usercog',l:'My profile',m:'',run:()=>go('my-profile')});
 out.push({g:'Actions',icon:'plus',l:'Add employee',m:'',run:()=>go('user-management/employees/new')});
 S.vehicles.forEach(v=>out.push({g:'Vehicles',icon:'truck',l:v.name+' · '+v.rego,m:v.model,run:()=>{LS.vehicles=LS.vehicles||{tab:'all',q:'',f:{}};LS.vehicles.q=v.rego;LS.vehicles.tab='all';pending={scroll:'#L-vehicles'};cur()==='vehicles'?rerender(true):go('vehicles');}}));
 out.push({g:'Actions',icon:'sun',l:'Toggle dark mode',m:'',run:()=>$('#themeBtn').click()});
 out.push({g:'Actions',icon:'reset',l:'Reset demo',m:'',run:()=>$('#resetBtn').click()});
 out.push({g:'Actions',icon:'lock',l:'Sign out',m:'',run:()=>$('#logoutBtn').click()});
 if(typeof DO['au-lock']==='function'){out.push({g:'Preview',icon:'lock',l:'Session expired screen',m:'Log in again over the page you were on',run:()=>DO['au-lock']()});[['phone-number','Onboarding gate: mobile number'],['two-factor','Onboarding gate: two-factor'],['company-details','Onboarding gate: company details']].forEach(([k,l])=>out.push({g:'Preview',icon:'usercog',l,m:'Pins you to the page that fixes it',run:()=>DO['au-preview']({k})}));}
 if(VIEWS.states)out.push({g:'Preview',icon:'alert',l:'Error and empty states',m:'Every state the app can show',run:()=>go('states')});
 return out;
}
function palPaint(){
 const q=palQ.value.trim().toLowerCase();
 res=palItems().map(it=>({it,s:(it.l+' '+it.m).toLowerCase().indexOf(q)})).filter(r=>!q||r.s>=0).sort((a,b)=>(q?a.s-b.s:0)).map(r=>r.it).slice(0,40);
 if(ci>=res.length)ci=0;
 if(!res.length){palList.innerHTML='<div class="none">No matches</div>';return;}
 let h='',g='';res.forEach((it,i)=>{if(it.g!==g){h+=`<div class="grp">${it.g}</div>`;g=it.g;}h+=`<div class="row${i===ci?' on':''}" data-i="${i}" role="option"><span class="g">${ICON(it.icon)}</span><span class="l">${esc(it.l)}</span>${it.m?`<span class="m">${esc(it.m)}</span>`:''}</div>`;});
 palList.innerHTML=h;
}
function palOpen(){lastF=document.activeElement;palQ.value='';ci=0;palPaint();pal.classList.add('on');palQ.focus();}
function palClose(){pal.classList.remove('on');if(lastF&&lastF.focus)lastF.focus();}
function palRun(i){const it=res[i==null?ci:i];palClose();if(it)setTimeout(()=>it.run(),40);}
palQ.addEventListener('input',()=>{ci=0;palPaint();});
palList.addEventListener('click',e=>{const r=e.target.closest('.row');if(r)palRun(+r.dataset.i);});
palList.addEventListener('mousemove',e=>{const r=e.target.closest('.row');if(r&&+r.dataset.i!==ci){ci=+r.dataset.i;palPaint();}});
$('[data-close]',pal).addEventListener('click',palClose);
$('#cmdBtn').addEventListener('click',palOpen);
document.addEventListener('keydown',e=>{
 if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();pal.classList.contains('on')?palClose():palOpen();return;}
 if(!pal.classList.contains('on')){if(e.key==='Escape')$('#modalWrap').classList.remove('on');return;}
 if(e.key==='Escape'){e.preventDefault();palClose();}
 else if(e.key==='ArrowDown'){e.preventDefault();ci=(ci+1)%res.length;palPaint();$('.row.on',palList)?.scrollIntoView({block:'nearest'});}
 else if(e.key==='ArrowUp'){e.preventDefault();ci=(ci-1+res.length)%res.length;palPaint();$('.row.on',palList)?.scrollIntoView({block:'nearest'});}
 else if(e.key==='Enter'){e.preventDefault();palRun();}
});

/* persona: preview the portal as another person (drives nav, buttons and fields) */
function paintMe(){
 $('#meAv').textContent=ini(ME.name);$('#meName').textContent=ME.name;$('#meRole').textContent=ME.role;
 $('#personaSel').innerHTML=Object.keys(PERSONAS).map(k=>`<option value="${k}"${k===ME.key?' selected':''}>${esc(PERSONAS[k].name)} · ${esc(PERSONAS[k].role)}</option>`).join('');
}
$('#personaSel').addEventListener('change',e=>{
 if(typeof GATE!=='undefined')GATE.on=false;setPersona(e.target.value);buildNav();paintMe();
 if(!allowed(VIEWS[cur()]))go(allowed(VIEWS.dash)?'dash':'my-profile');else rerender(true);
 toast('Viewing as '+ME.name,ME.role+' · '+(ME.bypass?'every permission':rolePerms().size+' permissions'));
});
buildNav();paintMe();
/* boot */
if(!location.hash)history.replaceState(null,'','#/'+(allowed(VIEWS.dash)?'dash':'my-profile'));
rerender(false);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>placeInd(false));
