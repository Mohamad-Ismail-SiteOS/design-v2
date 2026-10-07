/* =====================================================================
   Auth screens and the onboarding gate. Follow the shipped flows:
   - Login (email or username, password, Forgot password?, Google, Sign up) and Register
     (first, last, mobile, email, password; email link; then the account picks 2FA in My profile)
   - 2FA challenge (Authenticator / Email / SMS switcher, send first for email and SMS, recovery codes)
   - Forgot password, Reset password (also the invite landing "Set your password"), Verify email landing
   - Job invitation (new invitee, existing account, invalid)
   - Session expired lock that keeps the page underneath
   - Onboarding gate: mobile number, then two-factor, then company details, each pinning the user
     to the page that fixes it
   Demo only: every listed email signs in with the demo password; the 2FA code is 123456.
   ===================================================================== */
const DEMO={pw:'Siteos!2026',code:'123456',recovery:'RC4X-92KD'};
const AUTH_PW={};
const AUTH={mode:'login',step:'creds',fails:0,emp:null,method:'',sent:false,reg:null,err:'',busy:false,chk:'',sentTo:''};
const authReset=()=>Object.assign(AUTH,{mode:'login',step:'creds',fails:0,emp:null,method:'',sent:false,reg:null,err:'',busy:false,chk:'',sentTo:''});
const QS=()=>new URLSearchParams(location.hash.split('?')[1]||'');
const empBySign=id=>{const k=(id||'').trim().toLowerCase();return S.employees.find(e=>e.email.toLowerCase()===k||(e.username||'').toLowerCase()===k);};
const pwOf=e=>AUTH_PW[e.email.toLowerCase()]||DEMO.pw;
const authEmail=v=>/^[^\s@#]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v)?'':(v.includes('#')?'Email must not contain #.':'Enter a valid email address');
const authPw=v=>v.length<8?'Password must be at least 8 characters':(!/[A-Z]/.test(v)||!/[^A-Za-z0-9]/.test(v))?'Password must contain at least one uppercase letter and one special character':'';
const authMobile=(v,cc)=>{const d=String(v).replace(/\D/g,'').replace(/^0/,'');return cc==='+61'?(/^4\d{8}$/.test(d)?'':'Enter a valid Australian mobile number'):(d.length>=7&&d.length<=12?'':'Enter a valid mobile number');};
const safeRedir=r=>r&&r[0]==='/'&&r[1]!=='/'?r.slice(1):'';
function personaFor(e){
 const k=Object.keys(PERSONAS).find(x=>PERSONAS[x].name===e.name);if(k)return k;
 const key='u-'+e.id;PERSONAS[key]={name:e.name,role:roleName(e.roleId)||e.role,acct:e.acct,roleId:e.roleId,bypass:e.acct==='OWNER'||e.acct==='SUPERUSER'};return key;
}
function signIn(e,dest,msg){
 GATE.on=false;setPersona(personaFor(e));buildNav();paintMe();authReset();
 toast(msg||'Login success',e.name);go(dest||(allowed(VIEWS.dash)?'dash':'my-profile'));
}
const busyBtn=(el,fn,ms)=>{if(AUTH.busy)return;AUTH.busy=true;if(el){el.disabled=true;el.classList.add('busy');}setTimeout(()=>{AUTH.busy=false;if(el){el.disabled=false;el.classList.remove('busy');}fn();},ms||650);};

/* ---------- shell ---------- */
/* ---------- left side of the auth screens: a site photo with the portal pinned to what is in it ---------- */
/* The photo is assets/auth-site.jpg (676x576). Anchor points below are in that image's pixels; swap the file
   for your own photography and move the four dots to match. */
const AUTH_PHOTO='assets/auth-site.jpg';
/* the road's centre line, and blue lane dashes that travel up it toward the destination dot */
const LANE_MID=[[318,398],[328,452],[372,516],[404,576]],LANE_N=11;
const laneBz=t=>{const p=LANE_MID,u=1-t;return [u*u*u*p[0][0]+3*u*u*t*p[1][0]+3*u*t*t*p[2][0]+t*t*t*p[3][0],u*u*u*p[0][1]+3*u*u*t*p[1][1]+3*u*t*t*p[2][1]+t*t*t*p[3][1]].map(v=>v.toFixed(1));};
/* u runs 0 (the dot at the horizon) to 1 (the foreground); phase moves every dash toward 0 */
function laneFrame(phase){
 return Array.from({length:LANE_N},(_,k)=>{
  const u=(((k/LANE_N-phase)%1)+1)%1,a=Math.pow(u,1.65)*.96+.015,b=Math.min(a+.03+a*.085,1),p=laneBz(a),q=laneBz(b),fade=Math.min(1,u/.14,(1-u)/.1);
  return {d:`M${p[0]} ${p[1]}L${q[0]} ${q[1]}`,w:(1.1+3.6*a).toFixed(1),o:(.95*Math.max(.1,fade)).toFixed(2)};
 });
}
(function laneLoop(now){
 const g=document.querySelector('.lane-g');
 if(g&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
  const f=laneFrame((now/3800)%1),ps=g.children;
  for(let i=0;i<f.length&&i<ps.length;i++){ps[i].setAttribute('d',f[i].d);ps[i].setAttribute('stroke-width',f[i].w);ps[i].setAttribute('stroke-opacity',f[i].o);}
 }
 requestAnimationFrame(laneLoop);
})(performance.now());

/* leader lines: each runs from its pin to the nearest edge of its card, measured from the real boxes so they always meet */
const LEADERS=[['cc-crane',158,212],['cc-deck',505,298],['cc-jsa',178,420],['cc-ute',455,440],['cc-trip',318,400]];
const leaderRO=typeof ResizeObserver==='function'?new ResizeObserver(()=>fitLeaders()):null,leaderSeen=new WeakSet();
function fitLeaders(){
 document.querySelectorAll('.stage').forEach(st=>{
  const sr=st.getBoundingClientRect(),g=st.querySelector('.leaders');
  if(!g||!sr.width)return;
  if(leaderRO&&!leaderSeen.has(st)){leaderSeen.add(st);leaderRO.observe(st);st.querySelectorAll('.cc').forEach(c=>leaderRO.observe(c));}
  const k=676/sr.width;
  LEADERS.forEach(([cls,x,y],i)=>{
   const c=st.querySelector('.'+cls),p=g.children[i];if(!p)return;
   if(!c||getComputedStyle(c).display==='none'){p.setAttribute('d','');return;}
   const r=c.getBoundingClientRect(),L=(r.left-sr.left)*k,R=(r.right-sr.left)*k,T=(r.top-sr.top)*k,B=(r.bottom-sr.top)*k;
   let ex=Math.min(Math.max(x,L+10),R-10),ey;
   if(y>B)ey=B;else if(y<T)ey=T;else{ex=x<L?L:R;ey=y;}
   p.setAttribute('d','M'+x+' '+y+'L'+ex.toFixed(1)+' '+ey.toFixed(1));
  });
 });
}
addEventListener('resize',fitLeaders);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fitLeaders);
(()=>{const r=document.getElementById('authRoot');if(r)new MutationObserver(fitLeaders).observe(r,{childList:true});})();

