/* =====================================================================
   Extended data, aligned to the real SiteOS product
   - permission keys and groups mirror the portal's `Permission` enum
   - profile fields mirror the employee / customer forms
   Loaded after core.js; re-clones S so Reset demo restores it too.
   ===================================================================== */
const slug=n=>String(n).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

/* ---------- permissions: [key, label, description, tier] ---------- */
const PERM_GROUPS=[
 {key:'access',label:'Roles & Access',icon:'key',desc:'Control roles, role assignment and per-user permission overrides',perms:[
  ['impersonate:user','Impersonate user','Sign in as someone else to help them. SiteOS support staff only.','platform'],
  ['manage:permissions','Manage permissions','Override an individual employee’s permissions.'],
  ['manage:roles','Manage roles','Create, edit and delete company roles.'],
  ['assign:role','Assign role','Change which role an employee holds.']]},
 {key:'dashboard',label:'Dashboard',icon:'dash',desc:'Control access to the main dashboard',perms:[
  ['view:dashboard','View dashboard','See company totals, charts and the live map.']]},
 {key:'company',label:'Company',icon:'company',desc:'Control company and settings access',perms:[
  ['edit:company','Edit company','Change company details, branding and regional settings.'],
  ['view:company','View company','Open My Company and read its settings.'],
  ['manage:company:settings','Manage company settings','Allows changing critical company configuration.'],
  ['view:audit:logs','View audit logs','Read the activity history on every record.']]},
 {key:'employees',label:'Employees',icon:'users',desc:'Control who can view, add and manage employees',perms:[
  ['view:employee:data','View employees','See profiles, contacts and documents.'],
  ['add:employee','Add employee','Create employees and send invites.'],
  ['edit:employee:data','Edit employee data','Change profiles, documents and set passwords.'],
  ['archive:employee','Archive employees','Archive and restore employees.'],
  ['view:employee:financials','View employee financials','Hourly and cost rates, payslips, labour cost and company overhead.','owner']]},
 {key:'customers',label:'Customers',icon:'building',desc:'Control who can view, add and manage customers',perms:[
  ['view:customer','View customers','See customers and their details.'],
  ['add:customer','Add customer','Create a customer and email their invite.'],
  ['edit:customer','Edit customer','Change customer details.'],
  ['archive:customer','Archive customers','Archive and reactivate customers.']]},
 {key:'jobs',label:'Jobs',icon:'jobs',desc:'Control who can create, edit and view jobs',perms:[
  ['add:job','Add job','Create a new job.'],
  ['edit:job','Edit job','Change job details, supervisors and geofence.'],
  ['delete:job','Delete job','Delete or archive a job.'],
  ['view:job','View job','See jobs, sites and crews.'],
  ['view:job:financials','View job financials','Sell price, cost summaries and every labour cost figure.','owner']]},
 {key:'scheduler',label:'Scheduler',icon:'cal',desc:'Control who can view and manage the schedule and shifts',perms:[
  ['view:schedule','View schedule','See the whole roster, not just your own shifts.'],
  ['edit:schedule','Edit schedule','Publish, copy and clear weeks.'],
  ['create:shift','Create shift','Add shifts and group shifts.'],
  ['edit:shift','Edit shift','Change, move and reassign shifts.'],
  ['delete:shift','Delete shift','Remove shifts from the roster.']]},
 {key:'assets',label:'Assets',icon:'box',desc:'Control the tool and equipment register and who can check items out',perms:[
  ['view:asset','View assets','See the tools register.'],
  ['add:asset','Add asset','Add and import assets.'],
  ['edit:asset','Edit asset','Change asset details and test and tag dates.'],
  ['delete:asset','Delete asset','Remove assets from the register.'],
  ['assign:asset','Check out / return assets','Check out, transfer and return tools without editing the register.']]},
 {key:'vehicles',label:'Vehicles',icon:'truck',desc:'Control the vehicle register, check outs, inspections and incident reports',perms:[
  ['view:vehicle','View vehicles','See the fleet and its inspections.'],
  ['add:vehicle','Add vehicle','Add a vehicle to the fleet.'],
  ['edit:vehicle','Edit vehicle','Change vehicle details and service records.'],
  ['delete:vehicle','Delete vehicle','Remove a vehicle.'],
  ['assign:vehicle','Check out / return vehicles','Hand vehicles out and take them back.'],
  ['inspect:vehicle','Perform vehicle inspections','The driver walkaround and incident reports.'],
  ['view:incident','View incident reports','See every incident report, not only your own.'],
  ['review:incident','Review incident reports','Mark a report reviewed or re-open it.']]},
 {key:'time',label:'Time Clock',icon:'clock',desc:'Control clock in / out and access to time entries',perms:[
  ['clock:in','Clock in','Start a shift from the app or kiosk.'],
  ['clock:out','Clock out','End a shift.'],
  ['view:time:entries','View time entries','See everyone’s clock-ins and timesheets.'],
  ['edit:time:entries','Edit time entries','Approve, reject and correct time entries.']]},
 {key:'journeys',label:'Journeys',icon:'route',desc:'Control the whole-company journey register and acting on someone else’s journey. Every employee can already manage their own.',perms:[
  ['view:journey','View journeys','See every journey in the company.'],
  ['add:journey','Raise journeys for others','Create trips for other people.'],
  ['edit:journey','Manage journeys','Approve, change and cancel anyone’s trip.'],
  ['delete:journey','Delete journey','Delete draft trips.']]},
 {key:'jsa',label:'JSA (Job Safety Analysis)',icon:'shield',desc:'Control who builds and sends each job’s daily JSA. The rostered crew can always fill it in, and the named approver can always review it.',perms:[
  ['view:jsa','View JSAs','See every JSA across the company.'],
  ['edit:jsa','Build, send & review JSAs','Build templates, send JSAs and approve on someone’s behalf.']]}
];
const PERM_FLAT=PERM_GROUPS.flatMap(g=>g.perms.map(p=>({k:p[0],l:p[1],d:p[2],tier:p[3]||'',g:g.key})));
const PERM_BY=Object.fromEntries(PERM_FLAT.map(p=>[p.k,p]));
const PERM_ALL=PERM_FLAT.filter(p=>p.tier!=='platform').map(p=>p.k);

