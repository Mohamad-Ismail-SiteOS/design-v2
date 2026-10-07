/* =====================================================================
   Ruleset editor (Overtime & Pay Rules). Follows the shipped dialog, as a page:
   Ruleset Details (name, status, description, default), a pinned Time Range Multiplier card,
   and rule cards (type, name, multiplier, applies after, applies on, public holidays).
   Same validation: tiers chain upward per day group, Overtime is fixed Mon-Fri,
   Weekend Overtime only Sat/Sun, Time Range needs From <> To and a multiplier above 0.
   ===================================================================== */
const RSD={id:null,items:[],hr:{on:false,from:'',to:'',mult:''},removed:0};
let rsN=0;
const rsTid=()=>'t'+(++rsN);
const rsOf=id=>S.company.rulesets.find(r=>r.id===id);
function rsDraft(r){
 RSD.id=r.id;RSD.removed=0;RSD.hr={...r.hr};
 RSD.items=r.items.map(i=>({...i,days:i.days.slice(),tid:rsTid(),isNew:false}));
}
const rsDays=(t,sel)=>{
 const fixed=t==='overtime',all=daysFor(t);
 return all.map(d=>`<button type="button" class="dayb${sel.includes(d)?' on':''}${fixed?' fixed':''}" data-do="rs-day" data-d="${d}"${fixed?' disabled aria-disabled="true"':''} aria-pressed="${sel.includes(d)}">${WD_NAME[d]}</button>`).join('');
};
function rsCard(it){
 const p='ri_'+it.tid+'_';
 return `<div class="rcard" data-tid="${it.tid}"><div class="rch"><b>${esc(it.label||'Untitled rule')}</b>${it.isNew?pill('ok','New'):''}<button type="button" class="rowbtn" data-do="rs-rm" data-t="${it.tid}" aria-label="Remove rule" title="Remove rule" style="margin-left:auto">${ICON('trash')}</button></div>
  <div class="fgrid">${fld({name:p+'type',label:'Rule Type',type:'select',span:3,value:it.type,opts:RULE_TYPES})}${fld({name:p+'label',label:'Rule Name',req:true,span:3,value:it.label,ph:'Rule name',max:120})}
  ${fld({name:p+'mult',label:'Multiplier Rate',type:'number',req:true,span:3,value:it.mult,ph:'1.5'})}${fld({name:p+'after',label:'Applies After',type:'number',req:true,span:3,value:it.after,ph:'2h from regular hours',suffix:'h'})}
  <div class="fld s3"><label>Applies on${it.type==='overtime'?'':'<span class="req" aria-hidden="true">*</span>'}</label><div class="dayrow" data-days>${rsDays(it.type,it.days)}</div><div class="ferr" id="e-${p}days" role="alert"></div></div>
  <div class="fld s3" style="align-self:end"><label class="chk"><input type="checkbox" name="${p}holiday"${it.holiday?' checked':''}>Applies on public holidays</label></div></div></div>`;
}
function rsRules(){
 return RSD.items.length?RSD.items.map(rsCard).join(''):`<div class="empty" style="border:1.5px dashed var(--border-strong);border-radius:12px;padding:22px"><b>No rules yet.</b>Click “Add Rule” to create one.</div>`;
}
const rsCount=()=>`${RSD.items.length} ${RSD.items.length===1?'rule':'rules'}`;
function rsSync(){
 const f=$('#rsForm');if(!f)return;
 RSD.items.forEach(it=>{const p='ri_'+it.tid+'_',g=n=>$('[name="'+p+n+'"]',f);if(!g('label'))return;Object.assign(it,{type:g('type').value,label:g('label').value.trim(),mult:g('mult').value,after:g('after').value,holiday:g('holiday').checked});});
 RSD.hr={on:$('[name="hr_on"]',f).value==='1',from:$('[name="hr_from"]',f).value,to:$('[name="hr_to"]',f).value,mult:$('[name="hr_mult"]',f).value};
}
function rsPaint(){const box=$('#rsRules');if(box)box.innerHTML=rsRules();const c=$('#rsCount');if(c)c.textContent=rsCount();markDirty($('#rsForm'));}
const hrExample=()=>`Applies every day to hours worked within this time range, as long as they fall within regular shift hours. For example, a range of ${S.company.timeFormat==='12h'?'11:00 PM–3:00 AM':'23:00–03:00'} with a ×1.5 multiplier pays 1.5 times the regular rate during those hours. Overtime rules take priority once regular shift hours are exceeded.`;
VIEWS['ruleset-edit']={path:'company/rulesets/:id',parent:'company',perm:'edit:company',title:()=>{const r=rsOf(P.id);return r?r.name:'Ruleset';},sub:'Overtime & Pay Rules',crumbs:()=>{const r=rsOf(P.id);return [['My Company','company'],['Overtime & Pay Rules','company/edit'],[r?r.name:'Not found']];},
 render(){
  const r=rsOf(P.id);if(!r)return notFound('Ruleset','company');
  rsDraft(r);const hr=RSD.hr;
  return `<form class="formpage" data-form novalidate onsubmit="return false" id="rsForm" style="max-width:980px">
  ${fsec('Ruleset Details','',fld({name:'rs_name',label:'Name',req:true,span:4,value:r.name,ph:'e.g. Standard Overtime',max:200})+fld({name:'rs_status',label:'Status',type:'select',span:2,value:r.status,opts:[['active','Active'],['inactive','Inactive'],['archived','Archived']]})+fld({name:'rs_desc',label:'Description',type:'textarea',rows:2,span:6,value:r.description,ph:'Optional description',max:1000})+`<div class="fld s6"><label class="chk"><input type="checkbox" name="rs_default"${r.isDefault?' checked':''}${r.isDefault?' disabled':''}>Set as default ruleset for this company</label>${r.isDefault?'<div class="fhelp">This is the default. Make another ruleset the default to change it.</div>':''}</div>`)}
  <section class="qv-card fsec"><div class="qv-hd"><div class="grow"><h3>Rules</h3><div class="s" id="rsCount">${rsCount()}</div></div><div class="meta"><button type="button" class="btn btn-ghost btn-sm" data-do="rs-add">${ICON('plus')}Add Rule</button></div></div>
   <div class="qv-body" style="display:grid;gap:14px">
    <div class="cpanel" id="rsHr"><div class="cphead"><b>Time Range Multiplier <span class="infoi" title="${esc(hrExample())}" aria-label="How the Time Range Multiplier works">${ICON('alert').replace('<svg','<svg style="width:14px;height:14px"')}</span></b>${swHtml('hr_on',hr.on,'Enable Time Range Multiplier','rs-hr')}</div>
     <div class="fgrid">${fld({name:'hr_from',label:'From',type:'time',span:2,value:hr.from,disabled:!hr.on})}${fld({name:'hr_to',label:'To',type:'time',span:2,value:hr.to,disabled:!hr.on})}${fld({name:'hr_mult',label:'Multiplier Rate',type:'number',span:2,value:hr.mult,ph:'1.5',disabled:!hr.on})}</div>
     <div class="fhelp" id="hrNote" style="${hr.on?'':'opacity:.5'}">Applies every day to hours worked in this range, while still within regular shift hours.</div></div>
    <div id="rsRules" style="display:grid;gap:14px">${rsRules()}</div></div></section>
  <div class="fbar"><span class="hint">No changes yet</span><button type="button" class="btn btn-ghost" data-do="rs-cancel">Cancel</button><button type="button" class="btn" data-do="rs-save" data-fsave disabled>${ICON('check')}Update Ruleset</button></div></form>`;
 }};
