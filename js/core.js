'use strict';
/* =====================================================================
   Helpers
   ===================================================================== */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N=n=>Number(n).toLocaleString('en-AU');
const money=v=>v==null?'<span class="dash">—</span>':'$'+N(v);
const short=v=>{const a=Math.abs(v);if(a>=1e6)return '$'+(Math.round(v/1e5)/10)+'M';if(a>=1e3)return '$'+Math.round(v/1e3)+'K';return '$'+Math.round(v);};
const ini=n=>n.split(' ').map(p=>p[0]).join('').slice(0,2).toUpperCase();
const pct=(a,b)=>b>0?a/b*100:0;
const pctT=(p,dp)=>(dp===0?Math.round(p):Math.round(p*10)/10)+'%';
const f2=x=>Math.round(x*100)/100;
const reduced=(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}})();
const narrow=()=>{try{return matchMedia('(max-width:760px)').matches}catch(e){return false}};

const IC={
 dash:'<rect x="3" y="3" width="7.6" height="8.8" rx="2.2"/><rect x="13.4" y="3" width="7.6" height="5.4" rx="2.2"/><rect x="3" y="15" width="7.6" height="6" rx="2.2"/><rect x="13.4" y="11.6" width="7.6" height="9.4" rx="2.2"/>',
 jobs:'<path d="M2 21h20M6 21V8m0 0 4 3m-4-3 4-4m0 0h13m-4 0v4m4-4 2 4m-11-4v12m5-12v8m-2 0h4m-2 0 2 3"/>',
 cal:'<rect x="3" y="5" width="18" height="16" rx="2.4"/><path d="M3 10h18M8 3v4M16 3v4"/>',
 clock:'<circle cx="12" cy="12" r="9.1"/><path d="M12 6.9v5.4l3.4 2"/>',
 shield:'<path d="M12 2.9 4.9 5.7v6.2c0 4.4 3 7.9 7.1 8.9 4.1-1 7.1-4.5 7.1-8.9V5.7z"/><path d="m9.2 12.1 2.1 2.1 3.8-4.1"/>',
 route:'<circle cx="6" cy="5.6" r="2.6"/><circle cx="18" cy="18.4" r="2.6"/><path d="M8.6 5.6h5.6a3.4 3.4 0 0 1 0 6.8H9.8a3.4 3.4 0 0 0 0 6.8h5.6"/>',
 box:'<path d="M12 2.9 20.4 7.3v9.4L12 21.1 3.6 16.7V7.3z"/><path d="M3.6 7.3 12 11.8l8.4-4.5M12 11.8v9.3"/>',
 truck:'<rect x="2.6" y="6" width="11.4" height="9.6" rx="1.9"/><path d="M14 9.8h3.1c.5 0 1 .24 1.3.66l2 2.7c.2.27.3.6.3.94v1.5H14z"/><circle cx="6.9" cy="17.6" r="2"/><circle cx="17" cy="17.6" r="2"/>',
 users:'<circle cx="9.2" cy="8" r="3.4"/><path d="M2.8 19.9c0-3.5 2.9-5.6 6.4-5.6s6.4 2.1 6.4 5.6M16.5 5.1a3.4 3.4 0 0 1 .1 6.4M18.3 14.5c1.9.7 2.9 2.3 2.9 4.3"/>',
 building:'<rect x="4" y="3" width="16" height="18" rx="1.6"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3"/>',
 company:'<path d="M3 21V10l6 3.5V10l6 3.5V5h6v16z"/><path d="M3 21h18M7 17h2M13 17h2M17 9h1M17 13h1"/>',
 key:'<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>',
 usercog:'<circle cx="10" cy="8" r="4"/><path d="M3 20a7 7 0 0 1 11-5.7"/><circle cx="18" cy="17" r="2.6"/>',
 receipt:'<path d="M5.6 3.3a.7.7 0 0 1 .7-.7h11.4a.7.7 0 0 1 .7.7v17.4l-2.42-1.5-2.42 1.5L11.14 19l-2.42 1.7-2.42-1.5-.7.5z"/><path d="M9 8.4h6M9 12.3h4"/>',
 card:'<rect x="2.4" y="5" width="19.2" height="14" rx="2.8"/><path d="M2.4 9.7h19.2M6.1 14.7h3.6"/>',
 alert:'<path d="M10.28 4.03 2.6 17.2a2 2 0 0 0 1.72 3h15.36a2 2 0 0 0 1.72-3L13.72 4.03a2 2 0 0 0-3.44 0z"/><path d="M12 9.6v4.3M12 17.2h.01"/>',
 check:'<path d="m4.9 12.6 4.6 4.7L19.1 7.1"/>',
 checkc:'<circle cx="12" cy="12" r="9.1"/><path d="m8.3 12.2 2.5 2.5 4.9-5.2"/>',
 close:'<path d="M17.8 6.2 6.2 17.8M6.2 6.2l11.6 11.6"/>',
 closec:'<circle cx="12" cy="12" r="9.1"/><path d="M15 9 9 15M9 9l6 6"/>',
 timer:'<circle cx="12" cy="13.6" r="7.6"/><path d="M12 9.8v3.8l2.6 1.6M9.4 2.6h5.2M12 2.6v3.4"/>',
 hour:'<path d="M6.6 3h10.8M6.6 21h10.8M7.8 3v3.1c0 1.5 4.2 3.6 4.2 5.9 0 2.3-4.2 4.4-4.2 5.9V21M16.2 3v3.1c0 1.5-4.2 3.6-4.2 5.9 0 2.3 4.2 4.4 4.2 5.9V21"/>',
 pin:'<path d="M19 10.2c0 4.9-7 11-7 11s-7-6.1-7-11a7 7 0 1 1 14 0z"/><circle cx="12" cy="10" r="2.6"/>',
 search:'<circle cx="11" cy="11" r="7.1"/><path d="m20 20-3.9-3.9"/>',
 next:'<path d="m9.2 5.4 6.6 6.6-6.6 6.6"/>',
 plus:'<path d="M12 5.5v13M5.5 12h13"/>',
 download:'<path d="M12 3.6v11.5M7.7 10.9l4.3 4.3 4.3-4.3M4.5 20.3h15"/>',
 bell:'<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
 sun:'<circle cx="12" cy="12" r="4.1"/><path d="M12 2.6v2.3M12 19.1v2.3M4.35 4.35l1.63 1.63M18.02 18.02l1.63 1.63M2.6 12h2.3M19.1 12h2.3M4.35 19.65l1.63-1.63M18.02 5.98l1.63-1.63"/>',
 moon:'<path d="M20.8 13.1A8.6 8.6 0 1 1 10.9 3.2a6.7 6.7 0 0 0 9.9 9.9z"/>',
 reset:'<path d="M20.4 12a8.4 8.4 0 1 1-2.46-5.94"/><path d="M20.7 4.2v5h-5"/>',
 more:'<path d="M12 5h.01M12 12h.01M12 19h.01" stroke-width="2.8"/>',
 trend:'<path d="m3.6 16.6 5.4-5.6 3.4 3.4 6.4-6.8"/><path d="M14.6 7.6h4.2v4.2"/>',
 eye:'<path d="M2.5 12S6.3 5.7 12 5.7 21.5 12 21.5 12 17.7 18.3 12 18.3 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
 send:'<path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/>',
 sliders:'<path d="M4 7.4h9M17.4 7.4H20M4 16.6h3.2M11.6 16.6H20"/><circle cx="15.2" cy="7.4" r="2.2"/><circle cx="9.4" cy="16.6" r="2.2"/>',
 doc:'<path d="M9.2 4.4H6.7A1.7 1.7 0 0 0 5 6.1v13.3a1.7 1.7 0 0 0 1.7 1.7h10.6a1.7 1.7 0 0 0 1.7-1.7V6.1a1.7 1.7 0 0 0-1.7-1.7h-2.5"/><rect x="9.2" y="2.7" width="5.6" height="3.4" rx="1.3"/><path d="m9.1 13.7 2.1 2.1 4.1-4.4"/>'
};
const ICON=(n,sw)=>`<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="${sw||1.7}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]||IC.alert}</svg>`;

/* =====================================================================
   Mock data — Northline Civil, Thursday 1 October 2026
   ===================================================================== */