const R_ADMIN=['assign:role','manage:permissions','view:dashboard','view:company','edit:company','view:audit:logs','view:employee:data','add:employee','edit:employee:data','archive:employee','view:customer','add:customer','edit:customer','archive:customer','view:job','add:job','edit:job','delete:job','view:schedule','edit:schedule','create:shift','edit:shift','delete:shift','view:asset','add:asset','edit:asset','assign:asset','view:vehicle','add:vehicle','edit:vehicle','assign:vehicle','inspect:vehicle','view:incident','review:incident','view:time:entries','edit:time:entries','clock:in','clock:out','view:journey','add:journey','edit:journey','view:jsa','edit:jsa'];
const R_SUPER=['view:dashboard','view:employee:data','view:customer','view:job','view:schedule','edit:schedule','create:shift','edit:shift','delete:shift','view:asset','assign:asset','view:vehicle','assign:vehicle','inspect:vehicle','view:incident','view:time:entries','edit:time:entries','clock:in','clock:out','view:journey','add:journey','edit:journey','view:jsa','edit:jsa'];
const R_EMP=['clock:in','clock:out','inspect:vehicle','view:vehicle','view:asset','view:journey'];
const R_PAY=['view:dashboard','view:employee:data','view:time:entries','edit:time:entries','view:job','view:schedule','view:employee:financials'];

