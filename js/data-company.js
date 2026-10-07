/* =====================================================================
   Company data: profile and settings as the shipped company form holds them,
   rulesets (items), notification rules, journey settings and the signed-in
   user's journey channels, audit rows and the companies list.
   Loaded after data-fleet.js; re-clones S.
   ===================================================================== */
const COMPANY_FLAT=INIT.company;
Object.assign(INIT.company,{
 id:1,name:'Northline Civil',legalName:'Northline Civil Pty Ltd',abn:'41600123456',phone:'0295550140',email:'office@northline.com.au',website:'northline.com.au',address:'9 Cosgrove Rd, Enfield NSW 2136',
 status:'active',logo:'',timezone:'Australia/Sydney',currency:'AUD',language:'en',startOfWeek:'monday',timeFormat:'24h',dateFormat:'DD/MM/YYYY',lengthFormat:'meter',loginSession:'one_day',
 overhead:18,shiftHours:8,taxRegistered:true,taxName:'GST',taxNumber:'41 600 123 456',kycVerified:true,kycStatus:'verified',onboarding:'completed',
 approvalRequired:true,allowOvertime:true,multiLanguage:false,blockExpiredTT:true,minDaysTT:3,
 rounding:{in:{on:true,mins:15,dir:'down'},out:{on:false,mins:15,dir:'down'}},geofence:true,
 counts:{employees:48,customers:6,jobs:8}
});

/* ---------- rulesets ---------- */
const RULE_TYPES=[['overtime','Regular Overtime'],['weekend_overtime','Weekend Overtime'],['penalty','Penalty']];
const RULE_TYPE_NAME=Object.fromEntries(RULE_TYPES);
const WD=['mon','tue','wed','thu','fri','sat','sun'],WD_NAME={mon:'Mon',tue:'Tue',wed:'Wed',thu:'Thu',fri:'Fri',sat:'Sat',sun:'Sun'};
const daysFor=t=>t==='overtime'?['mon','tue','wed','thu','fri']:t==='weekend_overtime'?['sat','sun']:WD.slice();
INIT.company.rulesets=[
 {id:'rs1',name:'Standard award',description:'Full time and casual staff on the standard award.',status:'active',isDefault:true,emp:39,hr:{on:true,from:'22:00',to:'05:00',mult:'1.25'},
  items:[{id:'ri1',type:'overtime',label:'Overtime tier 1',mult:'1.5',after:'8',days:daysFor('overtime'),holiday:false,prio:1},{id:'ri2',type:'overtime',label:'Overtime tier 2',mult:'2',after:'10',days:daysFor('overtime'),holiday:false,prio:2},{id:'ri3',type:'penalty',label:'Public holiday',mult:'2.5',after:'0',days:WD.slice(),holiday:true,prio:3}]},
 {id:'rs2',name:'Weekend site work',description:'Weekend crews on civil sites.',status:'active',isDefault:false,emp:46,hr:{on:false,from:'',to:'',mult:''},
  items:[{id:'ri4',type:'weekend_overtime',label:'Saturday',mult:'1.5',after:'0',days:['sat'],holiday:false,prio:1},{id:'ri5',type:'weekend_overtime',label:'Sunday',mult:'2',after:'0',days:['sun'],holiday:true,prio:2}]},
 {id:'rs3',name:'Contractors',description:'Flat rate, no overtime.',status:'active',isDefault:false,emp:3,hr:{on:false,from:'',to:'',mult:''},items:[]}
];
const rsSummary=r=>{
 const p=r.items.map(i=>`${i.label} ${i.mult}×${+i.after?' after '+i.after+' h':''}`);
 if(r.hr.on)p.unshift(`${r.hr.from}–${r.hr.to} ${r.hr.mult}×`);
 return p.length?p.join(' · '):'Flat rate, no extra rules';
};

/* ---------- notification rules (one per type) ---------- */
const NOTIF_TYPES=[['employee_doc_expiry','Employee document expiry'],['asset_due','Asset notifications'],['vehicle_due','Vehicle notifications']];
const notifName=t=>(NOTIF_TYPES.find(n=>n[0]===t)||[0,t])[1];
const LEAD=[[1,'1 Month Before'],[2,'2 Months Before']];
INIT.company.notifs=[
 {id:'n1',type:'asset_due',email:true,sms:false,lead:1,users:['alex-morgan','grace-lee'],emails:['stores@northline.com.au'],active:true},
 {id:'n2',type:'vehicle_due',email:true,sms:true,lead:1,users:['alex-morgan'],emails:[],active:true},
 {id:'n3',type:'employee_doc_expiry',email:true,sms:false,lead:2,users:['grace-lee'],emails:[],active:true}
];

