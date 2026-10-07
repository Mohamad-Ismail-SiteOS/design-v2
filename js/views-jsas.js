/* =====================================================================
   JSAs. Structure follows the shipped screens:
   - JSAs: "JSA templates" + "Assign JSA"; tabs All JSAs | Waiting for me
   - Assign JSA: Job, Day, Template, Approver, Send to crew
   - JSA detail: status, crew progress, approval (Approve / Decline and send back with a reason),
     office actions (change approver, Send to crew, Edit its template, Delete), the filled form
   - My JSAs (/jsas/today): what you have to fill in, what is waiting for your approval
   - Templates: list, and the builder (15 question types, required, options, "Used on jobs",
     default approver, preview as the crew sees it)
   ===================================================================== */
JS.draft=['neutral','Not sent yet'];
const jsaBy=id=>S.jsas.find(j=>j.id.toLowerCase()===String(id).toLowerCase());
const nextJsaNo=()=>Math.max(3300,...S.jsas.map(j=>+String(j.id).split('-')[1]||0))+1;
const tplBy=id=>S.jsaTpls.find(t=>t.id===id);
const typeLbl=t=>(JSA_TYPES.find(x=>x[0]===t)||[t,t])[1];
const jsaHref=j=>'jsas/'+j.id.toLowerCase();
const mineToFill=()=>S.jsas.filter(j=>j.crew.includes(ME.name)&&['sent','progress','declined'].includes(j.st));
const waitingForMe=()=>S.jsas.filter(j=>j.st==='await'&&j.approver===ME.name);
const canApprove=j=>j.st==='await'&&(j.approver===ME.name||can('edit:jsa'));
const riskPill=r=>{const x=RISK.find(k=>k[0]===r)||RISK[3];return `<span class="risk" style="--c:${x[2]}">${x[1]}</span>`;};

/* ---------- list ---------- */
VIEWS.jsas.title='Job Safety Analyses';
VIEWS.jsas.sub='Send a job’s daily JSA to the crew. Every one is a copy of the job’s JSA template. They fill it in on their phones or under My JSAs here, and the approver approves it here.';
VIEWS.jsas.perm=['view:jsa','edit:jsa'];
VIEWS.jsas.act=()=>`<button type="button" class="btn btn-ghost" data-go="jsas/templates">${ICON('doc')}<span class="lb">JSA templates</span></button>`+(can('edit:jsa')?`<button type="button" class="btn" data-do="jsa-assign">${ICON('plus')}<span class="lb">Assign JSA</span></button>`:'');
VIEWS.jsas.render=function(){
 const n=S.jsas.length,sub=cnt(S.jsas,j=>j.ans===j.q&&j.st!=='draft'),signed=cnt(S.jsas,j=>j.st==='approved');
 const segs=Object.keys(JS).map((k,i)=>({k:JS[k][1],v:cnt(S.jsas,j=>j.st===k),c:['var(--ok)','var(--warn-dot)','var(--s3)','var(--bad-dot)','var(--s7)','var(--bad-dot)','var(--s7)'][i%7]})).filter(s=>s.v);
 return `<div class="page">
  ${strip('five',[
   {k:'Due today',icon:'shield',v:n,d:'across '+new Set(S.jsas.map(j=>j.job)).size+' jobs'},
   {k:'Submitted',icon:'doc',tone:'var(--s3)',v:sub,chip:chip('info',pctT(pct(sub,n),0)+' of today')},
   {k:'Waiting for me',icon:'hour',tone:'var(--warn-dot)',v:waitingForMe().length,d:'you are the approver',act:{tab:'jsas:waiting',scroll:'#L-jsas'}},
   {k:'Overdue',icon:'alert',tone:'var(--bad-dot)',v:overdueJsa(),d:'shift already started',act:{tab:'jsas:overdue',scroll:'#L-jsas'}},
   {k:'Sent back',icon:'closec',tone:'var(--s6)',v:cnt(S.jsas,j=>j.st==='declined'),d:'crew must redo'}])}
  <div class="g wl">${card({title:'Today’s JSA run',sub:'From assigned to signed off',body:steps([{k:'Sent to crew',icon:'send',v:N(n),pc:100,state:'done'},{k:'Filled in',icon:'doc',v:sub+' / '+n,pc:pct(sub,n),state:sub===n?'done':'now'},{k:'Signed off',icon:'checkc',v:signed+' / '+n,pc:pct(signed,n),state:signed===n?'done':(signed?'now':'')}]),foot:'<span>Signed off</span><b class="num">'+pctT(pct(signed,n),0)+'</b>'})}
   ${card({title:'JSAs by status',cls:'aside',body:donut(segs,{n,l:'today'},{sw:15})+legend(segs)})}</div>
  ${listCard('jsas',{href:r=>jsaHref(r),rows:S.jsas,tabs:[{key:'all',label:'All JSAs'},{key:'waiting',label:'Waiting for me'}],tabOf:(r,k)=>k==='all'||(r.st==='await'&&r.approver===ME.name),
   search:'Search JSA, job or person',filters:[{label:'Hazards flagged',test:r=>r.haz>0},{label:'Sent back',test:r=>r.st==='declined'},{label:'Overdue',test:r=>r.st==='overdue'}],text:r=>r.tpl+' '+r.id+' '+r.job+' '+r.resp.join(' ')+' '+r.approver,minW:1100,
   cols:[{h:'JSA',v:r=>titled(r.tpl,r.id,null,1)},{h:'Job',v:r=>jobTag(r.job)},{h:'Crew',v:r=>avs(r.crew)},{h:'Approver',v:r=>r.approver?person(r.approver):'<span class="dash">No approver</span>'},{h:'Day',v:r=>esc(r.shift)},{h:'Answered',v:r=>`<div class="budget"><div class="bar"><i style="width:${pct(r.ans,r.q)}%;--c:var(--brand)"></i></div><b class="num">${r.ans}/${r.q}</b></div>`},{h:'Hazards',v:r=>r.haz?`<span style="color:var(--warn);font-weight:600">${r.haz} flagged</span>`:'<span class="dash">None</span>'},{h:'Status',v:r=>pill(JS[r.st][0],JS[r.st][1],1)}],
   action:(r,i,lid)=>canApprove(r)&&r.approver===ME.name?actBtns(lid,i,[{a:'review',label:'Review'}]):actBtns(lid,i,[{a:'view',label:'View',cls:'btn-ghost'}]),
   onAct:(a,r)=>go(jsaHref(r))})}</div>`;
};
VIEWS.jsas.count=()=>waitingForMe().length+overdueJsa()||null;

