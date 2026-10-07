/* =====================================================================
   Dashboard with Customise layout. Follows the shipped behaviour (Customize layout, then drag and
   resize widgets, Reset layout, Done; each person keeps their own arrangement) on a simple
   12-column grid: every widget picks a width (third, half, two thirds, full), drags to a new place
   or moves with the arrows, and can be hidden and brought back. The designer's cards and charts are
   the widgets, unchanged. Layout lives per person for the session (Reset demo restores it).
   ===================================================================== */
const DASH_DEFAULT=[['kpis',12],['trend',8],['attendance',4],['map',8],['pipeline',4],['today',12],['road',4],['attention',4],['budget',4],['alerts',12]].map(([id,w])=>({id,w,hidden:false}));
INIT.dashLayout={};S.dashLayout={};
const dashItems=()=>{const k=ME.key||'owner';return S.dashLayout[k]||(S.dashLayout[k]=structuredClone(DASH_DEFAULT));};
const DASH_WIDTHS=[[4,'⅓'],[6,'½'],[8,'⅔'],[12,'Full']];
function dashData(){
 const al=[{n:cnt(S.today,t=>t.st==='late'||t.st==='absent'),k:'Late or absent',cls:'bad',a:{nav:'timeclock'}},
  {n:pendingTime(),k:'Time corrections',cls:'bad',a:{nav:'timeclock',tab:'timeclock:pending',scroll:'#L-timeclock'}},
  {n:awaitJsa()+overdueJsa(),k:'JSAs to action',cls:'warn',a:{nav:'jsas',tab:'jsas:await',scroll:'#L-jsas'}},
  {n:tagSoon()+tagExpired(),k:'Test & tag due',cls:'warn',a:{nav:'assets',tab:'assets:svc',scroll:'#L-assets'}},
  {n:lateJourneys(),k:'Journey running late',cls:'warn',a:{nav:'journeys',scroll:'#L-journeys'}},
  {n:drafts(),k:'Unpublished shifts',cls:'ok',a:{nav:'scheduler'}}];
 return {al,attn:al.reduce((a,x)=>a+x.n,0),road:S.journeys.filter(j=>['road','late','rest'].includes(j.st)),
  series:[{name:'Rostered hours',c:'var(--s1)',v:H.rost,area:true},{name:'Clocked hours',c:'var(--s3)',v:H.clock},{name:'On-time clock-ins',c:'var(--s4)',v:H.ontime,axis:'r',dash:true,dots:false,w:2}],
  att:[{k:'On site',v:31,c:'var(--ok)',act:{nav:'timeclock',tab:'timeclock:live'}},{k:'On break',v:4,c:'var(--s3)'},{k:'Late',v:3,c:'var(--warn-dot)',act:{scroll:'#L-today',tab:'today:late'}},{k:'Not clocked in',v:2,c:'var(--bad-dot)',act:{scroll:'#L-today',tab:'today:absent'}},{k:'Starts later',v:8,c:'var(--s7)'}],
  jobsBy:activeJobs().filter(j=>j.pct!=null).sort((a,b)=>b.pct-a.pct).slice(0,5)};
}
const DASH_W={
 kpis:{label:'Key figures',html:d=>strip('five',[
  {k:'On the clock now',icon:'clock',v:'31',unit:'/ 48',chip:chip('brand','65% of rostered'),d:'across 8 jobs',spark:[26,28,30,27,31,29,31],act:{nav:'timeclock',tab:'timeclock:live',scroll:'#L-timeclock'}},
  {k:'Active jobs',icon:'jobs',tone:'var(--s3)',v:activeJobs().length,chip:chip('info','3 start this week'),spark:[6,6,7,7,8,8,8],act:{nav:'jobs',scroll:'#L-jobs'}},
  {k:'Rostered hours',icon:'cal',tone:'var(--s6)',v:N(1284),chip:chip('up','+6%','trend'),d:'vs last week',spark:H.rost,act:{nav:'scheduler'}},
  {k:'JSAs to sign off',icon:'shield',tone:'var(--warn-dot)',v:awaitJsa(),chip:overdueJsa()?chip('down',overdueJsa()+' overdue'):chip('up','none overdue'),spark:[3,2,4,1,3,2,awaitJsa()||1],act:{nav:'jsas',tab:'jsas:await',scroll:'#L-jsas'}},
  {k:'Needs attention',icon:'alert',tone:'var(--bad-dot)',v:d.attn,chip:chip('down','Act today','alert'),d:'items',spark:[9,12,8,11,10,9,d.attn],act:{scroll:'#alerts'}}])},
 trend:{label:'Workforce trend',html:d=>card({title:'Workforce trend',sub:'Last 7 days · rostered vs clocked hours',meta:chip('','7d','clock'),body:trend({x:DAYS,series:d.series,right:true,minR:80,maxR:100,minL:1000,maxL:1300,h:250})+keys(d.series)+figs([{k:'Best day',v:N(1284)+' h'},{k:'Daily average',v:N(Math.round(H.rost.reduce((a,b)=>a+b)/7))+' h'},{k:'On time, 7-day',v:'92%',cls:'ok'},{k:'Overtime, 7-day',v:N(H.ot.reduce((a,b)=>a+b))+' h',cls:'warn'}])})},
 attendance:{label:'Shift attendance',html:d=>card({title:'Shift attendance',sub:'Today’s 48 rostered shifts',body:donut(d.att,{n:'92%',l:'on time'},{})+legend(d.att),foot:'<span>Target</span><b class="num">95%</b>'})},
 map:{label:'Live sites map',html:d=>card({title:'Live sites map',sub:'Crew on site and journeys on the road',link:{nav:'journeys',label:'All journeys'},body:opsMap({routes:d.road})})},
 pipeline:{label:'Shift pipeline',html:d=>card({title:'Today’s shift pipeline',sub:'From roster to boots on site',body:funnel([{k:'Rostered',v:48,icon:'cal',act:{nav:'scheduler'}},{k:'Published',v:46,icon:'send',act:{nav:'scheduler'}},{k:'JSA signed',v:41,icon:'shield',act:{nav:'jsas'}},{k:'Clocked in',v:35,icon:'clock',act:{nav:'timeclock'}},{k:'In geofence',v:31,icon:'pin',act:{nav:'timeclock'}}])+figs([{k:'Hours today',v:'186.5'},{k:'Crews on site',v:'8'},{k:'Avg crew size',v:'3.9'}]),foot:'<span>Rostered → in geofence</span><b class="num">65%</b>'})},
 today:{label:'Today’s shifts',html:d=>listCard('today',{title:'Today’s shifts',sub:'Live from the time clock',link:{nav:'scheduler',label:'Open scheduler'},rows:S.today,
  tabs:[{key:'all',label:'All'},{key:'on',label:'On site'},{key:'late',label:'Late'},{key:'absent',label:'Not clocked in'}],tabOf:(r,k)=>k==='all'||r.st===k,
  search:'Search employee or job',text:r=>r.name+' '+r.job,minW:860,
  cols:[{h:'Employee',v:r=>person(r.name,r.role)},{h:'Job',v:r=>jobTag(r.job)},{h:'Shift',v:r=>r.shift},{h:'Clocked in',v:r=>r.in||'<span class="dash">—</span>'},{h:'Status',v:r=>pill(TODAY_ST[r.st][0],r.st==='late'?'Late '+r.late+' min':TODAY_ST[r.st][1],1)}],
  action:(r,i,lid)=>r.st==='absent'?actBtns(lid,i,[{a:'call',label:'Call',cls:'btn-ok'}]):more,
  onAct:(a,r)=>toast('Calling '+r.name,'Their phone number is on file')})},
 road:{label:'On the road',html:d=>`<section class="qv-card"><div class="qv-hd"><div class="grow"><h3>On the road</h3><div class="s">${d.road.length} journeys in progress</div></div><div class="meta"><span class="viewall" data-nav="journeys">View all${ICON('next')}</span></div></div>
  ${d.road.length?`<div style="padding-bottom:6px">${d.road.map(j=>`<div class="roadcard" data-nav="journeys"><span class="grow"><div class="rid">${esc(j.veh)}<span>${esc(j.driver)}</span></div><div class="l2">${esc(j.from)} → ${esc(j.to)}</div><div class="eta">ETA<b class="num${j.st==='late'?' late':''}">${esc(j.eta)}${j.late?' (+'+j.late+' min)':''}</b></div></span><span class="glyph${j.st==='late'?' late':''}">${ICON(j.st==='rest'?'timer':'truck')}</span></div>`).join('')}</div>`:stateBlock({icon:'route',title:'No journeys on the road',body:'Trips that are under way show up here with their ETA.',compact:true})}</section>`},
 attention:{label:'Needs attention',html:d=>{const rows=d.al.filter(x=>x.n);return `<section class="qv-card"><div class="qv-hd"><div class="grow"><h3>Needs attention</h3><div class="s">Oldest first</div></div></div>${rows.length?`<div class="exlist">${rows.slice(0,5).map(x=>`<div class="exrow${x.cls==='bad'?'':' warn'}"${actA(x.a)}><i></i><span class="grow"><div class="t1">${esc(x.k)}</div><div class="t2">${x.a.nav?esc(VIEWS[x.a.nav].label):''}</div></span><span class="n num">${x.n}</span></div>`).join('')}</div>`:stateBlock({icon:'checkc',tone:'ok',title:'Nothing needs attention',body:'No late shifts, expiring tags or open corrections right now.',compact:true})}</section>`;}},
 budget:{label:'Budget used',html:d=>card({title:'Budget used',sub:'Highest first',link:{nav:'jobs',label:'All jobs'},body:bars(d.jobsBy.map(j=>({k:j.name,v:j.pct,vh:j.pct+'%',c:j.pct>100?'var(--bad-dot)':j.pct>=85?'var(--warn-dot)':'var(--brand)',act:{nav:'jobs'}})),{max:110,thick:true})})},
 alerts:{label:'Live alerts',html:d=>`<div class="alerts" id="alerts"><div class="hd"><span class="g">${ICON('alert')}</span><span><b>Live alerts</b><span>Tap a tile to open its board</span></span></div><div class="row">${d.al.map((x,i)=>`<button type="button" class="alert ${x.cls}"${actA(x.a)} style="--d:${300+i*60}ms"><b class="num">${x.n}</b><span>${esc(x.k)}</span></button>`).join('')}</div></div>`}
};
VIEWS.dash.act=()=>UI.dashEdit
 ?`<button type="button" class="btn btn-ghost" data-do="dash-reset">${ICON('reset')}<span class="lb">Reset layout</span></button><button type="button" class="btn" data-do="dash-done">${ICON('check')}<span class="lb">Done</span></button>`
 :`<button type="button" class="btn btn-ghost" data-do="dash-edit">${ICON('sliders')}<span class="lb">Customise</span></button>`+(can('add:job')?`<button type="button" class="btn" data-go="jobs/new">${ICON('plus')}<span class="lb">New job</span></button>`:'');