const JC={teal:'#2F8C8F',blue:'#4E79A7',orange:'#CC8442',green:'#3D9A6A',red:'#BC5A48',slate:'#7B8B85',gold:'#BFA04A'};
const INIT={
 jobs:[
  {name:'Westgate Depot Upgrade',code:'JOB-1042',c:JC.teal,addr:'14 Westgate Rd, Wetherill Park NSW',sups:['Liam Carter','Mei Tanaka'],geo:150,est:184000,sell:236500,pct:62,created:'12 Aug 2026',crew:9,pt:[236,150],arch:false,cust:'Westgate Logistics'},
  {name:'Harbour St Reservoir',code:'JOB-1039',c:JC.blue,addr:'2 Harbour St, Wollongong NSW',sups:['Priya Nair'],geo:200,est:412000,sell:520000,pct:41,created:'3 Aug 2026',crew:7,pt:[408,148],arch:false,cust:'Sydney Water'},
  {name:'M4 Drainage Package',code:'JOB-1036',c:JC.orange,addr:'M4 Motorway, Eastern Creek NSW',sups:['Josh Bennett','Daniel Okafor','Sophie Grant'],geo:500,est:96500,sell:121000,pct:88,created:'28 Jul 2026',crew:5,pt:[470,222],arch:false,cust:'Transport for NSW'},
  {name:'Riverside Footbridge',code:'JOB-1031',c:JC.green,addr:'Parramatta River, Rydalmere NSW',sups:['Daniel Okafor'],geo:0,est:268000,sell:331000,pct:23,created:'15 Jul 2026',crew:3,pt:[352,350],arch:false,cust:'City of Parramatta'},
  {name:'Orange Substation Fit-out',code:'JOB-1028',c:JC.red,addr:'41 Leeds Pde, Orange NSW',sups:['Mei Tanaka'],geo:250,est:152000,sell:190000,pct:104,created:'1 Jul 2026',crew:4,pt:[560,274],arch:false,cust:'Essential Energy'},
  {name:'Dubbo Pump Station',code:'JOB-1025',c:JC.teal,addr:'7 Wheelers Ln, Dubbo NSW',sups:['Priya Nair','Liam Carter'],geo:300,est:78000,sell:99500,pct:71,created:'22 Jun 2026',crew:2,pt:[534,128],arch:false,cust:'Dubbo Regional Council'},
  {name:'Campbelltown Car Park Reseal',code:'JOB-1021',c:JC.gold,addr:'Queen St, Campbelltown NSW',sups:['Josh Bennett'],geo:150,est:54000,sell:68000,pct:96,created:'9 Jun 2026',crew:1,pt:[262,320],arch:false,cust:'Transport for NSW'},
  {name:'Yard maintenance',code:'JOB-1002',c:JC.slate,addr:'9 Cosgrove Rd, Enfield NSW',sups:['Sophie Grant'],geo:100,est:null,sell:null,pct:null,created:'2 Feb 2026',crew:2,pt:[140,138],arch:false,cust:'Internal'},
  {name:'Kiama Seawall Repair',code:'JOB-1017',c:JC.green,addr:'Terralong St, Kiama NSW',sups:['Liam Carter'],geo:200,est:210000,sell:262000,pct:100,created:'14 May 2026',crew:0,arch:true,cust:'Kiama Municipal Council'},
  {name:'Penrith Depot Fence',code:'JOB-1012',c:JC.slate,addr:'3 Coreen Ave, Penrith NSW',sups:['Josh Bennett'],geo:0,est:24000,sell:31000,pct:97,created:'2 Apr 2026',crew:0,arch:true,cust:'Internal'},
  {name:'Bathurst Culvert Renewal',code:'JOB-1009',c:JC.blue,addr:'Mitchell Hwy, Bathurst NSW',sups:['Priya Nair'],geo:300,est:132000,sell:160000,pct:92,created:'11 Mar 2026',crew:0,arch:true,cust:'Transport for NSW'}
 ],
 today:[
  {name:'Liam Carter',role:'Leading hand',job:'Westgate Depot Upgrade',shift:'06:00 – 14:30',in:'05:56',st:'on'},
  {name:'Priya Nair',role:'Site supervisor',job:'Harbour St Reservoir',shift:'06:30 – 15:00',in:'06:41',st:'late',late:11},
  {name:'Josh Bennett',role:'Plant operator',job:'M4 Drainage Package',shift:'07:00 – 15:30',in:'',st:'absent'},
  {name:'Mei Tanaka',role:'Electrician',job:'Orange Substation Fit-out',shift:'05:30 – 14:00',in:'05:24',st:'on'},
  {name:'Sophie Grant',role:'Labourer',job:'Yard maintenance',shift:'06:00 – 14:30',in:'06:02',st:'break'},
  {name:'Daniel Okafor',role:'Carpenter',job:'Riverside Footbridge',shift:'08:00 – 16:30',in:'',st:'later'},
  {name:'Aisha Rahman',role:'Traffic controller',job:'M4 Drainage Package',shift:'06:45 – 15:15',in:'06:58',st:'late',late:13},
  {name:'Tom Hughes',role:'Apprentice',job:'Westgate Depot Upgrade',shift:'07:00 – 15:30',in:'06:55',st:'on'},
  {name:'Grace Lee',role:'Site engineer',job:'Harbour St Reservoir',shift:'07:30 – 16:00',in:'07:21',st:'on'}
 ],
 time:[
  {name:'Priya Nair',role:'Site supervisor',job:'Harbour St Reservoir',date:'Tue 29 Sep',in:'06:30',out:'16:10',brk:'30 min',hrs:9.2,src:'Manual edit',st:'pending'},
  {name:'Josh Bennett',role:'Plant operator',job:'M4 Drainage Package',date:'Wed 30 Sep',in:'07:00',out:'15:30',brk:'30 min',hrs:8.0,src:'Manual edit',st:'pending'},
  {name:'Mei Tanaka',role:'Electrician',job:'Orange Substation Fit-out',date:'Wed 30 Sep',in:'05:30',out:'15:05',brk:'45 min',hrs:8.8,src:'Manual edit',st:'pending'},
  {name:'Liam Carter',role:'Leading hand',job:'Westgate Depot Upgrade',date:'Thu 1 Oct',in:'05:56',out:'',brk:'—',hrs:1.8,src:'App',st:'live'},
  {name:'Sophie Grant',role:'Labourer',job:'Yard maintenance',date:'Wed 30 Sep',in:'19:40',out:'',brk:'—',hrs:12.1,src:'App',st:'live'},
  {name:'Daniel Okafor',role:'Carpenter',job:'Riverside Footbridge',date:'Wed 30 Sep',in:'07:58',out:'16:34',brk:'30 min',hrs:8.1,src:'App',st:'ok'},
  {name:'Liam Carter',role:'Leading hand',job:'Westgate Depot Upgrade',date:'Wed 30 Sep',in:'05:52',out:'14:41',brk:'30 min',hrs:8.3,src:'Kiosk',st:'ok'},
  {name:'Aisha Rahman',role:'Traffic controller',job:'M4 Drainage Package',date:'Wed 30 Sep',in:'06:45',out:'17:20',brk:'30 min',hrs:10.1,src:'App',st:'ok'},
  {name:'Tom Hughes',role:'Apprentice',job:'Westgate Depot Upgrade',date:'Wed 30 Sep',in:'07:02',out:'15:31',brk:'30 min',hrs:8.0,src:'App, off site',st:'ok'},
  {name:'Grace Lee',role:'Site engineer',job:'Harbour St Reservoir',date:'Tue 29 Sep',in:'07:30',out:'12:00',brk:'—',hrs:4.5,src:'Kiosk',st:'rejected'}
 ],
 jsas:[
  {tpl:'Excavation and trenching',id:'JSA-3318',job:'M4 Drainage Package',resp:['Josh Bennett','Aisha Rahman'],shift:'Today 07:00',ans:18,q:18,haz:2,photos:4,st:'await'},
  {tpl:'Working at heights',id:'JSA-3317',job:'Westgate Depot Upgrade',resp:['Liam Carter'],shift:'Today 06:00',ans:14,q:14,haz:1,photos:2,st:'await'},
  {tpl:'Confined space entry',id:'JSA-3316',job:'Harbour St Reservoir',resp:['Priya Nair','Grace Lee'],shift:'Today 06:30',ans:9,q:16,haz:0,photos:1,st:'progress'},
  {tpl:'Electrical isolation',id:'JSA-3315',job:'Orange Substation Fit-out',resp:['Mei Tanaka'],shift:'Today 05:30',ans:12,q:12,haz:0,photos:3,st:'approved'},
  {tpl:'Daily pre-start',id:'JSA-3314',job:'Riverside Footbridge',resp:['Daniel Okafor'],shift:'Today 08:00',ans:0,q:10,haz:0,photos:0,st:'sent'},
  {tpl:'Daily pre-start',id:'JSA-3313',job:'Yard maintenance',resp:['Sophie Grant'],shift:'Today 06:00',ans:3,q:10,haz:0,photos:0,st:'overdue'},
  {tpl:'Traffic management',id:'JSA-3312',job:'M4 Drainage Package',resp:['Aisha Rahman'],shift:'Today 06:45',ans:11,q:11,haz:0,photos:2,st:'approved'},
  {tpl:'Manual handling',id:'JSA-3311',job:'Westgate Depot Upgrade',resp:['Tom Hughes','Liam Carter'],shift:'Today 07:00',ans:8,q:8,haz:0,photos:0,st:'approved'}
 ],
 journeys:[
  {id:'TRP-0912',from:'Dubbo depot',to:'Orange Substation',dest:4,driver:'Mei Tanaka',pax:1,veh:'Ute 07',rego:'DBX-71K',dep:'05:40',eta:'08:05',late:25,km:152,chk:'2 of 3',st:'late'},
  {id:'TRP-0913',from:'Enfield yard',to:'Dubbo Pump Station',dest:5,driver:'Liam Carter',pax:2,veh:'Crew cab 02',rego:'EZK-22A',dep:'07:30',eta:'12:10',km:372,chk:'1 of 5',st:'rest'},
  {id:'TRP-0914',from:'Enfield yard',to:'Campbelltown',dest:6,driver:'Josh Bennett',pax:0,veh:'Tipper 01',rego:'BHT-903',dep:'07:10',eta:'08:00',km:41,chk:'1 of 2',st:'road'},
  {id:'TRP-0911',from:'Enfield yard',to:'Wollongong',dest:1,driver:'Priya Nair',pax:0,veh:'Ute 03',rego:'CQ-48-PL',dep:'05:15',eta:'06:40',km:86,chk:'3 of 3',st:'done'},
  {id:'TRP-0915',from:'Enfield yard',to:'Kiama',driver:'Daniel Okafor',pax:1,veh:'Ute 05',rego:'DMR-55C',dep:'13:00',eta:'15:05',km:128,chk:'—',st:'planned'},
  {id:'TRP-0916',from:'Orange',to:'Bathurst',driver:'Grace Lee',pax:0,veh:'Ute 07',rego:'DBX-71K',dep:'15:30',eta:'16:20',km:58,chk:'—',st:'planned'},
  {id:'TRP-0908',from:'Wollongong',to:'Enfield yard',driver:'Aisha Rahman',pax:0,veh:'Ute 03',rego:'CQ-48-PL',dep:'Wed 15:10',eta:'16:45',km:86,chk:'3 of 3',st:'done'},
  {id:'TRP-0905',from:'Bathurst',to:'Dubbo depot',driver:'Tom Hughes',pax:1,veh:'Crew cab 02',rego:'EZK-22A',dep:'Wed 09:00',eta:'11:30',km:205,chk:'4 of 4',st:'done'}
 ],
 assets:[
  {name:'Makita rotary hammer drill',serial:'MK-HR2631-0042',cat:'Power tools',holder:'Liam Carter',since:'since 22 Sep',loc:'Westgate Depot Upgrade',tag:'9 Oct 2026',days:8,val:649,st:'out'},
  {name:'Hilti laser level PR 30',serial:'HL-PR30-1187',cat:'Survey',holder:'Grace Lee',since:'since 15 Sep',loc:'Harbour St Reservoir',tag:'—',days:999,val:2890,st:'out'},
  {name:'Honda 3kVA generator',serial:'HD-EU30-0310',cat:'Plant',holder:'Josh Bennett',since:'since 1 Sep',loc:'M4 Drainage Package',tag:'12 Oct 2026',days:11,val:4200,st:'out'},
  {name:'DeWalt circular saw',serial:'DW-DCS570-2219',cat:'Power tools',holder:'',loc:'Store',tag:'28 Sep 2026',days:-3,val:389,st:'tagged'},
  {name:'Gas detector 4-gas',serial:'GD-MX4-7781',cat:'Safety',holder:'Priya Nair',since:'since 29 Sep',loc:'Harbour St Reservoir',tag:'3 Oct 2026',days:2,val:1650,st:'out'},
  {name:'Extension lead 25 m',serial:'EL-25M-0915',cat:'Electrical',holder:'',loc:'Store',tag:'14 Oct 2026',days:13,val:85,st:'in'},
  {name:'Plate compactor',serial:'WP-1550-0044',cat:'Plant',holder:'',loc:'Store',tag:'—',days:999,val:3100,st:'service'},
  {name:'Harness and lanyard kit',serial:'SF-HLK-0228',cat:'Safety',holder:'Tom Hughes',since:'since 30 Sep',loc:'Westgate Depot Upgrade',tag:'20 Jan 2027',days:111,val:420,st:'out'},
  {name:'Milwaukee impact driver',serial:'MW-M18-5521',cat:'Power tools',holder:'',loc:'Store',tag:'2 Mar 2027',days:152,val:329,st:'in'},
  {name:'Cable locator',serial:'CL-RD8-1120',cat:'Survey',holder:'Aisha Rahman',since:'since 26 Sep',loc:'M4 Drainage Package',tag:'27 Oct 2026',days:26,val:5400,st:'out'}
 ],
 vehicles:[
  {name:'Ute 07',model:'Toyota HiLux SR5 2023',c:JC.blue,rego:'DBX-71K',driver:'Mei Tanaka',odo:48210,insp:'Today',ok:true,svc:50000,regoExp:'14 Mar 2027',regoDays:164,st:'road'},
  {name:'Ute 03',model:'Ford Ranger XLT 2022',c:JC.teal,rego:'CQ-48-PL',driver:'Priya Nair',odo:71904,insp:'Today',ok:true,svc:72500,regoExp:'22 Oct 2026',regoDays:21,st:'service'},
  {name:'Crew cab 02',model:'Isuzu D-Max 2024',c:JC.green,rego:'EZK-22A',driver:'Liam Carter',odo:19877,insp:'Today',ok:true,svc:30000,regoExp:'2 Jun 2027',regoDays:244,st:'road'},
  {name:'Tipper 01',model:'Isuzu NPR 45-155',c:JC.orange,rego:'BHT-903',driver:'Josh Bennett',odo:132550,insp:'Today',ok:false,svc:140000,regoExp:'9 Feb 2027',regoDays:131,st:'issue'},
  {name:'Ute 05',model:'Toyota HiLux WorkMate 2021',c:JC.slate,rego:'DMR-55C',driver:'',odo:98431,insp:'Yesterday',ok:true,svc:99000,regoExp:'30 Nov 2026',regoDays:60,st:'service'},
  {name:'Ute 09',model:'Mitsubishi Triton GLX 2024',c:JC.blue,rego:'FAA-19T',driver:'',odo:8120,insp:'28 Sep',ok:true,svc:15000,regoExp:'18 Aug 2027',regoDays:321,st:'parked'},
  {name:'Truck 02',model:'Hino 300 Series 2020',c:JC.red,rego:'BHT-488',driver:'Aisha Rahman',odo:164002,insp:'29 Sep',ok:true,svc:170000,regoExp:'11 Oct 2026',regoDays:10,st:'parked'}
 ],
 employees:[
  {name:'Liam Carter',email:'liam.carter@northline.com.au',phone:'0412 555 018',role:'Leading hand',type:'Full time',hrs:42.5,docs:'6 on file',st:'active'},
  {name:'Priya Nair',email:'priya.nair@northline.com.au',phone:'0413 555 207',role:'Site supervisor',type:'Full time',hrs:34,docs:'8 on file',st:'active'},
  {name:'Josh Bennett',email:'josh.b@northline.com.au',phone:'0421 555 664',role:'Plant operator',type:'Full time',hrs:38,docs:'Licence expiring',st:'active'},
  {name:'Mei Tanaka',email:'mei.tanaka@northline.com.au',phone:'0432 555 391',role:'Electrician',type:'Contractor',hrs:38,docs:'5 on file',st:'active'},
  {name:'Daniel Okafor',email:'daniel.o@northline.com.au',phone:'0400 555 872',role:'Carpenter',type:'Full time',hrs:34,docs:'4 on file',st:'active'},
  {name:'Sophie Grant',email:'sophie.grant@northline.com.au',phone:'0438 555 120',role:'Labourer',type:'Casual',hrs:51,docs:'White card expiring',st:'active'},
  {name:'Aisha Rahman',email:'aisha.r@northline.com.au',phone:'0410 555 447',role:'Traffic controller',type:'Casual',hrs:30,docs:'3 on file',st:'active'},
  {name:'Tom Hughes',email:'tom.hughes@northline.com.au',phone:'0466 555 903',role:'Apprentice',type:'Full time',hrs:38,docs:'2 on file',st:'active'},
  {name:'Grace Lee',email:'grace.lee@northline.com.au',phone:'0455 555 238',role:'Site engineer',type:'Full time',hrs:36,docs:'7 on file',st:'active'},
  {name:'Noah Williams',email:'noah.w@gmail.com',phone:'0477 555 610',role:'Labourer',type:'Casual',hrs:null,docs:'None yet',st:'invited'},
  {name:'Chloe Martin',email:'chloe.martin@outlook.com',phone:'0419 555 352',role:'Traffic controller',type:'Casual',hrs:null,docs:'None yet',st:'invited'},
  {name:'Ben Foster',email:'ben.foster@northline.com.au',phone:'0402 555 781',role:'Plant operator',type:'Full time',hrs:null,docs:'5 on file',st:'archived'}
 ],
 customers:[
  {name:'Sydney Water',abn:'49 776 918 448',contact:'Rachel Kim',title:'Project manager',phone:'02 9555 4100',email:'r.kim@sydneywater.example',jobs:1,ytd:1284000,st:'active'},
  {name:'Transport for NSW',abn:'18 804 239 602',contact:'Mark Ellis',title:'Delivery lead',phone:'02 9555 8820',email:'mark.ellis@transport.example',jobs:2,ytd:642500,st:'active'},
  {name:'Essential Energy',abn:'37 428 185 226',contact:'Hannah Scott',title:'Contracts officer',phone:'02 6555 1300',email:'h.scott@essential.example',jobs:1,ytd:418900,st:'active'},
  {name:'City of Parramatta',abn:'49 907 174 773',contact:'James O’Neill',title:'Civil works manager',phone:'02 9555 5600',email:'joneill@parracity.example',jobs:1,ytd:296000,st:'active'},
  {name:'Westgate Logistics',abn:'61 112 334 905',contact:'Sam Patel',title:'Facilities lead',phone:'0412 555 330',email:'sam@westgate.example',jobs:1,ytd:236500,st:'active'},
  {name:'Dubbo Regional Council',abn:'53 539 070 928',contact:'Olivia Brown',title:'Asset engineer',phone:'02 6555 4000',email:'o.brown@dubbo.example',jobs:1,ytd:99500,st:'active'},
  {name:'Kiama Municipal Council',abn:'22 379 679 108',contact:'Ella Turner',title:'Coastal engineer',phone:'02 4555 0777',email:'eturner@kiama.example',jobs:0,ytd:262000,st:'archived'}
 ],
 roles:[
  {name:'Owner',desc:'Full access, including billing and company settings.',members:1,sys:true},
  {name:'Admin',desc:'Runs day-to-day operations across every job.',members:2,sys:true},
  {name:'Supervisor',desc:'Manages crews, shifts, time and JSAs on assigned jobs.',members:6,sys:false},
  {name:'Employee',desc:'Clocks in, completes JSAs and sees their own roster.',members:39,sys:true}
 ],
 company:{legal:'Northline Civil Pty Ltd',code:'NLC',abn:'41 600 123 456',email:'office@northline.com.au',phone:'02 9555 0140',addr:'9 Cosgrove Rd, Enfield NSW 2136',
  flags:{approval:true,overtime:true,roundIn:true,roundOut:false,multiplier:false,digest:true,lateAlert:true},
  rulesets:[{name:'Standard award',applies:'Full time and casual',rules:'Over 8 h a day at 1.5×, over 10 h at 2×',emp:39,def:true},
   {name:'Weekend site work',applies:'All employees',rules:'Saturday 1.5×, Sunday 2×',emp:46,def:false},
   {name:'Contractors',applies:'Contractors',rules:'Flat rate, no overtime',emp:3,def:false}],
  notifs:[{type:'Asset test & tag expiry',by:'Email · Push',to:'Alex Morgan, Grace Lee',when:'14 days before',on:true},
   {type:'Vehicle rego expiry',by:'Email',to:'Alex Morgan',when:'30 days before',on:true},
   {type:'Vehicle inspection issue',by:'Email · Push',to:'Grace Lee, Hamish Reid',when:'Straight away',on:true},
   {type:'Employee document expiry',by:'Email',to:'Grace Lee',when:'30 days before',on:true},
   {type:'Journey running late',by:'Email · Push',to:'Supervisors on the job',when:'After 15 min',on:true},
   {type:'Still clocked in',by:'Push',to:'The employee',when:'Every 2 h after the shift',on:false}]},
 perms:{Owner:[1,1,1,1,1,1,1,1,1,1,1],Admin:[1,1,1,1,1,1,1,1,1,1,0],Supervisor:[1,1,0,1,1,1,0,1,1,0,0],Employee:[1,0,0,0,0,0,0,0,0,0,0]},
 sched:[
  {name:'Unassigned',open:true,days:[[['07:00','15:30','Harbour St Reservoir',1]],[['06:00','14:30','M4 Drainage Package',1]],[],[['07:00','15:30','Westgate Depot Upgrade',1],['07:00','15:30','Westgate Depot Upgrade',1]],[],[['06:00','12:00','Yard maintenance',1],['06:00','12:00','Yard maintenance',1]],[]]},
  {name:'Liam Carter',days:[[['06:00','14:30','Westgate Depot Upgrade']],[['06:00','14:30','Westgate Depot Upgrade']],[['06:00','14:30','Westgate Depot Upgrade']],[['06:00','14:30','Westgate Depot Upgrade']],[['06:00','14:30','Westgate Depot Upgrade']],[],[]]},
  {name:'Priya Nair',days:[[['06:30','15:00','Harbour St Reservoir']],[['06:30','15:00','Harbour St Reservoir']],[['06:30','15:00','Harbour St Reservoir']],[],[['06:30','15:00','Harbour St Reservoir',1]],[],[]]},
  {name:'Josh Bennett',days:[[['07:00','15:30','M4 Drainage Package']],[['07:00','15:30','M4 Drainage Package']],[['07:00','15:30','M4 Drainage Package']],[['07:00','15:30','M4 Drainage Package']],[['07:00','11:00','Yard maintenance']],[],[]]},
  {name:'Mei Tanaka',days:[[['07:00','15:30','Westgate Depot Upgrade']],[['05:30','13:30','Orange Substation Fit-out']],[['05:30','14:00','Orange Substation Fit-out']],[['05:30','13:30','Orange Substation Fit-out']],[],[['07:00','12:00','Westgate Depot Upgrade',1]],[]]},
  {name:'Daniel Okafor',days:[[],[['08:00','16:30','Riverside Footbridge']],[['08:00','16:30','Riverside Footbridge']],[['08:00','16:30','Riverside Footbridge']],[['08:00','16:30','Riverside Footbridge']],[],[]]},
  {name:'Sophie Grant',days:[[['06:00','14:30','Yard maintenance']],[['06:00','14:30','Yard maintenance']],[['06:00','14:30','Yard maintenance']],[['06:00','14:30','Yard maintenance']],[['06:00','14:30','Yard maintenance']],[['06:00','14:30','M4 Drainage Package']],[]]},
  {name:'Aisha Rahman',days:[[['06:45','15:15','M4 Drainage Package']],[['06:45','15:15','M4 Drainage Package']],[['06:45','15:15','M4 Drainage Package']],[],[['06:45','15:15','M4 Drainage Package']],[],[]]}
 ]
};
const PERMS=['View jobs','Create and edit jobs','See job costs','Edit scheduler','Publish shifts','Approve time corrections','Edit time entries','Approve JSAs','Manage assets and vehicles','Manage employees','Company settings'];
let S=structuredClone(INIT);
const DAYS=['25/09','26/09','27/09','28/09','29/09','30/09','01/10'];
const H={rost:[1190,1215,1240,1205,1262,1250,1284],clock:[1102,1150,1168,1131,1196,1188,1211],ot:[64,72,58,81,77,69,62],ontime:[91,93,92,89,94,93,92],clockins:[41,44,43,40,45,44,35]};
const jobColor=n=>(S.jobs.find(j=>j.name===n)||{c:JC.slate}).c;

