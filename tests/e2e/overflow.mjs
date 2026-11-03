import { chromium } from 'playwright';
// Phone-width overflow audit across every tab, both themes, 360 and 390px.
const BASE = process.env.E2E_URL ?? 'http://localhost:3000';
const S=[['s-demo','/'],['s-demo','/inbox'],['s-demo','/departments'],['s-demo','/departments/cs'],['s-demo','/people'],['s-demo','/people/f-ada'],['s-demo','/places'],['s-demo','/events'],['s-demo','/events/new'],['s-demo','/clubs/new'],['s-demo','/clubs'],['s-demo','/clubs/robotics'],['s-demo','/clubs/robotics','Members'],['s-demo','/clubs/robotics','Manage'],
['s-demo','/academics','Catalog'],['s-demo','/academics','Timetable'],['s-demo','/academics/sec-cs340'],['s-demo','/me'],['f-ada','/teaching'],['f-ada','/teaching/sec-cs220','Attendance'],['f-ada','/teaching/sec-cs220','Assignments'],['f-ada','/teaching/sec-cs220','Announce'],
...['Overview','Approvals','Role requests','Users','Courses','Announce','Audit log'].map(t=>['admin-sam','/manage',t]),['staff-jo','/manage','Approvals']];
(async()=>{const b=await chromium.launch();let bad=0;
 for(const scheme of ['light','dark']) for(const w of [360,390]){const c=await b.newContext({viewport:{width:w,height:800},colorScheme:scheme});const pg=await c.newPage();
  for(const [p,r,tab] of S){await pg.addInitScript(id=>localStorage.setItem('commons.persona',id),p);await pg.goto(BASE+'/#'+r);await pg.waitForTimeout(250);await pg.evaluate(id=>localStorage.setItem('commons.persona',id),p);await pg.reload();await pg.waitForTimeout(300);
   if(tab){await pg.getByRole('tab',{name:new RegExp(tab)}).click();await pg.waitForTimeout(150)}
   const res=await pg.evaluate(()=>{const W=innerWidth;const off=[];document.querySelectorAll('main *').forEach(e=>{const r=e.getBoundingClientRect();if(!r.width||r.right<=W+1)return;let p=e.parentElement,scroll=false;while(p&&p!==document.body){const o=getComputedStyle(p).overflowX;if(o==='auto'||o==='scroll'||o==='hidden'){scroll=true;break}p=p.parentElement}if(!scroll)off.push((e.tagName+'.'+String(e.className).split(' ').slice(0,3).join('.')).slice(0,60)+' right='+Math.round(r.right))});return {doc:document.documentElement.scrollWidth-W,off:off.slice(0,3)}});
   if(res.doc>1||res.off.length){bad++;console.log(`${scheme}/${w} ${r}${tab?' ['+tab+']':''} doc+${res.doc} ${res.off.join(' | ')}`)}}
  await c.close()}
 await b.close();console.log(bad?`${bad} overflow findings`:'no overflow anywhere');process.exit(bad?1:0)})();
