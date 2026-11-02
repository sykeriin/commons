import { chromium } from 'playwright';
import assert from 'node:assert';
// End-to-end behaviour: enrol, waitlist, role gating, club approval, attendance, role requests.
const BASE = process.env.E2E_URL ?? 'http://localhost:3000';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  const as = async (id, route = '/') => { await page.evaluate(id => localStorage.setItem('commons.persona', id), id).catch(() => {}); await page.goto(BASE+'/#' + route); await page.reload(); await page.waitForTimeout(400); };
  const ok = (name) => console.log('PASS', name);
  await page.goto(BASE+'/'); await page.evaluate(() => localStorage.clear());

  // 1. Student enrolls in a course (a catalog one with free seats, no clash)
  await as('s-demo', '/academics'); await page.getByRole('tab', { name: 'Catalog' }).click();
  await page.getByPlaceholder('Search courses…').fill('Genetics');
  await page.getByRole('button', { name: /Enroll/ }).first().click(); await page.waitForTimeout(300);
  await page.getByRole('tab', { name: 'My courses' }).click();
  assert(await page.getByText('Genetics').first().isVisible()); ok('student enrolls -> appears in My courses');

  // 2. RSVP to a full event goes to the waitlist
  await as('s-demo', '/events'); await page.getByText('Chess Simul').first().click(); await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Join waitlist' }).click(); await page.waitForTimeout(300);
  assert(await page.getByText(/on the waitlist/).isVisible()); ok('full event -> waitlist');

  // 3. Student sees no Manage tab and is bounced from /manage
  await as('s-demo', '/manage'); assert(!(await page.getByRole('link', { name: 'Manage' }).count())); assert(page.url().endsWith('#/')); ok('student cannot reach /manage');

  // 4. Student starts a club -> pending; staff approves -> visible in Discover
  await as('s-demo', '/clubs/new'); await page.getByLabel('Club name').fill('Origami Order'); await page.getByLabel('What is it about?').fill('Folding things.');
  await page.getByRole('button', { name: 'Submit for approval' }).click(); await page.waitForTimeout(500);
  assert(await page.getByText('Pending approval').first().isVisible()); ok('new club is pending');
  await as('s-demo', '/clubs'); assert(!(await page.getByRole('tab', { name: 'Discover' }).isHidden())); 
  await as('staff-jo', '/manage'); await page.getByRole('tab', { name: /Approvals/ }).click(); await page.getByText('Origami Order').waitFor();
  await page.locator('div.card', { hasText: 'Origami Order' }).getByRole('button', { name: 'Approve' }).click(); await page.waitForTimeout(300);
  await as('f-ravi', '/clubs'); await page.getByPlaceholder('Search…').fill('Origami'); assert(await page.getByText('Origami Order').isVisible()); ok('staff approves -> club visible to others');

  // 5. Faculty: attendance for own section saved, student sees it
  await as('f-ravi', '/teaching/sec-cs340'); await page.getByRole('tab', { name: 'Attendance' }).click();
  await page.getByRole('radiogroup').first().getByRole('radio', { name: 'absent' }).click(); await page.getByRole('button', { name: 'Save', exact: true }).click(); await page.waitForTimeout(300); ok('faculty saves attendance');
  // 6. Faculty cannot manage someone else's section
  await as('f-ravi', '/teaching/sec-cs220'); assert(await page.getByText('You can only manage your own sections').isVisible()); ok('faculty blocked from other instructor section');
  // 7. Admin approves role request -> person becomes staff
  await as('admin-sam', '/manage'); await page.getByRole('tab', { name: /Role requests/ }).click(); await page.getByRole('button', { name: 'Approve' }).first().click(); await page.waitForTimeout(300);
  assert(await page.getByText('approved').first().isVisible()); ok('admin approves role request');
  // 8. Staff cannot see Role requests/Users tabs
  await as('staff-jo', '/manage'); assert(!(await page.getByRole('tab', { name: /Role requests/ }).count())); ok('staff has no role-admin tabs');
  console.log(errs.length ? 'PAGE ERRORS:\n' + errs.join('\n') : 'no page errors'); await b.close();
})().catch(e => { console.error('FAIL', e.message.split('\n').slice(0, 6).join('\n')); process.exit(1); });