/* =====================================================================
   Chart builders (inline SVG, no library)
   ===================================================================== */
function smooth(pts,k){
 if(!pts.length)return '';
 if(pts.length<3)return 'M'+pts.map(p=>f2(p[0])+' '+f2(p[1])).join('L');
 k=k==null?.34:k;let d='M'+f2(pts[0][0])+' '+f2(pts[0][1]);
 for(let i=0;i<pts.length-1;i++){const p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2;
  d+='C'+f2(p1[0]+(p2[0]-p0[0])*k/3)+' '+f2(p1[1]+(p2[1]-p0[1])*k/3)+','+f2(p2[0]-(p3[0]-p1[0])*k/3)+' '+f2(p2[1]-(p3[1]-p1[1])*k/3)+','+f2(p2[0])+' '+f2(p2[1]);}
 return d;
}
function niceMax(v){if(!(v>0))return 1;const m=Math.pow(10,Math.floor(Math.log10(v)));return Math.ceil(v/(m/2))*(m/2);}
let gid=0;
function trend(cfg){
 const sm=narrow();let W=sm?400:720,Hh=cfg.h||240;const L=sm?42:46,R=cfg.right?(sm?42:46):16,T=sm?10:14,B=sm?24:30;
 if(sm)Hh=Math.min(Hh,220);
 const xs=cfg.x,n=xs.length,iw=W-L-R,ih=Hh-T-B;
 const maxL=cfg.maxL||niceMax(Math.max(1,...cfg.series.filter(s=>s.axis!=='r').flatMap(s=>s.v)));
 const minL=cfg.minL||0;
 const minR=cfg.minR==null?60:cfg.minR,maxR=cfg.maxR==null?100:cfg.maxR;
 const px=i=>n<2?L+iw/2:L+iw*i/(n-1),pyL=v=>T+ih-ih*(v-minL)/(maxL-minL),pyR=v=>T+ih-ih*(v-minR)/(maxR-minR||1);
 const rows=sm?3:4;let g='';
 for(let i=0;i<=rows;i++){const y=T+ih*i/rows,val=Math.round(maxL-(maxL-minL)*i/rows);
  g+=`<line class="gridline${i===rows?'':' dash'}" x1="${L}" x2="${W-R}" y1="${f2(y)}" y2="${f2(y)}"/><text class="axis${sm?' sm':''}" x="${L-6}" y="${f2(y+3.2)}" text-anchor="end">${esc(cfg.fmtL?cfg.fmtL(val):N(val))}</text>`;
  if(cfg.right){const rv=Math.round(maxR-(maxR-minR)*i/rows);g+=`<text class="axis${sm?' sm':''}" x="${W-R+6}" y="${f2(y+3.2)}" text-anchor="start">${rv}%</text>`;}}
 const xl=xs.map((lb,i)=>{if(sm&&n>4&&i%2===1&&i!==n-1)return '';const half=String(lb).length*3.4;const lx=Math.min(Math.max(px(i),L+half),W-R-half);
  return `<text class="axis${sm?' sm':''}" x="${f2(lx)}" y="${Hh-(sm?7:9)}" text-anchor="middle">${esc(lb)}</text>`;}).join('');
 let defs='',body='';
 cfg.series.forEach((s,si)=>{const pts=s.v.map((v,i)=>[px(i),s.axis==='r'?pyR(v):pyL(v)]);const d=smooth(pts),dl=140+si*130;
  if(s.area){const id='tg'+(++gid);defs+=`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${s.c}" stop-opacity=".24"/><stop offset="100%" stop-color="${s.c}" stop-opacity="0"/></linearGradient>`;
   body+=`<path class="area" d="${d}L${f2(px(n-1))} ${T+ih}L${f2(px(0))} ${T+ih}Z" fill="url(#${id})" style="--d:${dl+160}ms"/>`;}
  body+=`<path class="${s.dash?'fadein':'line'}" d="${d}" fill="none" pathLength="100" stroke="${s.c}" stroke-width="${s.w||(sm?2:2.4)}" stroke-linecap="round" stroke-linejoin="round"${s.dash?' stroke-dasharray="1.1 2.2"':''} style="--d:${dl}ms"/>`;
  if(s.dots!==false)body+=pts.map((p,i)=>`<circle class="pt" cx="${f2(p[0])}" cy="${f2(p[1])}" r="${sm?2.6:3.4}" fill="var(--surface)" stroke="${s.c}" stroke-width="${sm?1.7:2.1}" style="--d:${dl+520+i*40}ms"><title>${esc(s.name+' · '+xs[i]+' · '+(cfg.fmtL&&s.axis!=='r'?cfg.fmtL(s.v[i]):s.v[i]))}</title></circle>`).join('');});
 return `<div class="trendwrap"><svg class="chart" viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none" style="height:${Hh}px" role="img">${defs?'<defs>'+defs+'</defs>':''}${g}${xl}${body}</svg></div>`;
}
const keys=series=>`<div class="keys">${series.map(s=>`<span class="key" style="--c:${s.c}"><i${s.dash?' class="d"':''}></i>${esc(s.name)}</span>`).join('')}</div>`;
function donut(segs,mid,opt){
 opt=opt||{};const sw=opt.sw||14,tot=segs.reduce((a,s)=>a+s.v,0);let cum=0;const r=50-sw/2-1;
 const arcs=segs.map((s,i)=>{const p=tot?s.v/tot*100:0;if(p<=0)return '';const draw=Math.max(p-(segs.length>1?1.6:0),.6);
  const el=`<circle class="arc" cx="50" cy="50" r="${r}" fill="none" pathLength="100" stroke="${cc(s.c)}" stroke-width="${sw}" stroke-linecap="butt" stroke-dasharray="${f2(draw)} 100" stroke-dashoffset="${f2(-cum)}" style="--d:${140+i*120}ms"><title>${esc(s.k+' · '+pctT(p))}</title></circle>`;cum+=p;return el;}).join('');
 return `<div class="donut"><svg class="chart" viewBox="0 0 100 100" role="img"><g transform="rotate(-90 50 50)"><circle cx="50" cy="50" r="${r}" fill="none" stroke="var(--track)" stroke-width="${sw}"/>${arcs}</g></svg><div class="mid"><div class="n num">${mid.n}</div>${mid.l?`<div class="l">${esc(mid.l)}</div>`:''}</div></div>`;
}
function actA(a){if(!a)return '';let o='';if(a.nav)o+=` data-nav="${a.nav}"`;if(a.tab)o+=` data-ltab="${a.tab}"`;if(a.scroll)o+=` data-scroll="${esc(a.scroll)}"`;return o?o+' role="button" tabindex="0"':'';}
const has=a=>!!(a&&(a.nav||a.tab||a.scroll));
function legend(items){
 const tot=items.reduce((a,i)=>a+(i.v||0),0);
 return `<div class="legend">${items.map(it=>`<div class="lg${has(it.act)?' act':''}" style="--c:${cc(it.c)}"${actA(it.act)}><i></i><span class="nm">${esc(it.k)}</span><b class="num">${it.vh||N(it.v)}</b>${it.nosh?'':`<span class="sh num">${pctT(pct(it.v,tot))}</span>`}</div>`).join('')}</div>`;
}
function bars(rows,opt){
 opt=opt||{};const mx=opt.max||Math.max(1,...rows.map(r=>r.v));
 return `<div class="bars">${rows.map((r,i)=>`<div class="br"${actA(r.act)}><div class="l"><span class="nm">${esc(r.k)}</span>${r.right?`<span class="sh num">${r.right}</span>`:''}<b class="num">${r.vh||N(r.v)}</b></div><div class="bar${opt.thick?' thick':''}" style="--c:${cc(r.c||'var(--brand)')}"><i style="width:${f2(Math.min(pct(r.v,mx),100))}%;--d:${140+i*80}ms"></i></div></div>`).join('')}</div>`;
}
function funnel(st){
 const top=st[0].v;
 return `<div class="funnel">${st.map((s,i)=>{const p=pct(s.v,top),sh=i/Math.max(st.length-1,1);
  const c1=`color-mix(in srgb,var(--s1) ${Math.round(100-sh*46)}%,#1D2540)`,c2=`color-mix(in srgb,var(--s2) ${Math.round(52+sh*40)}%,var(--s1))`;
  return `<div class="fn${has(s.act)?' act':''}"${actA(s.act)}><div><div class="slab" style="--w:${f2(Math.max(p,16))}%;--c1:${c1};--c2:${c2};--d:${120+i*90}ms">${ICON(s.icon)}<span class="nm">${esc(s.k)}</span></div></div><div class="rd"><b class="num">${N(s.v)}</b><span class="num">${pctT(p,0)}</span></div></div>`;}).join('')}</div>`;
}
function steps(items){
 return `<div class="steps">${items.map((s,i)=>`<div class="st ${s.state||''}" style="--d:${120+i*90}ms"><div class="dot">${ICON(s.icon)}</div><div class="nm">${esc(s.k)}</div><div class="vv num">${esc(s.v)}</div><div class="pc num">${s.pc==null?'—':pctT(s.pc,0)}</div></div>`).join('')}</div>`;
}
function cols(labels,vals,opt){
 opt=opt||{};const sm=narrow();const W=sm?400:640,Hh=sm?200:220,L=8,R=8,T=22,B=26,iw=W-L-R,ih=Hh-T-B,n=vals.length,mx=niceMax(Math.max(...vals)),bw=iw/n*.56;
 return `<svg class="chart" viewBox="0 0 ${W} ${Hh}" style="height:${Hh}px" preserveAspectRatio="none" role="img">${[0,.5,1].map(f=>`<line class="gridline dash" x1="${L}" x2="${W-R}" y1="${f2(T+ih*f)}" y2="${f2(T+ih*f)}"/>`).join('')}
  ${vals.map((v,i)=>{const h=ih*v/mx,x=L+iw*(i+.5)/n-bw/2,y=T+ih-h,hi=i===opt.hi;
   return `<rect class="col" x="${f2(x)}" y="${f2(y)}" width="${f2(bw)}" height="${f2(Math.max(h,1))}" rx="6" fill="${hi?'var(--brand)':'color-mix(in srgb,var(--brand) 32%,var(--surface))'}" style="--d:${120+i*60}ms"><title>${esc(labels[i]+' · '+v+(opt.unit||''))}</title></rect>
   <text class="axis${sm?' sm':''}" x="${f2(x+bw/2)}" y="${f2(y-6)}" text-anchor="middle" style="font-weight:600;fill:${hi?'var(--brand)':'var(--text-subtle)'}">${v?N(v):'—'}</text>
   <text class="axis${sm?' sm':''}" x="${f2(x+bw/2)}" y="${Hh-8}" text-anchor="middle"${hi?' style="fill:var(--brand);font-weight:700"':''}>${esc(labels[i])}</text>`;}).join('')}</svg>`;
}
function spark(vals,c){
 const W=180,Hh=34,p=3,mx=Math.max(...vals),mn=Math.min(...vals),rg=(mx-mn)||1;
 const pts=vals.map((v,i)=>[p+(W-p*2)*i/(vals.length-1||1),p+(Hh-p*2)*(1-(v-mn)/rg)]);const d=smooth(pts,.3),id='sp'+(++gid);
 return `<svg class="chart" viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}" stop-opacity=".28"/><stop offset="100%" stop-color="${c}" stop-opacity="0"/></linearGradient></defs><path class="area" d="${d}L${W} ${Hh}L0 ${Hh}Z" fill="url(#${id})" style="--d:340ms"/><path class="line" d="${d}" fill="none" pathLength="100" stroke="${c}" stroke-width="2" stroke-linecap="round" style="--d:220ms"/></svg>`;
}
const CMAP={'var(--ok)':'var(--s1)','var(--warn-dot)':'var(--s4)','var(--bad-dot)':'var(--s5)'};
const cc=c=>CMAP[c]||c;
const chip=(k,txt,ic)=>`<span class="chip ${k||''}">${ic?ICON(ic):''}<span>${txt}</span></span>`;
function kpi(o){
 const tone=cc(o.tone||'var(--brand)'),on=has(o.act);
 return `<div class="kpi${on?' act':''}" style="--tone:${tone}"${actA(o.act)}>${on?`<span class="go">${ICON('next')}</span>`:''}<div class="top"><div class="k">${esc(o.k)}</div><div class="ic">${ICON(o.icon)}</div></div><div class="v num">${o.v}${o.unit?`<small>${esc(o.unit)}</small>`:''}</div><div class="foot">${o.chip||''}${o.d?`<span class="d">${esc(o.d)}</span>`:''}</div>${o.spark?`<div class="spark">${spark(o.spark,tone)}</div>`:''}</div>`;
}
function card(o){
 const link=o.link?`<span class="viewall"${actA(o.link)}>${esc(o.link.label||'View all')}${ICON('next')}</span>`:'';
 return `<section class="qv-card${o.cls?' '+o.cls:''}"${o.id?` id="${o.id}"`:''}><div class="qv-hd"><div class="grow"><h3>${esc(o.title)}</h3>${o.sub?`<div class="s">${esc(o.sub)}</div>`:''}</div>${o.meta||link?`<div class="meta">${o.meta||''}${link}</div>`:''}</div><div class="qv-body">${o.body}</div>${o.foot?`<div class="qv-foot">${o.foot}</div>`:''}</section>`;
}
const sec=t=>`<div class="sec"><span class="ttl">${esc(t)}</span><span class="ln"></span></div>`;
const figs=items=>`<div class="figs">${items.map(f=>`<div class="fig ${f.cls||''}"><div class="n num">${f.v}</div><div class="l">${esc(f.k)}</div></div>`).join('')}</div>`;
const strip=(cls,items)=>`<div class="strip ${cls}">${items.map(kpi).join('')}</div>`;