/* ---------- Assign JSA ---------- */
DO['jsa-assign']=d=>{
 const jobs=S.jobs.filter(j=>!j.arch),preJob=(d&&d.job)||'';
 const approvers=S.employees.filter(e=>e.st==='active'&&(e.acct!=='EMPLOYEE'||['admin','supervisor'].includes(e.roleId)));
 drawer({title:'Assign JSA',sub:'Pick the job, the day and who approves it. The crew rostered that day gets the JSA on their phones.',okLabel:'Send to crew',
  rules:{job:v=>v?'':'Choose a job',approver:v=>v?'':'Choose who approves it'},
  body:`<div class="fgrid">${fld({name:'job',label:'Job',type:'select',req:true,span:6,value:preJob,opts:[['','Search jobs…'],...jobs.map(j=>[j.name,j.name])]})}${fld({name:'day',label:'Day',type:'date',req:true,span:6,value:TODAY_ISO})}
   ${fld({name:'tpl',label:'Template',type:'select',span:6,value:'',opts:[['','The job’s template'],...S.jsaTpls.map(t=>[t.id,t.name])],help:'Leave as the job’s template unless this day is different. '})}
   ${fld({name:'approver',label:'Approver',type:'select',req:true,span:6,value:'',opts:[['','Type a name to search…'],...approvers.map(e=>[e.name,e.name+' · '+e.role])],help:'Showing '+approvers.length+' people who can approve.'})}</div>
   <div class="fhelp"><a href="#/jsas/templates" style="color:var(--brand);font-weight:600" data-dclose>Manage templates</a></div>`,
  onOk:v=>{
   const job=jobBy(S.jobs.find(j=>j.name===v.job).id),roster=[...new Set(S.shifts.filter(s=>s.job===job.name&&s.date===v.day&&!s.cancelled).flatMap(s=>s.users))],crew=roster.length?roster:job.qual.slice(0,3);
   if(!crew.length){toastErr('Nobody to send it to','No one is rostered on '+job.name+' that day, and nobody is qualified for it.');return false;}
   const tpl=tplBy(v.tpl)||S.jsaTpls.find(t=>t.jobs.includes(job.name))||S.jsaTpls.find(t=>t.def),n=nextJsaNo();
   const q=tpl.fields.filter(f=>f.type!=='heading').length;
   S.jsas.unshift({tpl:tpl.name,id:'JSA-'+n,job:job.name,resp:crew.slice(0,2),crew,shift:v.day===TODAY_ISO?'Today':fmtD(v.day),ans:0,q,haz:0,photos:0,st:'sent',tplId:tpl.id,approver:v.approver});
   S.jsaAnswers['JSA-'+n]={};rerender(true);toast('JSA sent to the crew',crew.length+' people on '+job.name+' · '+v.approver+' approves');}});
};