function authShowcase(){
 const dots=[[158,212],[505,298],[178,420],[455,440],[318,400]];
 /* a translucent road running from the foreground to the horizon: the Journeys feature */
 return `<div class="stage"><img src="${AUTH_PHOTO}" alt="" draggable="false">
  <svg class="stage-lines" viewBox="0 0 676 576" aria-hidden="true"><defs><linearGradient id="roadg" gradientUnits="userSpaceOnUse" x1="0" y1="398" x2="0" y2="576"><stop offset="0" stop-color="#1b2a4a" stop-opacity=".18"/><stop offset=".4" stop-color="#0e1628" stop-opacity=".55"/><stop offset="1" stop-color="#0e1628" stop-opacity=".72"/></linearGradient><filter id="routeglow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
  <path d="M306 398C280 440 200 500 120 576L676 576L676 560C560 515 380 440 330 398Z" fill="url(#roadg)"/>
  <g fill="none" stroke="#cfe0ff" stroke-opacity=".7" stroke-width="1.8"><path d="M306 398C280 440 200 500 120 576"/><path d="M330 398C380 440 560 515 676 560"/></g>
  <g class="lane-g" stroke="#7aa8ff" stroke-linecap="round">${laneFrame(0).map(f=>`<path d="${f.d}" stroke-width="${f.w}" stroke-opacity="${f.o}"/>`).join('')}</g>
  <path d="M${LANE_MID[0][0]} ${LANE_MID[0][1]}C${LANE_MID[1][0]} ${LANE_MID[1][1]} ${LANE_MID[2][0]} ${LANE_MID[2][1]} ${LANE_MID[3][0]} ${LANE_MID[3][1]}" fill="none" stroke="#7aa2ff" stroke-opacity=".28" stroke-width="22" stroke-linecap="round"/>
  <g class="leaders" stroke="#fff" stroke-opacity=".8" stroke-width="1.4" fill="none"><path d="M158 212L214 200"/><path d="M505 298V158"/><path d="M178 426L190 470"/><path d="M455 444V470"/><path d="M318 400V380"/></g>${dots.map(([x,y])=>`<g class="pin" transform="translate(${x} ${y})"><circle class="pulse" r="9" fill="none" stroke="#fff" stroke-opacity=".6"/><circle r="4.5" fill="#fff"/></g>`).join('')}</svg>
  <div class="cc cc-deck"><span class="cc-ic">${ICON('clock')}</span><span class="cc-tx"><em>Time clock</em><b>2 on the deck, clocked in</b><small>Inside the Westgate geofence</small></span><span class="cc-st ok"><i></i>On site</span></div>
  <div class="cc cc-crane"><span class="cc-ic">${ICON('box')}</span><span class="cc-tx"><em>Assets</em><b>Tower crane TC-02</b><small>Test &amp; tag valid \u00b7 inspection in 6 days</small></span><span class="cc-tick">${ICON('check')}</span></div>
  <div class="cc cc-jsa"><span class="cc-ic">${ICON('shield')}</span><span class="cc-tx"><em>Daily JSA</em><b>3 of 4 signed</b><span class="cc-bar"><i></i></span><small>Waiting on Sophie Grant</small></span></div>
  <div class="cc cc-trip"><span class="cc-ic">${ICON('route')}</span><span class="cc-tx"><em>Journeys</em><b>Enfield yard to Dubbo</b><small>372 km \u00b7 ETA 12:10</small></span></div>
  <div class="cc cc-ute"><span class="cc-ic">${ICON('truck')}</span><span class="cc-tx"><em>Vehicles</em><b>Ute 05 \u00b7 with Liam Carter</b><small>Rego valid \u00b7 service in 1,790 km</small></span></div>
 </div>`;
}