/* ---- live sites map: a schematic of Greater Sydney, no tiles ---- */
const HUB=[104,286];
function opsMap(opt){
 opt=opt||{};const W=640,Hh=narrow()?460:400;
 const blocks=[[36,54,150,104],[206,40,150,92],[376,44,120,86],[520,74,92,120],[40,182,120,96],[190,182,116,74],[336,168,132,96],[492,214,124,96],[70,300,150,76],[248,296,140,86],[410,320,150,62]];
 let s=`<rect width="${W}" height="${Hh}" fill="var(--mapland)"/>`+blocks.map((b,i)=>`<rect x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}" rx="12" fill="var(--mapblock)" opacity="${(.55+(i%3)*.14).toFixed(2)}"/>`).join('')+
  `<path d="M-10 250 C80 230,150 270,230 250 C320 228,380 280,460 262 C540 244,600 286,660 270" fill="none" stroke="var(--mapriver)" stroke-width="22" stroke-linecap="round"/>`+
  `<g stroke="var(--maproad)" stroke-width="5" stroke-linecap="round" opacity=".85"><path d="M0 168H640M0 300H640M182 0V${Hh}M486 0V${Hh}"/></g><g stroke="var(--maproad)" stroke-width="2.5" opacity=".55"><path d="M0 96H640M0 352H640M84 0V${Hh}M400 0V${Hh}M578 0V${Hh}"/></g>`;
 let lanes='',trucks='';
 (opt.routes||[]).forEach((j,ri)=>{const dest=S.jobs[j.dest];if(!dest)return;const mid=[(HUB[0]+dest.pt[0])/2+(ri%2?30:-24),(HUB[1]+dest.pt[1])/2+(ri%2?-36:28)];
  const col=j.st==='late'?'var(--warn-dot)':(j.st==='rest'?'var(--s3)':'var(--s1)');const id='rt'+ri;
  lanes+=`<path id="${id}" class="line" d="${smooth([HUB,mid,dest.pt],.3)}" fill="none" pathLength="100" stroke="${col}" stroke-width="3" stroke-dasharray="${j.st==='rest'?'4 6':''}" stroke-linecap="round" style="--d:${220+ri*140}ms"/>`;
  trucks+=`<g data-nav="journeys" style="cursor:pointer" transform="translate(${f2(mid[0])},${f2(mid[1])})"><circle r="6.5" fill="${col}" stroke="var(--surface)" stroke-width="2.4"/><title>${esc(j.id+' · '+j.driver+' · '+j.veh)}</title></g>`;});
 const sites=S.jobs.filter(j=>!j.arch&&j.pt).map((j,i)=>`<g class="site" data-nav="jobs" transform="translate(${j.pt[0]},${j.pt[1]})"><circle class="halo" r="20" fill="${j.c}" opacity="0"/><circle r="13" fill="${j.c}" stroke="var(--surface)" stroke-width="2.6"/><text y="4" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">${j.crew}</text><title>${esc(j.name+' · '+j.crew+' on site')}</title></g>`).join('');
 const hub=`<g transform="translate(${HUB[0]},${HUB[1]})"><rect x="-14" y="-14" width="28" height="28" rx="9" fill="var(--brand)" stroke="var(--surface)" stroke-width="2.4"/><g transform="translate(-8,-8) scale(.67)" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round">${IC.box}</g><text x="-21" y="4" text-anchor="end" font-size="11" font-weight="700" fill="var(--text-muted)">Enfield yard</text></g>`;
 return `<div class="map"><svg class="chart" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Live sites map">${s}${lanes}${sites}${hub}${trucks}</svg><div class="zoom"><button type="button" data-zoom="1" aria-label="Zoom in">+</button><button type="button" data-zoom="-1" aria-label="Zoom out">−</button></div></div>
 <div class="maplegend"><span style="--c:var(--brand)"><i></i>Job site · crew on site</span><span style="--c:var(--s1)"><i></i>Journey on time</span><span style="--c:var(--warn-dot)"><i></i>Running late</span><span style="--c:var(--s3)"><i></i>Rest break</span></div>`;
}

/* =====================================================================
   Shared cell renderers
   ===================================================================== */
const pill=(k,t,dot)=>`<span class="pill ${k}">${dot?'<i></i>':''}${esc(t)}</span>`;
const avatarFiles={'Liam Carter':'liam','Priya Nair':'priya','Josh Bennett':'josh','Mei Tanaka':'mei','Daniel Okafor':'daniel','Sophie Grant':'sophie','Aisha Rahman':'aisha','Tom Hughes':'tom','Grace Lee':'grace','Noah Williams':'noah','Chloe Martin':'chloe','Ben Foster':'ben'};
/* the prototype photo files were never supplied, so avatars are initials only until they are */
const portrait=n=>false&&avatarFiles[n]?`<img src="assets/prototype-photos/avatar-${avatarFiles[n]}.jpg" alt="" loading="lazy" onerror="this.remove()">`:'';
const protoPhoto=(file,cls,alt)=>`<img class="${cls}" src="assets/prototype-photos/${file}" alt="${esc(alt||'')}" loading="lazy" onerror="this.style.display='none'">`;
const person=(n,sub)=>`<div class="cell"><span class="av">${portrait(n)}${ini(n)}</span><span class="tx"><b>${esc(n)}</b>${sub?`<small>${esc(sub)}</small>`:''}</span></div>`;
const titled=(t,sub,c,mono)=>`<div class="cell">${c?`<i class="sq" style="background:${c}"></i>`:''}<span class="tx"><b>${esc(t)}</b>${sub?`<small${mono?' class="mono"':''}>${esc(sub)}</small>`:''}</span></div>`;
const jobTag=n=>n?`<span class="sw" style="background:${jobColor(n)}"></span>${esc(n)}`:'<span class="dash">—</span>';
const avs=names=>`<div class="avs">${names.map(n=>`<span class="av" title="${esc(n)}">${portrait(n)}${ini(n)}</span>`).join('')}<em>${names.length===1?esc(names[0]):''}</em></div>`;
const more=`<button class="rowbtn" type="button" aria-label="More actions" data-toast="Row menu|Edit, archive and delete would live here">${ICON('more')}</button>`;
const budgetCell=p=>{if(p==null)return '<span class="dash">—</span>';const over=p>100,warn=p>=85&&!over,c=over?'var(--bad-dot)':warn?'var(--warn-dot)':'var(--brand)';
 return `<div class="budget"><div class="bar"><i style="width:${Math.min(p,100)}%;--c:${c}"></i></div><b class="num" style="color:${over?'var(--bad)':warn?'var(--warn)':'var(--text-muted)'}">${p}%</b></div>`;};

/* =====================================================================
   List cards — tabs, search, filter chips, row actions
   ===================================================================== */
