/* =====================================================================
   My Company. Follows the shipped screens:
   - read view: Company Information, Contact, Tax, Regional, Additional, Settings
     (Defaults, Feature Flags, Time Rounding, Job Geofence), Overtime & Pay Rules, Notifications
   - edit page: accordions Basic Information, Contact Information, Branding, Regional Settings,
     Company Settings, Overtime & Pay Rules, Journey Management, Notifications; Cancel / Update Company
   - a field search that opens the section and jumps to the field
   The designer's KPI strip stays on the read view.
   ===================================================================== */
const TZ=[['Australia/Sydney','Sydney'],['Australia/Melbourne','Melbourne'],['Australia/Brisbane','Brisbane'],['Australia/Perth','Perth'],['Australia/Adelaide','Adelaide'],['Pacific/Auckland','Auckland'],['Asia/Singapore','Singapore'],['Asia/Manila','Manila'],['Asia/Kolkata','Kolkata'],['Europe/London','London'],['America/New_York','New York'],['America/Los_Angeles','Los Angeles']];
const TZ_CUR={'Pacific/Auckland':'NZD','Asia/Singapore':'SGD','Asia/Manila':'PHP','Asia/Kolkata':'INR','Europe/London':'GBP','America/New_York':'USD','America/Los_Angeles':'USD'};
const CURRENCIES=['AUD','NZD','USD','GBP','SGD','PHP','INR','EUR','CAD'];
const SOW=[['monday','Monday'],['sunday','Sunday']],TFMT=[['12h','12 Hour'],['24h','24 Hour']],LFMT=[['meter','Meter'],['feet','Feet']],DFMT=['YYYY-MM-DD','DD/MM/YYYY','MM/DD/YYYY','DD.MM.YYYY','DD-MM-YYYY'];
const SESS=[['one_day','1 day (default)'],['one_week','1 week'],['one_month','1 month'],['unlimited','Stay logged in']];
const labelOf=(arr,k)=>(arr.find(a=>a[0]===k)||[0,k])[1];
const fmtAbn=a=>a?String(a).replace(/(\d{2})(\d{3})(\d{3})(\d{3})/,'$1 $2 $3 $4'):'';
const fmtPh=p=>/^0\d{9}$/.test(p||'')?p.replace(/^(0\d)(\d{4})(\d{4})$/,'$1 $2 $3'):(p||'');
const onoff=b=>pill(b?'ok':'neutral',b?'Enabled':'Disabled',1);
const coEmailOk=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const roundEx=(m,dir)=>{const t=7*60+10,r=t%m,x=!r?t:dir==='down'?t-r:t+(m-r);return String(Math.floor(x/60)).padStart(2,'0')+':'+String(x%60).padStart(2,'0');};
const roundRule=r=>`Round ${r.dir==='up'?'up':'down'} to nearest ${r.mins} minutes`;
const coFin=()=>can('view:employee:financials');

/* ---------- searchable fields (section, label) ---------- */
const CF=[['legalName','Legal Name','basic'],['companyCode','Company Code','basic'],['abn','ABN','basic'],['status','Status','basic'],['phone','Phone','contact'],['email','Email','contact'],['website','Website','contact'],['address','Address','contact'],['taxRegistered','Tax Registered','tax'],['language','Language','regional'],['timezone','Timezone','regional'],['currency','Currency','regional'],['startOfWeek','Start of Week','regional'],['timeFormat','Time Format','regional'],['dateFormat','Date Format','regional'],['lengthFormat','Length Format','regional'],['approvalRequired','Shift Approval Required','settings'],['shiftHours','Shift Regular Hours','settings'],['overhead','Over Head %','settings'],['loginSession','Login Session Duration','settings'],['allowOvertime','Allow Overtime','settings'],['multiLanguage','Multi-Language Support','settings'],['blockExpiredTT','Don’t allow asset assignment if inspection is expired','settings'],['rin_on','Round Clock-In Time','settings'],['rout_on','Round Clock-Out Time','settings'],['geofence','Job geofence','settings'],['rules','Overtime & Pay Rules','rules'],['journey','Journey Management','journey'],['notifs','Notifications','notifs']];
const cfSearch=()=>`<div class="csearch"><label class="field">${ICON('search')}<input type="search" id="cfq" placeholder="Search company fields" autocomplete="off" aria-label="Search company fields"></label><div class="cslist" id="cfl" hidden></div></div>`;
document.addEventListener('input',e=>{
 const q=e.target.closest('#cfq');if(!q)return;const v=q.value.trim().toLowerCase(),l=$('#cfl');
 const items=CF.filter(f=>(f[0]!=='overhead'||coFin())&&(!v||f[1].toLowerCase().includes(v))).slice(0,8);
 l.hidden=!v||!items.length&&false;l.innerHTML=items.length?items.map(f=>`<button type="button" data-do="cf-jump" data-k="${f[0]}" data-s="${f[2]}"><b>${esc(f[1])}</b><small>${esc(({basic:'Basic Information',contact:'Contact Information',tax:'Tax Information',regional:'Regional Settings',settings:'Company Settings',rules:'Overtime & Pay Rules',journey:'Journey Management',notifs:'Notifications'})[f[2]])}</small></button>`).join(''):'<div class="none">No matching field</div>';l.hidden=!v;
});
document.addEventListener('click',e=>{if(!e.target.closest('.csearch')){const l=$('#cfl');if(l)l.hidden=true;}});
DO['cf-jump']=d=>{
 const l=$('#cfl');if(l)l.hidden=true;const q=$('#cfq');if(q)q.value='';
 const edit=cur()==='company-edit';
 const mark=el=>{if(!el)return;if(!el.id)el.id='cfx-'+d.k;setTimeout(()=>reveal('#'+el.id),60);};
 if(edit){const s=$('#acc-co'+d.s);if(s&&!s.classList.contains('open')){s.classList.add('open');$('.acch',s).setAttribute('aria-expanded','true');}
  const f=$('[name="'+d.k+'"]');mark(f?(f.closest('.fld,.cpanel,.chk')||f):s);return;}
 UI.acc=UI.acc||{};UI.acc['co:'+d.s]=true;rerender(true);
 setTimeout(()=>{const t=$('#cf-'+d.k)||$('#acc-co'+d.s.replace(/\W/g,''));mark(t);},40);
};