const MARK=`<span class="mk">S</span>`;
function authShell(title,sub,body,o){
 o=o||{};
 return `<div class="authshell${o.lock?' lock':''}"><aside class="authart" aria-hidden="true"><div class="brandrow">${MARK}<b>SiteOS</b></div><div class="authart-tx"><h2>Everything on site, at a glance.</h2><p>Rosters, time, safety and fleet in one calm place.</p></div>${authShowcase()}</aside>
 <main class="authmain"><div class="authhero m" aria-hidden="true"><div class="brandrow">${MARK}<b>SiteOS</b></div><b class="hl">Everything on site, at a glance.</b></div><div class="authcard" role="${o.lock?'dialog':'region'}" aria-labelledby="authT"><h1 id="authT">${esc(title)}</h1>${sub?`<p class="authsub">${sub}</p>`:''}${body}</div>${o.demo===false?'':demoBox()}<footer class="authfoot">© 2026 SiteOS · <a data-toast="Help|Opens the help centre">Help</a> · <a data-toast="Privacy|Opens the privacy policy">Privacy</a></footer></main></div>`;
}
function demoBox(){
 const ps=Object.keys(PERSONAS).filter(k=>!k.startsWith('u-')).map(k=>{const e=S.employees.find(x=>x.name===PERSONAS[k].name);return e?[PERSONAS[k].name,PERSONAS[k].role,e.email,e.mfa]:null;}).filter(Boolean);
 const inv=S.employees.find(e=>!e.verified);
 return `<details class="demobox"><summary>Demo only: accounts and links</summary><div class="demob"><p>Every account below signs in with <code>${DEMO.pw}</code>. Two-factor code: <code>${DEMO.code}</code>${''} (recovery code <code>${DEMO.recovery}</code>).</p><div class="demoacc">${ps.map(([n,r,m,f])=>`<button type="button" data-do="au-fill" data-m="${esc(m)}"><b>${esc(n)}</b><small>${esc(r)}${f?' · 2FA':' · no 2FA'}</small></button>`).join('')}${inv?`<button type="button" data-do="au-fill" data-m="${esc(inv.email)}"><b>${esc(inv.name)}</b><small>Email not verified</small></button>`:''}</div>
 <p>Open a link:</p><div class="demolinks"><a data-go="auth/reset-password?uid=3&token=ok">Reset link</a><a data-go="auth/reset-password?uid=3&token=ok&mode=invite">Invite link</a><a data-go="auth/reset-password?uid=3&token=expired">Expired link</a><a data-go="auth/verify-email?uid=3&token=ok">Verify email</a><a data-go="auth/verify-email?uid=3&token=bad">Bad verify link</a><a data-go="collaboration/invite?token=new">New invitee</a><a data-go="collaboration/invite?token=existing">Existing account</a><a data-go="collaboration/invite?token=bad">Bad invitation</a></div></div></details>`;
}
const gIcon=`<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8a6 6 0 0 1 0-12c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4a9.6 9.6 0 1 0 0 19.2c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-2z"/></svg>`;
const pwf=(name,label,o)=>{o=o||{};return `<div class="fld s6"><label for="f-${name}">${esc(label)}${o.req===false?'':'<span class="req" aria-hidden="true">*</span>'}</label><div class="inp pw"><input id="f-${name}" name="${name}" type="password" autocomplete="${o.ac||'current-password'}"${o.req===false?'':' required'}><button type="button" class="pweye" data-do="au-eye" aria-label="Show password" aria-pressed="false">${ICON('eye')}</button></div>${o.rules?`<ul class="pwrules" data-pw="${name}"><li data-r="len">At least 8 characters</li><li data-r="up">One uppercase letter</li><li data-r="sp">One special character</li></ul>`:''}<div class="ferr" id="e-${name}" role="alert"></div></div>`;};
const afld=(name,label,o)=>fld({name,label,span:6,req:true,...o});
const sbtn=(label,cls)=>`<button type="submit" class="btn wide ${cls||''}" data-spin>${esc(label)}</button>`;
const orRow=`<div class="orrow"><span>or</span></div>`;
const alertBox=(msg)=>msg?`<div class="banner bad" role="alert" style="margin-bottom:14px">${ICON('alert')}<span>${esc(msg)}</span></div>`:'';
document.addEventListener('submit',e=>{const f=e.target.closest('[data-submit]');if(!f)return;e.preventDefault();const fn=DO[f.dataset.submit];if(fn)fn({},f.querySelector('[data-spin]')||f);});
document.addEventListener('input',e=>{const i=e.target.closest('input[type=password]');if(!i)return;const ul=$('.pwrules[data-pw="'+i.name+'"]');if(!ul)return;const v=i.value;$('[data-r=len]',ul).classList.toggle('ok',v.length>=8);$('[data-r=up]',ul).classList.toggle('ok',/[A-Z]/.test(v));$('[data-r=sp]',ul).classList.toggle('ok',/[^A-Za-z0-9]/.test(v));});
DO['au-eye']=(d,el)=>{const i=$('input',el.closest('.inp')),on=i.type==='password';i.type=on?'text':'password';el.setAttribute('aria-pressed',on);el.setAttribute('aria-label',on?'Hide password':'Show password');};
DO['au-fill']=d=>{if(AUTH.step!=='creds'||AUTH.mode!=='login'){authReset();}const go_=()=>{const i=$('[name="identifier"]'),p=$('[name="password"]');if(i){i.value=d.m;p.value=DEMO.pw;p.focus();}};if(cur()!=='login'){location.hash='#/login';setTimeout(go_,120);}else{rerender(true);setTimeout(go_,40);}};