const LISTS={},LS={};
function listCard(lid,cfg){
 LISTS[lid]=cfg;const st=LS[lid]||(LS[lid]={tab:cfg.tabs?cfg.tabs[0].key:null,q:'',f:{}});
 return `<section class="qv-card list" data-list="${lid}" id="L-${lid}">
  ${cfg.title?`<div class="qv-hd"><div class="grow"><h3>${esc(cfg.title)}</h3>${cfg.sub?`<div class="s">${esc(cfg.sub)}</div>`:''}</div>${cfg.link?`<div class="meta"><span class="viewall"${actA(cfg.link)}>${esc(cfg.link.label)}${ICON('next')}</span></div>`:''}</div>`:''}
  ${cfg.tabs?`<div class="tabs" role="tablist">${cfg.tabs.map(t=>`<button type="button" role="tab" class="tab${st.tab===t.key?' on':''}" data-t="${t.key}">${esc(t.label)}<span class="tc num"></span></button>`).join('')}</div>`:''}
  <div class="toolbar"><label class="field">${ICON('search')}<input type="search" placeholder="${esc(cfg.search||'Search')}" value="${esc(st.q)}" aria-label="${esc(cfg.search||'Search')}"></label>
   ${(cfg.filters||[]).map((f,i)=>`<button type="button" class="chipf${st.f[i]?' on':''}" data-f="${i}">${esc(f.label)}</button>`).join('')}
   <button type="button" class="btn btn-ghost btn-sm clr" hidden>Clear filters</button><span class="grow"></span>
   <button type="button" class="btn btn-ghost btn-sm" data-toast="Export|A CSV of this list would download">${ICON('download')}<span>Export</span></button></div>
  <div class="tblwrap"><table class="tbl" style="min-width:${cfg.minW||0}px"><thead><tr>${cfg.cols.map(c=>`<th${c.r?' class="r"':''}>${esc(c.h)}</th>`).join('')}<th class="act"><span class="sr">Actions</span></th></tr></thead><tbody></tbody></table></div>
  <div class="empty" hidden><b>Nothing matches</b>Try another search or clear the filters.</div>
  <div class="tblfoot"><span class="cnt num"></span><span class="hint">Rows per page <b>25</b></span></div></section>`;
}
function fillList(lid,animate){
 const cfg=LISTS[lid],st=LS[lid],box=document.querySelector(`[data-list="${lid}"]`);if(!box)return;
 const q=st.q.trim().toLowerCase();
 const list=cfg.rows.map((r,i)=>[r,i]).filter(([r])=>(!cfg.tabOf||!st.tab||cfg.tabOf(r,st.tab))&&(!q||cfg.text(r).toLowerCase().includes(q))&&Object.keys(st.f).every(k=>!st.f[k]||cfg.filters[k].test(r)));
 if(cfg.tabs)$$('.tab',box).forEach(b=>{b.classList.toggle('on',b.dataset.t===st.tab);b.setAttribute('aria-selected',b.dataset.t===st.tab);$('.tc',b).textContent=cfg.rows.filter(r=>cfg.tabOf(r,b.dataset.t)).length;});
 $('tbody',box).innerHTML=list.map(([r,i],k)=>`<tr data-i="${i}"${cfg.href?` data-href="${cfg.href(r)}"`:''}${animate&&k<30?` class="rowin${cfg.href?' link':''}" style="--d:${k*28}ms"`:(cfg.href?' class="link"':'')}>${cfg.cols.map(c=>`<td${c.r?' class="r"':''}${c.strong?' class="strong"':''}>${c.v(r)}</td>`).join('')}<td>${cfg.action?cfg.action(r,i,lid):more}</td></tr>`).join('');
 const em=$('.empty',box);em.hidden=list.length>0;if(!list.length)em.innerHTML=(!cfg.rows.length&&typeof EMPTY_FIRST!=='undefined'&&EMPTY_FIRST[lid])?firstRunHtml(lid):'<b>Nothing matches</b>Try another search or clear the filters.';
 $('.cnt',box).textContent=list.length?`Showing 1–${list.length} of ${list.length}`:'No results';
 $$('.chipf',box).forEach(b=>b.classList.toggle('on',!!st.f[b.dataset.f]));
 $('.clr',box).hidden=!(st.q||Object.values(st.f).some(Boolean));
}
function mountLists(root){
 $$('[data-list]',root).forEach(box=>{const lid=box.dataset.list,st=LS[lid];
  $$('.tab',box).forEach(b=>b.addEventListener('click',()=>{st.tab=b.dataset.t;fillList(lid,true);}));
  const inp=$('.field input',box);inp.addEventListener('input',()=>{st.q=inp.value;fillList(lid);});
  $$('.chipf',box).forEach(b=>b.addEventListener('click',()=>{st.f[b.dataset.f]=!st.f[b.dataset.f];fillList(lid,true);}));
  $('.clr',box).addEventListener('click',()=>{st.q='';st.f={};inp.value='';fillList(lid,true);});
  fillList(lid,true);});
}
const actBtns=(lid,i,btns)=>`<div class="acts">${btns.map(b=>`<button type="button" class="btn btn-sm ${b.cls||''}${b.sq?' btn-sq':''}" data-act="${b.a}" data-lid="${lid}" data-i="${i}"${b.sq?` aria-label="${esc(b.label)}" title="${esc(b.label)}"`:''}>${b.icon?ICON(b.icon):''}${b.sq?'':esc(b.label)}</button>`).join('')}</div>`;

/* =====================================================================
   Derived numbers
   ===================================================================== */
const activeJobs=()=>S.jobs.filter(j=>!j.arch);
const cnt=(arr,f)=>arr.filter(f).length;
const pendingTime=()=>S.requests.filter(r=>r.status==='pending').length;
const awaitJsa=()=>cnt(S.jsas,j=>j.st==='await');
const overdueJsa=()=>cnt(S.jsas,j=>j.st==='overdue');
const lateJourneys=()=>cnt(S.journeys,j=>j.st==='late');
const tagSoon=()=>cnt(S.assets,a=>a.days>=0&&a.days<=14);
const tagExpired=()=>cnt(S.assets,a=>a.days<0);
const drafts=()=>S.shifts.filter(s=>s.draft&&!s.cancelled).length;
const hrsOf=s=>{const a=s[0].split(':'),b=s[1].split(':');return (b[0]*60+ +b[1]-a[0]*60-a[1])/60;};
const TODAY_ST={on:['ok','On site'],late:['warn','Late'],absent:['bad','Not clocked in'],break:['info','On break'],later:['neutral','Starts later']};

/* =====================================================================
   Views
   ===================================================================== */
const VIEWS={};
const btn=(label,icon,toast,ghost)=>`<button type="button" class="btn${ghost?' btn-ghost':''}" data-toast="${esc(toast)}">${icon?ICON(icon):''}<span class="lb">${esc(label)}</span></button>`;

/* ---------- Dashboard ---------- */
VIEWS.dash={title:'Operations dashboard',sub:'Northline Civil · Thursday 1 October 2026',grp:'main',icon:'dash',label:'Dashboard',
 act:()=>btn('Customise','sliders','Customise|Drag cards to reorder the dashboard',1)+btn('New job','plus','New job|The job form would open here'),
 render(){
  const al=[{n:cnt(S.today,t=>t.st==='late'||t.st==='absent'),k:'Late or absent',cls:'bad',a:{nav:'timeclock'}},
   {n:pendingTime(),k:'Time corrections',cls:'bad',a:{nav:'timeclock',tab:'timeclock:pending',scroll:'#L-timeclock'}},
   {n:awaitJsa()+overdueJsa(),k:'JSAs to action',cls:'warn',a:{nav:'jsas',tab:'jsas:await',scroll:'#L-jsas'}},
   {n:tagSoon()+tagExpired(),k:'Test & tag due',cls:'warn',a:{nav:'assets',tab:'assets:svc',scroll:'#L-assets'}},
   {n:lateJourneys(),k:'Journey running late',cls:'warn',a:{nav:'journeys',scroll:'#L-journeys'}},
   {n:drafts(),k:'Unpublished shifts',cls:'ok',a:{nav:'scheduler'}}];
  const attn=al.reduce((a,x)=>a+x.n,0);
  const series=[{name:'Rostered hours',c:'var(--s1)',v:H.rost,area:true},{name:'Clocked hours',c:'var(--s3)',v:H.clock},{name:'On-time clock-ins',c:'var(--s4)',v:H.ontime,axis:'r',dash:true,dots:false,w:2}];
  const att=[{k:'On site',v:31,c:'var(--ok)',act:{nav:'timeclock',tab:'timeclock:live'}},{k:'On break',v:4,c:'var(--s3)'},{k:'Late',v:3,c:'var(--warn-dot)',act:{scroll:'#L-today',tab:'today:late'}},{k:'Not clocked in',v:2,c:'var(--bad-dot)',act:{scroll:'#L-today',tab:'today:absent'}},{k:'Starts later',v:8,c:'var(--s7)'}];
  const road=S.journeys.filter(j=>['road','late','rest'].includes(j.st));
  const jobsBy=activeJobs().filter(j=>j.pct!=null).sort((a,b)=>b.pct-a.pct).slice(0,5);
  return `<div class="page">
   ${sec('Overview')}
   ${strip('five',[
    {k:'On the clock now',icon:'clock',v:'31',unit:'/ 48',chip:chip('brand','65% of rostered'),d:'across 8 jobs',spark:[26,28,30,27,31,29,31],act:{nav:'timeclock',tab:'timeclock:live',scroll:'#L-timeclock'}},
    {k:'Active jobs',icon:'jobs',tone:'var(--s3)',v:activeJobs().length,chip:chip('info','3 start this week'),spark:[6,6,7,7,8,8,8],act:{nav:'jobs',scroll:'#L-jobs'}},
    {k:'Rostered hours',icon:'cal',tone:'var(--s6)',v:N(1284),chip:chip('up','+6%','trend'),d:'vs last week',spark:H.rost,act:{nav:'scheduler'}},
    {k:'JSAs to sign off',icon:'shield',tone:'var(--warn-dot)',v:awaitJsa(),chip:overdueJsa()?chip('down',overdueJsa()+' overdue'):chip('up','none overdue'),spark:[3,2,4,1,3,2,awaitJsa()||1],act:{nav:'jsas',tab:'jsas:await',scroll:'#L-jsas'}},
    {k:'Needs attention',icon:'alert',tone:'var(--bad-dot)',v:attn,chip:chip('down','Act today','alert'),d:'items',spark:[9,12,8,11,10,9,attn],act:{scroll:'#alerts'}}])}
   <div class="g trend">
    ${card({title:'Workforce trend',sub:'Last 7 days · rostered vs clocked hours',meta:chip('','7d','clock'),body:trend({x:DAYS,series,right:true,minR:80,maxR:100,minL:1000,maxL:1300,h:250})+keys(series)+figs([{k:'Best day',v:N(1284)+' h'},{k:'Daily average',v:N(Math.round(H.rost.reduce((a,b)=>a+b)/7))+' h'},{k:'On time, 7-day',v:'92%',cls:'ok'},{k:'Overtime, 7-day',v:N(H.ot.reduce((a,b)=>a+b))+' h',cls:'warn'}])})}
    ${card({title:'Shift attendance',sub:'Today’s 48 rostered shifts',body:donut(att,{n:'92%',l:'on time'},{})+legend(att),foot:'<span>Target</span><b class="num">95%</b>'})}
   </div>
   <div class="g map">
    ${card({title:'Live sites map',sub:'Crew on site and journeys on the road',link:{nav:'journeys',label:'All journeys'},body:opsMap({routes:road})})}
    ${card({title:'Today’s shift pipeline',sub:'From roster to boots on site',body:funnel([{k:'Rostered',v:48,icon:'cal',act:{nav:'scheduler'}},{k:'Published',v:46,icon:'send',act:{nav:'scheduler'}},{k:'JSA signed',v:41,icon:'shield',act:{nav:'jsas'}},{k:'Clocked in',v:35,icon:'clock',act:{nav:'timeclock'}},{k:'In geofence',v:31,icon:'pin',act:{nav:'timeclock'}}])+figs([{k:'Hours today',v:'186.5'},{k:'Crews on site',v:'8'},{k:'Avg crew size',v:'3.9'}]),foot:'<span>Rostered → in geofence</span><b class="num">65%</b>'})}
   </div>
   ${sec('Operational board')}
   ${listCard('today',{title:'Today’s shifts',sub:'Live from the time clock',link:{nav:'scheduler',label:'Open scheduler'},rows:S.today,
     tabs:[{key:'all',label:'All'},{key:'on',label:'On site'},{key:'late',label:'Late'},{key:'absent',label:'Not clocked in'}],tabOf:(r,k)=>k==='all'||r.st===k,
     search:'Search employee or job',text:r=>r.name+' '+r.job,minW:860,
     cols:[{h:'Employee',v:r=>person(r.name,r.role)},{h:'Job',v:r=>jobTag(r.job)},{h:'Shift',v:r=>r.shift},{h:'Clocked in',v:r=>r.in||'<span class="dash">—</span>'},{h:'Status',v:r=>pill(TODAY_ST[r.st][0],r.st==='late'?'Late '+r.late+' min':TODAY_ST[r.st][1],1)}],
     action:(r,i,lid)=>r.st==='absent'?actBtns(lid,i,[{a:'call',label:'Call',cls:'btn-ok'}]):more,
     onAct:(a,r)=>toast('Calling '+r.name,'Their phone number is on file')})}
   <div class="g c3">
    <section class="qv-card"><div class="qv-hd"><div class="grow"><h3>On the road</h3><div class="s">${road.length} journeys in progress</div></div><div class="meta"><span class="viewall" data-nav="journeys">View all${ICON('next')}</span></div></div>
     <div style="padding-bottom:6px">${road.map(j=>`<div class="roadcard" data-nav="journeys"><span class="grow"><div class="rid">${esc(j.veh)}<span>${esc(j.driver)}</span></div><div class="l2">${esc(j.from)} → ${esc(j.to)}</div><div class="eta">ETA<b class="num${j.st==='late'?' late':''}">${esc(j.eta)}${j.late?' (+'+j.late+' min)':''}</b></div></span><span class="glyph${j.st==='late'?' late':''}">${ICON(j.st==='rest'?'timer':'truck')}</span></div>`).join('')}</div></section>
    <section class="qv-card"><div class="qv-hd"><div class="grow"><h3>Needs attention</h3><div class="s">Oldest first</div></div></div>
     <div class="exlist">${al.filter(x=>x.n).slice(0,5).map(x=>`<div class="exrow${x.cls==='bad'?'':' warn'}"${actA(x.a)}><i></i><span class="grow"><div class="t1">${esc(x.k)}</div><div class="t2">${x.a.nav?esc(VIEWS[x.a.nav].label):''}</div></span><span class="n num">${x.n}</span></div>`).join('')}</div></section>
    ${card({title:'Budget used',sub:'Highest first',link:{nav:'jobs',label:'All jobs'},body:bars(jobsBy.map(j=>({k:j.name,v:j.pct,vh:j.pct+'%',c:j.pct>100?'var(--bad-dot)':j.pct>=85?'var(--warn-dot)':'var(--brand)',act:{nav:'jobs'}})),{max:110,thick:true})})}
   </div>
   <div class="alerts" id="alerts"><div class="hd"><span class="g">${ICON('alert')}</span><span><b>Live alerts</b><span>Tap a tile to open its board</span></span></div>
    <div class="row">${al.map((x,i)=>`<button type="button" class="alert ${x.cls}"${actA(x.a)} style="--d:${300+i*60}ms"><b class="num">${x.n}</b><span>${esc(x.k)}</span></button>`).join('')}</div></div>
  </div>`;}};