/* roles: perms is the grant list. count = people holding it (sample list is only the first page). */
INIT.rbac={roles:[
 {id:'admin',name:'Admin',desc:'Runs day-to-day operations across every job. No financial visibility unless the owner grants it.',sys:true,assignable:false,count:2,perms:R_ADMIN},
 {id:'supervisor',name:'Supervisor',desc:'Leads crews on site: roster, time approvals, JSAs and fleet hand-out for their jobs.',sys:false,assignable:true,count:6,perms:R_SUPER},
 {id:'payroll',name:'Payroll officer',desc:'Approves time and reads pay rates. No access to jobs, fleet or settings.',sys:false,assignable:false,count:1,perms:R_PAY},
 {id:'employee',name:'Employee',desc:'Clocks in, fills JSAs, sees their own shifts and checks out tools and vehicles.',sys:true,assignable:true,count:37,perms:R_EMP}
]};

/* Owner and Superuser are ACCOUNT TYPES, not roles. Both implicitly hold every permission (the API stamps them into the token).
   Only the owner can create a superuser, change an account type, or grant the owner-only financial permissions. */
const ACCT={OWNER:'Owner',SUPERUSER:'Superuser',EMPLOYEE:'Employee'};
const ACCT_OF={'alex-morgan':'OWNER','grace-lee':'SUPERUSER'};
/* personas for the View as switcher */
const PERSONAS={
 owner:{name:'Alex Morgan',role:'Owner',acct:'OWNER',bypass:true},
 superuser:{name:'Grace Lee',role:'Superuser',acct:'SUPERUSER',bypass:true},
 admin:{name:'Hamish Reid',role:'Admin',acct:'EMPLOYEE',roleId:'admin'},
 supervisor:{name:'Priya Nair',role:'Supervisor',acct:'EMPLOYEE',roleId:'supervisor'},
 employee:{name:'Tom Hughes',role:'Employee',acct:'EMPLOYEE',roleId:'employee'}
};

/* ---------- employees: add the two admins, then enrich every row ---------- */
INIT.employees.unshift(
 {name:'Alex Morgan',email:'alex.morgan@northline.com.au',phone:'0411 555 002',role:'Company owner',type:'Full time',hrs:30,docs:'4 on file',st:'active'},
 {name:'Hamish Reid',email:'hamish.reid@northline.com.au',phone:'0409 555 140',role:'Operations manager',type:'Full time',hrs:40,docs:'5 on file',st:'active'});
