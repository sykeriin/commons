import { chromium } from 'playwright';
// WCAG contrast for dark-theme token pairs and the computed colours of every category-coloured element.
const BASE = process.env.E2E_URL ?? 'http://localhost:3000';
const lum=([r,g,b])=>{const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(r)+.7152*f(g)+.0722*f(b)};
const cr=(a,b)=>{const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p);return (x+.05)/(y+.05)};
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const pairs=[['text on black','#ffffff','#000000'],['text on card','#ffffff','#0a0a0a'],['muted on black','#a3a3a3','#000000'],['muted on card','#a3a3a3','#0a0a0a'],['black on lime','#000000','#c4f000'],['black on pink','#000000','#ff3ea5'],['black on yellow','#000000','#ffde00'],
['lime text on black','#c4f000','#000000'],['pink link on black','#ff3ea5','#000000'],['pink link on card','#ff3ea5','#0a0a0a'],['bad on black','#ff5d5d','#000000'],['bad on card','#ff5d5d','#0a0a0a'],['ok on black','#4ade80','#000000'],['black on bad fill','#000000','#ff5d5d'],['white outline vs black','#ffffff','#000000'],['border vs black (UI 3:1)','#646464','#000000'],['border vs card (UI 3:1)','#646464','#0a0a0a']];
let fail=0; console.log('TOKEN PAIRS'); for(const [n,a,b] of pairs){const r=cr(hex(a),hex(b));const need=n.includes('UI')?3:4.5;const ok=r>=need;if(!ok)fail++;console.log((ok?'ok  ':'LOW ')+r.toFixed(2).padStart(6)+'  '+n)}
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:1440,height:900},colorScheme:'dark'});const pg=await c.newPage();await pg.addInitScript(()=>localStorage.setItem('commons.persona','s-demo'));
 const routes=['/campus','/events/ev-1','/clubs/robotics','/departments/cs','/academics','/events','/clubs'];const seen=new Map();
 for(const r of routes){await pg.goto(BASE+'/#'+r);await pg.waitForTimeout(500);if(r==='/academics'){await pg.getByRole('tab',{name:/Timetable/}).click();await pg.waitForTimeout(200)}
  const rows=await pg.evaluate(()=>{const cv=document.createElement('canvas').getContext('2d');const rgb=s=>{cv.fillStyle='#000';cv.fillStyle=s;cv.clearRect(0,0,1,1);cv.fillRect(0,0,1,1);return [...cv.getImageData(0,0,1,1).data].slice(0,3)};
   return [...document.querySelectorAll('.hue,.hue-chip')].map(e=>{const s=getComputedStyle(e);return {bg:rgb(s.backgroundColor),fg:rgb(s.color),t:(e.textContent||'').trim().slice(0,22)}})});
  rows.forEach(x=>seen.set(x.bg.join()+x.fg.join(),x))}
 console.log('\nHUE ELEMENTS (computed in browser, dark)'); for(const x of seen.values()){const r=cr(x.fg,x.bg);if(r<4.5)fail++;console.log((r>=4.5?'ok  ':'LOW ')+r.toFixed(2).padStart(6)+`  rgb(${x.bg}) / text rgb(${x.fg})  "${x.t}"`)}
 await b.close();console.log(fail?`\n${fail} LOW`:'\nall pass');process.exit(fail?1:0)})();