/* ---------- login / register / 2FA / verify ---------- */
function methodsFor(e){
 meSec(e);const m=[];if(e.totp)m.push('authenticator');if(e.phoneVerified)m.push('sms');m.push('email');
 const def=e.method==='totp'?'authenticator':e.method||'email';return {m,def:m.includes(def)?def:m[0]};
}
const METH_LBL={authenticator:'Authenticator',email:'Email',sms:'SMS'};
function loginScreen(){
 const lock=AUTH.lock;
 return `<form data-submit="au-login" novalidate>${alertBox(AUTH.err)}${afld('identifier','Email or username',{autocomplete:'username',max:255})}${pwf('password','Password')}
  ${lock?'':`<div class="rt"><button type="button" class="linkbtn" data-go="auth/forgot-password">Forgot password?</button></div>`}
  ${sbtn('Login')}${orRow}<button type="button" class="btn btn-ghost wide" data-do="au-google" data-m="login">${gIcon}Login with Google</button>
  ${lock?'':`<button type="button" class="linkbtn wide" data-do="au-mode" data-m="register">Don’t have an account? Sign up</button>`}</form>`;
}
function registerScreen(){
 return `<form data-submit="au-register" novalidate>${alertBox(AUTH.err)}${afld('firstName','First Name',{max:255})}${afld('lastName','Last Name',{max:255})}${fld({name:'phone',label:'Phone Number',type:'phone',span:6,req:true})}${afld('email','Email',{max:255,autocomplete:'email'})}${pwf('password','Password',{rules:true,ac:'new-password'})}
  ${sbtn('Register')}${orRow}<button type="button" class="btn btn-ghost wide" data-do="au-google" data-m="register">${gIcon}Sign up with Google</button><button type="button" class="linkbtn wide" data-do="au-mode" data-m="login">Already have an account? Login</button></form>`;
}
const waitScreen=(email,after)=>`<div class="waitbox"><div class="wl"><span class="spin"></span><span>Waiting for you to verify your email…</span></div><p>${email?`We’ve sent a verification link to <b>${esc(email)}</b>. `:'We’ve sent a verification link to your email. '}${after}</p>
 <button type="button" class="btn btn-ghost wide" data-do="au-resend">Resend link</button><button type="button" class="linkbtn wide" data-do="au-back">Back</button>
 <div class="demohint"><b>Demo:</b> <button type="button" class="linkbtn" data-do="au-linkclick">Open the verification link</button></div></div>`;