/* [roleId, started, hourly, cost, address, nextOfKin[name,rel,phone], emergency[name,phone]|null, scheduler, basis] */
const EMP_X={
 'alex-morgan':[null,'4 Mar 2014',null,null,'12 Marine Pde, Manly NSW 2095',['Jo Morgan','Spouse','0411 555 903'],null,false,'Full time salaried'],
 'hamish-reid':['admin','19 Jan 2019',58,74,'88 Burns Bay Rd, Lane Cove NSW 2066',['Nina Reid','Spouse','0409 555 877'],['Colin Reid','0402 555 310'],false,'Full time salaried'],
 'liam-carter':['supervisor','2 Feb 2021',54,69,'21 Pine St, Blacktown NSW 2148',['Ruth Carter','Mother','0412 555 600'],['Ruth Carter','0412 555 600'],true,'Full time'],
 'priya-nair':['supervisor','11 Jun 2020',56,71,'7 Orchard Ln, Wollongong NSW 2500',['Arjun Nair','Spouse','0413 555 118'],null,true,'Full time'],
 'josh-bennett':['supervisor','30 Aug 2022',51,65,'5 Mill Rd, Liverpool NSW 2170',['Kate Bennett','Partner','0421 555 009'],['Kate Bennett','0421 555 009'],true,'Full time'],
 'mei-tanaka':['employee','3 May 2023',72,72,'33 Hay St, Orange NSW 2800',['Ken Tanaka','Father','0432 555 200'],null,true,'Contractor'],
 'daniel-okafor':['supervisor','14 Nov 2021',49,62,'60 Victoria Rd, Parramatta NSW 2150',['Ada Okafor','Spouse','0400 555 330'],null,true,'Full time'],
 'sophie-grant':['employee','1 Mar 2024',42,48,'9 Elm Ct, Penrith NSW 2750',['Dale Grant','Brother','0438 555 450'],['Dale Grant','0438 555 450'],true,'Casual'],
 'aisha-rahman':['employee','20 Jul 2023',44,50,'18 Park Ave, Merrylands NSW 2160',['Yusuf Rahman','Father','0410 555 770'],null,true,'Casual'],
 'tom-hughes':['employee','6 Jan 2025',31,36,'3 Ross St, Campbelltown NSW 2560',['Ellen Hughes','Mother','0466 555 120'],['Ellen Hughes','0466 555 120'],true,'Apprentice'],
 'grace-lee':[null,'22 Apr 2022',60,76,'41 Lang Rd, Ryde NSW 2112',['Sam Lee','Spouse','0455 555 640'],null,true,'Full time'],
 'noah-williams':['employee','','',null,'','',null,true,'Casual'],
 'chloe-martin':['employee','','',null,'','',null,true,'Casual'],
 'ben-foster':['employee','8 Sep 2020',50,63,'12 Wood St, Richmond NSW 2753',['Lucy Foster','Spouse','0402 555 100'],null,true,'Full time']
};
INIT.employees.forEach((e,i)=>{
 const x=EMP_X[slug(e.name)]||['employee','','',null,'',['','',''],null,true,e.type];
 const parts=e.name.split(' ');
 Object.assign(e,{id:slug(e.name),first:parts[0],last:parts.slice(1).join(' '),roleId:x[0],acct:ACCT_OF[slug(e.name)]||'EMPLOYEE',started:x[1],hourly:x[2]===''?null:x[2],cost:x[3],address:x[4],
  nok:x[5]||['','',''],emerg:x[6],inSched:x[7],basis:x[8],username:e.email.split('@')[0],verified:e.st!=='invited',mfa:e.st==='active'&&i%3!==2,rules:'Standard Overtime'});
});

/* documents: [name, type, expiryLabel, daysLeft, visibility] */
const docT=(title)=>{
 const t=title.toLowerCase();
 if(t.includes('plant'))return [['High risk licence','Licence','12 Dec 2026',72]];
 if(t.includes('electric'))return [['Electrical licence','Licence','30 Jun 2027',272]];
 if(t.includes('traffic'))return [['Traffic controller ticket','Ticket','4 Feb 2027',126]];
 if(t.includes('supervisor')||t.includes('leading'))return [['Working at heights','Ticket','9 Aug 2027',311],['First aid certificate','Certificate','17 Mar 2027',167]];
 return [];
};
INIT.employees.forEach((e,i)=>{
 const docs=[['Employment contract','Contract','No expiry',null,'owner+admin'],...docT(e.role).map(d=>[...d,'everyone']),['White card','Ticket',e.name==='Sophie Grant'?'24 Oct 2026':'8 May 2028',e.name==='Sophie Grant'?23:949,'everyone']];
 if(e.name==='Josh Bennett')docs[1]=['High risk licence','Licence','19 Oct 2026',18,'everyone'];
 if(e.st==='invited')docs.length=0;
 e.docList=docs.map((d,k)=>({id:e.id+'-d'+k,name:d[0],type:d[1],exp:d[2],days:d[3],vis:d[4]||'everyone',added:'12 Feb 2026',by:'Hamish Reid'}));
 e.notes=i%3===1?[{id:e.id+'-n1',by:'Hamish Reid',when:'18 Sep 2026',text:'Asked to move to the earlier start on Westgate. Agreed, from Monday.',vis:'owner+admin'}]:[];
});
INIT.employees.find(e=>e.name==='Liam Carter').docList.push({id:'liam-d-exp',name:'Forklift licence',type:'Licence',exp:'19 Sep 2026',days:-12,vis:'everyone',added:'3 Mar 2024',by:'Hamish Reid'});
INIT.employees.find(e=>e.name==='Liam Carter').notes.push({id:'liam-n2',by:'Alex Morgan',when:'2 Sep 2026',text:'Put forward for the leading hand pay step at the next review.',vis:'owner+admin'});
INIT.employees.find(e=>e.name==='Sophie Grant').notes.push({id:'sophie-n2',by:'Priya Nair',when:'30 Sep 2026',text:'Worked past midnight on the pump test. Check the clock-out and fatigue rule.',vis:'everyone'});

