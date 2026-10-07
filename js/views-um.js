/* =====================================================================
   User management: ONE nav item with Employees / Customers / Roles tabs,
   the same structure as the shipped portal (/user-management/:tab).
   The three original pages become tab bodies; detail pages hang under it.
   ===================================================================== */
const UMT={employees:VIEWS.employees,customers:VIEWS.customers,roles:VIEWS.roles};
delete VIEWS.employees;delete VIEWS.customers;delete VIEWS.roles;

const UM_TABS=[['employees','Employees','view:employee:data',()=>S.employees.filter(e=>e.st==='active').length],
               ['customers','Customers','view:customer',()=>S.customers.filter(c=>c.st==='active').length],
               ['roles','Roles','manage:roles',()=>S.rbac.roles.length]];
const umAllowed=()=>UM_TABS.filter(t=>can(t[2]));
const umTab=()=>{const a=umAllowed();return a.find(t=>t[0]===P.tab)?P.tab:(a[0]||[])[0];};
const umView=()=>UMT[umTab()];
const umTabs=()=>`<div class="tabs ptabs" role="tablist" aria-label="User management sections">${umAllowed().map(t=>`<a role="tab" href="#/user-management/${t[0]}" class="tab${umTab()===t[0]?' on':''}" aria-selected="${umTab()===t[0]}">${t[1]}<span class="tc num">${t[3]()}</span></a>`).join('')}</div>`;

const UMV={title:'User management',grp:'main',icon:'users',label:'User management',
 perm:['view:employee:data','view:customer','manage:roles'],
 sub:()=>{const v=umView();return v?v.sub:'';},
 act:()=>{const v=umView();return v&&v.act?v.act():'';},
 render(){
  const v=umView(),body=v.render().replace(/^\s*<div class="page">/,'').replace(/<\/div>\s*$/,'');
  return `<div class="page">${umTabs()}${body}</div>`;
 },
 mount(root){const v=umView();if(v&&v.mount)v.mount(root);}};
VIEWS.um=Object.assign({},UMV,{path:'user-management'});
VIEWS['um-tab']=Object.assign({},UMV,{path:'user-management/:tab',parent:'um'});

/* shared crumbs for the pages that hang under a tab */
const umCrumbs=(tab,label,leaf)=>[['User management','user-management/'+tab],[label,'user-management/'+tab],...(leaf?[[leaf]]:[])];

/* who sees which sidebar item (mirrors the real portal's gates; Scheduler, Time Clock, JSAs, Vehicles, Journeys are open to everyone and scope their own data) */
VIEWS.dash.perm='view:dashboard';VIEWS.company.perm='view:company';VIEWS.jobs.perm='view:job';VIEWS.assets.perm='view:asset';
