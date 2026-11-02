import { chromium } from 'playwright';
// Every route as each role, phone + desktop: no crashes, no console errors, no horizontal overflow.
const BASE = process.env.E2E_URL ?? 'http://localhost:3000';
const personas = [['s-demo','student'],['f-ada','headfac'],['f-ravi','faculty'],['staff-jo','staff'],['admin-sam','admin']];
const routes = {
  student: ['/', '/academics', '/academics/sec-cs220', '/campus', '/events', '/events/ev-0', '/events/new', '/clubs', '/clubs/robotics', '/clubs/new', '/departments', '/departments/cs', '/people', '/people/f-ada', '/places', '/inbox', '/me', '/about'],
  headfac: ['/', '/teaching', '/teaching/sec-cs220', '/manage', '/people/f-ravi'],
  faculty: ['/', '/teaching', '/teaching/sec-cs340', '/inbox', '/me'],
  staff: ['/', '/manage', '/events/ev-12', '/clubs/quidditch'],
  admin: ['/', '/manage', '/clubs/quidditch', '/me'],
};
(async () => {
  const b = await chromium.launch(); const errors = [];
  for (const [vw, size] of [['m', { width: 390, height: 844 }], ['d', { width: 1440, height: 900 }]]) {
    for (const [id, key] of personas) {
      const ctx = await b.newContext({ viewport: size, colorScheme: vw === 'd' && key === 'student' ? 'dark' : 'light' }); const page = await ctx.newPage();
      page.on('pageerror', e => errors.push(`${vw}/${key} pageerror: ${e.message}`));
      page.on('console', m => m.type() === 'error' && !m.text().includes('fonts.googleapis') && !m.text().includes('ERR_') && errors.push(`${vw}/${key} console: ${m.text()}`));
      await page.addInitScript(id => localStorage.setItem('commons.persona', id), id);
      for (const r of routes[key]) {
        await page.goto(BASE+'/#' + r); await page.waitForTimeout(350);
        const txt = await page.locator('body').innerText();
        if (/Something went wrong|not found/i.test(txt)) errors.push(`${vw}/${key} ${r}: ${txt.match(/Something went wrong|.*not found.*/i)[0]}`);
        const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); if (ov > 1) errors.push(`${vw}/${key} ${r}: horizontal overflow ${ov}px`);
      }
      await ctx.close();
    }
  }
  console.log(errors.length ? errors.join('\n') : 'NO ERRORS'); await b.close();
})();