/* ---------- field widgets (fill, read-only, preview) ---------- */
function ynButtons(name,val,opts){return seg({name,label:'',value:val||'',opts,span:6}).replace('<label></label>','').replace('class="fld s6"','class="fld yn"');}
function fieldFill(f,a,crew){
 const n='f_'+f.id,L=`<label class="jq">${esc(f.label)}${f.req?'<span class="req">*</span>':''}</label>`;
 let w='';
 switch(f.type){
  case 'yesno':w=ynButtons(n,a,[['yes','Yes'],['no','No']]);break;
  case 'yesnona':w=ynButtons(n,a,[['yes','Yes'],['no','No'],['na','N/A']]);break;
  case 'checklist':w=`<div class="chkl">${(f.opts||[]).map((o,i)=>`<label class="chk"><input type="checkbox" name="${n}__${i}"${(a||[]).includes(o)?' checked':''}>${esc(o)}</label>`).join('')}</div>`;break;
  case 'short':w=`<input name="${n}" value="${esc(a||'')}" maxlength="120">`;break;
  case 'long':w=`<textarea name="${n}" rows="3" maxlength="800">${esc(a||'')}</textarea>`;break;
  case 'checkbox':w=`<label class="chk"><input type="checkbox" name="${n}"${a?' checked':''}>Confirmed</label>`;break;
  case 'task':{const t=a||{};w=`<div class="taskf"><input name="${n}__haz" value="${esc(t.hazard||f.label)}" placeholder="Hazard"><textarea name="${n}__ctl" rows="2" placeholder="Controls: what will you do about it?">${esc(t.control||'')}</textarea><label class="scsel"><span class="sr">Risk</span><select name="${n}__risk">${RISK.map(r=>`<option value="${r[0]}"${(t.risk||'low')===r[0]?' selected':''}>${r[1]} risk</option>`).join('')}</select></label></div>`;break;}
  case 'signatures':w=`<div class="chkl">${crew.map((p,i)=>`<label class="chk sig"><input type="checkbox" name="${n}__sig${i}" data-who="${esc(p)}"${(a||[]).includes(p)?' checked':''}><span class="av">${ini(p)}</span>${esc(p)}<small>tap to sign</small></label>`).join('')}</div>`;break;
  case 'person':w=`<select name="${n}"><option value="">Select a person</option>${crew.map(p=>`<option${a===p?' selected':''}>${esc(p)}</option>`).join('')}</select>`;break;
  case 'dropdown':w=`<select name="${n}"><option value="">Select</option>${(f.opts||[]).map(o=>`<option${a===o?' selected':''}>${esc(o)}</option>`).join('')}</select>`;break;
  case 'date':w=`<input type="date" name="${n}" value="${esc(a||'')}">`;break;
  case 'phone':w=`<input type="tel" name="${n}" value="${esc(a||'')}" placeholder="04xx xxx xxx">`;break;
  case 'address':w=`<input name="${n}" value="${esc(a||'')}" list="addrs" placeholder="Search for address…">`;break;
  case 'photos':w=`<div class="phs"><input type="hidden" name="${n}" value="${a||0}"><span class="phn">${a||0} photo${(a||0)===1?'':'s'}</span><button type="button" class="btn btn-ghost btn-sm" data-do="jsa-photo" data-n="${n}">${ICON('upload')}Add photo</button></div>`;break;
 }
 return f.type==='heading'?`<h4 class="jh">${esc(f.label)}</h4>`:`<div class="jqrow" data-jq="${f.id}">${L}${w}<div class="ferr" id="e-${n}" role="alert"></div></div>`;
}
function fieldRead(f,a){
 if(f.type==='heading')return `<h4 class="jh">${esc(f.label)}</h4>`;
 let v;const none='<span class="subtle" style="font-style:italic">Not answered yet</span>';
 if(a===undefined||a===''||a===null||(Array.isArray(a)&&!a.length))v=none;
 else switch(f.type){
  case 'yesno':case 'yesnona':v=pill(a==='yes'?'ok':a==='no'?'bad':'neutral',a==='yes'?'Yes':a==='no'?'No':'N/A');break;
  case 'checklist':v=a.map(x=>`<span class="chip">${esc(x)}</span>`).join(' ');break;
  case 'checkbox':v=pill('ok','Confirmed');break;
  case 'task':v=`<div class="taskr"><b>${esc(a.hazard)}</b><p>${esc(a.control)}</p>${riskPill(a.risk)}</div>`;break;
  case 'signatures':v=`<div class="sigs">${a.map(p=>`<span class="sig"><i>${esc(p)}</i><small>${esc(p)} · signed</small></span>`).join('')}</div>`;break;
  case 'photos':v=`<div class="phg">${Array.from({length:Math.min(a,6)},(_,i)=>`<span class="ph">${ICON('eye')}</span>`).join('')}<small class="subtle">${a} photo${a===1?'':'s'}</small></div>`;break;
  default:v=`<span>${esc(a)}</span>`;
 }
 return `<div class="jqrow ro"><label class="jq">${esc(f.label)}${f.req?'<span class="req">*</span>':''}</label><div class="jans">${v}</div></div>`;
}
function collectAnswers(root,tpl,crew){
 const d=readForm(root),a={};
 tpl.fields.filter(f=>f.type!=='heading').forEach(f=>{const n='f_'+f.id;
  switch(f.type){
   case 'checklist':a[f.id]=(f.opts||[]).filter((o,i)=>d[n+'__'+i]);break;
   case 'task':a[f.id]=(d[n+'__ctl']||'').trim()||d[n+'__haz']?{hazard:d[n+'__haz'],control:d[n+'__ctl'],risk:d[n+'__risk']}:null;break;
   case 'signatures':a[f.id]=crew.filter((p,i)=>d[n+'__sig'+i]);break;
   case 'checkbox':a[f.id]=!!d[n];break;
   case 'photos':a[f.id]=+d[n]||0;break;
   default:a[f.id]=d[n]||'';}
 });
 return a;
}
const isEmptyAns=(f,v)=>v===undefined||v===''||v===null||v===false||(Array.isArray(v)&&!v.length)||v===0||(f.type==='task'&&(!v||!(v.control||'').trim()));
DO['jsa-photo']=(d,el)=>{const h=$('[name="'+d.n+'"]');h.value=(+h.value||0)+1;$('.phn',el.closest('.phs')).textContent=h.value+' photo'+(h.value==='1'?'':'s');markDirty(h);};