DO['rs-cancel']=()=>go('company');
DO['rs-hr']=({on})=>{$$('#rsHr [name="hr_from"],#rsHr [name="hr_to"],#rsHr [name="hr_mult"]').forEach(x=>{x.disabled=!on;});const n=$('#hrNote');if(n)n.style.opacity=on?'':'.5';if(on){const f=$('#rsHr [name="hr_from"]'),t=$('#rsHr [name="hr_to"]');if(!f.value)f.value='00:00';if(!t.value)t.value='00:00';}else $$('#rsHr .fld').forEach(x=>{x.classList.remove('err');$('.ferr',x).textContent='';});};
DO['rs-add']=()=>{rsSync();const pr=RSD.items.length?Math.max(...RSD.items.map(i=>i.prio||0))+1:1;RSD.items.push({tid:rsTid(),isNew:true,type:'overtime',label:'',mult:'1',after:'',days:daysFor('overtime'),holiday:false,prio:pr});rsPaint();const c=$('#rsRules').lastElementChild;if(c){c.scrollIntoView({block:'center',behavior:'smooth'});c.classList.add('hl');setTimeout(()=>c.classList.remove('hl'),2200);}};
DO['rs-rm']=async d=>{
 rsSync();const it=RSD.items.find(i=>i.tid===d.t);
 if(!(await dialog({title:'Delete Rule',body:'Are you sure you want to delete this rule? This action cannot be undone.',okLabel:'Delete',danger:true})))return;
 RSD.items=RSD.items.filter(i=>i!==it);rsPaint();
};
DO['rs-day']=(d,el)=>{
 rsSync();const tid=el.closest('.rcard').dataset.tid,it=RSD.items.find(i=>i.tid===tid);
 it.days=it.days.includes(d.d)?it.days.filter(x=>x!==d.d):[...it.days,d.d];
 el.classList.toggle('on',it.days.includes(d.d));el.setAttribute('aria-pressed',it.days.includes(d.d));markDirty(el);
 const e=$('#e-ri_'+tid+'_days');if(e)e.textContent='';
};
document.addEventListener('change',e=>{
 const t=e.target.closest('#rsForm select[name^="ri_"][name$="_type"]');if(!t)return;
 rsSync();const tid=t.name.split('_')[1],it=RSD.items.find(i=>i.tid===tid);
 it.days=it.type==='overtime'?daysFor('overtime'):it.type==='weekend_overtime'?it.days.filter(d=>d==='sat'||d==='sun'):(it.days.length?it.days:WD.slice());
 if(it.type==='weekend_overtime'&&!it.days.length)it.days=['sat','sun'];
 rsPaint();
});
document.addEventListener('input',e=>{const l=e.target.closest('#rsForm [name^="ri_"][name$="_label"]');if(l){const b=$('b',l.closest('.rcard'));if(b)b.textContent=l.value.trim()||'Untitled rule';}});
function rsErr(name,msg){const el=$('[name="'+name+'"]',$('#rsForm'));if(el){const f=el.closest('.fld');if(f)f.classList.add('err');}const e=$('#e-'+name,$('#rsForm'));if(e)e.textContent=msg;}
function rsValidate(){
 const f=$('#rsForm');let n=0;const bad=(name,msg)=>{rsErr(name,msg);n++;};
 $$('.fld.err',f).forEach(x=>x.classList.remove('err'));$$('.ferr',f).forEach(x=>x.textContent='');
 if(!$('[name="rs_name"]',f).value.trim())bad('rs_name','Name is required');
 const hr=RSD.hr,sh=S.company.shiftHours;
 if(hr.on){
  if(!hr.from)bad('hr_from','Required');if(!hr.to)bad('hr_to','Required');else if(hr.from&&hr.from===hr.to)bad('hr_to','From and To cannot be the same time');
  if(!(parseFloat(hr.mult)>0))bad('hr_mult','Multiplier must be greater than 0');
 }
 RSD.items.forEach((it,i)=>{
  const p='ri_'+it.tid+'_',tn=RULE_TYPE_NAME[it.type];
  if(!it.label)bad(p+'label','Rule Name is required');
  if(it.mult==='')bad(p+'mult','Multiplier Rate is required');else if(!(parseFloat(it.mult)>0))bad(p+'mult','Multiplier must be greater than 0');
  if(it.after==='')bad(p+'after','Applies After is required');
  else if(!/^\d+(\.\d{1,2})?$/.test(it.after))bad(p+'after','Use hours with up to 2 decimals, e.g. 2 or 2.25');
  else if(it.type!=='penalty'){
   const base=it.type==='weekend_overtime'?0:sh,a=parseFloat(it.after);
   if(a<base)bad(p+'after',`Applies After for a ${tn} tier can never be less than ${base}h`);
   else{
    const prev=RSD.items.filter((o,j)=>j<i&&o.type===it.type&&o.after!==''&&o.days.some(d=>it.days.includes(d))).filter(o=>a<=parseFloat(o.after)).sort((x,y)=>parseFloat(y.after)-parseFloat(x.after))[0];
    if(prev)bad(p+'after',`Applies After must be greater than the previous ${tn} tier's ${prev.after}h`);
   }
  }
  if(!it.days.length)bad(p+'days','Pick at least one day');
  else if(it.type==='overtime'&&it.days.length!==5)bad(p+'days','Overtime always applies Monday through Friday');
  else if(it.type==='weekend_overtime'&&it.days.some(d=>d!=='sat'&&d!=='sun'))bad(p+'days','Weekend Overtime can only apply on Saturday or Sunday');
 });
 return n===0;
}
DO['rs-save']=()=>{
 rsSync();const f=$('#rsForm'),r=rsOf(RSD.id);
 if(!rsValidate()){const e=$('.fld.err',f)||$('.ferr:not(:empty)',f);if(e)e.scrollIntoView({block:'center',behavior:'smooth'});return toastErr('Can’t save yet','Fix the highlighted fields.');}
 const nm=$('[name="rs_name"]',f).value.trim(),mk=$('[name="rs_default"]',f).checked;
 if(S.company.rulesets.some(x=>x!==r&&x.name.toLowerCase()===nm.toLowerCase())){rsErr('rs_name','Another ruleset already uses this name');return toastErr('Can’t save yet','Ruleset names must be unique.');}
 Object.assign(r,{name:nm,status:$('[name="rs_status"]',f).value,description:$('[name="rs_desc"]',f).value.trim(),hr:{...RSD.hr},items:RSD.items.map((it,i)=>({id:it.id||'ri'+Date.now()+i,type:it.type,label:it.label,mult:it.mult,after:it.after,days:it.days.slice(),holiday:it.holiday,prio:i+1}))});
 if(mk&&!r.isDefault){S.company.rulesets.forEach(x=>x.isDefault=false);r.isDefault=true;}
 GUARD.dirty=false;toast('Ruleset updated',r.name+' · applied to '+r.emp+' employees');go('company');
};
