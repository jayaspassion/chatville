import type {VillageState,DisasterKind} from '../shared/state.js';
import {DISASTERS,DISASTER_KINDS} from '../shared/disasters.js';
import {houseUpgrade} from '../shared/upgrades.js';
const colors=['#edb6a5','#b9cba8','#b8cce0','#dbc1df','#efcf91','#9fcac4'];
export interface Announcement {text:string; simulation:boolean;priority?:boolean;}
export interface CommandResult {changed:boolean;reply?:string;replies?:string[];}
export function createVillage(now:()=>number=Date.now,random:()=>number=Math.random) {
  const state:VillageState={villagers:[],capacity:24,twitchConnected:false,round:null,serverTime:now(),crownId:null};
  let sequence=0, roundId=0, ticksDone=0, roundSimulation=false;
  let hitIds=new Set<string>(), destroyedIds=new Set<string>(), repairUsed=new Set<string>();
  const reachedOrder=new Map<string,number>();
  const announcements:Announcement[]=[];
  const announce=(text:string,priority=false)=>announcements.push({text,simulation:roundSimulation,priority});
  function crown(){
    const candidates=state.villagers.filter(v=>v.streak>=3&&v.damage<3);
    candidates.sort((a,b)=>b.streak-a.streak||(reachedOrder.get(a.id)??Infinity)-(reachedOrder.get(b.id)??Infinity));
    state.crownId=candidates[0]?.id??null;
  }
  function advance(){
    const time=now();state.serverTime=time;
    const round=state.round;if(!round)return false;
    let changed=false;
    if(round.phase==='active'){
      const pattern=DISASTERS[round.kind].pattern;
      while(ticksDone<pattern.length&&time>=round.startedAt+pattern[ticksDone].afterMs){
        const tick=pattern[ticksDone++];const at=round.startedAt+tick.afterMs;
        for(const id of [...round.atRiskIds].sort((a,b)=>(reachedOrder.get(a)??Infinity)-(reachedOrder.get(b)??Infinity))){
          const house=state.villagers.find(v=>v.id===id)!;
          const blocked=round.protectedIds.includes(id)&&house.damage<3;
          const amount=blocked?0:Math.min(tick.damage,3-house.damage);
          round.impacts.push({houseId:id,blocked,amount,at});
          if(amount>0){
            if(house.streak>=3)announce(`${house.username}'s ${house.streak} streak has ended!`);
            house.streak=0;house.damage+=amount;house.lastHitAt=at;hitIds.add(id);
            if(house.damage===3)destroyedIds.add(id);
          }
        }
        round.hitCount=hitIds.size;round.destroyedCount=destroyedIds.size;crown();changed=true;
      }
      if(time>=round.endsAt){
        for(const id of [...round.atRiskIds].sort((a,b)=>(reachedOrder.get(a)??Infinity)-(reachedOrder.get(b)??Infinity))){
          const house=state.villagers.find(v=>v.id===id)!;
          if(!hitIds.has(id)){
            house.survived++;house.streak++;house.bestStreak=Math.max(house.bestStreak,house.streak);
            reachedOrder.set(id,++sequence);
            if(house.survived%5===0){house.upgradedAt=round.endsAt;const upgrade=houseUpgrade(house.survived);announce(`${house.username}'s house upgraded to level ${upgrade.level}: ${upgrade.name}! (${house.survived} saves)`);}
            if([3,5,10].includes(house.streak)){house.milestoneAt=round.endsAt;announce(`${house.username} is on a ${house.streak} disaster streak!`);}
          }
        }
        round.phase=hitIds.size?'hit':'saved';round.protectedIds=[];repairUsed.clear();crown();changed=true;
      }
    }
    if(time>=round.outcomeEndsAt){state.round=null;changed=true;}
    return changed;
  }
  return {state,advance,
    drainAnnouncements(){return announcements.splice(0);},
    command(id:string,username:string,input:string,isBroadcaster=false,simulation=false):CommandResult{
      const advanced=advance();const ignored={changed:advanced};const cmd=input.trim().toLowerCase();
      const house=state.villagers.find(v=>v.id===id);
      if(cmd==='!help')return {...ignored,replies:[
        '[1/3 START] !join = get a house. Join before the disaster. Every 5 personal saves upgrades your home.',
        '[2/3 DEFEND] !shield = meteor | !umbrella = acid (before 15s) | !anchor = tornado (marked row).',
        '[3/3 RECOVER] !repair = patch up once between rounds | !rebuild = restore rubble | !stats = your progress.'
      ]};
      if(cmd==='!join'){
        if(house)return {...ignored,reply:"you're already in the village!"};
        if(state.villagers.length===24)return {...ignored,reply:'the village is full!'};
        const plot=state.villagers.length;
        state.villagers.push({id,username,plot,color:colors[plot%colors.length],damage:0,survived:0,streak:0,bestStreak:0,rebuilt:0,lastHitAt:0,lastRepairAt:0,milestoneAt:0,upgradedAt:0});
        return {changed:true,reply:'welcome, your house is up!'};
      }
      const requested=DISASTER_KINDS.find(k=>DISASTERS[k].startCommand===cmd);
      if(requested||cmd==='!disaster'){
        if(!isBroadcaster)return ignored;
        if(state.round)return {...ignored,reply:'a disaster round is still running! Wait for the outcome banner to fade.'};
        const defenders=state.villagers.filter(v=>v.damage<3);
        if(!defenders.length)return {...ignored,reply:'no house can defend! Type !join or !rebuild first.'};
        const kind:DisasterKind=requested??DISASTER_KINDS[Math.min(2,Math.floor(random()*3))];
        const rows=[...new Set(defenders.map(v=>Math.floor(v.plot/6)))];
        const row=kind==='tornado'?rows[Math.min(rows.length-1,Math.floor(random()*rows.length))]:null;
        const atRisk=defenders.filter(v=>row===null||Math.floor(v.plot/6)===row);
        const start=now();ticksDone=0;hitIds=new Set();destroyedIds=new Set();roundSimulation=simulation;
        state.round={id:++roundId,kind,phase:'active',startedAt:start,endsAt:start+30000,outcomeEndsAt:start+35000,defenderIds:defenders.map(v=>v.id),atRiskIds:atRisk.map(v=>v.id),protectedIds:[],row,hitCount:0,destroyedCount:0,impacts:[]};
        const launchText = kind==='meteor'
          ? '☄ A meteor is coming your way in 30 seconds! Type !shield to protect YOUR house!'
          : kind==='acidrain'
          ? '☂ Acid rain is here for 30 seconds! Type !umbrella now — damage hits in 15 and 30 seconds!'
          : `🌪 A tornado is coming through ROW ${row!+1} in 30 seconds! Row ${row!+1}, type !anchor to protect YOUR house!`;
        announce(launchText,true);
        return {changed:true};
      }
      if(cmd==='!stats'){
        if(!house)return {...ignored,reply:'type !join to build your house first!'};
        return {...ignored,reply:`survived: ${house.survived} | streak: ${house.streak} | best streak: ${house.bestStreak} | damage: ${house.damage}/3 | house level: ${houseUpgrade(house.survived).level} | next upgrade: ${houseUpgrade(house.survived).nextAt} saves`};
      }
      if(cmd==='!repair'){
        if(!house)return {...ignored,reply:'type !join to build your house first!'};
        if(house.damage===3)return {...ignored,reply:'your house is destroyed - type !rebuild'};
        if(state.round)return {...ignored,reply:'wait until the disaster and outcome banner finish to repair'};
        if(repairUsed.has(id))return {...ignored,reply:'you already repaired - wait for the next disaster'};
        if(house.damage===0)return {...ignored,reply:'your house is already intact! (0 damage left)'};
        house.damage--;house.lastRepairAt=now();repairUsed.add(id);
        return {changed:true,reply:`patched up! (${house.damage} damage left)`};
      }
      if(cmd==='!rebuild'){
        if(!house)return {...ignored,reply:'type !join to build your house first!'};
        if(house.damage!==3)return {...ignored,reply:'your house is still standing - use !repair during idle'};
        house.damage=0;house.streak=0;house.rebuilt++;house.lastRepairAt=now();crown();
        return {changed:true,reply:'rebuilt! Your house is back on the same plot.'};
      }
      const round=state.round;
      if(!round||round.phase!=='active'||DISASTERS[round.kind].defendCommand!==cmd||!house||house.damage===3||!round.defenderIds.includes(id))return ignored;
      if(round.kind==='tornado'&&!round.atRiskIds.includes(id))return {...ignored,reply:"you're safe this time!"};
      if(round.protectedIds.includes(id))return ignored;
      round.protectedIds.push(id);return {changed:true};
    }
  };
}