/* ---------- My Company ---------- */
const kv=rows=>`<div class="kv">${rows.map(([k,v])=>`<div><span>${esc(k)}</span><b>${v}</b></div>`).join('')}</div>`;
const setVal=(label,sub,val)=>`<div class="setrow"><span class="grow"><b>${esc(label)}</b>${sub?`<small>${esc(sub)}</small>`:''}</span><span class="val">${esc(val)}</span></div>`;
const setTog=(key,label,sub)=>{const on=!!S.company.flags[key];return `<div class="setrow"><span class="grow"><b>${esc(label)}</b>${sub?`<small>${esc(sub)}</small>`:''}</span><button type="button" class="tog${on?' on':''}" data-tog="${key}" role="switch" aria-checked="${on}" aria-label="${esc(label)}"><i></i></button></div>`;};
VIEWS.company={title:'My Company',sub:'Company details, time and pay rules, notifications and journey settings.',grp:'main',icon:'company',label:'My Company',
 act:()=>btn('Edit company','sliders','Edit company|Name, contact, tax and regional settings'),
 render(){
  const c=S.company,on=cnt(c.notifs,n=>n.on);
  return `<div class="page">
   ${strip('four',[
    {k:'Employees',icon:'users',v:48,d:'9 working today',act:{nav:'employees'}},
    {k:'Active jobs',icon:'jobs',tone:'var(--s3)',v:activeJobs().length,act:{nav:'jobs'}},
    {k:'Customers',icon:'building',tone:'var(--s6)',v:cnt(S.customers,x=>x.st==='active'),act:{nav:'customers'}},
    {k:'Notifications on',icon:'bell',tone:'var(--s4)',v:on,d:'of '+c.notifs.length+' set up',act:{scroll:'#L-notifs'}}])}
   <div class="g c2">
    ${card({title:'Company information',sub:'Shown on invoices and exports',body:kv([['Legal name',esc(c.legal)],['Company code',`<span class="mono">${c.code}</span>`],['ABN',esc(c.abn)],['Address',esc(c.addr)],['Email',esc(c.email)],['Phone',esc(c.phone)],['Tax','GST registered'],['KYC status',pill('ok','Verified',1)],['Onboarding',pill('ok','Complete',1)]])})}
    ${card({title:'Regional settings',sub:'Used for dates, times and distances',body:kv([['Timezone','Australia/Sydney'],['Currency','AUD'],['Date format','DD/MM/YYYY'],['Time format','24-hour'],['Start of week','Monday'],['Length format','Kilometres'],['Language','English']])})}
   </div>
   <div class="g c2">
    ${card({title:'Time & shifts',sub:'How the time clock rounds and approves hours',body:
     setTog('approval','Shift approval required','Supervisors approve hours before payroll')+
     setTog('roundIn','Round clock-in time','To the nearest 15 minutes')+
     setTog('roundOut','Round clock-out time','Off · exact time is kept')+
     setTog('overtime','Allow overtime','Hours over the regular day go to the overtime rules')+
     setVal('Shift regular hours','Before overtime starts','8 h')+
     setTog('multiplier','Hour range multiplier','Different rates for early and late hours')+
     setVal('Overhead','Added to job cost','18%')+
     setVal('Login session','Before staff sign in again','12 h')})}
    ${card({title:'Journey management',sub:'Driving safety for trips between sites',body:
     setTog('lateAlert','Late-trip alerts','Tell supervisors when a trip runs late')+
     setVal('Late after','Past the planned arrival time','15 min')+
     setVal('Rest break','Fatigue reminder while driving','Every 2 h')+
     setTog('digest','Weekly safety digest','Summary of trips, breaks and late arrivals')+
     setVal('Inspection expiry','Minimum days left to take a vehicle','14 days')+
     setVal('Hazard feeds','Road closures and incidents','NSW · VIC')})}
   </div>
   ${listCard('rulesets',{title:'Overtime & pay rules',sub:'Rulesets used to work out pay from approved hours',rows:c.rulesets,search:'Search rulesets',text:r=>r.name+' '+r.applies+' '+r.rules,minW:820,
    cols:[{h:'Ruleset',v:r=>`<b style="color:var(--text)">${esc(r.name)}</b>`},{h:'Applies to',v:r=>esc(r.applies)},{h:'Rules',v:r=>`<span style="white-space:normal">${esc(r.rules)}</span>`},{h:'Employees',r:1,v:r=>r.emp},{h:'Type',v:r=>r.def?pill('info','Default'):pill('neutral','Custom')}]})}
   ${listCard('notifs',{title:'Notifications',sub:'Who hears about what, and how',rows:c.notifs,search:'Search notifications',text:r=>r.type+' '+r.to+' '+r.by,minW:900,
    cols:[{h:'Notification',v:r=>`<b style="color:var(--text)">${esc(r.type)}</b>`},{h:'Notify by',v:r=>esc(r.by)},{h:'Recipients',v:r=>esc(r.to)},{h:'When',v:r=>esc(r.when)},{h:'Status',v:r=>r.on?pill('ok','On',1):pill('neutral','Off',1)}],
    action:(r,i,lid)=>actBtns(lid,i,[{a:'flip',label:r.on?'Turn off':'Turn on',cls:'btn-ghost'}]),
    onAct:(a,r)=>{r.on=!r.on;toast('Notification '+(r.on?'on':'off'),r.type);}})}
  </div>`;}};

/* ---------- Jobs ---------- */
VIEWS.jobs={title:'Jobs',sub:'Sites, crews and costs for every job your company runs.',grp:'ops',icon:'jobs',label:'Jobs',count:()=>activeJobs().length,
 act:()=>btn('Export','download','Export|A CSV of all jobs would download',1)+btn('New job','plus','New job|The job form would open here'),
 render(){
  const a=activeJobs(),costed=a.filter(j=>j.pct!=null),est=costed.reduce((s,j)=>s+j.est,0),sell=costed.reduce((s,j)=>s+j.sell,0);
  const avg=Math.round(costed.reduce((s,j)=>s+j.pct,0)/costed.length),over=cnt(costed,j=>j.pct>100),watch=cnt(costed,j=>j.pct>=85&&j.pct<=100);
  const health=[{k:'Healthy · under 85%',v:costed.length-over-watch,c:'var(--ok)'},{k:'Watch · 85–100%',v:watch,c:'var(--warn-dot)',act:{scroll:'#L-jobs',tab:'jobs:active'}},{k:'Over budget',v:over,c:'var(--bad-dot)'}];
  return `<div class="page">
   ${strip('five',[
    {k:'Active jobs',icon:'jobs',v:a.length,chip:chip('brand',cnt(S.jobs,j=>j.arch)+' archived'),act:{scroll:'#L-jobs',tab:'jobs:active'}},
    {k:'Estimated cost',icon:'receipt',tone:'var(--s3)',v:short(est),d:'across costed jobs',act:{scroll:'#qvBudget'}},
    {k:'Sell value',icon:'card',tone:'var(--s6)',v:short(sell),chip:chip('up',pctT(pct(sell-est,sell),0)+' margin'),act:{scroll:'#qvBudget'}},
    {k:'Average budget used',icon:'trend',tone:'var(--warn-dot)',v:avg+'%',d:'weighted by job',act:{scroll:'#qvBudget'}},
    {k:'Over budget',icon:'alert',tone:'var(--bad-dot)',v:over,chip:over?chip('down','Review costs'):chip('up','All within'),act:{scroll:'#qvBudget'}}])}
   <div class="g wl">
    ${card({title:'Budget used by job',sub:'Cost to date against estimate',id:'qvBudget',body:bars(costed.sort((x,y)=>y.pct-x.pct).map(j=>({k:j.name,v:j.pct,vh:j.pct+'%',right:short(j.est),c:j.pct>100?'var(--bad-dot)':j.pct>=85?'var(--warn-dot)':j.c})),{max:110,thick:true}),foot:'<span>Total estimate</span><b class="num">$'+N(est)+'</b>'})}
    ${card({title:'Budget health',sub:'Costed jobs by how much budget is used',cls:'aside',body:donut(health,{n:costed.length,l:'costed jobs'},{sw:15})+legend(health)})}
   </div>
   ${listCard('jobs',{href:r=>'jobs/'+r.id,rows:S.jobs,tabs:[{key:'active',label:'Active'},{key:'archived',label:'Archived'}],tabOf:(r,k)=>k==='active'?!r.arch:r.arch,
    search:'Search by name, code or address',filters:[{label:'Geofence on',test:r=>r.geo>0},{label:'Over 85% budget',test:r=>r.pct>=85}],
    text:r=>r.name+' '+r.code+' '+r.addr+' '+r.cust,minW:1100,
    cols:[{h:'Job',v:r=>titled(r.name,r.code,r.c,1)},{h:'Customer',v:r=>esc(r.cust)},{h:'Supervisors',v:r=>avs(r.sups)},{h:'Geofence',v:r=>r.geo?'On · '+r.geo+' m':'<span class="dash">Off</span>'},{h:'On site',r:1,v:r=>r.crew?`<b class="num" style="color:var(--text)">${r.crew}</b>`:'<span class="dash">0</span>'},{h:'Est. cost',r:1,v:r=>money(r.est)},{h:'Sell price',r:1,v:r=>money(r.sell)},{h:'Budget used',v:r=>budgetCell(r.pct)},{h:'Status',v:r=>pill(JOBST[r.status][0],JOBST[r.status][1],1)},{h:'Created',v:r=>esc(r.created)}],
    action:(r)=>jobMenuBtn(r)})}
  </div>`;}};

/* ---------- Scheduler ---------- */
const SCH={filter:'all',q:''};
VIEWS.scheduler={title:'Scheduler',sub:'Week of 28 Sep – 4 Oct 2026 · drag shifts to reassign.',grp:'ops',icon:'cal',label:'Scheduler',
 count:()=>drafts()||null,
 act:()=>`<button type="button" class="btn btn-ghost" data-toast="Previous week|Would load 21 – 27 Sep" aria-label="Previous week"><span style="display:inline-flex;transform:scaleX(-1)">${ICON('next')}</span></button>`+btn('Today','cal','Today|Already showing this week',1)+`<button type="button" class="btn" data-cmd="publish"${drafts()?'':' disabled'}>${ICON('send')}<span class="lb">Publish ${drafts()} shifts</span></button>`,
 render(){
  const all=S.sched.flatMap(p=>p.days.flat().map(s=>({p,s}))),hours=all.reduce((a,x)=>a+hrsOf(x.s),0),open=cnt(all,x=>x.p.open);
  const dayH=[0,1,2,3,4,5,6].map(d=>Math.round(S.sched.reduce((a,p)=>a+p.days[d].reduce((b,s)=>b+hrsOf(s),0),0)));
  const byJob={};all.forEach(x=>{byJob[x.s[2]]=(byJob[x.s[2]]||0)+hrsOf(x.s);});
  const jobSeg=Object.keys(byJob).sort((a,b)=>byJob[b]-byJob[a]).map(k=>({k,v:Math.round(byJob[k]),c:jobColor(k),vh:Math.round(byJob[k])+' h'}));
  const labels=['Mon 28','Tue 29','Wed 30','Thu 1','Fri 2','Sat 3','Sun 4'];
  const q=SCH.q.trim().toLowerCase();
  const rows=S.sched.filter(p=>(SCH.filter==='all'||(SCH.filter==='open'?p.open:!p.open))&&(!q||p.open||p.name.toLowerCase().includes(q)));
  return `<div class="page">
   ${strip('five',[
    {k:'Shifts this week',icon:'cal',v:all.length,spark:[52,55,51,58,56,54,all.length],act:{scroll:'#sched'}},
    {k:'Rostered hours',icon:'clock',tone:'var(--s3)',v:N(Math.round(hours)),unit:'h',d:'this roster',act:{scroll:'#qvDay'}},
    {k:'Assigned',icon:'users',tone:'var(--ok)',v:all.length-open,chip:chip('up',pctT(pct(all.length-open,all.length),0)+' filled'),act:{scroll:'#sched'}},
    {k:'Unassigned',icon:'alert',tone:'var(--warn-dot)',v:open,chip:open?chip('warn','Needs crew'):chip('up','All filled'),act:{scroll:'#sched'}},
    {k:'Drafts',icon:'send',tone:'var(--s7)',v:drafts(),d:'not sent to staff',act:{scroll:'#sched'}}])}
   <div class="g wl">
    ${card({title:'Hours by day',sub:'Rostered hours across the week · today highlighted',id:'qvDay',body:cols(labels,dayH,{hi:3,unit:' h'})})}
    ${card({title:'Hours by job',sub:'Where this week’s labour goes',cls:'aside',body:donut(jobSeg,{n:N(Math.round(hours)),l:'hours'},{sw:15})+legend(jobSeg)})}
   </div>
   <section class="qv-card" id="sched"><div class="qv-hd"><div class="grow"><h3>Week roster</h3><div class="s">Dashed = draft, not sent to staff yet</div></div></div>
    <div class="toolbar"><label class="field" style="width:240px">${ICON('search')}<input type="search" id="schQ" placeholder="Find employee" value="${esc(SCH.q)}" aria-label="Find employee"></label>
     ${[['all','Everyone'],['assigned','Assigned'],['open','Unassigned']].map(([k,l])=>`<button type="button" class="chipf${SCH.filter===k?' on':''}" data-sf="${k}">${l}</button>`).join('')}
     <div class="legendrow"><span><i style="background:color-mix(in srgb,var(--brand) 14%,var(--surface));border:1px solid color-mix(in srgb,var(--brand) 30%,transparent)"></i>Published</span><span><i style="border:1px dashed var(--border-strong)"></i>Draft</span></div></div>
    <div class="tblwrap"><div class="sched">
     <div class="srow shead"><div>Employee</div>${labels.map((l,i)=>`<div${i===3?' class="today"':''}><span class="dw">${l.split(' ')[0]}</span><span class="dt num">${l.split(' ')[1]}</span><span class="hr num">${dayH[i]} h</span></div>`).join('')}</div>
     ${rows.map(p=>{const tot=p.days.flat().reduce((a,s)=>a+hrsOf(s),0),c=p.days.flat().length;
      return `<div class="srow${p.open?' open':''}"><div class="who2"><span class="av">${p.open?'?':ini(p.name)}</span><span><b>${esc(p.name)}</b><small class="num${tot>48?' over':''}">${p.open?c+' open shifts':Math.round(tot*10)/10+' h'+(tot>48?' · over 48':'')}</small></span></div>
      ${p.days.map((d,i)=>`<div class="scell${i===3?' today':''}">${d.map(s=>`<button type="button" class="shift${s[3]?' draft':''}" style="--c:${jobColor(s[2])}" data-toast="${esc(s[2])}|${s[0]}–${s[1]}${s[3]?' · draft':''}"><b class="num">${s[0]}–${s[1]}</b><span>${esc(s[2])}</span></button>`).join('')}${d.length?'':'<button type="button" class="add" data-toast="Add shift|The shift form would open for this cell">+ Add</button>'}</div>`).join('')}</div>`;}).join('')}
    </div></div></section>
  </div>`;},
 mount(root){
  const q=$('#schQ',root);q.addEventListener('input',()=>{SCH.q=q.value;rerender(true);setTimeout(()=>{const n=$('#schQ');n.focus();n.setSelectionRange(n.value.length,n.value.length);});});
  $$('[data-sf]',root).forEach(b=>b.addEventListener('click',()=>{SCH.filter=b.dataset.sf;rerender(true);}));
 }};