/* ---------- detail: fill, review, approve / send back ---------- */
VIEWS['jsa-detail']={path:'jsas/:id',parent:'jsas',
 title:()=>{const j=jsaBy(P.id);return j?j.tpl:'JSA';},sub:()=>{const j=jsaBy(P.id);return j?j.id+' · '+j.job+' · '+j.shift:'';},
 crumbs:()=>{const j=jsaBy(P.id);return [[can(['view:jsa','edit:jsa'])?'JSAs':'My JSAs',can(['view:jsa','edit:jsa'])?'jsas':'jsas/today'],[j?j.id:'Not found']];},
 act:()=>{const j=jsaBy(P.id);if(!j||!can('edit:jsa'))return '';return (j.st==='draft'?`<button type="button" class="btn" data-do="jsa-send" data-id="${j.id}">${ICON('send')}<span class="lb">Send to crew</span></button>`:'')+`<button type="button" class="btn btn-ghost" data-go="jsas/templates/${j.tplId}">${ICON('edit')}<span class="lb">Edit its template</span></button><button type="button" class="btn btn-danger" data-do="jsa-del" data-id="${j.id}">${ICON('trash')}<span class="lb">${j.st==='draft'?'Delete draft':'Delete JSA'}</span></button>`;},
 render(){
  const j=jsaBy(P.id);if(!j)return notFound('JSA',can(['view:jsa','edit:jsa'])?'jsas':'jsas/today');
  const tpl=tplBy(j.tplId),ans=S.jsaAnswers[j.id]||{},filling=j.crew.includes(ME.name)&&['sent','progress','declined'].includes(j.st);
  const steps_=[{k:'Sent to crew',icon:'send',v:j.st==='draft'?'Not yet':'Sent',pc:j.st==='draft'?0:100,state:j.st==='draft'?'':'done'},{k:'Filled in',icon:'doc',v:j.ans+' / '+j.q,pc:pct(j.ans,j.q),state:j.ans===j.q?'done':(j.ans?'now':'')},{k:'Approved',icon:'checkc',v:j.st==='approved'?'Done':j.st==='declined'?'Sent back':'Waiting',pc:j.st==='approved'?100:0,state:j.st==='approved'?'done':(j.st==='await'?'now':'')}];
  const approval=j.st==='await'?`<section class="qv-card approval"><div class="qv-body"><div class="ap-h"><span class="gi2x">${ICON('hour')}</span><div class="grow"><b>${j.approver===ME.name?'Waiting for your approval':'Waiting for '+esc(j.approver)}</b><small>${canApprove(j)?'Read the answers below, then approve or send it back to the crew.':'Only the approver can approve it.'}</small></div>${canApprove(j)?`<button type="button" class="btn btn-ghost" data-do="jsa-decline" data-id="${j.id}">${ICON('close')}Decline & send back</button><button type="button" class="btn" data-do="jsa-approve" data-id="${j.id}">${ICON('check')}Approve</button>`:''}</div></div></section>`
   :j.st==='declined'?`<section class="qv-card approval bad"><div class="qv-body"><div class="ap-h"><span class="gi2x bad">${ICON('closec')}</span><div class="grow"><b>Sent back${j.crew.includes(ME.name)?'. Please redo it':''}</b><small>${esc(j.approver)} says: “${esc(j.declinedNote||'')}”</small></div></div></div></section>`
   :j.st==='approved'?`<section class="qv-card approval ok"><div class="qv-body"><div class="ap-h"><span class="gi2x ok">${ICON('checkc')}</span><div class="grow"><b>Filled in and approved</b><small>Approved by ${esc(j.approver)}</small></div></div></div></section>`:'';
  const office=can('edit:jsa')&&['draft','sent','progress','await'].includes(j.st)?`<div class="kvl" style="padding:2px 0 10px"><small>Approver</small><span><label class="scsel"><span class="sr">Approver</span><select data-jsaappr="${j.id}" aria-label="Approver">${S.employees.filter(e=>e.st==='active'&&(e.acct!=='EMPLOYEE'||['admin','supervisor'].includes(e.roleId))).map(e=>`<option${e.name===j.approver?' selected':''}>${esc(e.name)}</option>`).join('')}</select></label></span></div>`:'';
  const form=tpl.fields.map(f=>filling?fieldFill(f,ans[f.id],j.crew):fieldRead(f,ans[f.id])).join('');
  return `<div class="page" id="jsaPage" data-id="${j.id}">${strip('four',[{k:'Status',icon:'shield',v:`<span style="font-size:20px">${JS[j.st][1]}</span>`,tone:'var(--s3)'},{k:'Answered',icon:'doc',v:j.ans+'/'+j.q,tone:'var(--s6)',d:pctT(pct(j.ans,j.q),0)+' complete'},{k:'Crew',icon:'users',v:j.crew.length,tone:'var(--s4)',d:j.crew.join(', ')},{k:'Hazards flagged',icon:'alert',v:j.haz,tone:j.haz?'var(--warn-dot)':'var(--ok)',d:j.haz?'need a control':'none'}])}
   ${approval}${office?`<section class="qv-card"><div class="qv-body">${office}</div></section>`:''}
   <section class="qv-card"><div class="qv-hd"><div class="grow"><h3>Progress</h3></div></div><div class="qv-body">${steps(steps_)}</div></section>
   <section class="qv-card"><div class="qv-hd"><div class="grow"><h3>${esc(tpl.name)}</h3><div class="s">${filling?'Fill this in on site. You can save and come back.':'The form as the crew filled it in'}</div></div>${j.photos?`<div class="meta">${chip('','<span>'+j.photos+' photos</span>','file')}</div>`:''}</div>
    <div class="qv-body jform" ${filling?'data-form':''} id="jsaForm">${form}</div>${filling?`<div class="rbar"><span class="hint">${j.ans} of ${j.q} answered</span><button type="button" class="btn btn-ghost" data-do="jsa-save" data-id="${j.id}" data-submit="0">Save progress</button><button type="button" class="btn" data-do="jsa-save" data-id="${j.id}" data-submit="1">${ICON('send')}Submit for approval</button></div>`:''}</section></div>`;
 }};