/* ---------- read view ---------- */
const coRows=rows=>`<div class="kv">${rows.filter(r=>r[3]!==false).map(([k,l,v])=>`<div id="cf-${k}"><span>${esc(l)}</span><b>${v||'<span class="dash">N/A</span>'}</b></div>`).join('')}</div>`;
const coPanel=(title,rows)=>`<div class="cpanel"><div class="cphead"><b>${esc(title)}</b></div>${coRows(rows)}</div>`;
VIEWS.company.sub='Company details, time and pay rules, notifications and journey settings.';
VIEWS.company.act=()=>(can('view:audit:logs')?`<button type="button" class="btn btn-ghost" data-go="audit-log">${ICON('history')}<span class="lb">Audit log</span></button>`:'')+(can('edit:company')?`<button type="button" class="btn" data-go="company/edit">${ICON('edit')}<span class="lb">Edit company</span></button>`:'');
function NOTIF_LIST(){
 return {rows:S.company.notifs,search:'Search notifications',text:r=>notifName(r.type)+' '+coRecipNames(r),minW:900,title:'Notifications',sub:'Who hears about what, and how',
  cols:[{h:'Notification',v:r=>`<b style="color:var(--text)">${esc(notifName(r.type))}</b>`},{h:'Notify by',v:r=>esc([r.email&&'Email',r.sms&&'SMS'].filter(Boolean).join(' · ')||'—')},{h:'Recipients',v:r=>`<span style="white-space:normal">${esc(coRecipNames(r))}</span>`},{h:'Reminders start',v:r=>esc(labelOf(LEAD,r.lead))},{h:'Status',v:r=>r.active?pill('ok','On',1):pill('neutral','Off',1)}],
  action:r=>can('edit:company')?`<button type="button" class="btn btn-sm btn-ghost" data-do="nt-open" data-id="${r.id}">Edit</button>`:''};
}
const coRecipNames=r=>[...r.users.map(id=>(S.employees.find(e=>e.id===id)||{name:id}).name),...r.emails].join(', ');
function RULESET_LIST(){
 return {href:can('edit:company')?(r=>'company/rulesets/'+r.id):undefined,rows:S.company.rulesets,search:'Search rulesets',text:r=>r.name+' '+r.description+' '+rsSummary(r),minW:820,title:'Overtime & Pay Rules',sub:'Rulesets used to work out pay from approved hours',
  cols:[{h:'Ruleset',v:r=>`<b style="color:var(--text)">${esc(r.name)}</b><small class="subtle" style="display:block">${esc(r.description)}</small>`},{h:'Rules',v:r=>`<span style="white-space:normal">${esc(rsSummary(r))}</span>`},{h:'Employees',r:1,v:r=>r.emp},{h:'Status',v:r=>(r.isDefault?pill('info','Default')+' ':'')+pill(r.status==='active'?'ok':'neutral',cap(r.status),1)}]};
}
VIEWS.company.render=function(){
 const c=S.company,fin=coFin(),n=c.journey;
 const hero_=hero({sq:true,ini:ini(c.name),title:c.name,pills:[pill(c.status==='active'?'ok':'neutral',cap(c.status),1),c.kycVerified?pill('ok','KYC verified'):pill('warn','KYC pending')],sub:esc(c.legalName)+' · ABN '+esc(fmtAbn(c.abn)),meta:[['mail',esc(c.email)],['phone',esc(fmtPh(c.phone))],['pin',esc(c.address)]],
  actions:(can('edit:company')?`<button type="button" class="btn btn-ghost" data-go="company/edit">${ICON('edit')}<span class="lb">Edit</span></button>`:'')+(isOwnerAcct()?`<button type="button" class="btn btn-danger" data-do="co-del">${ICON('trash')}<span class="lb">Delete</span></button>`:'')});
 const sec=(k,ic,t,body,open)=>acc('co:'+k,ic,t,body,{open:open!==false});
 return `<div class="page">${hero_}
  ${strip('four',[
   {k:'Employees',icon:'users',v:c.counts.employees,d:'9 working today',act:{nav:'employees'}},
   {k:'Active jobs',icon:'jobs',tone:'var(--s3)',v:activeJobs().length,act:{nav:'jobs'}},
   {k:'Customers',icon:'building',tone:'var(--s6)',v:cnt(S.customers,x=>x.st==='active'),act:{nav:'customers'}},
   {k:'Notifications on',icon:'bell',tone:'var(--s4)',v:cnt(c.notifs,x=>x.active),d:'of '+c.notifs.length+' set up',act:{scroll:'#L-notifs'}}])}
  ${cfSearch()}
  <div class="g c2">
  ${sec('basic','company','Company Information',coRows([['legalName','Legal Name',esc(c.legalName)],['companyCode','Company Code',`<span class="mono">${esc(c.code)}</span>`],['abn','ABN',esc(fmtAbn(c.abn))],['status','Status',pill(c.status==='active'?'ok':'neutral',cap(c.status),1)]]))}
  ${sec('contact','phone','Contact Information',coRows([['phone','Phone',esc(fmtPh(c.phone))],['email','Email',esc(c.email)],['website','Website',c.website?`<a class="lnk" href="https://${esc(c.website.replace(/^https?:\/\//,''))}" target="_blank" rel="noopener">${esc(c.website)}</a>`:''],['address','Address',esc(c.address)]]))}
  ${sec('tax','card','Tax Information',coRows([['taxRegistered','Tax Registered',pill(c.taxRegistered?'ok':'neutral',c.taxRegistered?'Yes':'No',1)],['taxName','Tax Name',esc(c.taxName)],['taxNumber','Tax Number',esc(c.taxNumber)]]))}
  ${sec('regional','sun','Regional Settings',coRows([['language','Language',esc(c.language.toUpperCase())],['timezone','Timezone',esc(c.timezone)],['currency','Currency',esc(c.currency)],['startOfWeek','Start of Week',esc(labelOf(SOW,c.startOfWeek))],['timeFormat','Time Format',esc(labelOf(TFMT,c.timeFormat))],['dateFormat','Date Format',esc(c.dateFormat)],['lengthFormat','Length Format',esc(labelOf(LFMT,c.lengthFormat))]]))}
  ${sec('extra','shield','Additional Information',coRows([['onboardingStatus','Onboarding Status',pill('ok',cap(c.onboarding),0)],['kycVerified','KYC Verified',onoff(c.kycVerified).replace('Enabled','Verified').replace('Disabled','Not Verified')],['kycStatus','KYC Status',pill(c.kycStatus==='verified'?'ok':'warn',cap(c.kycStatus),0)]]))}
  </div>
  ${sec('settings','sliders','Settings',`<div class="g c2" style="margin:0">${coPanel('Defaults',[['approvalRequired','Shift Approval Required',onoff(c.approvalRequired)],['shiftHours','Shift Regular Hours',c.shiftHours+' hours'],['overhead','Over Head %',c.overhead+'%',fin],['loginSession','Login Session Duration',esc(labelOf(SESS,c.loginSession))]])}${coPanel('Feature Flags',[['allowOvertime','Allow Overtime',onoff(c.allowOvertime)],['multiLanguage','Multi-Language Support',onoff(c.multiLanguage)],['blockExpiredTT','Don’t allow asset assignment if inspection is expired',onoff(c.blockExpiredTT)],['minDaysTT','Minimum days to inspection expiry',String(c.minDaysTT),c.blockExpiredTT]])}${coPanel('Time Rounding',[['rin_on','Round Clock-In Time',onoff(c.rounding.in.on)],['rin_rule','Clock-In Rounding Rule',esc(roundRule(c.rounding.in)),c.rounding.in.on],['rout_on','Round Clock-Out Time',onoff(c.rounding.out.on)],['rout_rule','Clock-Out Rounding Rule',esc(roundRule(c.rounding.out)),c.rounding.out.on]])}${coPanel('Job Geofence',[['geofence','Geofence clock-in restriction & automatic clock-in/out',onoff(c.geofence)]])}</div>`)}
  <div id="cf-rules">${listCard('rulesets',RULESET_LIST())}</div>
  ${sec('journey','route','Journey Management',coRows([['jmp','Journey management plan required',onoff(n.jmpRequired)],['thr','Trip length that needs a plan',n.jmpRequired?n.thresholdMinutes+' minutes':'',n.jmpRequired],['appr','A manager must approve the plan',onoff(n.requireApproval),n.jmpRequired],['rest','Break reminder every',n.restIntervalMinutes+' minutes',n.jmpRequired],['ping','Distance between GPS fixes',n.pingDistanceM+' metres',n.jmpRequired],['wx','Weather along each route',onoff(n.weatherEnabled),n.jmpRequired],['ret','Keep journey records for',n.retentionDays+' days',n.jmpRequired],['dig','Weekly fleet safety digest',onoff(n.digest),n.jmpRequired]])+(can('edit:company')?`<div style="margin-top:12px"><button type="button" class="btn btn-ghost btn-sm" data-do="co-edit-sec" data-s="journey">${ICON('edit')}Edit journey settings</button></div>`:''))}
  <div id="cf-notifs">${listCard('notifs',NOTIF_LIST())}</div>
  </div>`;
};
DO['co-edit-sec']=d=>{UI.coOpen=d.s;go('company/edit');};
DO['nt-open']=d=>{UI.coOpen='notifs';UI.ntType=S.company.notifs.find(n=>n.id===d.id).type;go('company/edit');};
DO['co-del']=async()=>{
 const c=S.company;
 if(S.companies.length<2||c.id===S.currentCompanyId){toastErr('You can’t delete the company you are signed in to','Switch to another company first, then delete this one from All companies.');return;}
};

