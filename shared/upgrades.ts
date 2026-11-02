const styles=['Cottage','Garden cottage','Townhouse','Manor','Royal manor'];
export function houseUpgrade(survived:number){
  const level=1+Math.floor(survived/5);
  return {level,tier:Math.min(4,level-1),name:styles[Math.min(4,level-1)],prestige:Math.max(0,level-5),nextAt:Math.floor(survived/5)*5+5};
}
