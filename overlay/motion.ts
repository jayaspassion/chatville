export const METEOR_START={x:1780,y:20};
export const METEOR_END={x:1050,y:330};
export function meteorPose(progress:number){
 const p=Math.min(1,Math.max(0,progress));
 const dx=METEOR_END.x-METEOR_START.x,dy=METEOR_END.y-METEOR_START.y;
 return {x:METEOR_START.x+dx*p,y:METEOR_START.y+dy*p,angle:Math.atan2(dy,dx)*180/Math.PI};
}
export function tornadoRowTop(row:number){return 294+row*160;}
// Fragment cores share the meteor's breakup point, then fan out to each plot.
export function fragmentOrigin(plot:number){
 const columnWidth=(1530-5*16)/6;
 const centerX=195+columnWidth/2+(plot%6)*(columnWidth+16);
 const coreY=tornadoRowTop(Math.floor(plot/6))+(160-130)/2+35+12;
 return {x:METEOR_END.x-centerX,y:METEOR_END.y-coreY};
}
