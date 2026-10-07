/* =====================================================================
   Kit, part 2: multi-select, colour swatches, row menu, collapsible sections.
   ===================================================================== */

/* ---------- multi-select with chips ("Qualified: 2 selected, Clear all") ---------- */
const MSEL={};
function msel(o){
 MSEL[o.name]={opts:o.opts};
 return `<div class="fld s${o.span||6}" data-msel="${o.name}"><label for="mq-${o.name}">${esc(o.label)}${o.req?'<span class="req">*</span>':''}<span class="mcount"></span><button type="button" class="linkbtn mclear" data-mclear hidden>Clear all</button></label>
  <input type="hidden" name="${o.name}" value="${(o.value||[]).join(',')}">
  <div class="mbox"><span class="mchips"></span><input id="mq-${o.name}" class="mq" autocomplete="off" placeholder="${esc(o.ph||'Search and select…')}"></div>
  <div class="mlist" hidden></div>${o.help?`<div class="fhelp">${esc(o.help)}</div>`:''}<div class="ferr" id="e-${o.name}" role="alert"></div></div>`;
}
function mselPaint(box){
 const n=box.dataset.msel,cfg=MSEL[n],h=$('[name="'+n+'"]',box),ids=h.value?h.value.split(','):[],q=$('.mq',box).value.trim().toLowerCase();
 $('.mchips',box).innerHTML=ids.map(id=>{const o=cfg.opts.find(x=>x[0]===id),l=o?o[1]:id;return `<span class="mchip">${esc(l)}<button type="button" data-mrm="${esc(id)}" aria-label="Remove ${esc(l)}">${ICON('close')}</button></span>`;}).join('');
 $('.mcount',box).textContent=ids.length?ids.length+' selected':'';$('[data-mclear]',box).hidden=!ids.length;
 const items=cfg.opts.filter(o=>!ids.includes(o[0])&&(!q||(o[1]+' '+(o[2]||'')).toLowerCase().includes(q)));
 $('.mlist',box).innerHTML=items.length?items.map(o=>`<button type="button" class="mopt" data-mopt="${esc(o[0])}"><b>${esc(o[1])}</b>${o[2]?`<small>${esc(o[2])}</small>`:''}</button>`).join(''):`<div class="none">${cfg.opts.length?'No more matches':'Nothing to pick yet'}</div>`;
}
const mselInit=root=>$$('[data-msel]',root).forEach(mselPaint);
const mselSet=(box,ids)=>{$('[name="'+box.dataset.msel+'"]',box).value=ids.join(',');mselPaint(box);markDirty(box);};
const mselIds=box=>{const v=$('[name="'+box.dataset.msel+'"]',box).value;return v?v.split(','):[];};
document.addEventListener('focusin',e=>{const q=e.target.closest('.mq');if(q){const b=q.closest('[data-msel]');$$('.mlist').forEach(l=>l.hidden=true);$('.mlist',b).hidden=false;mselPaint(b);}});
document.addEventListener('input',e=>{const q=e.target.closest('.mq');if(q){const b=q.closest('[data-msel]');$('.mlist',b).hidden=false;mselPaint(b);}});
document.addEventListener('click',e=>{
 const opt=e.target.closest('[data-mopt]'),rm=e.target.closest('[data-mrm]'),clr=e.target.closest('[data-mclear]');
 if(opt){const b=opt.closest('[data-msel]');mselSet(b,[...mselIds(b),opt.dataset.mopt]);$('.mq',b).value='';mselPaint(b);$('.mq',b).focus();return;}
 if(rm){const b=rm.closest('[data-msel]');mselSet(b,mselIds(b).filter(x=>x!==rm.dataset.mrm));return;}
 if(clr){const b=clr.closest('[data-msel]');mselSet(b,[]);return;}
 if(!e.target.closest('[data-msel]'))$$('.mlist').forEach(l=>l.hidden=true);
});

