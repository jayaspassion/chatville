export function Landscape(){return <svg className="landscape" viewBox="0 0 1920 1080" aria-hidden="true">
 <defs><linearGradient id="far-hill" x2="0" y2="1"><stop stopColor="#a5c9be"/><stop offset="1" stopColor="#c5d3b4"/></linearGradient><linearGradient id="near-hill" x2=".2" y2="1"><stop stopColor="#8fb8a0"/><stop offset="1" stopColor="#b3c594"/></linearGradient><linearGradient id="meadow" x2=".1" y2="1"><stop stopColor="#b9cf9b"/><stop offset="1" stopColor="#a9bf86"/></linearGradient><pattern id="grass-detail" width="113" height="77" patternUnits="userSpaceOnUse"><path d="m12 24 3-5 3 5m67 32 2-4 3 4" fill="none" stroke="#718f6340" strokeWidth="2"/><circle cx="50" cy="40" r="1.5" fill="#f3eed071"/><circle cx="95" cy="19" r="1.5" fill="#f5e7bb60"/></pattern></defs>
 <path d="M0 340Q220 250 440 340T920 315 1410 340 1920 290V1080H0Z" fill="url(#far-hill)"/>
 <path d="M0 395Q300 305 600 420T1200 390 1700 365 1920 410V1080H0Z" fill="url(#near-hill)"/>
 <path d="M0 470Q410 420 900 472T1920 445V1080H0Z" fill="url(#meadow)"/>
 <path d="M0 470Q410 420 900 472T1920 445V1080H0Z" fill="url(#grass-detail)"/>
 <g fill="none" strokeLinecap="round"><path d="M85 1030Q160 950 190 900L190 480Q190 454 235 454H1680q46 0 46 40v420q0 34-50 34H244" stroke="#c2b49350" strokeWidth="32"/><path d="M85 1030Q160 950 190 900L190 480Q190 454 235 454H1680q46 0 46 40v420q0 34-50 34H244" stroke="#e2d7b5" strokeWidth="24"/><path d="M190 617h1535M190 780h1535" stroke="#e1d5b0" strokeWidth="18"/><path d="M190 454h1490m-1490 163h1535M190 780h1535" stroke="#f7eac87a" strokeWidth="3" strokeDasharray="6 14"/></g>
 <g fill="#f4e9c4" opacity=".6">{Array.from({length:23},(_,i)=><ellipse key={i} cx={100+(i*193)%1730} cy={490+(i*67)%435} rx="2.5" ry="1.5"/>)}</g>
 </svg>;}
