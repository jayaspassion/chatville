// Local development driver. Uses only the public /simulate and /ws interfaces.
import assert from 'node:assert/strict';
import {WebSocket} from 'ws';
import type {VillageState,DisasterKind} from '../shared/state.js';
import {DISASTERS,DISASTER_KINDS} from '../shared/disasters.js';
const [scenario='save',kindArg='meteor']=process.argv.slice(2);
if(!['save','mixed','streak'].includes(scenario)||!DISASTER_KINDS.includes(kindArg as DisasterKind))throw Error('Usage: npm run demo -- save|mixed|streak meteor|acidrain|tornado');
const kind=kindArg as DisasterKind;
const names=['demo_alice','demo_bob','demo_cara'];
const socket=new WebSocket('ws://127.0.0.1:3001/ws');
let state:VillageState;
let notifications:string[]=[];
const pause=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
socket.on('message',data=>{state=JSON.parse(String(data));});
const until=async(predicate:()=>boolean,timeout=40000)=>{const end=Date.now()+timeout;while(!predicate()){if(Date.now()>end)throw Error('Timed out waiting for a village update.');await pause(50);}};
const command=async(username:string,command:string,isBroadcaster=false)=>{
 const response=await fetch('http://127.0.0.1:3001/simulate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,command,isBroadcaster})});
 if(!response.ok)throw Error('/simulate unavailable. Start npm run dev.');
 const result=await response.json();notifications.push(...(result.announcements??[]));return result;
};
async function launch(kind:DisasterKind){await until(()=>!state.round);await command('demo_host',DISASTERS[kind].startCommand,true);await until(()=>state.round?.phase==='active');console.log(`${kind}: 30 seconds started; ${state.round!.atRiskIds.length} houses at risk.`);}
async function defend(namesToProtect:string[],kind:DisasterKind){for(const name of namesToProtect)await command(name,DISASTERS[kind].defendCommand);}
async function outcome(){await until(()=>!!state.round&&state.round.phase!=='active');console.log(`Outcome: ${state.round!.phase}; ${state.round!.hitCount} hit, ${state.round!.destroyedCount} destroyed.`);console.log(state.villagers.map(h=>`${h.username}: damage ${h.damage}, survived ${h.survived}, streak ${h.streak}, best ${h.bestStreak}`).join('\n'));}
try{
 await new Promise<void>((resolve,reject)=>{socket.once('open',()=>resolve());socket.once('error',reject);});await until(()=>!!state);
 if(state!.round||state!.villagers.length)throw Error('Start with an empty village: stop npm run dev with Ctrl+C, then start it again. This driver will not reset existing houses.');
 for(const name of names)await command(name,'!join');await until(()=>state.villagers.length===3);
 if(scenario==='save'){
  await launch(kind);await defend(names,kind);await outcome();assert.equal(state!.round!.phase,'saved');assert.ok(state!.villagers.every(h=>h.damage===0&&h.survived===1));
 }else if(scenario==='mixed'){
  if(kind==='meteor'){
   await launch('acidrain');await defend([names[0]],'acidrain');await until(()=>state.villagers[1].damage===1);await defend([names[1]],'acidrain');await outcome();
  }else{
   await launch('meteor');await defend(names.slice(0,2),'meteor');await outcome();
  }
  await launch(kind);await defend([names[0]],kind);await outcome();assert.equal(state!.round!.hitCount,2);assert.equal(state!.round!.destroyedCount,1);assert.deepEqual(state!.villagers.map(h=>h.damage),[0,2,3]);
  console.log('Expected: Alice intact, Bob burning, Cara rubble. Wait for idle; test Bob !repair twice and Cara !rebuild.');
 }else{
  for(let i=1;i<=5;i++){
   await launch('meteor');await defend(names,'meteor');await outcome();assert.equal(state!.villagers[0].streak,i);
   if(i>=3)assert.equal(state!.crownId,'sim:demo_alice');
  }
  console.log('Crown tie stays with Alice. Now Alice misses a defense:');await launch('meteor');await defend(names.slice(1),'meteor');await outcome();assert.equal(state!.crownId,'sim:demo_bob');assert.equal(state!.villagers[0].streak,0);
 }
 for(const name of names)console.log(name,(await command(name,'!stats')).reply);
 console.log('PASS. Outcome stays visible for 5 seconds. Game state remains available for manual testing.');
}finally{socket.close();}
