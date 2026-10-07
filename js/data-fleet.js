/* =====================================================================
   Fleet data: assets, vehicles, journeys with the fields the shipped
   screens carry (statuses, locations, history, service records,
   inspections, incidents, journey plans). Loaded after data-ops.js.
   ===================================================================== */
const mkd=(iso)=>iso;                                 // ISO dates; shown with fmtDL
const daysTo=iso=>Math.round((new Date(iso+'T00:00:00Z')-new Date(TODAY_ISO+'T00:00:00Z'))/864e5);

/* ---------- statuses (shipped vocabulary) ---------- */
const AST={in:['ok','Available'],out:['info','Deployed'],service:['warn','Maintenance'],retired:['neutral','Retired'],lost:['bad','Lost']};
const VST={available:['ok','Available'],in_use:['info','In use'],maintenance:['warn','Maintenance']};
const JST={draft:['neutral','Draft'],submitted:['warn','Submitted'],approved:['ok','Approved'],in_progress:['info','In progress'],completed:['ok','Completed'],cancelled:['bad','Cancelled']};
const CONDITIONS=[['good','Good'],['fair','Fair'],['poor','Poor']];

/* ---------- named locations (Locations tab, "Others") ---------- */
INIT.locations=[{id:'l1',name:'Enfield store'},{id:'l2',name:'Dubbo depot cage'},{id:'l3',name:'Orange site container'}];

/* ---------- assets ---------- */
/* serial -> [asset id, manufacturer, supplier, department, purchased, warranty, requires test & tag, order no] */
const AST_X={
 'MK-HR2631-0042':['NL-0042','Makita','Bunnings Trade','Civil','2025-03-14','2028-03-14',true,'PO-1042'],
 'HL-PR30-1187':['NL-1187','Hilti','Hilti Australia','Survey','2024-11-02','2027-11-02',false,'PO-0988'],
 'HD-EU30-0310':['NL-0310','Honda','Blackwoods','Plant','2023-06-21','2026-06-21',true,'PO-0712'],
 'DW-DCS570-2219':['NL-2219','DeWalt','Bunnings Trade','Civil','2025-01-09','2028-01-09',true,'PO-1019'],
 'GD-MX4-7781':['NL-7781','MSA','Blackwoods','Safety','2025-08-30','2027-08-30',true,'PO-1103'],
 'EL-25M-0915':['NL-0915','Pro-Lead','Total Tools','Electrical','2025-05-12','2026-05-12',true,'PO-1066'],
 'WP-1550-0044':['NL-0044','Wacker Neuson','Coates Hire','Plant','2022-09-03','2025-09-03',false,'PO-0511'],
 'SF-HLK-0228':['NL-0228','Miller','Blackwoods','Safety','2025-02-17','2027-02-17',false,'PO-1031'],
 'MW-M18-5521':['NL-5521','Milwaukee','Total Tools','Civil','2025-10-01','2028-10-01',true,'PO-1120'],
 'CL-RD8-1120':['NL-1120','Radiodetection','RD Direct','Survey','2024-04-19','2027-04-19',false,'PO-0902']
};
INIT.assets.forEach((a,i)=>{
 const x=AST_X[a.serial]||['NL-'+(9000+i),'','','General','2025-01-01','',false,''];
 if(a.st==='tagged')a.st='in';                                      // test & tag is its own flag, not a status
 Object.assign(a,{id:'ast-'+x[0].slice(3),assetId:x[0],mfr:x[1],supplier:x[2],dept:x[3],bought:x[4],warranty:x[5],needsTT:x[6],orderNo:x[7],
  place:a.st==='in'||a.st==='service'?(a.loc==='Store'?'Enfield store':a.loc):'',veh:'',notes:'',images:0,docs:[],
  history:a.holder?[{who:a.holder,type:'Employee',target:a.holder+' · '+a.loc,taken:'2026-09-'+String(20+i%8).padStart(2,'0'),returned:'',cond:'good',notes:''}]:[]});
 if(!a.needsTT){a.tag='—';a.days=999;}
 a.history.unshift({who:'Hamish Reid',type:'Location',target:'Enfield store',taken:x[4],returned:x[4],cond:'good',notes:'Added to the register'});
});
INIT.assets.push(
 {id:'ast-0007',assetId:'NL-0007',name:'Stihl cut-off saw',serial:'ST-TS420-0007',cat:'Power tools',holder:'',since:'',loc:'Store',tag:'—',days:999,val:1150,st:'retired',mfr:'Stihl',supplier:'Bunnings Trade',dept:'Civil',bought:'2019-05-02',warranty:'2022-05-02',needsTT:false,orderNo:'PO-0120',place:'Enfield store',veh:'',notes:'Retired after the blade guard cracked.',images:0,docs:[],history:[]},
 {id:'ast-0033',assetId:'NL-0033',name:'Trimble total station',serial:'TR-S5-0033',cat:'Survey',holder:'Grace Lee',since:'since 12 Aug',loc:'Harbour St Reservoir',tag:'—',days:999,val:14800,st:'lost',mfr:'Trimble',supplier:'Position Partners',dept:'Survey',bought:'2023-02-11',warranty:'2026-02-11',needsTT:false,orderNo:'PO-0644',place:'',veh:'',notes:'Not returned after the reservoir pour. Last seen on site.',images:0,docs:[],history:[{who:'Grace Lee',type:'Employee',target:'Grace Lee · Harbour St Reservoir',taken:'2026-08-12',returned:'',cond:'good',notes:''}]});
