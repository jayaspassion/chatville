import type {Villager,DisasterKind} from '../shared/state';
import {houseUpgrade} from '../shared/upgrades';
export function House({house,protection,crown}:{house:Villager;protection:DisasterKind|null;crown:boolean}){
 const {tier,prestige,level}=houseUpgrade(house.survived),destroyed=house.damage===3;
 const key=`house-${house.plot}`;
 const roof=['#bc725d','#79988a','#647f9d','#8a7199','#596d87'][tier];
 return <>
 {crown&&<svg className="crown" viewBox="0 0 60 40" aria-label="Longest streak crown"><path d="M8 31 3 7l15 10L30 2l12 15L57 7l-5 24z" fill="#f9d36d" stroke="#9e6b29" strokeWidth="3"/><path d="M9 36h42" stroke="#bd8c35" strokeWidth="5"/></svg>}
 <svg className={`house-art tier-${tier}`} viewBox="0 0 180 180" aria-hidden="true">
 <defs><linearGradient id={`${key}-wall`} x2=".25" y2="1"><stop stopColor="#fff0d6"/><stop offset="1" stopColor={house.color}/></linearGradient><linearGradient id={`${key}-roof`} x2=".7" y2="1"><stop stopColor={roof}/><stop offset="1" stopColor="#414c59"/></linearGradient><linearGradient id={`${key}-window`} x2="0" y2="1"><stop stopColor="#fff6c2"/><stop offset="1" stopColor="#efbb67"/></linearGradient></defs>
 <ellipse cx="90" cy="164" rx="76" ry="10" fill="#2e514b" opacity=".17"/>
 {destroyed?<g className="rubble"><path d="m25 156 17-25 22 8 21-25 29 10 20 16 23 17z" fill="#8c8985" stroke="#57565a" strokeWidth="3"/><path d="m53 151 16-23m22 29 5-33m28 28 10-12" stroke="#65616a" strokeWidth="4"/><path d="m40 128 33 13 20-35 37 22" fill="none" stroke={roof} strokeWidth="12"/><path d="m79 155 18-15 15 14" fill={house.color}/><path d="M25 164h132" stroke="#a9a290" strokeWidth="4" strokeLinecap="round"/></g>:<g>
 {tier>=2&&<g><path d="M16 106h36v52H16zm113 0h35v52h-35z" fill={`url(#${key}-wall)`} stroke="#645d59" strokeWidth="2.5"/><path d="m10 107 25-32 25 32zm112 0 25-32 25 32z" fill={`url(#${key}-roof)`} stroke="#5e5b61" strokeWidth="3"/>{[26,137].map(x=><rect key={x} x={x} y="120" width="13" height="20" rx="6" fill={`url(#${key}-window)`} stroke="#6a615c" strokeWidth="2"/>)}</g>}
 {tier===4&&<g><path d="M17 69h28v84H17zm117 0h29v84h-29z" fill="#dedbcf" stroke="#625f60" strokeWidth="3"/><path d="m9 72 22-43 22 43zm117 0 23-43 23 43z" fill={`url(#${key}-roof)`} stroke="#5e5b61" strokeWidth="3"/><path d="M31 30V13l21 7-21 8m118 2V13l21 7-21 8" fill="#e4bc68" stroke="#a27b3d" strokeWidth="2"/>{[24,142].map(x=><rect key={x} x={x} y="89" width="13" height="20" rx="6" fill={`url(#${key}-window)`} stroke="#8a8070" strokeWidth="2"/>)}</g>}
 <path d="M48 76V37h17v46" fill="#9d867e" stroke="#665f60" strokeWidth="3"/><path d="M45 38h23" stroke="#d3b9a4" strokeWidth="6"/>
 <path d={`M${tier>=3?32:36} ${tier>=3?65:83}h${tier>=3?116:108}v${tier>=3?94:76}H${tier>=3?32:36}z`} fill={`url(#${key}-wall)`} stroke="#665f60" strokeWidth="3"/>
 <path d={tier>=3?'M20 68 89 17h4l68 51z':'M23 87 88 30h7l63 57z'} fill={`url(#${key}-roof)`} stroke="#5d5960" strokeWidth="3.5" strokeLinejoin="round"/>
 <path d={tier>=3?'m31 59 59-43 60 43':'m34 77 56-47 57 47'} fill="none" stroke="#ffffff35" strokeWidth="3"/>
 <path d={tier>=3?'M28 66h125':'M31 86h120'} stroke="#e6c5a3" strokeWidth="4" strokeLinecap="round"/>
 {[48,117].map(x=><g key={x}><rect x={x} y="105" width="21" height="25" rx="4" fill={`url(#${key}-window)`} stroke="#776455" strokeWidth="3"/><path d={`M${x+10} 106v24m-10-12h21`} stroke="#ac8962" strokeWidth="2"/><path d={`M${x-5} 104v27m31-27v27`} stroke={roof} strokeWidth="4"/></g>)}
 <path d="M78 158v-32q0-17 14-17t14 17v32z" fill="#74635e" stroke="#645b59" strokeWidth="3"/><path d="M85 155v-29q0-9 7-9t7 9v29" fill="#a7826c"/><circle cx="99" cy="139" r="2.7" fill="#ffe5a6"/>
 <path d="M27 160h126m-69 5h25" stroke="#ebddc4" strokeWidth="6" strokeLinecap="round"/>
 {tier>=1&&<g><path d="M42 135h32l-5 10H47zm69 0h32l-5 10h-23z" fill="#9b715e"/>{[47,57,67,116,126,136].map((x,i)=><g key={x}><path d={`M${x} 135v-8`} stroke="#6c8f62" strokeWidth="2"/><circle cx={x} cy="126" r="4" fill={i%2?'#f4d38e':'#e5a0a0'}/></g>)}<path d="M114 152h36v8h-36" fill="#cfb9a1"/></g>}
 {tier>=2&&<g><path d="m69 75 21-23 22 23" fill={house.color} stroke="#e6c6a1" strokeWidth="3"/><rect x="82" y="64" width="17" height="21" rx="8" fill={`url(#${key}-window)`} stroke="#735f59" strokeWidth="3"/></g>}
 {tier>=3&&<g>{[49,116].map(x=><g key={x}><rect x={x} y="75" width="19" height="19" rx="8" fill={`url(#${key}-window)`} stroke="#776455" strokeWidth="3"/><path d={`M${x-4} 98h27m-23 0v5m19-5v5`} stroke="#b6a18c" strokeWidth="3"/></g>)}<path d="M36 151h34m42 0h34" stroke="#eed8b0" strokeWidth="4"/></g>}
 {tier>=4&&<g><path d="m82 39 9-8 9 8-9 9z" fill="#edca7b" stroke="#a37c3f" strokeWidth="2"/><path d="M35 66h111" stroke="#dbbd7e" strokeWidth="4"/></g>}
 {prestige>0&&<g><rect x="78" y="88" width="26" height="14" rx="5" fill="#e8c977"/><text x="91" y="99" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#67522e">{level}</text></g>}
 {house.damage>=1&&<g fill="none" stroke="#795147" strokeWidth="3.5"><path d="m45 88 9 13-7 9 12 13-7 13 10 21"/><path d="m136 138-13 4 6 11-10 7"/></g>}
 </g>}
 {protection==='meteor'&&<g className="dome"><path d="M7 163a83 120 0 0 1 166 0z" fill="#b5f5ff25" stroke="#b8f8ff" strokeWidth="4"/><path d="M24 100q12-40 38-51" stroke="#e3ffff" strokeWidth="5" fill="none" strokeLinecap="round"/></g>}
 {protection==='acidrain'&&<g className="umbrella"><path d="M90 14v87q0 16 14 7" fill="none" stroke="#474c59" strokeWidth="5"/><path d="M15 51Q90-35 165 51q-19-13-38 0-18-13-37 0-18-13-37 0-19-13-38 0" fill="#ddacc9" stroke="#67556c" strokeWidth="3"/><path d="M53 51Q65 16 90 5q27 12 37 46" fill="none" stroke="#b683a4" strokeWidth="3"/></g>}
 {protection==='tornado'&&<g className="anchors"><path d="M22 93 48 167m110-74-26 74" stroke="#c1d0d1" strokeWidth="9" strokeDasharray="9 3"/><path d="M22 93 48 167m110-74-26 74" stroke="#4d6870" strokeWidth="3" strokeDasharray="9 3"/><path d="M37 167h24m60 0h24M48 157v17m84-17v17" stroke="#465961" strokeWidth="6"/></g>}
 </svg>
 {!destroyed&&house.damage===2&&<div className="fire-smoke" aria-hidden="true"><i/><i/><i/><span/><span/></div>}
 </>;
}