document.addEventListener('change',e=>{const s=e.target.closest('[data-jsaappr]');if(!s)return;const j=jsaBy(s.dataset.jsaappr);j.approver=s.value;rerender(true);toast('Approver changed',s.value);});
DO['jsa-save']=d=>{
 const j=jsaBy(d.id),tpl=tplBy(j.tplId),root=$('#jsaForm'),a=collectAnswers(root,tpl,j.crew),qs=tpl.fields.filter(f=>f.type!=='heading');
 const done=qs.filter(f=>!isEmptyAns(f,a[f.id])).length;
 if(d.submit==='1'){const miss=qs.filter(f=>f.req&&isEmptyAns(f,a[f.id]));
  $$('.jqrow .ferr',root).forEach(x=>x.textContent='');$$('.jqrow',root).forEach(x=>x.classList.remove('bad'));
  if(miss.length){miss.forEach(f=>{const r=$('[data-jq="'+f.id+'"]',root);if(r){r.classList.add('bad');const er=$('.ferr',r);if(er)er.textContent='Answer this one to submit';}});toastErr('Answer the required questions','Missing: '+miss.map(f=>f.label).slice(0,2).join(', ')+(miss.length>2?' and '+(miss.length-2)+' more':'')+'.');const r=$('[data-jq="'+miss[0].id+'"]',root);if(r)r.scrollIntoView({block:'center',behavior:'smooth'});return;}}
 S.jsaAnswers[j.id]=a;j.ans=done;j.haz=Object.values(a).filter(v=>v&&v.risk&&['extreme','high'].includes(v.risk)).length;j.photos=qs.filter(f=>f.type==='photos').reduce((x,f)=>x+(a[f.id]||0),0);
 GUARD.dirty=false;
 if(d.submit==='1'){j.st='await';j.declinedNote=null;toast('Submitted for approval',j.approver+' is told by push and email');go(can(['view:jsa','edit:jsa'])?'jsas':'jsas/today');}
 else{j.st=j.st==='declined'?'declined':'progress';rerender(true);toast('Progress saved',done+' of '+j.q+' answered');}
};
DO['jsa-approve']=async d=>{const j=jsaBy(d.id);if(!(await dialog({title:'Approve JSA?',body:`The crew is told <b>${esc(j.job)}</b> is safe to start. This is recorded against <b>${esc(ME.name)}</b>.`,okLabel:'Approve'})))return;j.st='approved';if(j.approver!==ME.name)j.approver=ME.name+' (for '+j.approver+')';rerender(true);toast('JSA approved',j.job);};
DO['jsa-decline']=d=>{const j=jsaBy(d.id);drawer({title:'Decline JSA',sub:j.job+' · '+j.tpl,okLabel:'Decline & send back',danger:true,rules:{note:v=>v.trim().length<6?'Tell the crew what to fix':''},
 body:`<div class="fgrid">${fld({name:'note',label:'What needs fixing?',type:'textarea',req:true,rows:4,span:6,max:400,ph:'e.g. Add the EWP spotter to the controls, and tick the harness.',help:'The crew sees this and has to redo and resubmit the JSA.'})}</div>`,
 onOk:v=>{j.st='declined';j.declinedNote=v.note;rerender(true);toast('JSA declined',j.crew.join(', ')+' told to redo it');}});};
DO['jsa-send']=d=>{const j=jsaBy(d.id);if(!j.approver){toastErr('Choose who approves this JSA before sending it','Pick an approver first.');return;}j.st='sent';rerender(true);toast('Sent to the crew',j.crew.join(', '));};
DO['jsa-del']=async d=>{const j=jsaBy(d.id);if(!(await dialog({title:j.st==='draft'?'Delete draft?':'Delete JSA?',body:j.st==='draft'?'The draft is removed. Nothing was sent.':`<b>${esc(j.id)}</b> and the crew’s answers are deleted. This can’t be undone.`,okLabel:j.st==='draft'?'Delete draft':'Delete JSA',danger:true})))return;S.jsas=S.jsas.filter(x=>x!==j);toast('JSA deleted',j.id);go('jsas');};

/* ---------- My JSAs ---------- */
VIEWS['jsas-today']={path:'jsas/today',parent:'jsas-today',grp:'ops',icon:'doc',label:'My JSAs',title:'My JSAs',sub:'What you have to fill in today, and what is waiting for you to approve.',
 count:()=>mineToFill().length+waitingForMe().length||null,bad:true,
 render(){
  const fill=mineToFill(),wait=waitingForMe(),card_=(j,cta)=>`<div class="setrow link jcard" data-go="${jsaHref(j)}" role="button" tabindex="0"><span class="gi2x${j.st==='declined'?' bad':''}">${ICON(j.st==='declined'?'closec':'shield')}</span><span class="grow"><b>${esc(j.tpl)}</b><small>${esc(j.job)} · ${esc(j.shift)}${j.st==='declined'?' · sent back':''}</small>${j.ans?`<div class="bar" style="margin-top:6px;max-width:260px"><i style="width:${pct(j.ans,j.q)}%;--c:var(--brand)"></i></div>`:''}</span>${pill(JS[j.st][0],JS[j.st][1],1)}<span class="btn btn-sm${j.st==='declined'?'':''}">${cta}</span></div>`;
  return `<div class="page"><section class="qv-card"><div class="qv-hd"><div class="grow"><h3>Fill in</h3><div class="s">JSAs sent to you today</div></div></div><div class="qv-body">${fill.length?fill.map(j=>card_(j,'Fill in')).join(''):'<div class="empty"><b>No JSA for you today</b>When a supervisor sends you one it shows up here.</div>'}</div></section>
   <section class="qv-card"><div class="qv-hd"><div class="grow"><h3>Waiting for me</h3><div class="s">Submitted by a crew you approve</div></div></div><div class="qv-body">${wait.length?wait.map(j=>card_(j,'Review')).join(''):'<div class="empty"><b>Nothing waiting for you</b>When a crew submits a JSA you approve, it shows up here and you get an email.</div>'}</div></section></div>`;
 }};