/* ---------- customers: enrich ---------- */
const CUST_X={
 'sydney-water':['Rachel','Kim','Level 6, 1 Smith St, Parramatta NSW 2150',['Marcus Hale','Site liaison','02 9555 4122','m.hale@sydneywater.example']],
 'transport-for-nsw':['Mark','Ellis','231 Elizabeth St, Sydney NSW 2000',['Dee Wong','Contract admin','02 9555 8831','d.wong@transport.example']],
 'essential-energy':['Hannah','Scott','51 Rankin St, Orange NSW 2800',[]],
 'city-of-parramatta':['James','O’Neill','126 Church St, Parramatta NSW 2150',[]],
 'westgate-logistics':['Sam','Patel','14 Westgate Rd, Wetherill Park NSW 2164',[]],
 'dubbo-regional-council':['Olivia','Brown','63 Darling St, Dubbo NSW 2830',[]],
 'kiama-municipal-council':['Ella','Turner','11 Manning St, Kiama NSW 2533',[]]
};
INIT.customers.forEach(c=>{
 const x=CUST_X[slug(c.name)];
 Object.assign(c,{id:slug(c.name),first:x[0],last:x[1],address:x[2],others:x[3].length?[{name:x[3][0],title:x[3][1],phone:x[3][2],email:x[3][3]}]:[],
  collab:c.st==='active'?{state:c.jobs>1?'accepted':(c.name==='Westgate Logistics'?'pending':'accepted')}:{state:'none'},since:'2024'});
});