/* ---------- journey settings (company) and the signed-in user's channels ---------- */
INIT.company.journey={jmpRequired:true,thresholdMinutes:120,requireApproval:true,restIntervalMinutes:120,pingDistanceM:100,weatherEnabled:true,windKmh:60,heatC:38,coldC:2,fog:true,rainPct:70,rainMm:10,retentionDays:365,digest:true};
const JOURNEY_EVENTS=[
 ['journey_submitted','Plan submitted','A traveller submits a journey plan for approval.'],
 ['journey_approved','Plan approved','Your own plan is approved — sent to you as the traveller.'],
 ['journey_assigned','Trip assigned to me','Someone raises a trip on your behalf.'],
 ['journey_started','Trip started','A traveller sets off.'],
 ['journey_completed','Trip completed','A traveller arrives.'],
 ['journey_checkin','Check-ins','Rest stop, leaving site, and home safe.'],
 ['journey_weather','Weather on the road','New weather hazards or BOM warnings found mid-trip. The traveller is always told.']
];
INIT.journeyPrefs=Object.fromEntries(JOURNEY_EVENTS.map(([k],i)=>[k,{push:true,email:i<3||k==='journey_weather'}]));

/* ---------- audit log ---------- */
const AU_CLASSES=['Employee','Job','Company','Role','Vehicle','Asset','Shift','Customer'];
(()=>{
 const actors=['Alex Morgan','Hamish Reid','Priya Nair','Grace Lee'],rows=[];
 const specs=[
  ['Employee','Updated','hourlyRate','42.00','44.50'],['Employee','Updated','jobTitle','Labourer','Leading hand'],['Employee','Created','','',''],['Employee','Updated','roleId','employee','supervisor'],
  ['Job','Updated','estimatedCost','180000','195000'],['Job','Created','','',''],['Job','Updated','geofenceRadius','100','150'],['Job','Updated','status','active','archived'],
  ['Company','Updated','shiftRegularHours','8','8.5'],['Company','Updated','loginSessionDuration','one_week','one_day'],['Company','Updated','timeRounding.clockIn.enabled','false','true'],
  ['Role','Updated','assignable','false','true'],['Role','Created','','',''],
  ['Vehicle','Updated','status','available','in_use'],['Vehicle','Updated','registrationDue','2026-10-22','2027-10-22'],
  ['Asset','Updated','status','in','out'],['Asset','Updated','testTagDue','2026-09-28','2027-03-28'],
  ['Shift','Created','','',''],['Shift','Updated','users','Liam Carter','Liam Carter, Josh Bennett'],['Customer','Updated','email','accounts@westgate.com.au','ap@westgate.com.au']
 ];
 for(let i=0;i<64;i++){
  const s=specs[(i*7)%specs.length],d=addDays('2026-10-01',-Math.floor(i*1.6));
  rows.push({id:900+i,objectId:String(10000+((i*37)%900)),className:s[0],actor:actors[i%actors.length],event:s[1],prop:s[2],old:s[3],new:s[4],date:d,archive:false});
 }
 for(let i=0;i<10;i++){const s=specs[(i*3)%specs.length];rows.push({id:1100+i,objectId:String(9000+i*11),className:s[0],actor:actors[(i+1)%actors.length],event:s[1],prop:s[2],old:s[3],new:s[4],date:addDays('2026-03-20',-i*3),archive:true});}
 INIT.auditLogs=rows;
})();

/* ---------- companies (platform / owner list) ---------- */
INIT.companies=[
 {id:1,name:'Northline Civil',code:'NLC',owner:'Alex Morgan',status:'active',employees:48,jobs:8,customers:6,created:'2024-02-11',kyc:'verified'},
 {id:2,name:'Northline Plant Hire',code:'NPH',owner:'Alex Morgan',status:'active',employees:12,jobs:3,customers:4,created:'2025-06-03',kyc:'verified'},
 {id:3,name:'Harbour Fabrication',code:'HFB',owner:'Alex Morgan',status:'inactive',employees:0,jobs:0,customers:0,created:'2026-08-19',kyc:'pending'}
];
INIT.currentCompanyId=1;
S=structuredClone(INIT);
