/* =====================================================================
   Empty, loading and error states. Follow the shipped components:
   - ErrorState, page and section variants (title, message, Retry, one action)
   - the full-page HTTP error banner (Forbidden / Not found / Internal server error /
     Service unavailable) with Reload page, Go back to home and a dismiss
   - PageLoader / SectionLoader with a label
   Adds what the shipped app leaves to the browser: a Page not found screen, first-run empty
   states on lists, an offline bar, skeletons, and a catalogue page (palette: "Error and empty states").
   ===================================================================== */
const stateBlock=o=>`<div class="stateblk${o.tone?' '+o.tone:''}${o.compact?' compact':''}"><span class="sg">${ICON(o.icon||'alert')}</span><b>${esc(o.title)}</b>${o.body?`<p>${esc(o.body)}</p>`:''}${o.actions?`<div class="sact">${o.actions}</div>`:''}</div>`;
const skel=(w,h,r)=>`<i class="skel" style="width:${w||'100%'};height:${h||14}px${r?';border-radius:'+r:''}"></i>`;
const loaderBlock=label=>`<div class="loaderblk" role="status"><span class="spin dark"></span><span>${esc(label||'Loading…')}</span></div>`;
const HTTP_ERR={403:['lock','Forbidden','You don’t have access to this. Ask an owner or admin to grant it from Roles.'],404:['search','Not found','We couldn’t find what you were looking for. It may have been removed, or the link is out of date.'],500:['alert','Internal server error','Something went wrong on our side and we’ve been told. Please try again in a moment.'],503:['timer','Service unavailable','SiteOS is briefly unavailable. Please try again in a few minutes.']};

/* ---------- full-page HTTP error (dismissable, like the shipped banner) ---------- */
function httpError(code,msg){
 const e=HTTP_ERR[code]||['alert','Something went wrong','Please try again later'];
 let r=$('#errRoot');if(!r){r=document.createElement('div');r.id='errRoot';document.body.appendChild(r);}
 r.innerHTML=`<div class="errpage" role="alertdialog" aria-labelledby="errT"><button type="button" class="iconbtn errx" data-do="err-close" aria-label="Dismiss">${ICON('close')}</button><div class="errbody"><span class="errcode">${code||''}</span>${stateBlock({icon:e[0],tone:code===403?'warn':'bad',title:e[1],body:msg||e[2],actions:`<button type="button" class="btn" data-do="err-reload">${ICON('reset')}Reload page</button><button type="button" class="btn btn-ghost" data-do="err-home">Go back to home</button>`}).replace('<b>','<b id="errT">')}</div></div>`;
 r.classList.add('on');
}
DO['err-show']=d=>httpError(+d.code);
DO['err-close']=()=>{const r=$('#errRoot');if(r){r.classList.remove('on');r.innerHTML='';}};
DO['err-reload']=()=>{DO['err-close']();toast('Page reloaded');rerender(true);};
DO['err-home']=()=>{DO['err-close']();go(allowed(VIEWS.dash)?'dash':'me');};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#errRoot.on'))DO['err-close']();});
addEventListener('hashchange',()=>{if($('#errRoot.on'))DO['err-close']();});

/* ---------- Page not found (inside the app shell) ---------- */
VIEWS['not-found']={path:'not-found',nobanner:true,title:'Page not found',sub:'That address doesn’t go anywhere.',crumbs:()=>[['Not found']],
 render(){return `<div class="page"><section class="qv-card">${stateBlock({icon:'search',title:'We couldn’t find that page',body:'The link may be out of date, or the page was removed. Check the address, or jump to something you know.',actions:`<button type="button" class="btn" data-go="${allowed(VIEWS.dash)?'dash':'me'}">${ICON('dash')}Go to dashboard</button><button type="button" class="btn btn-ghost" id="nfSearch" data-do="pal-open">${ICON('search')}Search SiteOS</button>`})}</section></div>`;}};
DO['pal-open']=()=>$('#cmdBtn').click();

/* ---------- first-run empty states for lists (used when a list has no rows at all) ---------- */
const EMPTY_FIRST={
 jobs:['jobs','No jobs yet','Create your first job and crews, shifts and JSAs have somewhere to attach.','New job','jobs/new','add:job'],
 assets:['box','No tools registered','Add the tools you own so you can check them out and keep their test & tag dates.','Add asset','assets/new','add:asset'],
 vehicles:['truck','No vehicles yet','Add a vehicle to track its registration, servicing and who has the keys.','Add vehicle','vehicles/new','add:vehicle'],
 journeys:['route','No journeys yet','When someone plans a long drive it shows up here for approval.','Create trip',null,'add:journey'],
 employees:['users','No employees yet','Add your first employee and they get an invitation to set a password.','Add employee','employees/new','add:employee'],
 customers:['building','No customers yet','Add a customer to link them to jobs and share work with their company.','Add customer','customers/new','add:customer']
};
function firstRunHtml(lid){
 const d=EMPTY_FIRST[lid];if(!d)return '';
 const cta=d[5]&&can(d[5])?(d[4]?`<button type="button" class="btn" data-go="${d[4]}">${ICON('plus')}${esc(d[3])}</button>`:`<button type="button" class="btn" data-do="jrn-new">${ICON('plus')}${esc(d[3])}</button>`):'';
 return stateBlock({icon:d[0],title:d[1],body:d[2],actions:cta,compact:true});
}

