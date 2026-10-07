/* =====================================================================
   My profile (/my-profile): the signed-in person.
   Personal details, security (mandatory two-factor), documents,
   activity, submissions, work rules.
   ===================================================================== */
const meEmp=()=>S.employees.find(e=>e.name===ME.name)||S.employees[0];
const METHODS=[['totp','Authenticator app'],['sms','SMS code'],['email','Email code']];
const newCodes=()=>Array.from({length:8},()=>{const s=()=>Math.random().toString(36).slice(2,6).toUpperCase().padEnd(4,'7');return s()+'-'+s();});

function meSec(e){ // security state lives on the employee record
 if(e.totp===undefined){e.totp=!!e.mfa;e.method=e.mfa?'totp':'';e.phoneVerified=e.verified;}
 return e;
}
const meTabs=e=>[{k:'personal',l:'Personal details'},{k:'security',l:'Security',n:e.mfa?null:'!'},{k:'shared',l:'Shared with me'},{k:'submissions',l:'My submissions'},{k:'activity',l:'My activity'},{k:'docs',l:'Documents',n:e.docList.length}];

function mePersonal(e){
 return `${addrList}<form class="formpage" data-form novalidate onsubmit="return false" id="meForm">
  ${fsec('Personal details','Shown to your supervisors and on your timesheets',
   fld({name:'first',label:'First name',req:true,value:e.first})+fld({name:'last',label:'Last name',req:true,value:e.last})
   +fld({name:'display',label:'Display name',value:e.display||e.first,span:3,help:'What other people see in the scheduler.'})+fld({name:'username',label:'Username',value:e.username,span:3,max:30})
   +`<div class="fld s3"><label for="f-email">Email ${e.verified?pill('ok','Verified'):pill('warn','Not verified')}</label><input id="f-email" name="email" value="${esc(e.email)}" disabled>${e.verified?'':`<div class="fhelp"><button type="button" style="color:var(--brand);font-weight:600" data-do="me-resend">Resend verification email</button></div>`}</div>`
   +`<div class="fld s3"><label for="f-phone">Mobile ${e.phoneVerified?pill('ok','Verified'):pill('warn','Not verified')}</label><input id="f-phone" name="phone" value="${esc(e.phone)}" type="tel">${e.phoneVerified?'':`<div class="fhelp"><button type="button" style="color:var(--brand);font-weight:600" data-do="me-verify-phone">Verify number</button></div>`}<div class="ferr" id="e-phone" role="alert"></div></div>`
   +fld({name:'address',label:'Address',value:e.address,span:6,list:'addrs',autocomplete:'off',ph:'Search for address…'}))}
  ${fsec('Employment','Set by your admin',kv([['Job title',e.role?esc(e.role):'<span class="dash">\u2014</span>'],['Employment basis',esc(e.basis)],e.acct==='EMPLOYEE'?['Role',esc(roleName(e.roleId))]:['Account type',acctPill(e)],['Started',e.started?esc(e.started):'<span class="dash">\u2014</span>'],['Hourly rate',e.hourly?money2(e.hourly)+' / h':'<span class="dash">\u2014</span>']]))}
  <div class="fbar"><span class="hint">No changes yet</span><button type="button" class="btn btn-ghost" data-do="me-discard">Discard</button><button type="button" class="btn" data-do="me-save" data-fsave disabled>${ICON('check')}Save changes</button></div></form>`;
}

function meSecurity(e){
 meSec(e);
 const phoneOkS=e.phoneVerified;
 const row=(ic,t,sub,right)=>`<div class="sec2"><span class="si">${ICON(ic)}</span><span class="grow"><b>${t}</b><small>${sub}</small></span>${right}</div>`;
 return `<div class="g">
  ${e.mfa||(typeof gateKey==='function'&&gateKey()==='two-factor')?'':`<div class="banner warn">${ICON('alert')}<span><b>Two-factor sign-in is required.</b> Turn it on to keep using SiteOS. It takes about a minute.</span><button type="button" class="btn btn-sm" data-do="me-totp-setup">Set up now</button></div>`}
  <div class="two"><div class="g">
   ${card({title:'Two-factor authentication',sub:'A second step every time you sign in',meta:e.mfa?pill('ok','On',1):pill('warn','Off',1),body:
    `<div class="fld"><label>Verification method</label><div class="segc" role="radiogroup" aria-label="Verification method">${METHODS.map(([k,l])=>{const dis=(k==='totp'&&!e.totp)||(k==='sms'&&!phoneOkS);return `<button type="button" role="radio" aria-checked="${e.method===k}" class="${e.method===k?'on':''}" data-do="me-method" data-m="${k}" ${dis?'disabled title="'+(k==='sms'?'Verify your mobile number first':'Set up the authenticator app first')+'" style="opacity:.45;cursor:not-allowed"':''}>${l}</button>`;}).join('')}</div><div class="fhelp">Used when you sign in. SMS needs a verified mobile number.</div></div>`
    +row('qr','Authenticator app',e.totp?'Connected':'Not set up',e.totp?`<button type="button" class="btn btn-ghost btn-sm" data-do="me-totp-off">Disconnect</button>`:`<button type="button" class="btn btn-sm" data-do="me-totp-setup">Set up</button>`)
    +row('chat','SMS to '+esc(e.phone),phoneOkS?'Verified number':'Number not verified',phoneOkS?pill('ok','Verified'):`<button type="button" class="btn btn-sm" data-do="me-verify-phone">Verify number</button>`)
    +row('mail','Email '+esc(e.email),e.verified?'Verified address':'Address not verified',e.verified?pill('ok','Verified'):`<button type="button" class="btn btn-sm" data-do="me-resend">Resend email</button>`)})}
   ${card({title:'Recovery codes',sub:'One-time codes if you lose your phone',body:`<div class="subtle" style="font-size:13px;line-height:1.55">Keep them somewhere safe. Each works once. Generating new codes makes the old ones stop working.</div><div style="margin-top:12px"><button type="button" class="btn btn-ghost btn-sm" data-do="me-codes" ${e.mfa?'':'disabled'}>${ICON('reset')}Generate new codes</button></div>`})}
  </div><div class="g">
   ${card({title:'Password',body:`${kv([['Last changed','12 Aug 2026'],['Sign-in','Email + password'+(e.mfa?' + 2FA':'')]])}<div style="margin-top:12px"><button type="button" class="btn btn-ghost btn-sm" data-do="me-pwd">${ICON('lock')}Change password</button></div>`})}
   ${card({title:'Session',body:`<div class="subtle" style="font-size:13px;line-height:1.55">You are signed out after ${esc(String(12))} hours without activity. Your company sets this.</div>`})}
  </div></div></div>`;
}