INIT.assets.forEach(a=>{if(a.st==='lost'||a.st==='retired'){a.holder=a.st==='lost'?a.holder:'';}});
(()=>{const a=INIT.assets.find(x=>x.assetId==='NL-1120');if(a){a.holder='';a.veh='Truck 02';a.since='since 26 Sep';a.loc='Store';Object.assign(a.history.find(h=>!h.returned),{who:'Truck 02',type:'Vehicle',target:'Truck 02',notes:'Kept in the tool box'});}})();

/* ---------- vehicles ---------- */
const VEH_X={
 'ute-07':['in_use','Mei Tanaka','Silver','all_terrain','2025-11-04','2026-12-02'],
 'ute-03':['available','','White','on_road','2026-02-11','2026-10-30'],
 'crew-cab-02':['in_use','Liam Carter','White','all_terrain','2026-04-20','2027-01-14'],
 'tipper-01':['in_use','Josh Bennett','Yellow','on_road','2026-03-02','2026-09-15'],
 'ute-05':['maintenance','','Grey','all_terrain','2026-05-19','2026-11-12'],
 'ute-09':['available','','Blue','on_road','2026-08-30','2027-02-25'],
 'truck-02':['available','','White','on_road','2025-12-12','2026-10-18']
};
INIT.vehicles.forEach((v,i)=>{
 const id=slug(v.name),x=VEH_X[id]||['available','','White','on_road','2026-01-01','2026-12-31'],yr=(v.model.match(/\b(20\d\d)\b/)||[])[1]||'',mm=v.model.replace(/\s*\b20\d\d\b\s*/,'').trim(),make=mm.split(' ')[0];
 Object.assign(v,{id,make,mdl:mm.slice(make.length).trim(),year:yr,vin:'JT'+String(2000000+i*13579).slice(0,7)+'P'+String(38000+i*17),color:x[2],terrain:x[3],status:x[0],outTo:x[1],
  roadsideCo:'NRMA',roadsidePh:'13 11 22',insExp:x[4]==='2026-03-02'?'2026-12-20':'2027-0'+(1+i%9)+'-15',inspDue:x[5],svcDate:addDays(TODAY_ISO,Math.max(Math.round((v.svc-v.odo)/55),5)),
  notes:'',images:0,docs:[{id:'vd'+i,name:'Registration certificate',files:1,added:'3 Mar 2026',by:'Hamish Reid'}],
  services:[{id:'sr'+i+'a',date:'2026-03-18',km:v.odo-9800,desc:'Logbook service, oil and filters',cost:420,invoices:1},{id:'sr'+i+'b',date:'2025-09-04',km:v.odo-19800,desc:'Brake pads, front',cost:360,invoices:1}],
  history:x[1]?[{who:x[1],taken:'2026-09-'+String(20+i%8).padStart(2,'0'),expected:'2026-10-05',returned:'',out:'Full tank. Mirror folded for transport.',in:''}]:[]});
 v.history.unshift({who:'Aisha Rahman',taken:'2026-08-14',expected:'2026-08-16',returned:'2026-08-16',out:'Ready to go.',in:'Returned clean. Low washer fluid.'});
});
INIT.incidents=[
 {id:'inc1',car:'tipper-01',by:'Josh Bennett',occurred:'2026-09-29T14:20',filed:'2026-09-29T16:02',reviewedBy:'',loc:'Queen St, Campbelltown NSW 2560',desc:'Reversing into the yard, the passenger mirror clipped a bollard. No injuries, no third party.',other:null,media:2},
 {id:'inc2',car:'ute-03',by:'Priya Nair',occurred:'2026-09-12T07:48',filed:'2026-09-12T08:30',reviewedBy:'Hamish Reid',loc:'Harbour St, Wollongong NSW 2500',desc:'Another driver reversed into the ute in a car park. Minor scuff on the rear quarter panel.',other:{name:'Dale Whitcombe',phone:'0408 555 211',licence:2},media:3}
];
INIT.inspections=[
 {id:'vi1',car:'tipper-01',date:'2026-10-01',plate:'BHT-903',inspector:'Josh Bennett',type:'Isuzu NPR',created:'2026-10-01T06:10',status:'completed',photos:6},
 {id:'vi2',car:'tipper-01',date:'2026-09-24',plate:'BHT-903',inspector:'Josh Bennett',type:'Isuzu NPR',created:'2026-09-24T06:02',status:'completed',photos:5},
 {id:'vi3',car:'ute-07',date:'2026-10-01',plate:'DBX-71K',inspector:'Mei Tanaka',type:'Toyota HiLux',created:'2026-10-01T05:20',status:'completed',photos:4}
];
INIT.comparisons=[
 {id:'cmp1',car:'tipper-01',created:'2026-09-29T17:12',status:'completed',before:'Walk-around 07:05, 29 Sep',after:'Walk-around 16:40, 29 Sep',summary:'One new area of damage on the passenger side. Everything else matches the first video.',items:[{loc:'Passenger mirror',sev:'moderate',note:'Housing cracked, glass intact. Not present in the first video.'},{loc:'Rear step',sev:'minor',note:'Fresh scuff. May be from the same contact.'}]},
 {id:'cmp2',car:'ute-07',created:'2026-09-18T07:40',status:'completed',before:'Walk-around 17:30, 17 Sep',after:'Walk-around 07:10, 18 Sep',summary:'No new damage found.',items:[]}
];