/* ---------- offline bar ---------- */
function netBar(on){
 let b=$('#netbar');if(!b){b=document.createElement('div');b.id='netbar';b.setAttribute('role','status');document.body.appendChild(b);}
 b.className=on?'on':'';b.innerHTML=on?`${ICON('alert')}<span><b>You’re offline.</b> Changes can’t be saved until you reconnect. Nothing you typed is lost.</span>`:'';
 document.body.classList.toggle('offline',on);
}
addEventListener('offline',()=>netBar(true));addEventListener('online',()=>{netBar(false);toast('Back online','Everything is syncing again');});

/* ---------- catalogue ---------- */
const ST={retry:'fail'};
const stCard=(t,s,body)=>`<section class="qv-card"><div class="qv-hd"><div class="grow"><h3>${esc(t)}</h3><div class="s">${esc(s)}</div></div></div><div class="qv-body">${body}</div></section>`;
function stSection(){
 if(ST.retry==='loading')return loaderBlock('Loading company…');
 if(ST.retry==='ok')return stateBlock({icon:'checkc',tone:'ok',title:'Loaded',body:'That worked on the second try.',actions:`<button type="button" class="btn btn-ghost btn-sm" data-do="st-reset">Reset demo</button>`,compact:true});
 return stateBlock({icon:'alert',tone:'bad',title:'Unable to load company',body:'We couldn’t reach the server. Check your connection and try again.',actions:`<button type="button" class="btn btn-sm" data-do="st-retry">${ICON('reset')}Try again</button>`,compact:true});
}
DO['st-retry']=()=>{ST.retry='loading';rerender(true);setTimeout(()=>{ST.retry='ok';if(cur()==='states')rerender(true);},1000);};
DO['st-reset']=()=>{ST.retry='fail';rerender(true);};
VIEWS.states={path:'states',nobanner:true,title:'Error and empty states',sub:'Every state the app can show when there is nothing to show, something is loading, or something went wrong.',crumbs:()=>[['States']],
 render(){
  return `<div class="page">
  <div class="g c2">
   ${stCard('First-run empty','A list with no rows yet. One clear action.',stateBlock({icon:'jobs',title:'No jobs yet',body:'Create your first job and crews, shifts and JSAs have somewhere to attach.',actions:`<button type="button" class="btn">${ICON('plus')}New job</button>`,compact:true}))}
   ${stCard('Nothing matches','A search or filter that finds nothing. Offers the way back.',stateBlock({icon:'search',title:'Nothing matches',body:'Try another search or clear the filters.',actions:`<button type="button" class="btn btn-ghost btn-sm">Clear filters</button>`,compact:true}))}
   ${stCard('All clear','A positive empty state. No action needed.',stateBlock({icon:'checkc',tone:'ok',title:'Nothing needs attention',body:'No late shifts, expiring tags or open corrections right now.',compact:true}))}
   ${stCard('No access','The page needs a permission this person doesn’t have.',stateBlock({icon:'lock',tone:'warn',title:'You don’t have access to this page',body:'Your role does not include the permission it needs. Ask an owner or admin to grant it from Roles.',actions:`<button type="button" class="btn btn-ghost btn-sm">Go to dashboard</button>`,compact:true}))}
  </div>
  <div class="g c2">
   ${stCard('Section error','One block fails without taking the page down. Try again works in place.',`<div id="stSec">${stSection()}</div>`)}
   ${stCard('Loading','Page and section loaders, and skeletons for content that has a known shape.',`${loaderBlock('Loading company…')}<div class="skelgrid"><div class="skelrow">${skel('38px',38,'12px')}<div style="flex:1;display:grid;gap:8px">${skel('55%',13)}${skel('35%',11)}</div></div><div class="skelrow">${skel('38px',38,'12px')}<div style="flex:1;display:grid;gap:8px">${skel('62%',13)}${skel('28%',11)}</div></div><div class="skelrow">${skel('38px',38,'12px')}<div style="flex:1;display:grid;gap:8px">${skel('48%',13)}${skel('40%',11)}</div></div></div><button type="button" class="btn busy" disabled style="margin-top:12px">Saving</button>`)}
  </div>
  ${stCard('Full-page errors','The blocking banner for failed requests. It dismisses, reloads or goes home.',`<div class="chkrow">${[403,404,500,503].map(c=>`<button type="button" class="btn btn-ghost" data-do="err-show" data-code="${c}">${c} · ${HTTP_ERR[c][1]}</button>`).join('')}<button type="button" class="btn btn-ghost" data-go="this-page-does-not-exist">Unknown address</button></div>`)}
  ${stCard('Messages','Errors stay until dismissed. Long text truncates and shows in full on hover.',`<div class="chkrow"><button type="button" class="btn btn-ghost" data-do="st-toast-bad">Show an error</button><button type="button" class="btn btn-ghost" data-do="st-toast-ok">Show a success</button><button type="button" class="btn btn-ghost" data-do="st-offline">Show the offline bar</button><button type="button" class="btn btn-ghost" data-do="au-lock">Session expired</button></div><div class="banner bad" role="alert" style="margin-top:14px">${ICON('alert')}<span><b>Inline form error.</b> Sits above the form it belongs to. Fields keep their own message underneath.</span></div>`)}
  </div>`;
 }};
DO['st-toast-bad']=()=>toastErr('Can’t save the shift','The user Priya Nair is already rostered on another job between 06:00 and 14:30 on Tuesday, so this shift would overlap. Remove her from one of them first.');
DO['st-toast-ok']=()=>toast('Saved','Your changes are live');
DO['st-offline']=()=>{netBar(true);setTimeout(()=>netBar(false),4000);};
