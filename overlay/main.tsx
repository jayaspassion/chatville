import {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import type {VillageState} from '../shared/state';
import {DISASTERS} from '../shared/disasters';
import {House} from './House';
import {Landscape} from './Landscape';
import {houseUpgrade} from '../shared/upgrades';
import './style.css';
const initial:VillageState={villagers:[],capacity:24,twitchConnected:false,round:null,serverTime:Date.now(),crownId:null};
function App(){
 const [state,setState]=useState(initial),[connected,setConnected]=useState(false);
 const [scale,setScale]=useState(()=>Math.min(innerWidth/1920,innerHeight/1080));
 const [clock,setClock]=useState(Date.now()),[offset,setOffset]=useState(0);
 useEffect(()=>{const resize=()=>setScale(Math.min(innerWidth/1920,innerHeight/1080));addEventListener('resize',resize);const tick=setInterval(()=>setClock(Date.now()),100);return()=>{removeEventListener('resize',resize);clearInterval(tick);};},[]);
 useEffect(()=>{let stopped=false;let socket:WebSocket;let timer:ReturnType<typeof setTimeout>;let retry=500;
 const connect=()=>{socket=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws`);socket.onopen=()=>{setConnected(true);retry=500;};socket.onmessage=e=>{try{const next=JSON.parse(e.data);setState(next);setOffset(next.serverTime-Date.now());}catch{/* Keep last valid village. */}};socket.onclose=()=>{setConnected(false);if(!stopped){timer=setTimeout(connect,retry);retry=Math.min(retry*2,5000);}};socket.onerror=()=>socket.close();};connect();return()=>{stopped=true;clearTimeout(timer);socket.close();};},[]);
 const time=clock+offset,round=state.round,active=round?.phase==='active';
 const definition=round?DISASTERS[round.kind]:null;
 const remaining=round?Math.max(0,Math.ceil((round.endsAt-time)/1000)):0;
 const progress=round?Math.min(1,Math.max(0,(time-round.startedAt)/30000)):0;
 return <div className="scene-frame" style={{transform:`translate(-50%,-50%) scale(${scale})`}}><main className={`village ${active?`disaster-${round.kind}`:''} ${active&&remaining<=5?'urgent':''}`}>
 <div className="sky"/><div className="sun"/><div className="cloud cloud-one"/><div className="cloud cloud-two"/><div className="hills hills-back"/><div className="hills hills-front"/><div className="meadow"/><Landscape/>
 <header><div className="eyebrow">A LITTLE PLACE FOR YOUR COMMUNITY</div><h1>Chatville<span>✦</span></h1><p>A little home. A legendary story.</p></header>
 <aside className="population"><span className="dot"/>{state.villagers.length} / 24 <small>villagers</small></aside>
 {round&&<section className={`round-banner ${round.phase}`} aria-live="polite">
 {active?<><div className="countdown">{remaining}<small>SECONDS</small></div><strong>{definition!.title}{round.row!==null?` · ROW ${round.row+1}`:''}</strong><span>{definition!.instruction}</span><div className="shield-count">{round.protectedIds.length} / {round.atRiskIds.length} houses protected</div></>:<><strong>{round.phase==='saved'?'VILLAGE SAVED!':`${round.hitCount} houses hit, ${round.destroyedCount} destroyed`}</strong><span>{round.phase==='saved'?'Every at-risk home made it through.':'type !repair or !rebuild'}</span></>}
 </section>}
 {active&&round.kind==='meteor'&&<div className="meteor" style={{left:`${82-progress*35}%`,top:`${-10+progress*48}%`}}><span/></div>}
 {active&&round.kind==='acidrain'&&<div className="acid-rain" aria-hidden="true">{Array.from({length:65},(_,i)=><i key={i} style={{left:`${(i*37)%100}%`,animationDelay:`-${(i%13)*.1}s`,animationDuration:`${.65+(i%5)*.09}s`}}/>)}</div>}
 {active&&round.kind==='tornado'&&<><div className="row-warning" style={{top:290+round.row!*165}}><span>ROW {round.row!+1} · ANCHOR YOUR HOUSE</span></div><div className="tornado" style={{top:268+round.row!*165,left:160+progress*1500}}>{Array.from({length:6},(_,i)=><i key={i} style={{width:150-i*18,top:i*18,animationDelay:`-${i*.13}s`}}/>)}</div></>}
 <section className="plots" aria-label="Village plots">{Array.from({length:24},(_,plot)=>{
 const h=state.villagers[plot];if(!h)return <div className="plot" key={plot}><div className="empty-plot"><span>＋</span></div></div>;
 const protection=active&&round.protectedIds.includes(h.id)&&h.damage<3?round.kind:null;
 const recentHit=time-h.lastHitAt<900,recentRepair=time-h.lastRepairAt<900,milestone=time-h.milestoneAt<3000;
 const upgrade=houseUpgrade(h.survived);
 const upgrading=time-h.upgradedAt<3000;
 const impact=round?.kind==='meteor'&&round.phase!=='active'?round.impacts.find(i=>i.houseId===h.id):null;
 return <div className={`plot occupied damage-${h.damage} ${active&&round.atRiskIds.includes(h.id)?'at-risk':''}`} key={plot}>
 <div className={`home ${recentHit?'taking-hit':''} ${recentRepair?'repairing':''} ${upgrading?'upgrading':''}`} key={`${h.id}:${h.rebuilt}`}>
 <div className={`stats-badge ${milestone?'milestone':''}`} title={`Survived ${h.survived} · Current streak ${h.streak} · Best ${h.bestStreak}`}><span>🛡 {h.survived}</span><span>🔥 {h.streak}</span></div>
 <div className="house-level" title={`${upgrade.name} · ${h.survived} saves · Next upgrade at ${upgrade.nextAt}`}><span>LV</span> {upgrade.level}</div><House house={h} protection={protection} crown={state.crownId===h.id}/>
 {impact&&<div key={`${round!.id}:${h.id}`} className={`fragment ${impact.blocked?'blocked':'landed'}`}><i/>{impact.blocked&&<svg className="impact-dome" viewBox="0 0 180 180"><path d="M9 161a81 115 0 0 1 162 0z" fill="#b5f5ff25" stroke="#b8f8ff" strokeWidth="5"/></svg>}<span>✦</span></div>}
 <div className="name" title={h.username} style={{fontSize:h.username.length>20?14:h.username.length>16?16:18}}>{h.username}</div>
 {upgrading&&<div className="upgrade-burst" key={h.upgradedAt}><span>✦</span><b>HOME UPGRADED</b><span>✦</span></div>}<div className="damage-meter" aria-label={`${h.damage} of 3 damage`}>{[1,2,3].map(n=><i key={n} className={h.damage>=n?'filled':''}/>)}</div>
 </div></div>;
 })}</section>
 {round?.phase==='saved'&&<div className="fireworks" key={round.id}>{Array.from({length:5},(_,i)=><div className="burst" key={i} style={{left:`${18+i*16}%`,top:`${24+(i%2)*12}%`,animationDelay:`${i*.18}s`}}>{Array.from({length:12},(_,j)=><i key={j} style={{transform:`rotate(${j*30}deg) translateY(-90px)`,background:['#fff1a6','#f5b9ae','#b2e5d5'][i%3]}}/>)}</div>)}</div>}
 <footer><span className="join-key">{active?definition!.defendCommand:'!join'}</span><div>{active?'Protect your own little corner':'Make yourself at home'}<small>{active?'One house. One defense. Make it count.':'Chat to join · !repair to patch · !rebuild from rubble · !stats'}</small></div><span className={`connection ${connected&&state.twitchConnected?'live':''}`}>{connected&&state.twitchConnected?'TWITCH CONNECTED':connected?'LOCAL PREVIEW':'RECONNECTING'}</span></footer>
 </main></div>;
}
createRoot(document.getElementById('root')!).render(<App/>);