/* ---------- journeys ---------- */
const JX={
 'TRP-0912':['in_progress','Hamish Reid',{fatigue:'Rested, 8 hours sleep',route:'Mitchell Hwy via Bathurst',breaks:'Every 2 hours, Bathurst and Orange'}],
 'TRP-0913':['in_progress','Hamish Reid',{fatigue:'Rested, 7 hours sleep',route:'Great Western Hwy to Dubbo',breaks:'Every 2 hours, Lithgow and Orange'}],
 'TRP-0914':['in_progress','Hamish Reid',{fatigue:'Rested',route:'M5 then Narellan Rd',breaks:'None needed, under 90 minutes'}],
 'TRP-0911':['completed','Hamish Reid',{fatigue:'Rested',route:'Princes Hwy',breaks:'None needed'}],
 'TRP-0915':['approved','Hamish Reid',{fatigue:'Rested',route:'Princes Hwy to Kiama',breaks:'One stop at Wollongong'}],
 'TRP-0916':['submitted','',{fatigue:'Rested',route:'Mitchell Hwy',breaks:'None needed'}],
 'TRP-0908':['completed','Priya Nair',{fatigue:'Rested',route:'Princes Hwy',breaks:'None needed'}],
 'TRP-0905':['completed','Hamish Reid',{fatigue:'Rested',route:'Great Western Hwy',breaks:'One stop at Orange'}]
};
INIT.journeys.forEach(j=>{
 const x=JX[j.id]||['draft','',{}];
 Object.assign(j,{key:j.id.toLowerCase(),status:x[0],approvedBy:x[1],plan:x[2],notify:j.pax>0?'app':'sms',people:[{name:j.driver,canDrive:true},...Array.from({length:j.pax},(_,k)=>({name:['Tom Hughes','Aisha Rahman','Sophie Grant'][k%3],canDrive:k===0}))],
  events:[]});
 if(['in_progress','completed'].includes(j.status))j.events.push({t:j.dep.replace(/^\w{3} /,''),ev:'Departed',d:j.from});
 if(j.status==='completed')j.events.push({t:j.eta,ev:'Arrived',d:j.to},{t:j.eta,ev:'Trip completed',d:'Record written'});
 if(j.st==='rest')j.events.push({t:'09:10',ev:'Rest break',d:'Planned stop, Lithgow'});
 if(j.st==='late')j.events.push({t:'07:20',ev:'Running late',d:'+'+j.late+' min against the plan. Supervisors told.'});
 if(j.chk&&j.chk!=='—'&&j.status==='in_progress')j.events.push({t:'08:00',ev:'Check-in',d:'Check-in '+j.chk});
});
INIT.journeys.push({id:'TRP-0917',key:'trp-0917',from:'Enfield yard',to:'Penrith depot',dest:null,driver:'Sophie Grant',pax:0,veh:'Ute 09',rego:'FAA-19T',dep:'Fri 06:30',eta:'07:20',km:48,chk:'—',st:'planned',status:'draft',approvedBy:'',plan:{},notify:'sms',people:[{name:'Sophie Grant',canDrive:true}],events:[]},
 {id:'TRP-0904',key:'trp-0904',from:'Orange',to:'Dubbo depot',dest:null,driver:'Tom Hughes',pax:0,veh:'Crew cab 02',rego:'EZK-22A',dep:'Mon 05:45',eta:'—',km:0,chk:'—',st:'done',status:'cancelled',approvedBy:'Hamish Reid',plan:{},notify:'sms',people:[{name:'Tom Hughes',canDrive:true}],events:[{t:'05:30',ev:'Cancelled',d:'Job moved to Thursday'}]});