/* ---------- jobs: fields the shipped job form and detail page carry ---------- */
const JOBST={active:['ok','Active'],planned:['info','Planned'],hold:['warn','On hold'],done:['neutral','Completed'],archived:['neutral','Archived']};
const JSA_TPLS=['Default (Daily JSA)','Excavation and trenching','Working at heights','Confined space entry','Traffic management'];
/* code -> [external no., description, status, lat, lng, qualified people, customer ids, JSA send time ('' = off)] */
const JOB_X={
 'JOB-1042':['WL-2041','Hardstand upgrade, drainage and a new vehicle wash bay at the Wetherill Park depot.','active',-33.8493,150.9054,['Liam Carter','Tom Hughes','Mei Tanaka','Aisha Rahman'],['westgate-logistics'],'06:00'],
 'JOB-1039':['SW-8812','Reservoir roof refurbishment and confined-space inspection.','active',-34.4278,150.8931,['Priya Nair','Grace Lee'],['sydney-water'],'06:30'],
 'JOB-1036':['TfNSW-M4-17','Cross-drainage renewal along the M4 eastbound shoulder.','active',-33.8157,150.8622,['Josh Bennett','Aisha Rahman','Daniel Okafor','Sophie Grant'],['transport-for-nsw'],'07:00'],
 'JOB-1031':['CP-3390','New timber footbridge over the Parramatta River at Rydalmere.','planned',-33.8142,151.0287,['Daniel Okafor'],['city-of-parramatta'],'08:00'],
 'JOB-1028':['EE-7730','Switchgear and protection fit-out for the 66 kV substation.','active',-33.2840,149.1010,['Mei Tanaka'],['essential-energy'],'05:30'],
 'JOB-1025':['DRC-551','Pump replacement. Paused until the council signs off the bypass plan.','hold',-32.2569,148.6011,['Priya Nair','Liam Carter'],['dubbo-regional-council'],''],
 'JOB-1021':['TfNSW-CP-04','Reseal and line marking, Queen St car park.','active',-34.0650,150.8140,['Josh Bennett'],['transport-for-nsw'],'07:00'],
 'JOB-1002':['','Internal yard upkeep and plant checks.','active',-33.8890,151.1280,['Sophie Grant'],[],'06:00'],
 'JOB-1017':['KMC-210','Seawall repair and re-rendering, Terralong St.','archived',-34.6710,150.8540,['Liam Carter'],['kiama-municipal-council'],''],
 'JOB-1012':['','Depot perimeter fence replacement.','archived',-33.7510,150.6940,['Josh Bennett'],[],''],
 'JOB-1009':['TfNSW-BC-09','Culvert renewal on the Mitchell Hwy.','archived',-33.4190,149.5770,['Priya Nair'],['transport-for-nsw'],'']
};
INIT.jobs.forEach(j=>{
 const x=JOB_X[j.code]||['','','active',-33.87,151.21,[],[],''];
 Object.assign(j,{id:j.code.toLowerCase(),num:x[0],desc:x[1],status:x[2],lat:x[3],lng:x[4],qual:x[5],custIds:x[6],jsaTime:x[7],jsaOn:!!x[7],jsaTpl:JSA_TPLS[0],
  cname:Object.keys(JC).find(k=>JC[k]===j.c)||'slate',spent:j.est?Math.round(j.est*(j.pct||0)/100):null,docs:[],groups:[]});
 if(j.arch)j.status='archived';
});
INIT.jobs.find(j=>j.code==='JOB-1042').docs.push({id:'jd1',name:'Site induction pack',files:4,added:'12 Aug 2026',by:'Hamish Reid'});
INIT.jobs.find(j=>j.code==='JOB-1039').docs.push({id:'jd2',name:'Confined space entry permit',files:1,added:'3 Aug 2026',by:'Priya Nair'});
/* jobs other companies have shared with this one (Shared with me tab) */
INIT.sharedJobs=[
 {id:'sh1',name:'Hartley Retaining Wall',by:'Hartley Civil Pty Ltd',addr:'18 Creek Rd, Castle Hill NSW',role:'Project manager',state:'pending',date:'29 Sep 2026'},
 {id:'sh2',name:'Ridgeview Stage 2 Drainage',by:'Ridgeview Developments',addr:'8 Ridge Rd, Castle Hill NSW',role:'Site supervisor',state:'accepted',date:'14 Sep 2026'}
];

INIT.customers.forEach((c,i)=>{if(!/^04/.test(c.phone))c.phone='04'+(12+i)+' 555 '+(100+i*37);});

/* ---------- reapply: S is cloned before this file loaded ---------- */
S=structuredClone(INIT);

/* ---------- access helpers ---------- */
let ME=null;
function setPersona(k){const p=PERSONAS[k];ME=Object.assign({key:k},p);}
setPersona('owner');
const rolePerms=()=>{const r=S.rbac.roles.find(r=>r.id===ME.roleId);return new Set(r?r.perms:[]);};
const isOwnerAcct=()=>ME.acct==='OWNER';
const holdsAll=e=>e.acct==='OWNER'||e.acct==='SUPERUSER';
const acctPill=e=>e.acct==='OWNER'?pill('info','Owner'):e.acct==='SUPERUSER'?pill('warn','Superuser'):pill('neutral',roleName(e.roleId));
const can=p=>{if(!p||ME.bypass)return true;const s=rolePerms();return Array.isArray(p)?p.some(x=>s.has(x)):s.has(p);};
const roleName=id=>(S.rbac.roles.find(r=>r.id===id)||{name:'No role'}).name;
const empBy=id=>S.employees.find(e=>e.id===id);
const custBy=id=>S.customers.find(c=>c.id===id);
const jobBy=id=>S.jobs.find(j=>j.id===id);