function twofaScreen(){
 const e=AUTH.emp,mm=methodsFor(e),m=AUTH.method||mm.def,auth=m==='authenticator',needsSend=!auth&&!AUTH.sent;
 const prompt=auth?'Enter the current 6-digit code from your authenticator app.':needsSend?(m==='sms'?'We’ll send a 6-digit code by SMS to your mobile number.':'We’ll email you a 6-digit code.'):(m==='sms'?'Enter the SMS code we sent you. It can take a minute to arrive.':'Enter the code we emailed you. It can take a minute to arrive — check your inbox first.');
 return `<form data-submit="au-2fa" novalidate>${mm.m.length>1?`<div class="segc wide" role="tablist" style="margin-bottom:14px">${mm.m.map(x=>`<button type="button" role="tab" class="${x===m?'on':''}" aria-selected="${x===m}" data-do="au-method" data-m="${x}">${METH_LBL[x]}</button>`).join('')}</div>`:''}
  <p class="authsub left">${prompt}</p>
  ${needsSend?`<button type="button" class="btn wide" data-do="au-send" data-spin>${m==='sms'?'Send SMS code':'Email me a code'}</button>`:`${fld({name:'code',label:auth?'Authenticator code':'Verification code',span:6,req:true,inputmode:'numeric',autocomplete:'one-time-code'})}${auth?'<div class="fhelp" style="margin:-6px 0 6px">Lost your device? Enter one of your recovery codes instead.</div>':''}${sbtn('Verify')}${auth?'':`<button type="button" class="linkbtn wide" data-do="au-send">Resend code</button>`}`}
  <button type="button" class="linkbtn wide" data-do="au-back">Back</button>${AUTH.err?alertBox(AUTH.err):''}</form>`;
}
VIEWS.login={path:'login',auth:true,title:'Login',enter(){authReset();const r=QS().get('mode');if(r==='register')AUTH.mode='register';},
 render(){
  if(AUTH.step==='verify')return authShell('Verify your email','',waitScreen(AUTH.emp.email,'Click it and you’ll be signed in automatically.'));
  if(AUTH.step==='reg')return authShell('Verify your email','',waitScreen(AUTH.reg.email,'Click it and you’ll be signed in automatically — then pick how you want to secure your account.'));
  if(AUTH.step==='2fa')return authShell('Two-step sign-in','',twofaScreen());
  return authShell(AUTH.mode==='register'?'Register':'Login',AUTH.mode==='register'?'':'Welcome back to SiteOS.',AUTH.mode==='register'?registerScreen():loginScreen());
 }};
DO['au-mode']=d=>{AUTH.mode=d.m;AUTH.err='';rerender(true);};
DO['au-back']=()=>{Object.assign(AUTH,{step:'creds',err:'',sent:false,method:''});rerender(true);};
DO['au-method']=d=>{AUTH.method=d.m;AUTH.sent=false;AUTH.err='';rerender(true);};
DO['au-send']=(d,el)=>{const m=AUTH.method||methodsFor(AUTH.emp).def;busyBtn(el,()=>{AUTH.sent=true;rerender(true);toast(m==='sms'?'A code has been sent to you by SMS.':'A code has been sent to your email.','Demo code '+DEMO.code);},500);};
DO['au-resend']=()=>toast('We’ve sent another verification link to your email.');
DO['au-login']=(d,el)=>{
 const root=$('.authcard'),v=validate(root,{});if(!v)return;
 busyBtn(el,()=>{
  const e=empBySign(v.identifier);
  if(AUTH.fails>=5){AUTH.err='Too many attempts. Wait 15 minutes, or reset your password.';rerender(true);return;}
  if(!e||pwOf(e)!==v.password){AUTH.fails++;AUTH.err=AUTH.fails>=5?'Too many attempts. Wait 15 minutes, or reset your password.':'Incorrect email or password.'+(AUTH.fails>=3?' '+(5-AUTH.fails)+' attempt'+(5-AUTH.fails===1?'':'s')+' left.':'');rerender(true);$('[name="identifier"]').value=v.identifier;return;}
  AUTH.fails=0;AUTH.err='';AUTH.emp=e;
  if(!e.verified){AUTH.step='verify';rerender(true);return;}
  if(e.mfa){AUTH.step='2fa';AUTH.method=methodsFor(e).def;AUTH.sent=false;rerender(true);return;}
  signIn(e,safeRedir(QS().get('redirect')));
 });
};
DO['au-2fa']=(d,el)=>{
 const v=validate($('.authcard'),{});if(!v)return;
 busyBtn(el,()=>{
  const m=AUTH.method||methodsFor(AUTH.emp).def,ok=v.code===DEMO.code||(m==='authenticator'&&v.code.toUpperCase()===DEMO.recovery);
  if(!ok){toastErr('That code is invalid or has expired.');$('[name="code"]').value='';return;}
  signIn(AUTH.emp,safeRedir(QS().get('redirect')));
 });
};
DO['au-linkclick']=()=>{
 if(AUTH.step==='reg'){registerAccount(AUTH.reg);return;}
 const e=AUTH.emp;e.verified=true;toast('Email verified',e.email);
 if(e.mfa){AUTH.step='2fa';AUTH.method=methodsFor(e).def;AUTH.sent=false;rerender(true);}else signIn(e,'my-profile');
};
function registerAccount(r){
 const base=structuredClone(S.employees.find(e=>e.name===PERSONAS.owner.name)),first=r.firstName.trim(),last=r.lastName.trim(),name=first+' '+last;
 const id=slug(name)+(S.employees.some(e=>e.id===slug(name))?'-'+(S.employees.length+1):'');
 Object.assign(base,{id,name,first,last,display:first,email:r.email.trim(),username:r.email.split('@')[0],phone:r.phone,address:'',role:'Owner',roleId:'admin',acct:'OWNER',mfa:false,totp:false,method:'',phoneVerified:false,verified:true,st:'active',docList:[],docs:'None yet'});
 S.employees.push(base);AUTH_PW[base.email.toLowerCase()]=r.password;
 GATE.on=true;signIn(base,'my-profile','Login success');GATE.on=true;rerender(true);
}
DO['au-register']=(d,el)=>{
 const root=$('.authcard'),v=validate(root,{email:authEmail,password:authPw,phone:(x,a)=>authMobile(x,a.phone_cc),firstName:x=>x.trim().length<2?'First Name must be at least 2 characters':'',lastName:x=>x.trim().length<2?'Last Name must be at least 2 characters':''});
 if(!v)return;
 busyBtn(el,()=>{
  if(empBySign(v.email)){AUTH.err='An account with this email already exists. Log in instead.';rerender(true);return;}
  AUTH.reg={firstName:v.firstName,lastName:v.lastName,phone:v.phone,email:v.email,password:v.password};AUTH.step='reg';AUTH.err='';rerender(true);
 },800);
};
function googleDrawer(mode){
 const ex=S.employees.find(e=>e.name===PERSONAS.owner.name);
 drawer({title:'Choose a Google account',sub:'to continue to SiteOS',okLabel:null,body:`<div class="cmplist"><button type="button" class="cmpitem" data-do="au-gpick" data-k="exist" data-m="${mode}"><span class="av">${ini(ex.name)}</span><span class="tx"><b>${esc(ex.name)}</b><small>${esc(ex.email)}</small></span>${ICON('next')}</button><button type="button" class="cmpitem" data-do="au-gpick" data-k="new" data-m="${mode}"><span class="av">+</span><span class="tx"><b>Use another account</b><small>new.person@gmail.com</small></span>${ICON('next')}</button></div><p class="subtle" style="font-size:12.5px;margin-top:12px">Prototype: this stands in for Google’s own popup.</p>`});
}
DO['au-google']=d=>googleDrawer(d.m);
DO['au-gpick']=async d=>{
 await closeDrawer(true);
 if(d.k==='exist'){const e=S.employees.find(x=>x.name===PERSONAS.owner.name);if(e.mfa){AUTH.emp=e;AUTH.step='2fa';AUTH.method=methodsFor(e).def;AUTH.sent=false;rerender(true);}else signIn(e,safeRedir(QS().get('redirect')));return;}
 registerAccount({firstName:'New',lastName:'Person',phone:'0412 000 111',email:'new.person@gmail.com',password:'Google!Signin1'});
};