/* ---------- templates: list ---------- */
VIEWS['jsa-templates']={path:'jsas/templates',parent:'jsas',perm:['view:jsa','edit:jsa'],title:'JSA templates',sub:'Build the form once. Every JSA sent for the jobs using it is a copy.',
 crumbs:()=>[['JSAs','jsas'],['Templates']],
 act:()=>can('edit:jsa')?`<button type="button" class="btn" data-go="jsas/templates/new">${ICON('plus')}<span class="lb">New template</span></button>`:'',
 render(){
  return `<div class="page"><div class="tcards">${S.jsaTpls.map(t=>{const q=t.fields.filter(f=>f.type!=='heading').length;return `<article class="qv-card tplcard"><div class="qv-body"><div class="tp-h"><span class="gi2x">${ICON('shield')}</span><div class="grow"><b>${esc(t.name)}</b><small>${q} question${q===1?'':'s'}</small></div>${t.def?pill('info','Default'):''}</div>
   <div class="kvl"><small>Used on</small><span style="text-align:right">${t.def?'Every job without its own template':t.jobs.length?t.jobs.map(esc).join(', '):'<span class="dash">No jobs yet</span>'}</span></div><div class="kvl"><small>Default approver</small><b style="font-size:13.5px">${esc(t.approver||'None')}</b></div>
   <div class="tp-f"><button type="button" class="btn btn-ghost btn-sm" data-go="jsas/templates/${t.id}">${ICON('edit')}${can('edit:jsa')?'Edit':'View'}</button></div></div></article>`;}).join('')}</div>
   <div class="banner info">${ICON('shield')}<span>Jobs not listed on any template use the default one. A job moves off its old template when you add it to a new one.</span></div></div>`;
 }};