VIEWS.dash.render=function(){
 const items=dashItems(),d=dashData(),edit=!!UI.dashEdit,hidden=items.filter(i=>i.hidden);
 const vis=items.filter(i=>!i.hidden);
 return `<div class="page">${edit?`<div class="banner info dashhint" role="status">${ICON('sliders')}<span><b>Customising your dashboard.</b> Drag a widget to move it, pick a width, or hide what you don’t need. Only you see this arrangement.</span></div>`:''}
  <div class="dgrid${edit?' edit':''}" id="dgrid">${vis.map((it,n)=>`<div class="dw w${it.w}" data-dw="${it.id}"${edit?' draggable="true"':''}>${edit?`<div class="dwbar"><span class="grip" aria-hidden="true">${ICON('more').replace('<svg','<svg style="transform:rotate(90deg)"')}</span><b>${esc(DASH_W[it.id].label)}</b><span class="segc dwseg" role="radiogroup" aria-label="Width">${DASH_WIDTHS.map(([w,l])=>`<button type="button" role="radio" aria-checked="${w===it.w}" class="${w===it.w?'on':''}" data-do="dash-w" data-id="${it.id}" data-w="${w}">${l}</button>`).join('')}</span><button type="button" class="rowbtn" data-do="dash-move" data-id="${it.id}" data-dir="-1" aria-label="Move ${esc(DASH_W[it.id].label)} earlier"${n===0?' disabled':''}>${ICON('next').replace('<svg','<svg style="transform:rotate(-90deg)"')}</button><button type="button" class="rowbtn" data-do="dash-move" data-id="${it.id}" data-dir="1" aria-label="Move ${esc(DASH_W[it.id].label)} later"${n===vis.length-1?' disabled':''}>${ICON('next').replace('<svg','<svg style="transform:rotate(90deg)"')}</button><button type="button" class="rowbtn" data-do="dash-hide" data-id="${it.id}" aria-label="Hide ${esc(DASH_W[it.id].label)}" title="Hide">${ICON('eye')}</button></div>`:''}<div class="dwb">${DASH_W[it.id].html(d)}</div></div>`).join('')}</div>
  ${edit&&hidden.length?`<section class="qv-card dtray"><div class="qv-hd"><div class="grow"><h3>Hidden widgets</h3><div class="s">Bring one back to the end of the dashboard</div></div></div><div class="qv-body chkrow">${hidden.map(i=>`<button type="button" class="btn btn-ghost" data-do="dash-show" data-id="${i.id}">${ICON('plus')}${esc(DASH_W[i.id].label)}</button>`).join('')}</div></section>`:''}
  ${!vis.length?`<section class="qv-card">${stateBlock({icon:'dash',title:'Your dashboard is empty',body:'Every widget is hidden. Customise the layout to bring some back.',actions:`<button type="button" class="btn" data-do="dash-edit">${ICON('sliders')}Customise</button>`})}</section>`:''}
 </div>`;
};
DO['dash-edit']=()=>{UI.dashEdit=true;rerender(true);};
DO['dash-done']=()=>{UI.dashEdit=false;rerender(true);toast('Dashboard saved','Your arrangement is kept for next time');};
DO['dash-reset']=()=>{S.dashLayout[ME.key||'owner']=structuredClone(DASH_DEFAULT);rerender(true);toast('Layout reset','Back to the standard dashboard');};
DO['dash-w']=d=>{dashItems().find(i=>i.id===d.id).w=+d.w;rerender(true);};
DO['dash-hide']=d=>{dashItems().find(i=>i.id===d.id).hidden=true;rerender(true);};
DO['dash-show']=d=>{const a=dashItems(),i=a.findIndex(x=>x.id===d.id),it=a.splice(i,1)[0];it.hidden=false;a.push(it);rerender(true);};
DO['dash-move']=d=>{const a=dashItems(),vis=a.filter(i=>!i.hidden),i=vis.findIndex(x=>x.id===d.id),j=i+ +d.dir;if(j<0||j>=vis.length)return;const A=a.indexOf(vis[i]),B=a.indexOf(vis[j]);[a[A],a[B]]=[a[B],a[A]];rerender(true);setTimeout(()=>{const el=$('[data-dw="'+d.id+'"]');if(el)el.scrollIntoView({block:'nearest',behavior:'smooth'});},30);};
/* drag to reorder: drop before or after the widget under the pointer */
let dragId=null;
document.addEventListener('dragstart',e=>{const w=e.target.closest&&e.target.closest('[data-dw]');if(!w||!UI.dashEdit)return;dragId=w.dataset.dw;w.classList.add('dragging');try{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragId);}catch(x){}});
document.addEventListener('dragover',e=>{const w=e.target.closest&&e.target.closest('[data-dw]');if(!dragId||!w||w.dataset.dw===dragId)return;e.preventDefault();const r=w.getBoundingClientRect(),after=e.clientX>r.left+r.width/2&&(r.width<innerWidth*.9)||e.clientY>r.top+r.height/2&&r.width>=innerWidth*.9;$$('[data-dw]').forEach(x=>x.classList.remove('dropb','dropa'));w.classList.add(after?'dropa':'dropb');});
document.addEventListener('drop',e=>{const w=e.target.closest&&e.target.closest('[data-dw]');if(!dragId||!w||w.dataset.dw===dragId)return;e.preventDefault();const after=w.classList.contains('dropa'),a=dashItems(),from=a.findIndex(x=>x.id===dragId),it=a.splice(from,1)[0],to=a.findIndex(x=>x.id===w.dataset.dw);a.splice(to+(after?1:0),0,it);dragId=null;rerender(true);});
document.addEventListener('dragend',()=>{dragId=null;$$('[data-dw]').forEach(x=>x.classList.remove('dragging','dropb','dropa'));});
