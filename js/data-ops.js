/* =====================================================================
   Operations data: shifts with real dates, unavailability, time requests,
   JSA templates and answers. Loaded after kit-extra.js; re-clones S.
   ===================================================================== */
const TODAY_ISO='2026-10-01';                 // Thursday
const WEEK0='2026-09-28';                      // Monday of the sample week
const addDays=(s,n)=>{const d=new Date(s+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
const mondayOf=s=>{const d=new Date(s+'T00:00:00Z'),w=(d.getUTCDay()+6)%7;return addDays(s,-w);};
const DOW=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const dparts=s=>{const d=new Date(s+'T00:00:00Z');return {dow:DOW[(d.getUTCDay()+6)%7],d:d.getUTCDate(),m:MON[d.getUTCMonth()],y:d.getUTCFullYear()};};
const fmtD=s=>{const p=dparts(s);return p.dow+' '+p.d+' '+p.m;};
const fmtDL=s=>{const p=dparts(s);return p.dow+' '+p.d+' '+p.m+' '+p.y;};
const hhmm=m=>{const h=Math.floor(m/60),mm=Math.round(m%60);return (h%24)+':'+String(mm).padStart(2,'0');};
const t12=t=>{const[h,m]=t.split(':').map(Number),ap=h>=12?'p':'a',h12=h%12||12;return h12+(m?':'+String(m).padStart(2,'0'):'')+ap;};
const shiftHrs=s=>{const a=s.start.split(':'),b=s.end.split(':');return Math.max((b[0]*60+ +b[1]-a[0]*60-a[1])/60,0);};

/* ---------- shifts (built from the design's sample week) ---------- */
let SHN=0;const sid=()=>'sh'+(++SHN);
INIT.shifts=[];
(()=>{
 const seen={};
 INIT.sched.forEach(p=>p.days.forEach((day,di)=>day.forEach(s=>{
  const date=addDays(WEEK0,di),draft=!!s[3];
  if(p.open){INIT.shifts.push({id:sid(),date,start:s[0],end:s[1],job:s[2],users:[],title:'',draft,claim:di===3,cancelled:false});return;}
  const key=[date,s[0],s[1],s[2],draft].join('|');
  if(seen[key]){seen[key].users.push(p.name);}
  else{const o={id:sid(),date,start:s[0],end:s[1],job:s[2],users:[p.name],title:'',draft,claim:false,cancelled:false};seen[key]=o;INIT.shifts.push(o);}
 })));
 /* last week: the same pattern, all published (so "Copy previous week" has something to copy into next week) */
 const base=INIT.shifts.filter(s=>!s.draft&&s.users.length);
 base.forEach(s=>INIT.shifts.push({...s,id:sid(),date:addDays(s.date,-7),users:s.users.slice(),draft:false,claim:false}));
 INIT.shifts.find(s=>s.date===addDays(WEEK0,4)&&s.users.includes('Josh Bennett')).cancelled=true;
})();
INIT.unavail=[
 {id:'ua1',user:'Sophie Grant',from:addDays(WEEK0,4),to:addDays(WEEK0,4),allDay:true,reason:'Annual leave',kind:'timeoff'},
 {id:'ua2',user:'Aisha Rahman',from:addDays(WEEK0,3),to:addDays(WEEK0,3),allDay:false,start:'06:45',end:'10:00',reason:'Medical appointment',kind:'unavail'},
 {id:'ua3',user:'Tom Hughes',from:addDays(WEEK0,5),to:addDays(WEEK0,6),allDay:true,reason:'TAFE block',kind:'unavail'}
];
INIT.shiftTpls=[
 {id:'t1',name:'Day shift',start:'07:00',end:'15:30'},{id:'t2',name:'Early start',start:'05:30',end:'14:00'},{id:'t3',name:'Half day',start:'06:00',end:'12:00'}
];

/* ---------- time requests (correction / add shift / remove shift) ---------- */
INIT.requests=[
 {id:'rq1',user:'Priya Nair',type:'correction',date:addDays(WEEK0,1),job:'Harbour St Reservoir',old:{in:'06:30',out:'15:00',job:'Harbour St Reservoir'},req:{in:'06:30',out:'16:10',job:'Harbour St Reservoir'},reason:'Stayed back to finish the roof inspection sign-off. Forgot to clock out at the gate.',status:'pending',created:'Tue 29 Sep, 07:12'},
 {id:'rq2',user:'Josh Bennett',type:'correction',date:addDays(WEEK0,2),job:'M4 Drainage Package',old:{in:'07:20',out:'15:30',job:'M4 Drainage Package'},req:{in:'07:00',out:'15:30',job:'M4 Drainage Package'},reason:'Phone had no signal at the site gate, clocked in 20 minutes late.',status:'pending',created:'Wed 30 Sep, 06:41'},
 {id:'rq3',user:'Mei Tanaka',type:'add_shift',date:addDays(WEEK0,2),job:'Orange Substation Fit-out',old:null,req:{in:'05:30',out:'15:05',job:'Orange Substation Fit-out'},reason:'Worked the call-out after the fault. Not on the roster.',status:'pending',created:'Wed 30 Sep, 16:02'},
 {id:'rq4',user:'Daniel Okafor',type:'correction',date:addDays(WEEK0,2),job:'Riverside Footbridge',old:{in:'08:00',out:'16:00',job:'Yard maintenance'},req:{in:'08:00',out:'16:00',job:'Riverside Footbridge'},reason:'Clocked in under the wrong job.',status:'approved',created:'Mon 28 Sep, 16:30',reviewedBy:'Priya Nair',reviewNote:'Fine.'},
 {id:'rq5',user:'Grace Lee',type:'remove_shift',date:addDays(WEEK0,1),job:'Harbour St Reservoir',old:{in:'07:30',out:'12:00',job:'Harbour St Reservoir'},req:null,reason:'Duplicate entry from the kiosk.',status:'declined',created:'Tue 29 Sep, 09:05',reviewedBy:'Hamish Reid',reviewNote:'The kiosk log shows you were on site for this one.'},
 {id:'rq6',user:'Aisha Rahman',type:'correction',date:addDays(WEEK0,2),job:'M4 Drainage Package',old:{in:'06:58',out:'15:15',job:'M4 Drainage Package'},req:{in:'06:45',out:'15:15',job:'M4 Drainage Package'},reason:'Arrived on time, app was slow to load.',status:'approved',created:'Mon 28 Sep, 15:40',reviewedBy:'Hamish Reid',reviewNote:''},
 {id:'rq7',user:'Tom Hughes',type:'correction',date:addDays(WEEK0,2),job:'Westgate Depot Upgrade',old:{in:'06:55',out:'15:31',job:'Westgate Depot Upgrade'},req:{in:'06:55',out:'15:00',job:'Westgate Depot Upgrade'},reason:'Left early for TAFE.',status:'withdrawn',created:'Wed 30 Sep, 15:40'}
];

/* ---------- JSA templates: 15 question types as in the shipped builder ---------- */
const JSA_TYPES=[
 ['yesno','Yes / No','Two big buttons'],['yesnona','Yes / No / N/A','With a not-applicable option'],['checklist','Checkbox list','Tick several from a list'],
 ['short','Short text','One line'],['long','Long text','Several lines'],['checkbox','Checkbox','A single confirmation'],
 ['task','Task','A hazard, its controls and a risk rating'],['signatures','Signatures','Crew sign on a screen'],['person','Person','Pick someone from the crew'],
 ['dropdown','Dropdown','Pick one from a list'],['date','Date',''],['phone','Phone number',''],['address','Address',''],['photos','Photos','Take or attach photos'],['heading','Section heading','Groups the questions under it']
];
const RISK=[['extreme','Extreme','var(--bad)'],['high','High','var(--bad-dot)'],['medium','Medium','var(--warn-dot)'],['low','Low','var(--ok)'],['bau','BAU','var(--text-faint)']];
let FID=0;const fid=()=>'f'+(++FID);
const F=(type,label,o)=>Object.assign({id:fid(),type,label,req:false},o||{});
INIT.jsaTpls=[
 {id:'tpl-default',name:'Default (Daily JSA)',def:true,jobs:[],approver:'Hamish Reid',fields:[
  F('heading','Before you start'),F('yesno','Are you fit for work today?',{req:true}),F('yesnona','Have you read the site induction?',{req:true}),F('checklist','PPE worn',{req:true,opts:['Hard hat','Hi-vis','Safety boots','Gloves','Eye protection','Hearing protection']}),
  F('heading','Today’s work'),F('long','What work is being done today?',{req:true}),F('task','Main hazard on site today',{req:true}),F('photos','Photo of the work area'),
  F('heading','Sign on'),F('signatures','Crew sign-on',{req:true})]},
 {id:'tpl-excav',name:'Excavation and trenching',def:false,jobs:['M4 Drainage Package'],approver:'Priya Nair',fields:[
  F('heading','Services and ground'),F('yesno','Dial Before You Dig plans checked?',{req:true}),F('yesnona','Services located and marked?',{req:true}),F('task','Trench collapse',{req:true}),F('dropdown','Shoring type',{req:true,opts:['Trench box','Battering','Sheet piling','None needed']}),F('photos','Photo of the trench before entry',{req:true}),
  F('heading','Sign on'),F('signatures','Crew sign-on',{req:true})]},
 {id:'tpl-heights',name:'Working at heights',def:false,jobs:['Westgate Depot Upgrade'],approver:'Hamish Reid',fields:[
  F('heading','Access'),F('dropdown','Access method',{req:true,opts:['EWP','Scaffold','Ladder','Roof anchor']}),F('yesno','Harness inspected today?',{req:true}),F('yesno','Rescue plan briefed?',{req:true}),F('task','Fall from height',{req:true}),F('person','Spotter'),F('signatures','Crew sign-on',{req:true})]},
 {id:'tpl-confined',name:'Confined space entry',def:false,jobs:['Harbour St Reservoir'],approver:'Grace Lee',fields:[
  F('heading','Permit'),F('yesno','Entry permit issued?',{req:true}),F('yesno','Atmosphere tested (4-gas)?',{req:true}),F('short','Gas reading at entry'),F('task','Toxic atmosphere',{req:true}),F('person','Standby person',{req:true}),F('photos','Photo of the permit board'),F('signatures','Entrants sign-on',{req:true})]},
 {id:'tpl-traffic',name:'Traffic management',def:false,jobs:[],approver:'Hamish Reid',fields:[
  F('heading','Set-up'),F('yesno','Traffic guidance scheme in place?',{req:true}),F('checkbox','Signs and cones checked'),F('task','Vehicle strike',{req:true}),F('phone','Site emergency contact'),F('address','Site address'),F('signatures','Traffic controllers sign-on',{req:true})]}
];
INIT.jsas.push({tpl:'Daily pre-start',id:'JSA-3319',job:'Westgate Depot Upgrade',resp:['Tom Hughes','Liam Carter'],shift:'Today 07:00',ans:0,q:9,haz:0,photos:0,st:'sent'});
INIT.jsas.push({tpl:'Traffic management',id:'JSA-3320',job:'M4 Drainage Package',resp:['Aisha Rahman'],shift:'Tomorrow 06:45',ans:0,q:5,haz:0,photos:0,st:'draft'});
INIT.jsas.forEach((j,i)=>{
 const tpl=INIT.jsaTpls.find(t=>j.tpl.toLowerCase().includes(t.name.split(' ')[0].toLowerCase()))||INIT.jsaTpls[0];
 {const nq=tpl.fields.filter(f=>f.type!=='heading').length;j.ans=j.q?Math.round(j.ans/j.q*nq):0;j.q=nq;}
 j.tplId=tpl.id;j.approver=['Alex Morgan','Hamish Reid','Priya Nair','Grace Lee'][i%4];j.crew=j.resp.slice();
 if(j.st==='await'&&i<2)j.approver='Alex Morgan';
});
INIT.jsas.find(j=>j.id==='JSA-3313').declinedNote=null;
/* a declined one, so the "sent back" path has data */
INIT.jsas.push({tpl:'Daily pre-start',id:'JSA-3309',job:'Yard maintenance',resp:['Sophie Grant'],shift:'Yesterday 06:00',ans:7,q:7,haz:1,photos:1,st:'declined',tplId:'tpl-default',approver:'Hamish Reid',crew:['Sophie Grant'],declinedNote:'The photo is of the wrong bay. Retake it and tick the harness item.'});
INIT.jsas.forEach(j=>{if(!j.tplId)j.tplId='tpl-default';});
INIT.jsaAnswers={};
(()=>{ /* deterministic sample answers for every JSA that has been started */
 INIT.jsas.forEach(j=>{
  const tpl=INIT.jsaTpls.find(t=>t.id===j.tplId),qs=tpl.fields.filter(f=>f.type!=='heading'),take=Math.round(qs.length*(j.q?Math.min(j.ans/j.q,1):0)),a={};
  qs.slice(0,take).forEach((f,i)=>{
   a[f.id]=f.type==='yesno'||f.type==='yesnona'?'yes':f.type==='checklist'?(f.opts||[]).slice(0,4):f.type==='long'?'Pipe laying and backfill, east side. Two crews.':f.type==='short'?'0 ppm':f.type==='checkbox'?true:
    f.type==='task'?{hazard:f.label,control:'Trench box fitted, spotter on the excavator, exclusion zone marked.',risk:j.haz?'high':'low'}:f.type==='signatures'?j.resp.slice():f.type==='person'?j.resp[0]:f.type==='dropdown'?(f.opts||[])[0]:f.type==='photos'?Math.max(j.photos,1):f.type==='phone'?'0412 555 018':f.type==='address'?'14 Westgate Rd, Wetherill Park':f.type==='date'?TODAY_ISO:'';
  });
  INIT.jsaAnswers[j.id]=a;
 });
})();
S=structuredClone(INIT);
JS.declined=['bad','Sent back'];