/* ---------- forgot / reset / verify / invitation ---------- */
const FP={sent:false};
VIEWS.forgot={path:'auth/forgot-password',auth:true,title:'Forgot password',enter(){FP.sent=false;},
 render(){return authShell('Forgot password',FP.sent?'':'Enter your account email and we’ll send you a link to reset your password.',(FP.sent?`<p class="authsub">If an account exists for that email, we’ve sent a link to reset your password. Please check your inbox.</p>`:`<form data-submit="au-forgot" novalidate>${afld('email','Email',{max:255})}${sbtn('Send reset link')}</form>`)+`<button type="button" class="linkbtn wide" data-go="login">Back to login</button>${FP.sent?`<div class="demohint"><b>Demo:</b> <a class="linkbtn" data-go="auth/reset-password?uid=3&token=ok">Open the reset link</a></div>`:''}`);}};
DO['au-forgot']=(d,el)=>{const v=validate($('.authcard'),{email:authEmail});if(!v)return;busyBtn(el,()=>{FP.sent=true;rerender(true);},700);};
const RP={st:'checking',key:''};
const rpKey=()=>QS().get('uid')+'|'+QS().get('token');
VIEWS.reset={path:'auth/reset-password',auth:true,title:'Reset password',
 enter(){RP.key=rpKey();const ok=parseInt(QS().get('uid'),10)>0&&QS().get('token');RP.st=ok?'checking':'invalid';if(ok)setTimeout(()=>{RP.st=QS().get('token')==='ok'?'valid':'invalid';if(cur()==='reset')rerender(true);},800);},
 render(){
  const inv=QS().get('mode')==='invite';
  let body='';
  if(RP.st==='checking')body=`<p class="authsub"><span class="spin dark"></span> Checking your link…</p>`;
  else if(RP.st==='invalid')body=`<p class="authsub">This link is invalid or has expired. Please request a new one.</p><button type="button" class="btn wide" data-go="auth/forgot-password">Request a new link</button>`;
  else body=`<form data-submit="au-reset" novalidate>${pwf('newPassword','New password',{rules:true,ac:'new-password'})}${pwf('confirmPassword','Confirm new password',{ac:'new-password'})}${sbtn(inv?'Set password':'Reset password')}</form>`;
  return authShell(inv?'Set your password':'Reset password',inv&&RP.st==='valid'?'Choose a password to activate your SiteOS account.':'',body+`<button type="button" class="btn btn-ghost wide" data-go="login" style="margin-top:12px">Back to login</button>`);
 }};