/* ---------- template builder ---------- */
let JB=null;
const blankField=type=>({id:'f'+Date.now()+Math.floor(Math.random()*999),type,label:type==='heading'?'':'',req:false,opts:['dropdown','checklist'].includes(type)?['']:undefined});
function openBuilder(id){
 const t=id?tplBy(id):null;
 JB=t?{id:t.id,name:t.name,jobs:t.jobs.slice(),approver:t.approver,def:t.def,fields:t.fields.map(f=>({...f,opts:f.opts?f.opts.slice():undefined}))}:{id:'',name:'',jobs:[],approver:'',def:false,fields:[]};
 return JB;
}
function builderHtml(){
 const t=JB,jobOpts=S.jobs.filter(j=>!j.arch).map(j=>[j.id,j.name,tplOfJob(j.name)]),approvers=S.employees.filter(e=>e.st==='active'&&(e.acct!=='EMPLOYEE'||['admin','supervisor'].includes(e.roleId)));
 const ro=!can('edit:jsa');
 return `<div class="jbwrap"><form class="formpage jb" data-form novalidate onsubmit="return false" id="jbForm" style="max-width:none">
  ${fsec('Template details','Name it, say where it applies and who approves it',
   fld({name:'name',label:'Template name',req:true,value:t.name,span:6,ph:'e.g. EWP work JSA',max:80,help:'Also the title the crew sees on the JSA.',disabled:ro})
   +(t.def?`<div class="banner info" style="grid-column:1/-1">${ICON('shield')}<span>This is the default template. Jobs not listed on any template use it anyway.</span></div>`:msel({name:'jobs',label:'Used on jobs',opts:jobOpts,value:t.jobs.map(n=>(S.jobs.find(j=>j.name===n)||{}).id).filter(Boolean),span:6,ph:'Search jobs…',help:'Jobs not listed on any template use the default one. A job moves off its old template when you add it here. Removed jobs go back to the default.'}))
   +fld({name:'approver',label:'Default approver',type:'select',value:t.approver,span:6,disabled:ro,opts:[['','Who usually approves it?'],...approvers.map(e=>[e.name,e.name+' · '+e.role])],help:'Pre-selected when you send a JSA. You can pick someone else each time.'}))}
  <section class="qv-card fsec"><div class="qv-hd"><div class="grow"><h3>Questions</h3><div class="s">Build the form the crew will fill in</div></div><div class="meta"><span class="tc num" id="jbCount"></span></div></div><div class="qv-body"><div id="jbFields"></div>
   ${ro?'':`<div style="margin-top:12px"><button type="button" class="btn btn-ghost" data-do="row-menu" data-kind="jbadd" data-id="x" data-items="${JSA_TYPES.map(x=>x[0]+':'+x[1]).join('|')}" aria-haspopup="menu">${ICON('plus')}Add a field</button></div>`}</div></section>
  <div class="fbar"><span class="hint">${t.id?'No changes yet':'Nothing saved yet'}</span>${t.id&&!t.def&&!ro?`<button type="button" class="btn btn-danger" data-do="jb-del" style="margin-right:auto">${ICON('trash')}Delete template</button>`:''}<button type="button" class="btn btn-ghost" data-go="jsas/templates">Cancel</button>${ro?'':`<button type="button" class="btn" data-do="jb-save" data-fsave${t.id?' disabled':''}>${ICON('check')}${t.id?'Save template':'Create template'}</button>`}</div></form>
  <aside class="jbprev" aria-label="Preview as the crew sees it"><div class="pvphone"><div class="ph-top"><span>${ICON('shield')}</span><b id="pvTitle"></b></div><div class="ph-body" id="jbPrev"></div></div><small class="subtle">Preview — as the crew sees it</small></aside></div>`;
}
const tplOfJob=n=>{const t=S.jsaTpls.find(x=>x.jobs.includes(n));return t&&t.id!==(JB&&JB.id)?'On "'+t.name+'"':'';};
function fieldEditor(f,i,n){
 const hasOpts=['dropdown','checklist'].includes(f.type),ro=!can('edit:jsa');
 return `<div class="fe${f.type==='heading'?' hd':''}" data-fi="${i}"><div class="fe-h"><span class="ftype">${esc(typeLbl(f.type))}</span><span class="grow"></span>${ro?'':`<button type="button" class="rowbtn" data-do="jb-up" data-i="${i}" aria-label="Move up"${i?'':' disabled'}><span style="display:inline-flex;transform:rotate(-90deg)">${ICON('next')}</span></button><button type="button" class="rowbtn" data-do="jb-down" data-i="${i}" aria-label="Move down"${i<n-1?'':' disabled'}><span style="display:inline-flex;transform:rotate(90deg)">${ICON('next')}</span></button><button type="button" class="rowbtn" data-do="jb-rm" data-i="${i}" aria-label="Remove field" title="Remove field">${ICON('trash')}</button>`}</div>
  <div class="fgrid"><div class="fld s${f.type==='heading'||ro?6:4}"><label for="fl${i}">${f.type==='heading'?'Section heading':'Question'}</label><input id="fl${i}" data-flab="${i}" value="${esc(f.label)}" placeholder="${f.type==='heading'?'e.g. Before you start':'Write the question'}" maxlength="140" ${ro?'disabled':''}><div class="ferr" id="fe${i}"></div></div>
   ${f.type==='heading'?'':`<div class="setrow fswitch s2"><span class="grow"><b>Required</b></span><button type="button" class="tog${f.req?' on':''}" role="switch" aria-checked="${!!f.req}" data-do="jb-req" data-i="${i}" aria-label="Required" ${ro?'disabled':''}><i></i></button></div>`}
   ${hasOpts?`<div class="fld s6"><label for="fo${i}">Options<small class="subtle" style="font-weight:500"> one per line</small></label><textarea id="fo${i}" data-fopt="${i}" rows="${Math.max(3,(f.opts||[]).length+1)}" placeholder="Option 1" ${ro?'disabled':''}>${esc((f.opts||[]).join('\n'))}</textarea><div class="ferr" id="fp${i}"></div></div>`:''}</div></div>`;
}
function paintFields(){
 const el=$('#jbFields');if(!el)return;
 el.innerHTML=JB.fields.length?JB.fields.map((f,i)=>fieldEditor(f,i,JB.fields.length)).join(''):`<div class="empty"><b>Start with a section heading</b>Then add the questions under it.</div>`;
 const q=JB.fields.filter(f=>f.type!=='heading').length;$('#jbCount').textContent=q+' question'+(q===1?'':'s');paintPreview();
}
function previewField(f){
 const L=esc(f.label||(f.type==='heading'?'Section heading':'Untitled question'))+(f.req?'<span class="req">*</span>':'');
 const w={yesno:'<div class="pv-yn"><i>Yes</i><i>No</i></div>',yesnona:'<div class="pv-yn"><i>Yes</i><i>No</i><i>N/A</i></div>',checklist:(f.opts||[]).filter(Boolean).map(o=>`<div class="pv-c"><i></i>${esc(o)}</div>`).join('')||'<div class="pv-c"><i></i>Option</div>',short:'<div class="pv-i"></div>',long:'<div class="pv-i tall"></div>',checkbox:'<div class="pv-c"><i></i>Confirmed</div>',task:'<div class="pv-i"></div><div class="pv-i tall"></div><div class="pv-r">Low risk</div>',signatures:'<div class="pv-s">Tap to sign</div>',person:'<div class="pv-i sel"></div>',dropdown:'<div class="pv-i sel">'+esc((f.opts||[]).filter(Boolean)[0]||'Select')+'</div>',date:'<div class="pv-i sel">dd/mm/yyyy</div>',phone:'<div class="pv-i"></div>',address:'<div class="pv-i"></div>',photos:'<div class="pv-ph">+ Add photo</div>'}[f.type]||'';
 return f.type==='heading'?`<div class="pv-h">${L}</div>`:`<div class="pv-q"><label>${L}</label>${w}</div>`;
}
function paintPreview(){const el=$('#jbPrev');if(!el)return;el.innerHTML=JB.fields.length?JB.fields.map(previewField).join(''):'<div class="pv-empty">Questions you add appear here.</div>';const n=$('#jbForm [name="name"]');$('#pvTitle').textContent=(n&&n.value)||JB.name||'New JSA template';}
/* one listener for the page's lifetime: #app persists, so binding in mount() would stack a new copy on every visit */
document.addEventListener('input',e=>{
 if(!JB||!e.target.closest('#jbForm'))return;
 const l=e.target.closest('[data-flab]'),o=e.target.closest('[data-fopt]');
 if(l){JB.fields[+l.dataset.flab].label=l.value;paintPreview();}
 if(o){JB.fields[+o.dataset.fopt].opts=o.value.split('\n');paintPreview();}
 if(e.target.name==='name')paintPreview();});