function meShared(e){
 return `<section class="qv-card"><div class="toolbar"><label class="field" style="width:180px"><input type="date" value="2026-09-30" aria-label="Date" style="color:var(--text)"></label><span class="grow"></span><label class="field">${ICON('search')}<input type="search" placeholder="Search" aria-label="Search"></label></div>${emptyBlock('file','No entries to display','Shared entries will be displayed here. Your teammates may share forms and checklist entries with you, which will be displayed here.')}</section>`;
}
function meSubmissions(e){
 const rows=S.jsas.filter(j=>j.resp.includes(e.name));
 return `<section class="qv-card"><div class="qv-hd"><div class="grow"><h3>My submissions</h3><div class="s">JSAs you filled in</div></div></div>${rows.length?`<div class="tblwrap"><table class="tbl" style="min-width:640px"><thead><tr><th>JSA</th><th>Job</th><th>Shift</th><th>Status</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${titled(r.tpl,r.id,null,1)}</td><td>${jobTag(r.job)}</td><td>${esc(r.shift)}</td><td>${pill(JS[r.st][0],JS[r.st][1],1)}</td></tr>`).join('')}</tbody></table></div>`:emptyBlock('shield','No submissions yet','JSAs you complete will appear here.')}</section>`;
}
function meActivity(e){
 return `<section class="qv-card"><div class="qv-hd"><div class="grow"><h3>My activity</h3><div class="s">Recent changes to your account</div></div></div><div class="qv-body">${timeline([
  tlItem('lock','Signed in','Chrome on Windows, Sydney','Today','brand'),
  tlItem('shield','Two-factor '+(e.mfa?'turned on':'not yet set up'),'',e.mfa?'4 Sep 2026':'—',e.mfa?'ok':'warn'),
  tlItem('edit','Profile updated','Mobile number changed','12 Sep 2026'),
  tlItem('file','Document added',esc((e.docList[0]||{name:'Employment contract'}).name),'12 Feb 2026')])}</div></section>`;
}

VIEWS.me={path:'my-profile',title:'My profile',sub:'Your details, sign-in security and documents.',label:'My profile',
 render(){
  const e=meEmp();meSec(e);
  const tabs=meTabs(e),k=curTab(tabs);
  const h=hero({name:e.name,ini:ini(e.name),title:e.name,pills:[acctPill(e),e.mfa?pill('ok','Two-factor on',1):pill('warn','Two-factor needed',1)],sub:esc(e.role)+' · '+esc(S.company.legal),meta:[['mail',esc(e.email)],['phone',esc(e.phone)]],
   actions:`<button type="button" class="btn btn-ghost" data-do="me-photo">${ICON('upload')}<span class="lb">Change picture</span></button>`});
  const body={personal:mePersonal,security:meSecurity,shared:meShared,docs:empDocs,submissions:meSubmissions,activity:meActivity}[k](e);
  return `<div class="page">${h}${ptabs(tabs)}${body}</div>`;
 }};

/* ---------- actions ---------- */
DO['me-save']=()=>{
 const e=meEmp(),d=validate($('#meForm'),{phone:v=>phoneOk(v)?'':'Must be a valid mobile number'});if(!d)return toastErr('Can’t save yet','Fix the highlighted fields and try again.');
 const phoneChanged=d.phone!==e.phone;
 Object.assign(e,{first:d.first,last:d.last,display:d.display,username:d.username,phone:d.phone,address:d.address,name:d.first+' '+d.last});
 if(phoneChanged){e.phoneVerified=false;if(e.method==='sms')e.method=e.totp?'totp':'';}
 ME.name=e.name;GUARD.dirty=false;rerender(true);toast('Profile updated',phoneChanged?'New number needs verifying before SMS codes work.':e.name);
};
DO['me-discard']=()=>{GUARD.dirty=false;rerender(true);};
DO['me-resend']=()=>toast('Verification email sent',meEmp().email+' · the link works for 24 hours');
DO['me-method']=d=>{const e=meEmp();e.method=d.m;rerender(true);toast('Verification method updated',METHODS.find(m=>m[0]===d.m)[1]);};
DO['me-photo']=()=>drawer({title:'Change profile picture',sub:'Shown in the scheduler and on your timesheets',okLabel:'Save picture',
 rules:{file:{always:true,fn:v=>v?'':'Choose an image'}},body:`<div class="fgrid">${drop('file','Photo','JPG or PNG, up to 5 MB')}</div>`,onOk:()=>toast('Profile picture updated')});
DO['me-pwd']=()=>drawer({title:'Change password',sub:'You stay signed in on this device',okLabel:'Change password',
 rules:{cur:v=>v?'':'Enter your current password',pw:v=>v.length<10?'Use at least 10 characters':/\d/.test(v)&&/[A-Za-z]/.test(v)?'':'Mix letters and numbers',pw2:(v,a)=>v!==a.pw?'Passwords don’t match':''},
 body:`<div class="fgrid">${fld({name:'cur',label:'Current password',type:'password',req:true,span:6,autocomplete:'current-password'})}${fld({name:'pw',label:'New password',type:'password',req:true,span:6,autocomplete:'new-password',help:'At least 10 characters, with letters and numbers.'})}${fld({name:'pw2',label:'Confirm new password',type:'password',req:true,span:6,autocomplete:'new-password'})}</div>`,
 onOk:()=>toast('Password changed','Other devices have been signed out.')});
DO['me-verify-phone']=()=>{const e=meEmp();drawer({title:'Verify your number',sub:'We text a 6-digit code to '+e.phone,okLabel:'Verify',
 rules:{code:v=>/^\d{6}$/.test(v)?'':'Enter the 6-digit code'},hint:'Prototype: any 6 digits work.',
 body:`<div class="fgrid">${fld({name:'code',label:'Code',req:true,span:6,inputmode:'numeric',max:6,ph:'000000',autocomplete:'one-time-code'})}</div><div><button type="button" class="btn btn-ghost btn-sm" data-toast="Code sent|A new SMS is on its way">Resend code</button></div>`,
 onOk:()=>{e.phoneVerified=true;rerender(true);toast('Number verified',e.phone);}});};
DO['me-totp-setup']=()=>{const e=meEmp();drawer({title:'Set up authenticator app',sub:'Google Authenticator, Microsoft Authenticator, 1Password or similar',okLabel:'Turn on',
 rules:{code:v=>/^\d{6}$/.test(v)?'':'Enter the 6-digit code from your app'},hint:'Prototype: any 6 digits work.',
 body:`<div class="qr" role="img" aria-label="QR code placeholder"></div><div style="text-align:center;font-size:12.5px;color:var(--text-subtle)">Can’t scan? Enter this key: <b class="mono" style="color:var(--text)">JBSW Y3DP EHPK 3PXP</b></div>
  <div class="fgrid">${fld({name:'code',label:'6-digit code',req:true,span:6,inputmode:'numeric',max:6,ph:'000000',autocomplete:'one-time-code',help:'From the app, to confirm it is set up.'})}</div>`,
 onOk:async()=>{e.totp=true;e.mfa=true;e.method='totp';rerender(true);toast('Two-factor turned on','Authenticator app connected');const c=newCodes();setTimeout(()=>showCodes(c,true),250);}});};
DO['me-totp-off']=async()=>{
 const e=meEmp();
 if(!(await dialog({title:'Disconnect authenticator app?',body:e.phoneVerified?'You’ll switch to SMS codes. Two-factor stays on, because SiteOS requires it.':'<b>Two-factor will turn off</b> and SiteOS will ask you to set it up again at your next sign-in.',okLabel:'Disconnect',danger:true})))return;
 e.totp=false;if(e.phoneVerified){e.method='sms';}else{e.method='';e.mfa=false;}rerender(true);toast('Authenticator app disconnected');
};
async function showCodes(c,first){
 await dialog({title:first?'Save your recovery codes':'Your new recovery codes',body:`<div style="margin-bottom:8px">Each code works once. Store them somewhere safe, like a password manager.</div><div class="codes">${c.map(x=>`<span>${x}</span>`).join('')}</div>`,okLabel:'I’ve saved them',keep:'Copy codes'});
}
DO['me-codes']=async()=>{
 if(!(await dialog({title:'Generate new recovery codes?',body:'Your current codes stop working straight away.',okLabel:'Generate',danger:true})))return;
 showCodes(newCodes(),false);
};