/* ---------- edit page ---------- */
const eacc=(key,icon,title,body,open)=>`<section class="qv-card acc${open?' open':''}" id="acc-co${key}"><button type="button" class="acch" data-do="cf-tog" data-k="${key}" aria-expanded="${!!open}"><span class="gi">${ICON(icon)}</span><b>${title}</b>${ICON('next').replace('<svg','<svg class="chev"')}</button><div class="accb">${body}</div></section>`;
DO['cf-tog']=(d,el)=>{const s=el.closest('.acc'),on=!s.classList.contains('open');s.classList.toggle('open',on);el.setAttribute('aria-expanded',on);};
const chk=(name,label,on)=>`<label class="chk bchk"><input type="checkbox" name="${name}"${on?' checked':''}>${esc(label)}</label>`;
const swHtml=(name,on,label,fchange)=>`<input type="hidden" name="${name}" value="${on?1:0}"><button type="button" class="tog${on?' on':''}" data-ftog="${name}" role="switch" aria-checked="${!!on}" aria-label="${esc(label)}"${fchange?` data-fchange="${fchange}"`:''}><i></i></button>`;
const cpanel=(title,body,head)=>`<div class="cpanel"><div class="cphead"><b>${esc(title)}</b>${head||''}</div>${body}</div>`;
function roundCard(p,title,r){
 return `<div class="cpanel" data-roundcard="${p}">${`<div class="cphead"><b>${title}</b>${swHtml(p+'_on',r.on,title,'co-round')}</div>`}<div class="fgrid">${fld({name:p+'_mins',label:'Round to',type:'select',span:3,value:String(r.mins),opts:[['15','15 minutes'],['30','30 minutes']],disabled:!r.on})}${fld({name:p+'_dir',label:'Direction',type:'select',span:3,value:r.dir,opts:[['up','Round Up'],['down','Round Down']],disabled:!r.on})}</div><div class="fhelp rex" style="${r.on?'':'opacity:.5'}">Example: 07:10 becomes ${roundEx(r.mins,r.dir)}</div></div>`;
}
DO['co-round']=({on},el)=>{const p=el.closest('.cpanel');$$('select',p).forEach(s=>s.disabled=!on);const x=$('.rex',p);if(x)x.style.opacity=on?'':'.5';};
document.addEventListener('change',e=>{
 const s=e.target.closest('[data-roundcard] select');
 if(s){const p=s.closest('[data-roundcard]'),k=p.dataset.roundcard;$('.rex',p).textContent='Example: 07:10 becomes '+roundEx(+$('[name="'+k+'_mins"]',p).value,$('[name="'+k+'_dir"]',p).value);return;}
 const tz=e.target.closest('#coMain [name="timezone"]');
 if(tz){const c=TZ_CUR[tz.value]||(/^Australia\//.test(tz.value)?'AUD':'');if(c){const cu=$('#coMain [name="currency"]');if(cu)cu.value=c;}return;}
 const lf=e.target.closest('#coLogoIn');
 if(lf&&lf.files[0]){const f=lf.files[0];if(!/^image\//.test(f.type)){toastErr('That file isn’t an image','Choose a PNG, JPG or SVG logo.');lf.value='';return;}const rd=new FileReader();rd.onload=()=>{$('#coMain [name="logo"]').value=rd.result;coLogoPaint(rd.result);markDirty(lf);};rd.readAsDataURL(f);}
});
document.addEventListener('input',e=>{
 if(e.target.closest('#coMain [name="name"]')){const l=$('#coMain [name="legalName"]');if(l)l.value=e.target.value;}
 if(e.target.closest('#coMain [name="abn"]'))e.target.value=e.target.value.replace(/\D/g,'').slice(0,11);
});
const coLogoPaint=src=>{const b=$('#coLogo');if(!b)return;b.innerHTML=src?`<div class="logoprev"><img src="${src}" alt="Company logo"><button type="button" class="btn btn-ghost btn-sm" data-do="co-logo-rm">${ICON('trash')}Remove</button></div>`:`<label class="dropzone" data-drop><input type="file" id="coLogoIn" accept="image/*" hidden>${ICON('upload')}<b>Click to upload logo</b><small>PNG, JPG or SVG</small></label>`;};
DO['co-logo-rm']=()=>{$('#coMain [name="logo"]').value='';coLogoPaint('');markDirty($('#coMain'));};
DO['co-geo']=d=>{
 const f=$('#coMain');
 if(d.k==='me'){$('[name="lat"]',f).value='-33.8688';$('[name="lng"]',f).value='151.2093';$('[name="address"]',f).value='9 Cosgrove Rd, Enfield NSW 2136';markDirty(f);toast('Location found','Using this device’s position');return;}
 const la=$('[name="lat"]',f).value,ln=$('[name="lng"]',f).value;
 if(!la||!ln||isNaN(la)||isNaN(ln)){toastErr('Enter both coordinates first','Latitude and longitude are needed to look up an address.');return;}
 $('[name="address"]',f).value='Near 9 Cosgrove Rd, Enfield NSW 2136';markDirty(f);toast('Address found');
};
function coRulesList(){
 const rs=S.company.rulesets;
 return rs.map(r=>`<div class="docrow"><div class="grow"><b>${esc(r.name)} ${r.isDefault?pill('info','Default'):''}</b><small>${esc(rsSummary(r))}</small></div><div class="x"><button type="button" class="btn btn-ghost btn-sm" data-go="company/rulesets/${r.id}">${ICON('edit')}Edit</button><button type="button" class="rowbtn" data-do="rs-del" data-id="${r.id}" aria-label="Delete ruleset" title="Delete">${ICON('trash')}</button></div></div>`).join('');
}
DO['rs-del']=async d=>{const r=S.company.rulesets.find(x=>x.id===d.id);if(r.isDefault){toastErr('You can’t delete the default ruleset','Make another ruleset the default first.');return;}if(!(await dialog({title:'Delete Ruleset',body:`<b>${esc(r.name)}</b> and its rules are removed. Employees on it fall back to the default ruleset.`,okLabel:'Delete',danger:true})))return;S.company.rulesets=S.company.rulesets.filter(x=>x!==r);const l=$('#coRules');if(l)l.innerHTML=coRulesList();else rerender(true);toast('Ruleset deleted successfully');};

/* journey management: settings (edit:journey) + the signed-in user's own channels, one Save */
const jfNum=(name,label,v,help)=>fld({name,label,type:'number',value:v,span:3,help});
const jgroup=(title,cap,body,attr)=>`<div class="jgroup"${attr||''}><b>${esc(title)}</b><small>${esc(cap)}</small><div class="fgrid" style="margin-top:10px">${body}</div></div>`;
function journeySection(){
 const j=S.company.journey,can_=can('edit:journey');
 const settings=can_?`${jgroup('Journey plans','When a trip needs a plan, and who signs it off.',tgl({name:'jm_jmp',label:'Require a journey management plan',help:'When on, long trips prompt the traveller to fill in a JMP before setting off.',value:j.jmpRequired,span:6}).replace('data-ftog="jm_jmp"','data-ftog="jm_jmp" data-fchange="jm-rev"')+`<div class="fgrid s6" data-jmp${j.jmpRequired?'':' hidden'} style="grid-column:span 6;padding:0">${jfNum('jm_thr','Trip length that needs a plan (minutes)',j.thresholdMinutes,'Estimated driving time. Trips at or above this need a JMP.')}${tgl({name:'jm_appr',label:'A manager must approve the plan',help:'When off, a submitted plan can be started without waiting for approval.',value:j.requireApproval,span:3})}</div>`)}
  <div data-jmp${j.jmpRequired?'':' hidden'}>
  ${jgroup('On the road','What the app does while a trip is under way.',jfNum('jm_rest','Break reminder every (minutes)',j.restIntervalMinutes,'The rest stops planned for a trip are spaced this far apart. The app reminds the driver from the plan, so the reminders still arrive with no phone signal.')+jfNum('jm_ping','Distance between GPS fixes (metres)',j.pingDistanceM,'The app records a location every this many metres while a trip is in progress. Applies from the next trip start.'))}
  ${jgroup('Weather','Report-only. Weather never blocks or changes a trip.',tgl({name:'jm_wx',label:'Check the weather along each route',help:'Forecasts matched to when the driver will be at each point, plus official BOM warnings.',value:j.weatherEnabled,span:6}).replace('data-ftog="jm_wx"','data-ftog="jm_wx" data-fchange="jm-rev"')+`<div class="fgrid s6" data-jmwx${j.weatherEnabled?'':' hidden'} style="grid-column:span 6;padding:0">${jfNum('jm_wind','Report wind from (km/h)',j.windKmh)}${jfNum('jm_heat','Report heat from (°C)',j.heatC)}${jfNum('jm_cold','Report ice or snow at or below (°C)',j.coldC,'May be negative.')}${tgl({name:'jm_fog',label:'Report forecast fog',help:'The one forecast code we trust; everything else above is judged on numbers.',value:j.fog,span:3})}${jfNum('jm_rainp','Report rain from (% chance)',j.rainPct,'Both this AND the amount must be met before rain is reported.')}${jfNum('jm_rainmm','...and rain from (mm)',j.rainMm,'Forecast rainfall for the day.')}</div>`)}
  ${jgroup('Records and reports','What is kept, and what gets emailed out.',jfNum('jm_ret','Keep journey records for (days)',j.retentionDays,'Location fixes and trip events are deleted after this. The trip document is kept.')+tgl({name:'jm_dig',label:'Email a weekly fleet safety digest',help:'Every Monday morning, send the owner and administrators of this company a report on the previous week of trips: rest breaks kept and missed, tracking alarms and weather exposure. Report only — it never blocks or changes a trip.',value:j.digest,span:3}))}
  </div><hr class="sep">`:'';
 const pr=S.journeyPrefs;
 return `<div id="jmRoot">${settings}<div class="jgroup"><b>My notifications</b><small>How you hear about journey plans and trips. These are your own preferences — they don’t affect anyone else.</small>
  <div class="tblwrap" style="margin-top:10px"><table class="tbl" style="min-width:480px"><thead><tr><th>Event</th><th class="r" style="width:90px">Push</th><th class="r" style="width:90px">Email</th></tr></thead><tbody>${JOURNEY_EVENTS.map(([k,l,d])=>`<tr><td><b style="color:var(--text)">${esc(l)}</b><small class="subtle" style="display:block;white-space:normal">${esc(d)}</small></td><td class="r"><label class="chk"><input type="checkbox" name="jp_${k}_push"${pr[k].push?' checked':''} aria-label="${esc(l)} by push"></label></td><td class="r"><label class="chk"><input type="checkbox" name="jp_${k}_email"${pr[k].email?' checked':''} aria-label="${esc(l)} by email"></label></td></tr>`).join('')}</tbody></table></div></div>
  <div style="margin-top:14px"><button type="button" class="btn" data-do="jm-save">${can_?'Save journey settings':'Save notification preferences'}</button></div></div>`;
}
DO['jm-rev']=({on},el)=>{const n=el.dataset.ftog,a=n==='jm_jmp'?'data-jmp':'data-jmwx';$$('['+a+']').forEach(x=>x.hidden=!on);};
DO['jm-save']=()=>{
 const root=$('#jmRoot'),d=validate(root,Object.fromEntries(['jm_thr','jm_rest','jm_ping','jm_ret','jm_wind','jm_heat','jm_cold','jm_rainp','jm_rainmm'].map(k=>[k,(x)=>x===''||isNaN(Number(x))?'Enter a number':(['jm_heat','jm_cold','jm_wind'].includes(k)||Number(x)>0)?'':'Must be greater than 0'])));
 if(!d)return toastErr('Can’t save yet','Fix the highlighted fields.');
 const g=k=>d[k]==='1',n=k=>Number(d[k]);
 if(can('edit:journey'))Object.assign(S.company.journey,{jmpRequired:g('jm_jmp'),thresholdMinutes:n('jm_thr'),requireApproval:g('jm_appr'),restIntervalMinutes:n('jm_rest'),pingDistanceM:n('jm_ping'),weatherEnabled:g('jm_wx'),windKmh:n('jm_wind'),heatC:n('jm_heat'),coldC:n('jm_cold'),fog:g('jm_fog'),rainPct:n('jm_rainp'),rainMm:n('jm_rainmm'),retentionDays:n('jm_ret'),digest:g('jm_dig')});
 JOURNEY_EVENTS.forEach(([k])=>{S.journeyPrefs[k]={push:!!d['jp_'+k+'_push'],email:!!d['jp_'+k+'_email']};});
 toast(can('edit:journey')?'Journey settings saved':'Notification preferences saved');
};

/* notifications: editor (one rule per type, prefilled when a type is picked) + saved rules */
const NT={emails:[]};
const ntChips=()=>NT.emails.map(e=>`<span class="mchip">${esc(e)}<button type="button" data-do="nt-rmemail" data-e="${esc(e)}" aria-label="Remove ${esc(e)}">${ICON('close')}</button></span>`).join('');
function ntList(){
 const rows=S.company.notifs;
 return `<div class="jgroup" style="margin-top:22px"><b>Saved notifications</b><small>One rule per type. Pick a type above to change it.</small>${rows.length?`<div class="tblwrap" style="margin-top:10px"><table class="tbl" style="min-width:640px"><thead><tr><th>Notification</th><th>Notify by</th><th>Recipients</th><th>Reminders start</th><th class="act"></th></tr></thead><tbody>${rows.map(r=>`<tr><td class="strong">${esc(notifName(r.type))}</td><td>${esc([r.email&&'Email',r.sms&&'SMS'].filter(Boolean).join(' · '))}</td><td style="white-space:normal">${esc(coRecipNames(r))}</td><td>${esc(labelOf(LEAD,r.lead))}</td><td><button type="button" class="btn btn-sm btn-ghost" data-do="nt-pick" data-t="${r.type}">Edit</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="subtle" style="margin-top:8px">No notifications set up yet</div>'}</div>`;
}
function notifSection(){
 NT.emails=[];
 return `<div id="ntRoot"><div class="fgrid">${fld({name:'nt_type',label:'Notification type',type:'select',span:3,value:'',opts:[['','Select notification type'],...NOTIF_TYPES]})}${fld({name:'nt_lead',label:'Notification period',type:'select',span:3,value:'1',opts:LEAD.map(([k,l])=>[String(k),l])})}
  <div class="fld s6"><label>Notify by</label><div class="chkrow">${chk('nt_email','Email',false)}${chk('nt_sms','SMS',false)}</div><div class="ferr" id="e-nt_ch" role="alert"></div></div>
  ${msel({name:'nt_users',label:'Recipients (company users)',opts:S.employees.filter(e=>e.st==='active').map(e=>[e.id,e.name,e.role]),span:6,value:[],ph:'Search company users…'})}
  <div class="fld s6"><label for="f-nt_email_in">Other recipients (by email)</label><div class="selrow"><input id="f-nt_email_in" name="nt_email_in" type="email" placeholder="name@example.com" autocomplete="off"><button type="button" class="btn btn-ghost" data-do="nt-addemail">${ICON('plus')}Add</button></div><div class="mchips" id="ntChips" style="margin-top:8px"></div><div class="ferr" id="e-nt_email_in" role="alert"></div></div></div>
  <div style="margin-top:6px"><button type="button" class="btn" data-do="nt-save">Save notification</button></div><div id="ntList">${ntList()}</div></div>`;
}
function ntFill(type){
 const r=S.company.notifs.find(n=>n.type===type),root=$('#ntRoot'),box=$('[data-msel="nt_users"]',root);
 $('[name="nt_email"]',root).checked=!!(r&&r.email);$('[name="nt_sms"]',root).checked=!!(r&&r.sms);$('[name="nt_lead"]',root).value=String(r?r.lead:1);
 mselSet(box,r?r.users.slice():[]);NT.emails=r?r.emails.slice():[];$('#ntChips').innerHTML=ntChips();$('#e-nt_ch').textContent='';
}
document.addEventListener('change',e=>{const t=e.target.closest('#ntRoot [name="nt_type"]');if(t&&t.value)ntFill(t.value);});
DO['nt-pick']=d=>{const s=$('#ntRoot [name="nt_type"]');s.value=d.t;ntFill(d.t);s.closest('.fld').scrollIntoView({block:'center',behavior:'smooth'});};
DO['nt-addemail']=()=>{
 const i=$('#ntRoot [name="nt_email_in"]'),v=i.value.trim().toLowerCase();if(!v)return;
 if(!coEmailOk(v)){toastErr('Please enter a valid email address');return;}if(NT.emails.includes(v)){toastErr('This email has already been added');return;}
 NT.emails.push(v);i.value='';$('#ntChips').innerHTML=ntChips();
};
DO['nt-rmemail']=d=>{NT.emails=NT.emails.filter(x=>x!==d.e);$('#ntChips').innerHTML=ntChips();};
DO['nt-save']=()=>{
 const root=$('#ntRoot'),d=readForm(root),box=$('[data-msel="nt_users"]',root);$$('.fld.err',root).forEach(f=>f.classList.remove('err'));$('#e-nt_ch').textContent='';
 if(!d.nt_type){$('[name="nt_type"]',root).closest('.fld').classList.add('err');$('#e-nt_type').textContent='Notification type is required';toastErr('Please select a notification type');return;}
 if(!d.nt_email&&!d.nt_sms){$('#e-nt_ch').textContent='Choose at least one delivery channel';toastErr('Please choose at least one delivery channel');return;}
 const pend=(d.nt_email_in||'').toLowerCase();if(pend&&!coEmailOk(pend)){toastErr('Please enter a valid email address');return;}
 const all=pend&&!NT.emails.includes(pend)?[...NT.emails,pend]:NT.emails,users=mselIds(box),uMail=new Set(users.map(id=>((S.employees.find(e=>e.id===id)||{}).email||'').toLowerCase()).filter(Boolean)),ext=all.filter(m=>!uMail.has(m));
 if(users.length+ext.length===0){toastErr('Please add at least one recipient');return;}
 const rec={type:d.nt_type,email:d.nt_email,sms:d.nt_sms,lead:+d.nt_lead,users,emails:ext,active:true},old=S.company.notifs.find(n=>n.type===d.nt_type);
 if(old)Object.assign(old,rec);else S.company.notifs.push({id:'n'+Date.now(),...rec});
 NT.emails=ext;$('#ntChips').innerHTML=ntChips();$('[name="nt_email_in"]',root).value='';$('#ntList').innerHTML=ntList();toast('Notification saved',notifName(d.nt_type));
};

/* the whole form */
function coBasicHtml(c,nw){
 return eacc('basic','company','Basic Information',`<div class="fgrid">${fld({name:'name',label:'Company Name',req:true,span:6,value:c.name,ph:'Enter company name',max:200})}${fld({name:'legalName',label:'Legal Name',span:6,value:c.legalName,ph:'Enter legal name',max:255})}${fld({name:'abn',label:'ABN',span:6,value:c.abn,ph:'Enter ABN',max:11,inputmode:'numeric'})}</div>`,true)
 +eacc('contact','phone','Contact Information',`${addrList}<div class="fgrid">${fld({name:'phone',label:'Phone',type:'phone',span:3,value:c.phone})}${fld({name:'email',label:'Email',type:'email',span:3,value:c.email,ph:'Enter email address'})}
  ${fld({name:'address',label:'Street Address',span:6,value:c.address,list:'addrs',ph:'Search for address…',max:255,help:'Street address is stored as a single line (max 255 characters). GPS fields are for lookup only.'})}
  <div class="fld s6" style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn btn-ghost btn-sm" data-do="co-geo" data-k="me">${ICON('pin')}My Current Location</button><button type="button" class="btn btn-ghost btn-sm" data-do="co-geo" data-k="coords">${ICON('search')}Get Address from Coordinates</button></div>
  ${fld({name:'lat',label:'GPS Latitude',type:'number',span:3,value:'',ph:'-33.8688'})}${fld({name:'lng',label:'GPS Longitude',type:'number',span:3,value:'',ph:'151.2093'})}
  ${fld({name:'website',label:'Website',span:6,value:c.website,ph:'example.com',max:255})}</div>`)
 +eacc('branding','sliders','Branding',`<div class="fgrid"><div class="fld s6"><label>Company Logo</label><input type="hidden" name="logo" value="${esc(c.logo||'')}"><div id="coLogo"></div></div></div>`)
 +eacc('regional','sun','Regional Settings',`<datalist id="tzlist">${TZ.map(t=>`<option value="${t[0]}">${t[1]}</option>`).join('')}</datalist><div class="fgrid">${fld({name:'language',label:'Language',type:'select',span:2,value:c.language,opts:[['en','English']]})}${fld({name:'timezone',label:'Timezone',span:2,value:c.timezone,list:'tzlist',ph:'Search or type a timezone'})}${fld({name:'currency',label:'Currency',type:'select',span:2,value:c.currency,opts:CURRENCIES})}
  ${fld({name:'startOfWeek',label:'Start of Week',type:'select',span:3,value:c.startOfWeek,opts:SOW})}${fld({name:'timeFormat',label:'Time Format',type:'select',span:3,value:c.timeFormat,opts:TFMT})}${fld({name:'dateFormat',label:'Date Format',type:'select',span:3,value:c.dateFormat,opts:DFMT})}${fld({name:'lengthFormat',label:'Length Format',type:'select',span:3,value:c.lengthFormat,opts:LFMT})}</div>`);
}
function coSettingsHtml(c){
 return eacc('settings','sliders','Company Settings',`<div class="cogrid">
  ${cpanel('Defaults',`<div class="fgrid" style="padding:0">${chk('approvalRequired','Shift Approval Required',c.approvalRequired).replace('<label','<label style="grid-column:1/-1"')}${coFin()?fld({name:'overhead',label:'Over Head %',type:'number',span:6,value:c.overhead,suffix:'%',help:'This % will be added to job cost for reports and estimates.'}):''}${fld({name:'loginSession',label:'Login Session Duration',type:'select',span:6,value:c.loginSession,opts:SESS})}</div>`)}
  ${cpanel('Feature Flags',`<div class="fgrid" style="padding:0">${chk('allowOvertime','Allow Overtime',c.allowOvertime)}${chk('multiLanguage','Multi-Language Support',c.multiLanguage)}${chk('blockExpiredTT','Don’t allow asset assignment if inspection is expired',c.blockExpiredTT)}<div class="fgrid s6" data-rev-chk="blockExpiredTT"${c.blockExpiredTT?'':' hidden'} style="grid-column:span 6;padding:0">${fld({name:'minDaysTT',label:'Minimum days left on test & tag',type:'number',span:6,value:c.minDaysTT,help:'An asset must have at least this many days left on its test & tag before anyone can check it out. Example: enter 3 and an asset due in 3 days can still go out, but one due in 2 days is blocked. Enter 0 to block it only after the test & tag has already expired.'})}</div></div>`)}
  ${roundCard('rin','Round Clock-In',c.rounding.in)}${roundCard('rout','Round Clock-Out',c.rounding.out)}
  ${cpanel('Shift Regular Hours',`<div class="fgrid" style="padding:0">${fld({name:'shiftHours',label:'Shift Regular Hours',type:'number',req:true,span:6,value:c.shiftHours,help:'The length of a regular shift. Overtime tiers start here.'})}</div>`)}
  ${cpanel('Job Geofence',`<div class="fhelp" style="margin:0">On the mobile app, workers can only clock in manually inside the job geofence, and are clocked in automatically when they enter it and clocked out when they leave it.</div>`,swHtml('geofence',c.geofence,'Job Geofence'))}
 </div>`);
}
document.addEventListener('change',e=>{const b=e.target.closest('#coMain [name="blockExpiredTT"]');if(b){const x=$('[data-rev-chk="blockExpiredTT"]');if(x)x.hidden=!b.checked;}});
VIEWS['company-edit']={path:'company/edit',parent:'company',perm:'edit:company',title:'Edit company',sub:'Changes apply straight away. Overtime rules, journey settings and notifications save on their own.',crumbs:()=>[['My Company','company'],['Edit company']],
 render(){
  const c=S.company;
  return `<div class="page formpage" id="coPage" style="max-width:1040px">${cfSearch()}
   <form data-form novalidate onsubmit="return false" id="coMain" style="display:grid;gap:16px">${coBasicHtml(c)}${coSettingsHtml(c)}</form>
   ${eacc('rules','jobs','Overtime & Pay Rules',`<div class="subtle" style="font-size:13px;margin-bottom:8px">Rulesets used to work out pay from approved hours. Editing one applies it to the employees on it.</div><div id="coRules">${coRulesList()}</div>`)}
   ${eacc('journey','route','Journey Management',journeySection())}
   ${eacc('notifs','bell','Notifications',notifSection())}
   <div class="fbar"><span class="hint">No changes yet</span>${gateKey()==='company-details'?'':'<button type="button" class="btn btn-ghost" data-go="company">Cancel</button>'}<button type="button" class="btn" data-do="co-save" data-fsave${gateKey()==='company-details'?'':' disabled'}>${ICON('check')}Update Company</button></div></div>`;
 },
 mount(root){
  coLogoPaint(S.company.logo||'');mselInit($('#ntRoot'));
  const o=UI.coOpen;UI.coOpen=null;
  if(o){const s=$('#acc-co'+o);if(s){s.classList.add('open');$('.acch',s).setAttribute('aria-expanded','true');setTimeout(()=>{s.scrollIntoView({block:'start',behavior:'smooth'});},60);}}
  if(UI.ntType){const t=UI.ntType;UI.ntType=null;const s=$('#ntRoot [name="nt_type"]');s.value=t;ntFill(t);}
 }};
const coCheck=f=>validate(f,{
  abn:x=>x&&!/^\d{11}$/.test(x)?'ABN must be 11 digits':'',
  email:x=>x&&!coEmailOk(x)?'Enter a valid email address':'',
  phone:(x,a)=>x&&!phoneValid(x,a.phone_cc)?'Enter a valid phone number':'',
  shiftHours:{always:true,fn:x=>x===''||isNaN(Number(x))||Number(x)<1||Number(x)>24?'Enter hours between 1 and 24':''},
  overhead:x=>x!==''&&(isNaN(Number(x))||Number(x)<0||Number(x)>999.99)?'Enter a percentage between 0 and 999.99':'',
  minDaysTT:x=>x!==''&&(!/^\d+$/.test(x)||Number(x)>365)?'Enter whole days between 0 and 365':''});
const coFail=(page,f)=>{$$('.acc',page).forEach(s=>{if($('.fld.err',s)){s.classList.add('open');$('.acch',s).setAttribute('aria-expanded','true');}});const e=$('.fld.err input,.fld.err select',f);if(e)e.scrollIntoView({block:'center'});toastErr('Can’t save yet','Fix the highlighted fields.');};
DO['co-save']=()=>{
 const f=$('#coMain'),c=S.company,d=coCheck(f);
 if(!d)return coFail($('#coPage'),f);
 const site=(d.website||'').trim();
 Object.assign(c,{name:d.name.trim(),legalName:(d.legalName||d.name).trim(),abn:d.abn,phone:String(d.phone||'').replace(/\D/g,'').replace(/^61/,'').replace(/^(?!0)/,'0'),email:d.email,address:d.address,website:site&&!/^https?:\/\//i.test(site)?'https://'+site:site,logo:d.logo,
  language:d.language,timezone:d.timezone||'Australia/Sydney',currency:d.currency,startOfWeek:d.startOfWeek,timeFormat:d.timeFormat,dateFormat:d.dateFormat,lengthFormat:d.lengthFormat,
  approvalRequired:!!d.approvalRequired,allowOvertime:!!d.allowOvertime,multiLanguage:!!d.multiLanguage,blockExpiredTT:!!d.blockExpiredTT,minDaysTT:d.minDaysTT===''?c.minDaysTT:Number(d.minDaysTT),loginSession:d.loginSession,shiftHours:Number(d.shiftHours),
  rounding:{in:{on:d.rin_on==='1',mins:+d.rin_mins,dir:d.rin_dir},out:{on:d.rout_on==='1',mins:+d.rout_mins,dir:d.rout_dir}},geofence:d.geofence==='1'});
 if(d.overhead!==undefined&&d.overhead!=='')c.overhead=Number(d.overhead);
 c.legal=c.legalName;
 GUARD.dirty=false;toast('Company updated successfully',c.name);go('company');
};
