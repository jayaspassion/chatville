import {useEffect,useRef} from 'react';
import type {DisasterKind} from '../shared/state';
import {meteorPose,tornadoRowTop} from './motion';
export function Atmosphere({kind,start,row}:{kind:DisasterKind;start:number;row:number|null}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
 const canvas=ref.current!,ctx=canvas.getContext('2d')!;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let frame=0;
 const paint=()=>{
  const t=(Date.now()-start)/1000,p=Math.min(1,Math.max(0,t/30));
  ctx.clearRect(0,0,1920,1080);
  if(kind==='meteor'){
   for(let i=0;i<75;i++){const x=(i*337.4)%1920,y=(i*97.7)%490;ctx.globalAlpha=.2+.35*(.5+.5*Math.sin(t*1.3+i));ctx.fillStyle=i%5?'#d8e4ff':'#ffd09a';ctx.beginPath();ctx.arc(x,y,i%5?1:1.8,0,Math.PI*2);ctx.fill();}
   const m=meteorPose(p);
   for(let i=0;i<28;i++){const age=((t*1.6+i*.127)%1),x=m.x+age*260+(Math.sin(i*17)*18),y=m.y-age*115+Math.cos(i*7)*22;ctx.globalAlpha=(1-age)*.7;ctx.fillStyle=i%3?'#ffc875':'#ff8a57';ctx.beginPath();ctx.arc(x,y,(1-age)*3+.5,0,Math.PI*2);ctx.fill();}
  }else if(kind==='acidrain'){
   ctx.lineWidth=1.7;ctx.strokeStyle='#c8fba4';
   for(let i=0;i<180;i++){const z=.5+(i%7)/9,x=((i*137.19-t*(95+z*40))%2200+2200)%2200-100,y=((i*83.3+t*(650+z*230))%1300)-130;ctx.globalAlpha=.13+z*.3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-8*z,y+48*z);ctx.stroke();}
   for(let i=0;i<33;i++){const phase=(t*.8+i*.23)%1;ctx.globalAlpha=(1-phase)*.35;ctx.strokeStyle='#d6ffb5';ctx.beginPath();ctx.ellipse(160+(i*193)%1610,470+(i*97)%470,phase*20,phase*5,0,0,Math.PI*2);ctx.stroke();}
  }else{
   for(let i=0;i<45;i++){const x=((i*233+t*(310+i%5*40))%2300)-200,y=100+(i*97)%840;ctx.globalAlpha=.05+(i%3)*.025;ctx.strokeStyle='#d3e5ee';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+60,y-10,x+140,y+12,x+220,y-5);ctx.stroke();}
   const x=160+p*1500,y=tornadoRowTop(row??0)+143;
   for(let i=0;i<25;i++){const a=t*3+i*2.1,r=45+(i%7)*12;ctx.globalAlpha=.25+(i%4)*.1;ctx.fillStyle=i%3?'#a8a089':'#d5c09a';ctx.save();ctx.translate(x+110+Math.cos(a)*r,y+Math.sin(a)*r*.22-(i%5)*12);ctx.rotate(a);ctx.fillRect(-3,-1,6+i%4,2);ctx.restore();}
  }
  ctx.globalAlpha=1;
  if(!reduced)frame=requestAnimationFrame(paint);
 };
 paint();return()=>cancelAnimationFrame(frame);
 },[kind,start,row]);
 return <canvas ref={ref} className="atmosphere" width="1920" height="1080" aria-hidden="true"/>;
}
export function Meteor({progress}:{progress:number}){
 const m=meteorPose(progress);
 return <div className="meteor-flight" style={{transform:`translate3d(${m.x}px,${m.y}px,0) rotate(${m.angle}deg)`}} aria-hidden="true"><svg viewBox="-460 -100 560 200">
 <defs><linearGradient id="meteor-plume"><stop stopColor="#ee6e3c" stopOpacity="0"/><stop offset=".7" stopColor="#fa9d56" stopOpacity=".5"/><stop offset="1" stopColor="#fff2bd"/></linearGradient><radialGradient id="meteor-stone"><stop stopColor="#ce9874"/><stop offset=".6" stopColor="#8f6260"/><stop offset="1" stopColor="#4b424f"/></radialGradient></defs>
 <path className="meteor-plume" d="M-445 0Q-230-65 0-48L33 0 0 48Q-230 65-445 0Z" fill="url(#meteor-plume)"/>
 <path d="M-335 0Q-150-30 10-23L34 0 10 23Q-150 30-335 0" fill="#fff1b5" opacity=".65"/>
 <ellipse cx="0" cy="0" rx="55" ry="52" fill="#ffb777" opacity=".45"/>
 <path d="m-29-35 32-9 31 22 6 36-26 28-35-8-22-27z" fill="url(#meteor-stone)" stroke="#ffd898" strokeWidth="4"/>
 <path d="m-19-27 10 14 24-10m-18 19 21 13-12 19m-30-13 12-10" fill="none" stroke="#ebaf7c" strokeWidth="3"/>
 </svg></div>;
}
export function Tornado({progress,row}:{progress:number;row:number}){
 return <div className="tornado-storm" style={{transform:`translate3d(${160+progress*1500}px,${tornadoRowTop(row)-62}px,0)`}} aria-hidden="true"><div className="tornado-dust"/><svg viewBox="0 0 220 240"><defs><linearGradient id="funnel-shade" x2="1" y2="0"><stop stopColor="#425465" stopOpacity=".25"/><stop offset=".45" stopColor="#aec2c9" stopOpacity=".85"/><stop offset=".7" stopColor="#6a8495" stopOpacity=".65"/><stop offset="1" stopColor="#293b4e" stopOpacity=".35"/></linearGradient></defs><path d="M10 16Q120-15 210 16L130 205Q110 225 99 205Z" fill="url(#funnel-shade)"/>{Array.from({length:14},(_,i)=>{const w=196-i*11,y=17+i*14;return <ellipse className="funnel-band" key={i} cx={110+Math.sin(i*.6)*8} cy={y} rx={w/2} ry={12-i*.5} fill="none" stroke={i%2?'#adc3c8':'#68869a'} strokeWidth={i%3?5:8} opacity={.4+(i%3)*.12} style={{animationDelay:`-${i*.11}s`}}/>;})}</svg></div>;
}