const builderMount=root=>{mselInit(root);paintFields();};
['dropdown','checklist','yesno','yesnona','short','long','checkbox','task','signatures','person','date','phone','address','photos','heading'].forEach(t=>{DO['jbadd-'+t]=()=>{JB.fields.push(blankField(t));paintFields();markDirty($('#jbForm'));const last=$('#jbFields .fe:last-child input');if(last)last.focus();};});
DO['jb-up']=d=>{const i=+d.i;if(i<1)return;[JB.fields[i-1],JB.fields[i]]=[JB.fields[i],JB.fields[i-1]];paintFields();markDirty($('#jbForm'));};
DO['jb-down']=d=>{const i=+d.i;if(i>=JB.fields.length-1)return;[JB.fields[i+1],JB.fields[i]]=[JB.fields[i],JB.fields[i+1]];paintFields();markDirty($('#jbForm'));};
DO['jb-req']=d=>{const f=JB.fields[+d.i];f.req=!f.req;paintFields();markDirty($('#jbForm'));};
DO['jb-rm']=async d=>{const f=JB.fields[+d.i];if(f.label.trim()&&!(await dialog({title:'Remove field',body:`Remove <b>${esc(f.label)}</b> from this template? JSAs not filled in yet are updated too.`,okLabel:'Remove',keep:'Keep it',danger:true})))return;JB.fields.splice(+d.i,1);paintFields();markDirty($('#jbForm'));};
DO['jb-save']=()=>{
 const root=$('#jbForm'),d=validate(root,{});if(!d)return toastErr('Give the template a name','The name is also the title the crew sees on the JSA.');
 let bad=null;
 $$('#jbFields .ferr').forEach(e=>e.textContent='');
 JB.fields.forEach((f,i)=>{if(!f.label.trim()){$('#fe'+i).textContent='Give this field a label';bad=bad||$('#fl'+i);}
  if(['dropdown','checklist'].includes(f.type)){const o=(f.opts||[]).map(x=>x.trim()).filter(Boolean);if(!o.length){$('#fp'+i).textContent='Add at least one option';bad=bad||$('#fo'+i);}else f.opts=o;}});
 if(bad){bad.focus();return toastErr('Fix the highlighted fields','Each field needs a label, and lists need at least one option.');}
 if(!JB.fields.some(f=>f.type!=='heading'))return toastErr('A JSA needs at least one question.','Add a question under a section heading.');
 const jobs=(d.jobs?d.jobs.split(','):[]).map(i=>jobBy(i).name),t=JB.id?tplBy(JB.id):null;
 S.jsaTpls.forEach(x=>{if(x.id!==(t&&t.id)&&!x.def)x.jobs=x.jobs.filter(n=>!jobs.includes(n));});
 const rec={name:d.name,jobs:JB.def?[]:jobs,approver:d.approver,fields:JB.fields.map(f=>({...f,opts:f.opts?f.opts.slice():undefined}))};
 GUARD.dirty=false;
 if(t){Object.assign(t,rec);toast('Template saved','New JSAs use it, and JSAs not filled in yet were updated.');go('jsas/templates');}
 else{const n={id:'tpl-'+slug(d.name)+'-'+Math.random().toString(36).slice(2,5),def:false,...rec};S.jsaTpls.push(n);toast('Template created',d.name);go('jsas/templates');}
};
DO['jb-del']=async()=>{const t=tplBy(JB.id),used=S.jsas.filter(j=>j.tplId===t.id&&j.st!=='approved').length;if(!(await dialog({title:'Delete template',body:`<b>${esc(t.name)}</b> will be removed. Its jobs go back to the default template.${used?` <b>${used} open JSA${used>1?'s':''}</b> keep their questions.`:''} This can’t be undone.`,okLabel:'Delete',keep:'Keep it',danger:true})))return;S.jsaTpls=S.jsaTpls.filter(x=>x!==t);GUARD.dirty=false;toast('JSA template deleted',t.name);go('jsas/templates');};
VIEWS['jsa-template-new']={path:'jsas/templates/new',parent:'jsas',perm:'edit:jsa',title:'New JSA template',sub:'Build the form once. Every JSA sent for the jobs using it is a copy. Never edited on a single JSA.',crumbs:()=>[['JSAs','jsas'],['Templates','jsas/templates'],['New template']],render(){openBuilder(null);return builderHtml();},mount:builderMount};
VIEWS['jsa-template']={path:'jsas/templates/:id',parent:'jsas',perm:['view:jsa','edit:jsa'],title:()=>{const t=tplBy(P.id);return t?t.name:'JSA template';},sub:'Build the form once. Every JSA sent for the jobs using it is a copy. Never edited on a single JSA.',
 crumbs:()=>{const t=tplBy(P.id);return [['JSAs','jsas'],['Templates','jsas/templates'],[t?t.name:'Not found']];},
 render(){if(!tplBy(P.id))return notFound('Template','jsas/templates');openBuilder(P.id);return builderHtml();},mount:builderMount};