INIT.journeyHazards={'trp-0913':{kind:'Road closed',desc:'Great Western Hwy closed westbound at Lithgow after a crash.',km:34,by:'a colleague',source:'NSW Live Traffic'}};
INIT.journeyWeather={avgTemp:'19°C',rain:'35%',wind:'28 km/h',points:[{place:'Enfield',t:'07:30',temp:'16°C',rain:'10%',wind:'14 km/h'},{place:'Lithgow',t:'09:20',temp:'12°C',rain:'55%',wind:'34 km/h'},{place:'Orange',t:'10:50',temp:'14°C',rain:'40%',wind:'30 km/h'},{place:'Dubbo',t:'12:10',temp:'22°C',rain:'15%',wind:'26 km/h'}],bom:'Severe weather warning: damaging winds, Central West, until 14:00.'};

/* ---------- helpers ---------- */
const astBy=id=>S.assets.find(a=>a.id===id);
const vehBy=id=>S.vehicles.find(v=>v.id===id);
const jrnBy=k=>S.journeys.find(j=>j.key===String(k).toLowerCase());
const locName=a=>a.holder?a.holder+(a.loc&&a.loc!=='Store'?' · '+a.loc:''):a.veh?'Vehicle · '+a.veh:a.loc&&a.loc!=='Store'?a.loc:(a.place||'Enfield store');
Object.assign(AS,AST);
S=structuredClone(INIT);