/* ---------- Time Clock ---------- */
const TC={ok:['ok','Approved'],pending:['warn','Pending approval'],live:['info','On the clock'],rejected:['bad','Rejected']};
VIEWS.timeclock={title:'Time Clock',sub:'Clock-ins, timesheets and correction requests.',grp:'ops',icon:'clock',label:'Time Clock',count:()=>pendingTime()||null,bad:true,
 act:()=>btn('Export timesheet','download','Export|Timesheets for this week would download',1)+btn('Add time entry','plus','Add time entry|The entry form would open here'),
 render(){
  const src={};S.time.forEach(t=>{const k=t.src.startsWith('App')?'App':t.src;src[k]=(src[k]||0)+1;});
  const srcSeg=[{k:'App',v:src.App||0,c:'var(--s1)'},{k:'Kiosk',v:src.Kiosk||0,c:'var(--s3)'},{k:'Manual edit',v:src['Manual edit']||0,c:'var(--warn-dot)',act:{scroll:'#L-timeclock',tab:'timeclock:pending'}}];
  const series=[{name:'Clock-ins',c:'var(--s1)',v:H.clockins,area:true},{name:'On time %',c:'var(--s4)',v:H.ontime,axis:'r',dash:true,dots:false,w:2}];
  return `<div class="page">
   ${strip('five',[
    {k:'On the clock now',icon:'clock',v:31,spark:[26,28,30,27,31,29,31],d:'across 8 jobs',act:{scroll:'#L-timeclock',tab:'timeclock:live'}},
    {k:'Hours logged today',icon:'timer',tone:'var(--s3)',v:'186.5',unit:'h',chip:chip('up','+12 h'),act:{scroll:'#qvClock'}},
    {k:'Correction requests',icon:'doc',tone:'var(--warn-dot)',v:pendingTime(),chip:pendingTime()?chip('warn','Oldest 2 days'):chip('up','All clear'),act:{scroll:'#L-timeclock',tab:'timeclock:pending'}},
    {k:'Clocked in over 12 h',icon:'alert',tone:'var(--bad-dot)',v:cnt(S.time,t=>t.st==='live'&&t.hrs>12),d:'Sophie Grant',act:{scroll:'#L-timeclock',tab:'timeclock:live'}},
    {k:'Manual edits',icon:'sliders',tone:'var(--s7)',v:src['Manual edit']||0,d:'this week',act:{scroll:'#qvSrc'}}])}
   <div class="g trend">
    ${card({title:'Clock-ins',sub:'Last 7 days · count and punctuality',id:'qvClock',body:trend({x:DAYS,series,right:true,minR:80,maxR:100,h:230})+keys(series)})}
    ${card({title:'How time was captured',sub:'Source of each entry this week',id:'qvSrc',body:donut(srcSeg,{n:S.time.length,l:'entries'},{sw:15})+legend(srcSeg)})}
   </div>
   ${listCard('timeclock',{rows:S.time,tabs:[{key:'all',label:'All entries'},{key:'pending',label:'Pending approval'},{key:'live',label:'On the clock'},{key:'ok',label:'Approved'}],tabOf:(r,k)=>k==='all'||r.st===k,
    search:'Search employee or job',filters:[{label:'Manual edits',test:r=>r.src==='Manual edit'},{label:'Overtime',test:r=>r.hrs>9}],text:r=>r.name+' '+r.job,minW:1080,
    cols:[{h:'Employee',v:r=>person(r.name,r.role)},{h:'Job',v:r=>jobTag(r.job)},{h:'Date',v:r=>esc(r.date)},{h:'In',v:r=>r.in},{h:'Out',v:r=>r.out||'<span class="dash">—</span>'},{h:'Break',v:r=>r.brk},{h:'Hours',r:1,v:r=>`<b class="num" style="color:${r.hrs>9?'var(--warn)':'var(--text)'}">${r.hrs.toFixed(1)}</b>`},{h:'Source',v:r=>r.src==='Manual edit'?'<span style="color:var(--warn);font-weight:600">Manual edit</span>':esc(r.src)},{h:'Status',v:r=>pill(TC[r.st][0],TC[r.st][1],1)}],
    action:(r,i,lid)=>r.st==='pending'?actBtns(lid,i,[{a:'reject',label:'Reject',icon:'close',sq:1,cls:'btn-ghost'},{a:'approve',label:'Approve',icon:'check',sq:1}]):more,
    onAct:(a,r)=>{r.st=a==='approve'?'ok':'rejected';toast(a==='approve'?'Approved':'Rejected',r.name+' · '+r.date);}})}
  </div>`;}};

/* ---------- JSAs ---------- */
const JS={approved:['ok','Approved'],await:['warn','Awaiting sign-off'],progress:['info','In progress'],overdue:['bad','Overdue'],sent:['neutral','Sent']};
VIEWS.jsas={title:'JSAs',sub:'Job safety analyses for today’s work, from your templates.',grp:'ops',icon:'shield',label:'JSAs',count:()=>awaitJsa()+overdueJsa()||null,bad:true,
 act:()=>btn('Templates','doc','Templates|The template builder would open',1)+btn('Assign JSA','plus','Assign JSA|Pick a template, job and responsible people'),
 render(){
  const n=S.jsas.length,started=cnt(S.jsas,j=>j.ans>0),sub=cnt(S.jsas,j=>j.ans===j.q),signed=cnt(S.jsas,j=>j.st==='approved');
  const segs=Object.keys(JS).map((k,i)=>({k:JS[k][1],v:cnt(S.jsas,j=>j.st===k),c:['var(--ok)','var(--warn-dot)','var(--s3)','var(--bad-dot)','var(--s7)'][i],act:{scroll:'#L-jsas',tab:'jsas:'+k}}));
  return `<div class="page">
   ${strip('five',[
    {k:'Due today',icon:'shield',v:n,d:'for 6 jobs',act:{scroll:'#L-jsas',tab:'jsas:all'}},
    {k:'Submitted',icon:'doc',tone:'var(--s3)',v:sub,chip:chip('info',pctT(pct(sub,n),0)+' of today'),act:{scroll:'#qvJsaRun'}},
    {k:'Awaiting sign-off',icon:'hour',tone:'var(--warn-dot)',v:awaitJsa(),d:'you are the approver',act:{scroll:'#L-jsas',tab:'jsas:await'}},
    {k:'Overdue',icon:'alert',tone:'var(--bad-dot)',v:overdueJsa(),d:'shift already started',act:{scroll:'#L-jsas',tab:'jsas:overdue'}},
    {k:'Hazards flagged',icon:'eye',tone:'var(--s6)',v:S.jsas.reduce((a,j)=>a+j.haz,0),d:'need a control',act:{scroll:'#L-jsas'}}])}
   <div class="g wl">
    ${card({title:'Today’s JSA run',sub:'From assigned to signed off',id:'qvJsaRun',body:steps([{k:'Sent to crew',icon:'send',v:N(n),pc:100,state:'done'},{k:'Started',icon:'eye',v:started+' / '+n,pc:pct(started,n),state:started===n?'done':'now'},{k:'Submitted',icon:'doc',v:sub+' / '+n,pc:pct(sub,n),state:sub===n?'done':'now'},{k:'Signed off',icon:'checkc',v:signed+' / '+n,pc:pct(signed,n),state:signed===n?'done':(signed?'now':'')}]),foot:'<span>Signed off</span><b class="num">'+pctT(pct(signed,n),0)+'</b>'})}
    ${card({title:'JSAs by status',sub:'Tap a row to filter the list',cls:'aside',body:donut(segs,{n,l:'today'},{sw:15})+legend(segs)})}
   </div>
   ${listCard('jsas',{rows:S.jsas,tabs:[{key:'all',label:'All'},{key:'await',label:'Awaiting sign-off'},{key:'progress',label:'In progress'},{key:'approved',label:'Approved'},{key:'overdue',label:'Overdue'},{key:'sent',label:'Sent'}],tabOf:(r,k)=>k==='all'||r.st===k,
    search:'Search JSA, job or person',filters:[{label:'Hazards flagged',test:r=>r.haz>0},{label:'Has photos',test:r=>r.photos>0}],text:r=>r.tpl+' '+r.id+' '+r.job+' '+r.resp.join(' '),minW:1060,
    cols:[{h:'JSA',v:r=>titled(r.tpl,r.id,null,1)},{h:'Job',v:r=>jobTag(r.job)},{h:'Responsible',v:r=>avs(r.resp)},{h:'Shift',v:r=>esc(r.shift)},{h:'Answered',v:r=>`<div class="budget"><div class="bar"><i style="width:${pct(r.ans,r.q)}%;--c:var(--brand)"></i></div><b class="num">${r.ans}/${r.q}</b></div>`},{h:'Hazards',v:r=>r.haz?`<span style="color:var(--warn);font-weight:600">${r.haz} flagged</span>`:'<span class="dash">None</span>'},{h:'Status',v:r=>pill(JS[r.st][0],JS[r.st][1],1)}],
    action:(r,i,lid)=>r.st==='await'?actBtns(lid,i,[{a:'sign',label:'Sign off'}]):actBtns(lid,i,[{a:'view',label:'View',cls:'btn-ghost'}]),
    onAct:(a,r)=>{if(a==='sign'){r.st='approved';toast('JSA signed off',r.tpl+' · '+r.job);}else toast(r.tpl,'The submitted answers and photos would open');}})}
  </div>`;}};

/* ---------- Journeys ---------- */
const JR={road:['info','On the road'],rest:['neutral','Rest break'],late:['warn','Running late'],planned:['neutral','Planned'],done:['ok','Completed']};
VIEWS.journeys={title:'Journeys',sub:'Trip plans, check-ins and fatigue breaks for staff driving between sites.',grp:'res',icon:'route',label:'Journeys',count:()=>cnt(S.journeys,j=>['road','late','rest'].includes(j.st))||null,
 act:()=>btn('Plan journey','plus','Plan journey|Route, driver, vehicle and passengers'),
 render(){
  const road=S.journeys.filter(j=>['road','late','rest'].includes(j.st));
  const segs=[{k:'On the road',v:cnt(S.journeys,j=>j.st==='road'),c:'var(--s1)'},{k:'Running late',v:lateJourneys(),c:'var(--warn-dot)'},{k:'Rest break',v:cnt(S.journeys,j=>j.st==='rest'),c:'var(--s3)'},{k:'Planned',v:cnt(S.journeys,j=>j.st==='planned'),c:'var(--s7)'},{k:'Completed',v:cnt(S.journeys,j=>j.st==='done'),c:'var(--s6)'}];
  return `<div class="page">
   ${strip('five',[
    {k:'On the road now',icon:'truck',v:road.length,chip:chip('info',cnt(S.journeys,j=>j.st==='rest')+' on a break'),act:{scroll:'#qvMap'}},
    {k:'Planned today',icon:'route',tone:'var(--s3)',v:cnt(S.journeys,j=>j.st==='planned'),d:'later today',act:{scroll:'#L-journeys',tab:'journeys:planned'}},
    {k:'Running late',icon:'timer',tone:'var(--warn-dot)',v:lateJourneys(),d:'Ute 07 · +25 min',act:{scroll:'#L-journeys',tab:'journeys:active'}},
    {k:'Kilometres today',icon:'pin',tone:'var(--s6)',v:N(S.journeys.filter(j=>!j.dep.startsWith('Wed')).reduce((a,j)=>a+j.km,0)),unit:'km',act:{scroll:'#L-journeys'}},
    {k:'Missed check-ins',icon:'checkc',tone:'var(--ok)',v:0,chip:chip('up','This week'),act:{scroll:'#L-journeys'}}])}
   <div class="g map">
    ${card({title:'Live journeys',sub:'Dots show where each vehicle is now',id:'qvMap',body:opsMap({routes:road})})}
    ${card({title:'Journeys by status',sub:'Today and yesterday',body:donut(segs,{n:S.journeys.length,l:'journeys'},{sw:15})+legend(segs)+figs([{k:'Passengers',v:S.journeys.reduce((a,j)=>a+j.pax,0)},{k:'Longest trip',v:'372 km'},{k:'Avg check-ins',v:'2.6'}])})}
   </div>
   ${listCard('journeys',JOURNEY_LIST())}
  </div>`;}};

/* ---------- Assets ---------- */
const AS={out:['info','Checked out'],in:['ok','Available'],service:['warn','In service'],tagged:['bad','Tag expired']};
VIEWS.assets={title:'Assets',sub:'Tools register: who has what, and when it’s due for test and tag.',grp:'res',icon:'box',label:'Assets',
 act:()=>btn('Scan barcode','search','Scan barcode|Point the phone camera at the asset label',1)+btn('Add asset','plus','Add asset|Name, serial, category and photo'),
 render(){
  const cats={};S.assets.forEach(a=>cats[a.cat]=(cats[a.cat]||0)+1);
  const catSeg=Object.keys(cats).map((k,i)=>({k,v:cats[k],c:['var(--s1)','var(--s3)','var(--s6)','var(--s4)','var(--s7)'][i%5]}));
  const due=[{k:'Expired',v:tagExpired(),c:'var(--bad-dot)'},{k:'Due within 7 days',v:cnt(S.assets,a=>a.days>=0&&a.days<=7),c:'var(--warn-dot)'},{k:'8 – 14 days',v:cnt(S.assets,a=>a.days>7&&a.days<=14),c:'var(--s4)'},{k:'15 – 30 days',v:cnt(S.assets,a=>a.days>14&&a.days<=30),c:'var(--s3)'},{k:'Later or not tagged',v:cnt(S.assets,a=>a.days>30),c:'var(--s7)'}];
  return `<div class="page">
   ${strip('five',[
    {k:'Total assets',icon:'box',v:214,d:'10 shown below',act:{scroll:'#L-assets',tab:'assets:all'}},
    {k:'Checked out',icon:'users',tone:'var(--s3)',v:87,d:'to 29 people',act:{scroll:'#L-assets',tab:'assets:out'}},
    {k:'Test & tag due',icon:'timer',tone:'var(--warn-dot)',v:tagSoon(),d:'within 14 days',act:{scroll:'#qvTag'}},
    {k:'Tag expired',icon:'alert',tone:'var(--bad-dot)',v:tagExpired(),d:'blocked from check-out',act:{scroll:'#L-assets',tab:'assets:svc'}},
    {k:'Replacement value',icon:'card',tone:'var(--s6)',v:'$186K',d:'whole register'}])}
   <div class="g wl">
    ${card({title:'Test & tag schedule',sub:'Electrical safety tags by due date',id:'qvTag',body:bars(due.map(d=>({k:d.k,v:d.v,c:d.c})),{thick:true}),foot:'<span>Next due</span><b>3 Oct · Gas detector 4-gas</b>'})}
    ${card({title:'By category',sub:'Assets in this list',cls:'aside',body:donut(catSeg,{n:S.assets.length,l:'assets'},{sw:15})+legend(catSeg)})}
   </div>
   ${listCard('assets',ASSET_LIST())}
  </div>`;}};

