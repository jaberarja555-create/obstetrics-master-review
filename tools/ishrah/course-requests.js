const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const port = process.env.PORT || 8820;
const width = Number(process.argv[2] || 390);
const accounts = { owner: '0910000201', author: '0910000202', reader: '0910000203', second: '0910000204', teacher: '0910000205' };
const password = 'preview-pass';
const course = 'Fixture group anatomy request';

async function checkRequests(browser) {
  const page = await browser.newPage({ viewport: { width, height: 844 }, hasTouch: width < 600, isMobile: width < 600 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const main = page.locator('#main');
  const find = text => main.getByText(text, { exact: true }).first();
  const visible = async text => find(text).waitFor();
  const absent = async text => assert.equal(await find(text).count(), 0, text);
  const loaded = async pageName => page.locator('body[data-page="' + pageName + '"] #main > .page').waitFor();
  async function go(hash) {
    const current = await page.evaluate(() => location.hash.slice(1));
    if (current === hash) await page.evaluate(() => IS.route());
    else await page.evaluate(hash => IS.go(hash), hash);
    await loaded(hash.split('/')[0]);
  }
  async function signIn(name) {
    await page.evaluate(async ({ phone, password }) => {
      await DB.signIn({ phone, pass: password });
      await IS.loadMe();
    }, { phone: accounts[name], password });
  }
  function action(name) {
    return main.locator('[data-command="' + name + '"]');
  }
  async function confirmAction(name) {
    await action(name).click();
    await page.locator('#cfy').click();
  }
  async function submit(name, field, value) {
    const form = main.locator('form[data-form="' + name + '"]');
    if (field) await form.locator('[name="' + field + '"]').fill(value);
    await form.locator('button[type=submit],button:not([type])').click();
  }

  await page.addInitScript(() => {
    if (window !== window.top) return;
    localStorage.setItem('ish-spec', '"medicine"');
    localStorage.setItem('ish-study-sections', '{"medicine":"basics"}');
    localStorage.setItem('ish-lang', '"en"');
  });
  await page.goto('http://localhost:' + port + '/');
  await loaded('home');
  await page.evaluate(async ({ accounts, password }) => {
    if (DB.live) throw new Error('Run the journey with an empty preview config.');
    for (const [name, phone] of Object.entries(accounts)) {
      const id = await DB.signUp({ name: name === 'teacher' ? 'Fixture Anatomy Lecturer' : name, phone, pass: password });
      if (name === 'teacher') await DB.ins('lecturers', { id, name: 'Fixture Anatomy Lecturer', status: 'active' });
    }
    await DB.ins('notices', { user_id: null, title: 'Fixture Basics announcement', spec: 'medicine', cat: 'basics' });
    await DB.ins('notices', { user_id: null, title: 'Fixture Clinical announcement', spec: 'medicine', cat: 'clinical' });
    await DB.signOut();
    await IS.loadMe();
  }, { accounts, password });

  await go('home');
  await visible('Fixture Basics announcement');
  await absent('Fixture Clinical announcement');
  await signIn('author');
  await go('course-requests/new');
  const create = main.locator('form[data-form="cr-create"]');
  await create.locator('[name=title]').fill(course);
  await create.locator('[name=details]').fill('Two sessions on anatomical terminology.');
  await create.locator('[name=lecturer]').selectOption({ label: 'Fixture Anatomy Lecturer' });
  await create.locator('[name=min]').fill('100');
  await create.locator('[name=max]').fill('200');
  await create.locator('[name=date]').fill('2026-12-07');
  await create.locator('[name=time]').fill('19:30');
  await create.locator('[name=rules]').fill('Please attend both sessions.');
  await create.locator('[name=goal]').fill('2');
  await create.locator('[name=auto_close]').check();
  await submit('cr-create');
  await loaded('course-request');
  await visible('Awaiting approval');
  const id = await page.evaluate(() => location.hash.split('/')[1]);

  await signIn('reader');
  await go('course-requests');
  await absent(course);
  await go('course-request/' + id);
  await visible('Not found');

  await signIn('owner');
  await go('control-course-requests');
  await main.getByRole('link', { name: course }).click();
  await loaded('control-course-request');
  await action('approve').click();
  await loaded('control-course-requests');
  await absent(course);

  await signIn('reader');
  await go('home');
  await visible(course);
  await go('course-request/' + id);
  await visible('Please attend both sessions.');
  await visible('100 – 200 SDG');
  await visible('Fixture Anatomy Lecturer');
  await submit('cr-comment', 'body', 'I can join both sessions.');
  await visible('I can join both sessions.');
  const rating = main.locator('form[data-form="cr-rate"]');
  await rating.locator('select').selectOption('5');
  await rating.locator('button').click();
  await visible('5 / 5 (1)');
  await action('join').click();
  await action('leave').waitFor();
  await visible('1 / 2 joined');
  await page.evaluate(() => IS.setSection('clinical'));
  await go('home');
  await visible('Fixture Clinical announcement');
  await absent('Fixture Basics announcement');
  await absent(course);
  await go('course-request/' + id);
  await main.locator('[data-act="open-study-space"]').click();
  await visible(course);

  await signIn('second');
  await go('course-request/' + id);
  await action('join').click();
  await visible('Joining closed');
  await visible('2 / 2 joined');
  await action('leave').click();
  await visible('1 / 2 joined');
  await visible('Joining closed');
  assert.equal(await action('join').count(), 0);

  await signIn('teacher');
  await go('studio-course-requests');
  await main.getByRole('link', { name: course }).click();
  await loaded('studio-course-request');
  await submit('cr-offer', 'terms', 'My private terms are 150 SDG per person.');
  await visible('Private teaching offers');
  const offerLink = await main.locator('a[href^="#studio-course-request/' + id + '/"]').getAttribute('href');
  await signIn('reader');
  await go('course-request/' + id + '/' + offerLink.split('/').pop());
  await visible('Not found');

  await signIn('author');
  await go('course-request/' + id);
  await main.locator('a[href^="#course-request/' + id + '/"]').click();
  await visible('My private terms are 150 SDG per person.');
  await submit('cr-message', 'body', 'Can we agree on a shorter first session?');
  await visible('Can we agree on a shorter first session?');
  await confirmAction('accept');
  await visible('Accepted');
  await signIn('teacher');
  await go(offerLink.slice(1));
  await visible('Accepted');
  await visible('Can we agree on a shorter first session?');

  await signIn('author');
  await go('course-request/' + id);
  await confirmAction('delete');
  await loaded('course-requests');
  await absent(course);
  await go('course-requests/new');
  await create.locator('[name=title]').fill('Fixture general request to close immediately');
  await create.locator('[name=details]').fill('Any available lecturer may respond.');
  await submit('cr-create');
  await loaded('course-request');
  const secondId = await page.evaluate(() => location.hash.split('/')[1]);
  await signIn('owner');
  await go('control-course-request/' + secondId);
  await action('approve').click();
  await loaded('control-course-requests');
  await signIn('author');
  await go('course-request/' + secondId);
  await confirmAction('close');
  await visible('Joining closed');
  await visible('0 joined');

  await page.evaluate(async () => {
    await DB.ins('news', { title: 'Fixture Basics news', status: 'published', spec: 'medicine', cat: 'basics' });
    await DB.ins('news', { title: 'Fixture Clinical news', status: 'published', spec: 'medicine', cat: 'clinical' });
    await DB.ins('events', { title: 'Fixture Basics event', status: 'published', spec: 'medicine', cat: 'basics', starts: '2026-12-07T17:30:00Z' });
    await DB.ins('events', { title: 'Fixture Clinical event', status: 'published', spec: 'medicine', cat: 'clinical' });
    await DB.ins('posts', { title: 'Fixture popular discussion', body: 'Earlier discussion.', room: 'basics', status: 'open', spec: 'medicine', n_replies: 12, created_at: '2026-10-01T09:00:00Z' });
  });
  await signIn('teacher');
  await go('community');
  const postForm = main.locator('form[data-form=post]');
  await postForm.locator('[name=title]').fill('Fixture lecturer preview');
  await postForm.locator('[name=body]').fill('See the material before you enrol.');
  await postForm.locator('[name=preview_video]').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  await postForm.locator('[name=preview_image]').setInputFiles(require('node:path').join(__dirname, 'receipt.png'));
  await postForm.locator('[name=highlights]').fill('Two live sessions\nPractice questions');
  await submit('post');
  await loaded('post');
  const postPath = await page.evaluate(() => location.hash.slice(1));
  await visible('Two live sessions');
  await main.locator('.post-preview-photo').waitFor();
  await signIn('reader');
  await go('home');
  await visible('Section feed');
  await visible('Fixture Basics news');
  await visible('Fixture Basics event');
  await absent('Fixture Clinical news');
  await absent('Fixture Clinical event');
  await main.locator('#feed-type').selectOption('discussion');
  await absent('Fixture Basics event');
  await main.locator('#feed-sort').selectOption('popular');
  assert.equal(await main.locator('.feed-card h3').first().innerText(), 'Fixture popular discussion');
  await main.locator('#feed-sort').selectOption('new');
  assert.equal(await main.locator('.feed-card h3').first().innerText(), 'Fixture lecturer preview');
  const card = main.locator('.feed-discussion').filter({ hasText: 'Fixture lecturer preview' });
  assert.equal(await card.locator('iframe').count(), 0);
  await page.route('https://www.youtube-nocookie.com/**', route => route.fulfill({ contentType: 'text/plain', body: 'Preview video' }));
  await card.locator('[data-act=post-video]').click();
  await card.locator('iframe').waitFor();
  await card.locator('[data-act=feed-vote][data-value="1"]').click();
  const postId = postPath.split('/')[1];
  await page.waitForFunction(async id => (await DB.one('posts', id)).like_count === 1, postId);
  await card.locator('[data-act=feed-vote][data-value="-1"]').click();
  await page.waitForFunction(async id => {
    const post = await DB.one('posts', id);
    return post.like_count === 0 && post.dislike_count === 1;
  }, postId);
  await go(postPath);
  const postRating = main.locator('form[data-form=post-rating]');
  await postRating.locator('select[name=stars]').selectOption('4');
  await postRating.locator('button').click();
  await visible('4 / 5 (1)');
  await main.locator('form[data-form=reply] textarea').fill('Will the preview slides be available?');
  await main.locator('form[data-form=reply] button').click();
  await visible('Will the preview slides be available?');

  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  assert.deepEqual(errors, []);
  console.log('Course request journey OK at ' + width + 'px');
}

(async () => {
  const browser = await chromium.launch();
  try { await checkRequests(browser); } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