/* ---------- colour swatches ---------- */
const JOB_COLORS=[['red',JC.red],['orange',JC.orange],['gold',JC.gold],['green',JC.green],['teal',JC.teal],['blue',JC.blue],['slate',JC.slate]];
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
function swatches(o){
 return `<div class="fld s${o.span||2}"><label>${esc(o.label||'Color')}</label><input type="hidden" name="${o.name}" value="${o.value}"><div class="swatches" role="radiogroup" aria-label="${esc(o.label||'Color')}">${JOB_COLORS.map(([k,c])=>`<button type="button" role="radio" aria-checked="${k===o.value}" class="swb${k===o.value?' on':''}" style="--c:${c}" data-fsw="${o.name}" data-v="${k}" title="${cap(k)}"></button>`).join('')}</div><div class="fhelp swname">${cap(o.value)}</div></div>`;
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-fsw]');if(!b)return;const root=b.closest('[data-form]')||document;$('[name="'+b.dataset.fsw+'"]',root).value=b.dataset.v;$$('[data-fsw="'+b.dataset.fsw+'"]',root).forEach(x=>{const on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-checked',on);});const nm=$('.swname',b.closest('.fld'));if(nm)nm.textContent=cap(b.dataset.v);markDirty(b);});

/* ---------- row menu (the three-dots menu): data-do="row-menu" data-kind="job" data-id="..." data-items="edit:Edit job|archive:Archive|delete:Delete:danger" ---------- */
function closeMenu(){const m=$('#pmenu');if(m)m.remove();}
DO['row-menu']=(d,el)=>{
 const had=$('#pmenu')&&$('#pmenu').dataset.for===d.kind+d.id;closeMenu();if(had)return;
 const r=el.getBoundingClientRect(),m=document.createElement('div');m.id='pmenu';m.className='pmenu';m.dataset.for=d.kind+d.id;m.setAttribute('role','menu');
 m.innerHTML=d.items.split('|').map(s=>{const[k,l,x]=s.split(':');return `<button type="button" role="menuitem" class="${x||''}" data-pm="${k}">${esc(l)}</button>`;}).join('');
 document.body.appendChild(m);
 const w=m.offsetWidth,h=m.offsetHeight;m.style.left=Math.max(8,Math.min(innerWidth-w-8,r.right-w))+'px';m.style.top=(r.bottom+h+12>innerHeight?r.top-h-6:r.bottom+6)+'px';
 m.addEventListener('click',ev=>{const b=ev.target.closest('[data-pm]');if(!b)return;closeMenu();const f=DO[d.kind+'-'+b.dataset.pm];if(f)f({id:d.id},el);});
};
document.addEventListener('click',e=>{if(!e.target.closest('#pmenu,[data-do="row-menu"]'))closeMenu();},true);
addEventListener('scroll',closeMenu,{passive:true});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});

/* ---------- collapsible sections (detail pages): same idea as the shipped pages, with Expand all ---------- */
const accIsOpen=(key,def)=>{UI.acc=UI.acc||{};return UI.acc[key]!==undefined?UI.acc[key]:!!def;};
function acc(key,icon,title,body,o){
 o=o||{};const open=accIsOpen(key,o.open);
 return `<section class="qv-card acc${open?' open':''}" id="acc-${key.replace(/\W/g,'')}"><button type="button" class="acch" data-do="acc-tog" data-k="${key}" aria-expanded="${open}"><span class="gi">${ICON(icon)}</span><b>${title}</b>${o.meta?`<span class="am">${o.meta}</span>`:''}${ICON('next').replace('<svg','<svg class="chev"')}</button><div class="accb">${body}</div></section>`;
}
DO['acc-tog']=d=>{UI.acc=UI.acc||{};UI.acc[d.k]=!accIsOpen(d.k);rerender(true);};
DO['acc-all']=d=>{UI.acc=UI.acc||{};const keys=d.keys.split(','),allOpen=keys.every(k=>accIsOpen(k));keys.forEach(k=>UI.acc[k]=!allOpen);rerender(true);};