/* ---------- Vehicles ---------- */
const VS={road:['info','On a journey'],parked:['ok','Available'],service:['warn','Service due'],issue:['bad','Inspection issue']};
VIEWS.vehicles={title:'Vehicles',sub:'Fleet, inspections, servicing and roadside details.',grp:'res',icon:'truck',label:'Vehicles',
 act:()=>btn('Add vehicle','plus','Add vehicle|Rego, make, model and roadside assistance'),
 render(){
  const segs=Object.keys(VS).map((k,i)=>({k:VS[k][1],v:cnt(S.vehicles,v=>v.st===k),c:['var(--s3)','var(--ok)','var(--warn-dot)','var(--bad-dot)'][i],act:{scroll:'#L-vehicles',tab:'vehicles:'+(k==='service'||k==='issue'?'attn':k)}}));
  const svc=S.vehicles.map(v=>({k:v.name,v:Math.max(v.svc-v.odo,0),vh:N(Math.max(v.svc-v.odo,0))+' km',c:v.svc-v.odo<1000?'var(--warn-dot)':v.c})).sort((a,b)=>a.v-b.v);
  return `<div class="page">
   ${strip('five',[
    {k:'Fleet',icon:'truck',v:18,d:'14 utes, 4 trucks',act:{scroll:'#L-vehicles',tab:'vehicles:all'}},
    {k:'On a journey',icon:'route',tone:'var(--s3)',v:cnt(S.vehicles,v=>v.st==='road'),d:'right now',act:{nav:'journeys'}},
    {k:'Service due',icon:'sliders',tone:'var(--warn-dot)',v:cnt(S.vehicles,v=>v.st==='service'),d:'within 1,000 km',act:{scroll:'#qvSvc'}},
    {k:'Inspection issues',icon:'alert',tone:'var(--bad-dot)',v:cnt(S.vehicles,v=>!v.ok),d:'Tipper 01 · cracked mirror',act:{scroll:'#L-vehicles',tab:'vehicles:attn'}},
    {k:'Rego within 30 days',icon:'doc',tone:'var(--s6)',v:cnt(S.vehicles,v=>v.regoDays<=30),d:'renew online',act:{scroll:'#L-vehicles'}}])}
   <div class="g wl">
    ${card({title:'Kilometres to next service',sub:'Closest first',id:'qvSvc',body:bars(svc,{max:15000,thick:true})})}
    ${card({title:'Fleet status',sub:'Tap a row to filter',cls:'aside',body:donut(segs,{n:S.vehicles.length,l:'vehicles'},{sw:15})+legend(segs)})}
   </div>
   ${listCard('vehicles',VEHICLE_LIST())}
  </div>`;}};

/* ---------- Employees ---------- */
VIEWS.employees={title:'Employees',sub:'Everyone who works shifts, with roles, contacts and documents.',grp:'um',icon:'users',label:'Employees',
 act:()=>btn('Import CSV','download','Import|Upload a CSV of employees',1)+btn('Invite employee','plus','Invite employee|An SMS and email invite would be sent'),
 render(){
  const act=S.employees.filter(e=>e.st==='active'),types={};act.forEach(e=>types[e.type]=(types[e.type]||0)+1);
  const tSeg=Object.keys(types).map((k,i)=>({k,v:types[k],c:['var(--s1)','var(--s3)','var(--s4)'][i]}));
  const hrs=act.slice().sort((a,b)=>b.hrs-a.hrs).map(e=>({k:e.name,v:e.hrs,vh:e.hrs+' h',c:e.hrs>48?'var(--bad-dot)':e.hrs>40?'var(--warn-dot)':'var(--brand)'}));
  return `<div class="page">

   ${strip('five',[
    {k:'Active employees',icon:'users',v:act.length,d:'of 48 total',act:{scroll:'#L-employees',tab:'employees:active'}},
    {k:'Invites pending',icon:'send',tone:'var(--s3)',v:cnt(S.employees,e=>e.st==='invited'),d:'sent this week',act:{scroll:'#L-employees',tab:'employees:invited'}},
    {k:'Hours this week',icon:'clock',tone:'var(--s6)',v:N(act.reduce((a,e)=>a+e.hrs,0)),unit:'h',act:{scroll:'#qvHrs'}},
    {k:'Over 48 hours',icon:'alert',tone:'var(--bad-dot)',v:cnt(act,e=>e.hrs>48),d:'fatigue risk',act:{scroll:'#qvHrs'}},
    {k:'Documents expiring',icon:'doc',tone:'var(--warn-dot)',v:cnt(act,e=>e.docs.includes('expir')),d:'within 30 days',act:{scroll:'#L-employees'}}])}
   <div class="g wl">
    ${card({title:'Hours this week',sub:'Employees over 48 hours are flagged',id:'qvHrs',body:bars(hrs,{max:56,thick:true})})}
    ${card({title:'Employment type',sub:'Active employees',cls:'aside',body:donut(tSeg,{n:act.length,l:'active'},{sw:15})+legend(tSeg)})}
   </div>
   ${listCard('employees',{href:r=>'user-management/employees/'+slug(r.name),rows:S.employees,tabs:[{key:'active',label:'Active'},{key:'invited',label:'Invited'},{key:'archived',label:'Archived'}],tabOf:(r,k)=>r.st===k,
    search:'Search name, email or phone',filters:[{label:'Documents expiring',test:r=>r.docs.includes('expir')},{label:'Casual',test:r=>r.type==='Casual'}],text:r=>r.name+' '+r.email+' '+r.phone+' '+r.role,minW:1000,
    cols:[{h:'Name',v:r=>person(r.name,r.email)},{h:'Role',v:r=>esc(r.role)},{h:'Phone',v:r=>r.phone},{h:'Type',v:r=>esc(r.type)},{h:'Hours this week',r:1,v:r=>r.hrs==null?'<span class="dash">—</span>':`<span style="color:${r.hrs>48?'var(--bad)':'var(--text)'};font-weight:600">${r.hrs} h</span>`},{h:'Documents',v:r=>r.docs.includes('expir')?`<b style="color:var(--warn)">${r.docs}</b>`:esc(r.docs)},{h:'Status',v:r=>r.st==='active'?pill('ok','Active',1):r.st==='invited'?pill('info','Invite sent',1):pill('neutral','Archived',1)}],
    action:(r,i,lid)=>r.st==='invited'?actBtns(lid,i,[{a:'resend',label:'Resend',cls:'btn-ghost'}]):more,onAct:(a,r)=>toast('Invite resent',r.name)})}
  </div>`;}};

/* ---------- Customers ---------- */
VIEWS.customers={title:'Customers',sub:'Clients you run jobs for, with contacts and billing.',grp:'um',icon:'building',label:'Customers',
 act:()=>btn('Add customer','plus','Add customer|Name, ABN and main contact'),
 render(){
  const act=S.customers.filter(c=>c.st==='active'),tot=act.reduce((a,c)=>a+c.ytd,0);
  const top=act.slice().sort((a,b)=>b.ytd-a.ytd);
  const seg=top.slice(0,4).map((c,i)=>({k:c.name,v:c.ytd,vh:short(c.ytd),c:['var(--s1)','var(--s3)','var(--s6)','var(--s4)'][i]})).concat([{k:'Others',v:top.slice(4).reduce((a,c)=>a+c.ytd,0),vh:short(top.slice(4).reduce((a,c)=>a+c.ytd,0)),c:'var(--s7)'}]);
  return `<div class="page">
   ${strip('four',[
    {k:'Active customers',icon:'building',v:act.length,d:'1 archived',act:{scroll:'#L-customers'}},
    {k:'Active jobs',icon:'jobs',tone:'var(--s3)',v:act.reduce((a,c)=>a+c.jobs,0),act:{nav:'jobs'}},
    {k:'Billed this year',icon:'receipt',tone:'var(--s6)',v:short(tot),chip:chip('up','+18%','trend'),d:'vs last year',act:{scroll:'#qvBill'}},
    {k:'Average per customer',icon:'card',tone:'var(--s4)',v:short(tot/act.length),act:{scroll:'#qvBill'}}])}
   <div class="g wl">
    ${card({title:'Billed this year',sub:'Highest first',id:'qvBill',body:bars(top.map(c=>({k:c.name,v:c.ytd,vh:short(c.ytd),c:'var(--brand)'})),{thick:true}),foot:'<span>Total</span><b class="num">$'+N(tot)+'</b>'})}
    ${card({title:'Revenue share',sub:'Top four customers',cls:'aside',body:donut(seg,{n:short(tot),l:'this year'},{sw:15})+legend(seg)})}
   </div>
   ${listCard('customers',{href:r=>'user-management/customers/'+slug(r.name),rows:S.customers,tabs:[{key:'active',label:'Active'},{key:'archived',label:'Archived'}],tabOf:(r,k)=>r.st===k,
    search:'Search customer, contact or ABN',filters:[{label:'Has active jobs',test:r=>r.jobs>0}],text:r=>r.name+' '+r.contact+' '+r.abn+' '+r.email,minW:1000,
    cols:[{h:'Customer',v:r=>`<div class="cell"><span class="thumb">${ini(r.name)}</span><span class="tx"><b>${esc(r.name)}</b><small class="mono">ABN ${r.abn}</small></span></div>`},{h:'Main contact',v:r=>person(r.contact,r.title)},{h:'Phone',v:r=>r.phone},{h:'Email',v:r=>`<a href="mailto:${esc(r.email)}" style="color:var(--brand)">${esc(r.email)}</a>`},{h:'Active jobs',r:1,v:r=>r.jobs||'<span class="dash">0</span>'},{h:'Billed this year',r:1,v:r=>money(r.ytd)},{h:'Status',v:r=>r.st==='active'?pill('ok','Active',1):pill('neutral','Archived',1)}]})}
  </div>`;}};

/* ---------- Roles ---------- */
VIEWS.roles={title:'Roles & permissions',sub:'What each role can see and do in SiteOS.',grp:'um',icon:'key',label:'Roles',
 act:()=>btn('New role','plus','New role|Name it, then tick its permissions'),
 render(){
  const names=Object.keys(S.perms),cells=names.length*PERMS.length,granted=names.reduce((a,k)=>a+S.perms[k].filter(Boolean).length,0);
  const seg=[{k:'Granted',v:granted,c:'var(--s1)'},{k:'Not accessible',v:cells-granted,c:'var(--s7)'}];
  return `<div class="page">
   ${strip('four',[
    {k:'Roles',icon:'key',v:names.length,d:'3 built in, 1 custom',act:{scroll:'#L-roles'}},
    {k:'Permissions',icon:'shield',tone:'var(--s3)',v:PERMS.length,d:'per role',act:{scroll:'#matrix'}},
    {k:'Granted',icon:'check',tone:'var(--ok)',v:granted,d:'across all roles',act:{scroll:'#matrix'}},
    {k:'People with a role',icon:'users',tone:'var(--s6)',v:S.roles.reduce((a,r)=>a+r.members,0),act:{nav:'employees'}}])}
   <div class="g wl">
    ${card({title:'Reach by role',sub:'Permissions each role holds',body:bars(names.map(k=>({k,v:S.perms[k].filter(Boolean).length,vh:S.perms[k].filter(Boolean).length+' / '+PERMS.length,c:'var(--brand)'})),{max:PERMS.length,thick:true})})}
    ${card({title:'Permission coverage',sub:'Every role against every permission',cls:'aside',body:donut(seg,{n:pctT(pct(granted,cells),0),l:'granted'},{sw:15})+legend(seg)})}
   </div>
   <section class="qv-card" id="matrix"><div class="qv-hd"><div class="grow"><h3>Permissions by role</h3><div class="s">Built-in roles are locked · tick Supervisor cells to change them</div></div></div>
    <div class="tblwrap"><table class="tbl matrix" style="min-width:720px"><thead><tr><th>Permission</th>${names.map(n=>`<th class="c">${n}</th>`).join('')}</tr></thead><tbody>
    ${PERMS.map((p,i)=>`<tr><td class="strong">${p}</td>${names.map(n=>{const on=S.perms[n][i],ed=n==='Supervisor';return `<td class="c"><button type="button" class="perm${on?' on':''}" ${ed?`data-perm="${n}:${i}"`:'disabled'} aria-pressed="${!!on}" aria-label="${esc(n+': '+p)}">${on?ICON('check',2.4):''}</button></td>`;}).join('')}</tr>`).join('')}
    </tbody></table></div></section>
   ${listCard('roles',{title:'Roles',rows:S.roles,search:'Search roles',text:r=>r.name+' '+r.desc,minW:760,
    cols:[{h:'Role',v:r=>`<b style="color:var(--text)">${r.name}</b>`},{h:'Description',v:r=>`<span style="white-space:normal">${esc(r.desc)}</span>`},{h:'Members',r:1,v:r=>r.members},{h:'Permissions',r:1,v:r=>S.perms[r.name].filter(Boolean).length+' of '+PERMS.length},{h:'Type',v:r=>r.sys?pill('neutral','Built in'):pill('info','Custom')}]})}
  </div>`;}};