DO['au-reset']=(d,el)=>{
 const v=validate($('.authcard'),{newPassword:authPw,confirmPassword:{always:true,fn:(x,a)=>x!==a.newPassword?'Passwords do not match.':''}});if(!v)return;
 busyBtn(el,()=>{const e=S.employees[(parseInt(QS().get('uid'),10)||1)-1];if(e){AUTH_PW[e.email.toLowerCase()]=v.newPassword;if(!e.verified)e.verified=true;}toast(QS().get('mode')==='invite'?'Your password is set. Please log in.':'Your password has been reset. Please log in.');go('login');},700);
};
const VE={st:'verifying'};
VIEWS.verify={path:'auth/verify-email',auth:true,title:'Verify email',
 enter(){const ok=parseInt(QS().get('uid'),10)>0&&QS().get('token');VE.st=ok?'verifying':'invalid';if(ok)setTimeout(()=>{VE.st=QS().get('token')==='ok'?'success':'invalid';if(cur()==='verify')rerender(true);},800);},
 render(){
  const msg={verifying:'Verifying your email…',success:'Your email is verified. You can close this tab and go back to the page where you were signing up — it will continue automatically.',invalid:'This verification link is invalid or has expired. Please request a new one from the sign-up page or your profile.'}[VE.st];
  return authShell('Verify email','',`${VE.st==='success'?`<div class="okmark">${ICON('checkc')}</div>`:VE.st==='verifying'?'<div style="text-align:center"><span class="spin dark"></span></div>':''}<p class="authsub">${msg}</p>${VE.st==='invalid'?`<button type="button" class="linkbtn wide" data-go="login">Back to login</button>`:''}`);
 }};
const INV={st:'checking',d:null};
const INVITES={new:{invitingCompanyName:'Westgate Civil',jobName:'Riverside Footbridge',role:'Project manager',targetCompanyName:'Harbour Fabrication',email:'sam@harbourfab.com.au',emailAlreadyRegistered:false},existing:{invitingCompanyName:'Westgate Civil',jobName:'Riverside Footbridge',role:'Project manager',targetCompanyName:'Northline Civil',email:'priya.nair@northline.com.au',emailAlreadyRegistered:true}};
VIEWS.invite={path:'collaboration/invite',auth:true,title:'Job invitation',
 enter(){const t=QS().get('token')||'';INV.st=t?'checking':'bad';INV.d=INVITES[t]||null;if(t)setTimeout(()=>{INV.st=INV.d?'ok':'bad';if(cur()==='invite')rerender(true);},800);},
 render(){
  let body='';
  if(INV.st==='checking')body=`<p class="authsub"><span class="spin dark"></span> Checking your invitation…</p>`;
  else if(INV.st==='bad')body=`<p class="authsub">${QS().get('token')?'This invitation is no longer valid. It may have expired or been revoked — ask for a new one.':'This invitation link is invalid or incomplete.'}</p><button type="button" class="btn btn-ghost wide" data-go="login">Go to login</button>`;
  else{
   const d=INV.d,matches=d.emailAlreadyRegistered&&ME&&(S.employees.find(e=>e.name===ME.name)||{email:''}).email.toLowerCase()===d.email.toLowerCase();
   body=`<p class="authsub">${esc(d.invitingCompanyName)} invited you to work on <b>${esc(d.jobName)}</b> as ${esc(d.role)} for ${esc(d.targetCompanyName)}.</p>`+(d.emailAlreadyRegistered
    ?(matches?`<button type="button" class="btn wide" data-do="au-accept" data-spin>Accept invitation</button>`:`<p class="authsub">This invitation belongs to an existing account (${esc(d.email)}). Log in as that account to accept it.</p><button type="button" class="btn wide" data-go="login?redirect=/collaboration/invite%3Ftoken%3Dexisting">Log in</button><div class="demohint"><b>Demo:</b> sign in as ${esc(d.email)}, or <button type="button" class="linkbtn" data-do="au-asinvitee">continue as that account</button></div>`)
    :`<form data-submit="au-invite" novalidate>${afld('firstName','First name')}${afld('lastName','Last name')}${fld({name:'phone',label:'Mobile (optional)',type:'phone',span:6})}${pwf('password','Password',{rules:true,ac:'new-password'})}${pwf('confirmPassword','Confirm password',{ac:'new-password'})}${sbtn('Create account & accept')}</form>`);
  }
  return authShell('Job invitation','',body);
 }};
DO['au-asinvitee']=()=>{const e=empBySign(INVITES.existing.email);if(e)signIn(e,'jobs','Invitation accepted');};
DO['au-accept']=(d,el)=>busyBtn(el,()=>{toast('Invitation accepted');go('jobs');},600);
DO['au-invite']=(d,el)=>{
 const v=validate($('.authcard'),{password:authPw,phone:(x,a)=>x?authMobile(x,a.phone_cc):'',confirmPassword:{always:true,fn:(x,a)=>x!==a.password?'Passwords do not match.':''}});if(!v)return;
 busyBtn(el,()=>{const r={firstName:v.firstName,lastName:v.lastName,phone:v.phone||'',email:INV.d.email,password:v.password};registerAccount(r);toast('Your account is ready — welcome to SiteOS');},800);
};

/* ---------- session expired lock (keeps the page underneath) ---------- */
DO['au-lock']=d=>{
 let r=$('#lockRoot');if(!r){r=document.createElement('div');r.id='lockRoot';document.body.appendChild(r);}
 AUTH.lock=true;AUTH.mode='login';AUTH.step='creds';if(!(d&&d.keep))AUTH.err='';
 r.innerHTML=authShell('Session expired','Log in again to continue where you left off.',loginScreen()+`<button type="button" class="linkbtn wide" data-do="au-lockout">Log out</button>`,{lock:true,demo:false});
 r.classList.add('on');fitLeaders();setTimeout(()=>{const i=$('[name="identifier"]',r);if(i){i.value=(S.employees.find(e=>e.name===ME.name)||{}).email||'';$('[name="password"]',r).focus();}},60);
};
DO['au-lockout']=()=>{AUTH.lock=false;const r=$('#lockRoot');if(r){r.classList.remove('on');r.innerHTML='';}go('login');};
/* inside the lock, a successful login just removes it */
const lockSignIn=DO['au-login'];
DO['au-login']=(d,el)=>{
 if(!AUTH.lock||!$('#lockRoot.on'))return lockSignIn(d,el);
 const root=$('#lockRoot .authcard'),v=validate(root,{});if(!v)return;
 busyBtn(el,()=>{const e=empBySign(v.identifier);if(!e||pwOf(e)!==v.password){AUTH.err='Incorrect email or password.';DO['au-lock']({keep:1});return;}AUTH.lock=false;$('#lockRoot').classList.remove('on');$('#lockRoot').innerHTML='';setPersona(personaFor(e));buildNav();paintMe();rerender(true);toast('Welcome back',e.name+' · you are right where you left off');});
};

/* ---------- onboarding gate: mobile number, two-factor, company details ---------- */
const GATE={on:false,was:null};
const gateSteps=[
 {key:'phone-number',label:'Mobile number',msg:'Add your mobile number to continue. SiteOS uses it for sign-in security and shift alerts.',met:()=>!!(meEmp().phone||'').trim(),to:'my-profile',ok:id=>id==='me'},
 {key:'two-factor',label:'Two-factor sign-in',msg:'Turn on two-factor sign-in to continue. It takes about a minute.',met:()=>!!meEmp().mfa,to:'my-profile',ok:id=>id==='me',cta:['Set up now','me-totp-setup']},
 {key:'company-details',label:'Company details',msg:'Complete your company details to continue. Only the company name is required.',met:()=>!can('edit:company')||!!(S.company.name||'').trim(),to:'company/edit',ok:id=>id==='company-edit'}
];
const gateUnmet=()=>GATE.on?gateSteps.find(s=>!s.met()):null;
const gateKey=()=>{const u=gateUnmet();return u?u.key:'';};
function gateBanner(u){
 const i=gateSteps.indexOf(u);
 return `<div class="gatebar" role="status"><span class="gi">${ICON('lock')}</span><div class="grow"><b>Finish setting up your account</b><span>${esc(u.msg)}</span><ol class="gsteps" aria-label="Setup steps">${gateSteps.map((s,k)=>`<li class="${k<i?'done':k===i?'now':''}"><i>${k<i?ICON('check'):k+1}</i>${esc(s.label)}</li>`).join('')}</ol></div>${u.cta?`<button type="button" class="btn btn-sm" data-do="${u.cta[1]}">${esc(u.cta[0])}</button>`:''}</div>`;
}
function gateEnter(id){
 const u=gateUnmet();
 if(!u){if(GATE.was&&GATE.on)toast('You\u2019re all set','Everything is unlocked. Welcome to SiteOS.');GATE.was=null;return false;}
 const changed=GATE.was!==u.key;GATE.was=u.key;
 /* land on the tab that fixes the step (Security for two-factor, Personal details for the mobile number), once per step, so people can still look around */
 const aim=()=>{if(u.to==='my-profile'){UI.tab['me:']=u.key==='two-factor'?'security':'personal';if(u.key==='phone-number')pending={scroll:'#f-phone'};}};
 if(!u.ok(id)&&location.hash.split('?')[0]!=='#/'+u.to){aim();go(u.to);return true;}
 if(changed)aim();
 return false;
}
/* previews of each gate on the person you are viewing as */
const gatePreview=k=>{GATE.on=true;const e=meEmp(),o=((typeof INIT!=='undefined'&&INIT.employees)||[]).find(x=>x.name===e.name)||{};
 /* every preview starts from someone who has finished the other steps, so previewing one gate after another still lands on the one you picked */
 if(!(e.phone||'').trim())e.phone=o.phone||(S.employees.find(x=>(x.phone||'').trim())||{}).phone||'+61 412 345 678';
 if(!e.mfa){e.mfa=true;e.totp=o.totp!==undefined?o.totp:true;e.method=o.method||'totp';}
 if(!(S.company.name||'').trim())S.company.name=(typeof INIT!=='undefined'&&INIT.company&&INIT.company.name)||'Northline Civil';
 if(k==='phone-number')e.phone='';
 else if(k==='two-factor'){e.mfa=false;e.totp=false;e.method='';}
 else S.company.name='';
 rerender(false);};
DO['au-preview']=d=>gatePreview(d.k);
$('#logoutBtn').addEventListener('click',()=>{go('login');toast('Signed out');});
