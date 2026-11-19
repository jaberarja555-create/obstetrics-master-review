const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const port = process.env.PORT || 8820;
const width = Number(process.argv[2] || 390);
const accounts = { owner: '0910000201', author: '0910000202', reader: '0910000203', second: '0910000204', teacher: '0910000205' };
const password = 'preview-pass';
const course = 'Fixture group anatomy request';
const image = require('node:path').join(__dirname, 'receipt.png');

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
  await create.locator('[name=price]').fill('125');
  await create.locator('[name=date]').fill('2026-12-07');
  await create.locator('[name=time]').fill('19:30');
  await create.locator('[name=rules]').fill('Please attend both sessions.');
  await create.locator('[name=goal]').fill('2');
  await create.locator('[name=auto_close]').check();
  await create.locator('[name=attachments]').setInputFiles([
    { name: 'Anatomy outline.txt', mimeType: 'text/plain', buffer: Buffer.from('Introduction to anatomy') }
  ]);
  await submit('cr-create');
  await loaded('course-request');
  await visible('Awaiting approval');
  await main.getByRole('link', { name: 'Anatomy outline.txt' }).waitFor();
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
  await main.getByRole('link', { name: 'Anatomy outline.txt' }).waitFor();
  assert.deepEqual(await main.locator('.cr-facts dt').allTextContents(), ['Lecturer', 'Proposed price per person', 'Proposed date and time']);
  await visible('125 SDG');
  await visible('Fixture Anatomy Lecturer');
  await submit('cr-comment', 'body', 'I can join both sessions.');
  await visible('I can join both sessions.');
  await main.getByRole('link', { name: 'Comments (1)' }).click();
  await page.waitForFunction(() => document.activeElement.matches('[data-post-comments]'));
  await main.getByRole('button', { name: 'Like (0)', exact: true }).click();
  await main.getByRole('img', { name: 'Positive reactions 100%' }).waitFor();
  assert.equal(await main.locator('form[data-form="cr-rate"]').count(), 0);
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

  await signIn('teacher');
  await go('studio-course-requests');
  await main.getByRole('link', { name: course }).click();
  await loaded('studio-course-request');
  await main.locator('form[data-form="cr-offer"] [name=price]').fill('150');
  await main.locator('form[data-form="cr-offer"] [name=date]').fill('2026-12-12');
  await main.locator('form[data-form="cr-offer"] [name=time]').fill('17:00');
  await submit('cr-offer', 'terms', 'Saturdays at 5 pm, online.');
  await visible('Offer conversations');
  await visible('Published teaching offers');
  const offerLink = await main.locator('a.li[href^="#studio-course-request/' + id + '/"]').getAttribute('href');
  await signIn('reader');
  await go('course-request/' + id);
  await visible('Saturdays at 5 pm, online.');
  await visible('150 SDG');
  await visible('Published teaching offers');
  await absent('Offer conversations');
  await go('course-request/' + id + '/' + offerLink.split('/').pop());
  await visible('Not found');

  await signIn('author');
  await go('course-request/' + id);
  await main.locator('a.li[href^="#course-request/' + id + '/"]').click();
  await visible('Saturdays at 5 pm, online.');
  await visible('150 SDG');
  await submit('cr-message', 'body', 'Can we agree on a shorter first session?');
  await visible('Can we agree on a shorter first session?');
  await confirmAction('accept');
  await visible('Accepted');
  await signIn('teacher');
  await go(offerLink.slice(1));
  await visible('Accepted');
  await visible('Can we agree on a shorter first session?');

  await signIn('second');
  await go('course-request/' + id);
  await visible('Teaching agreement');
  await absent('125 SDG');
  await visible('Saturdays at 5 pm, online.');
  await visible('150 SDG');
  await absent('Can we agree on a shorter first session?');
  assert.deepEqual(await main.locator('.cr-facts dt').allTextContents(), ['Lecturer', 'Price per person', 'Teaching date and time']);
  assert.match(await main.locator('.cr-facts dd').last().innerText(), /17:00/);
  await visible('0 / 2 joined');
  assert.equal(await action('join').count(), 0);

  async function pay() {
    const payment = page.locator('form[data-form=pay]');
    await page.getByText('Transfer the amount with Bankak', { exact: true }).waitFor();
    await payment.locator('[name=phone]').fill('0910000203');
    assert.equal(await payment.locator('[name=ref]').count(), 0);
    await payment.locator('[name=receipt]').setInputFiles(image);
    await payment.locator('button[type=submit],button:not([type])').click();
    await payment.waitFor({ state: 'hidden' });
    await loaded('payment');
    await visible('Under review');
    return await page.evaluate(() => location.hash.slice(1));
  }
  await main.getByRole('button', { name: 'Pay to join' }).click();
  const firstPayment = await pay();
  await go('course-request/' + id);
  await visible('0 / 2 joined');
  await signIn('owner');
  await go('control-pay');
  const paymentCard = main.locator('.payc').filter({ hasText: course });
  const message = 'Please confirm the name on the receipt.';
  await paymentCard.getByRole('button', { name: 'Message student' }).click();
  const messageForm = page.locator('form[data-form=paymsg]');
  await messageForm.locator('[name=body]').fill(message);
  await messageForm.getByRole('button', { name: 'Send message' }).click();
  await messageForm.waitFor({ state: 'hidden' });

  await signIn('reader');
  await go(firstPayment);
  await visible('Not found');
  await signIn('second');
  await go('notifications');
  await main.getByRole('link', { name: /Message from the payments team/ }).click();
  await visible(message);
  await visible('Under review');

  await signIn('owner');
  await go('control-pay');
  await paymentCard.getByRole('button', { name: 'Reject', exact: true }).click();
  await page.locator('#askf textarea').fill('The receipt image was incomplete.');
  await page.locator('#askf').getByRole('button', { name: 'Reject', exact: true }).click();
  await paymentCard.waitFor({ state: 'hidden' });
  await signIn('second');
  await go(firstPayment);
  await visible('Rejected');
  await visible('The receipt image was incomplete.');
  await main.getByRole('link', { name: 'Open request' }).click();
  await main.getByRole('button', { name: 'Submit a new receipt' }).click();
  const secondPayment = await pay();
  assert.notEqual(firstPayment, secondPayment);

  await signIn('owner');
  await go('control-pay');
  await paymentCard.getByRole('button', { name: 'Confirm seat' }).click();
  await paymentCard.waitFor({ state: 'hidden' });
  await signIn('second');
  await go(secondPayment);
  await visible('Approved');
  await visible('Payment confirmed. Your seat is booked.');
  await go('course-request/' + id);
  await visible('1 / 2 joined');
  await signIn('reader');
  await go('course-request/' + id);
  await main.getByRole('button', { name: 'Pay to join' }).click();
  await pay();
  await go('learning');
  await visible('Teaching groups');
  await main.getByRole('link', { name: new RegExp(course) }).waitFor();
  await signIn('owner');
  await go('control-pay');
  await paymentCard.getByRole('button', { name: 'Confirm seat' }).click();
  await paymentCard.waitFor({ state: 'hidden' });
  await signIn('reader');
  await go('course-request/' + id);
  await visible('Joining closed');
  await visible('2 / 2 joined');

  await signIn('author');
  await go('course-request/' + id);
  assert.equal(await action('delete').count(), 0);
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
  await signIn('reader');
  await go('community/new');
  await main.getByRole('link', { name: /Ask a question/ }).waitFor();
  assert.equal(await main.getByRole('link', { name: /Create a course|Create an event|Write an announcement/ }).count(), 0);
  await signIn('teacher');
  await go('community/new');
  await main.getByRole('link', { name: /Create a course/ }).click();
  await loaded('studio-course');
  const courseForm = main.locator('form[data-form=course]');
  assert.equal(await courseForm.locator('[name=cat]').inputValue(), 'basics');
  await courseForm.getByLabel('Course title').fill('Fixture paid anatomy course');
  await courseForm.locator('[name=subject]').selectOption('anatomy');
  await courseForm.locator('[name=pricing][value=paid]').check();
  await courseForm.locator('[name=price]').fill('250');
  await courseForm.locator('[name=delivery]').selectOption('live');
  await courseForm.locator('[name=starts_at]').fill('2026-12-12T17:00');
  await courseForm.locator('[name=seat_limit]').fill('1');
  await courseForm.locator('[name=live_link]').fill('https://example.org/private-session');
  await courseForm.locator('[name=teaching_method]').fill('Case reviews and interactive questions.');
  await courseForm.locator('[name=promo]').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  await courseForm.locator('[data-ed=about]').fill('An anatomy course for first-year students.');
  await courseForm.locator('[name=learn]').fill('Review anatomical terms');
  await courseForm.locator('[name=cover]').setInputFiles(image);
  await submit('course');
  await main.getByRole('link', { name: /Next: publishing/ }).waitFor();
  const studioPath = await page.evaluate(() => location.hash.slice(1).split('/')[1]);
  await go('studio-course/' + studioPath + '/publish');
  await main.locator('#gdok').check();
  await main.locator('[data-act=submit]').click();
  await main.getByText('The course is with the review team. You will be notified.', { exact: true }).waitFor();
  await signIn('owner');
  await go('control-review');
  await main.locator('[data-act=cpub][data-id="' + studioPath + '"]').click();
  await main.locator('[data-act=cpub][data-id="' + studioPath + '"]').waitFor({ state:'hidden' });
  await signIn('teacher');
  await go('community/new');
  await main.getByRole('link', { name: /Create an event/ }).click();
  await loaded('studio-events');
  const event = page.locator('form[data-form=event]');
  assert.equal(await event.locator('[name=cat]').inputValue(), 'basics');
  await event.locator('[name=title]').fill('Fixture lecturer event');
  await event.locator('[name=starts]').fill('2026-12-12T18:00');
  await event.getByRole('button', { name:'Save and publish' }).click();
  await visible('Fixture lecturer event');

  const postForm = main.locator('form[data-form=post]');
  await go('community/new/announcement');
  await postForm.getByLabel('Announcement title').fill('Fixture lecturer announcement');
  await postForm.getByLabel('Announcement text').fill('An extra anatomy study session is available.');
  await submit('post');
  await visible('Fixture lecturer announcement');
  await go('community/new/discussion');
  await postForm.getByLabel('Discussion title').waitFor();
  assert.equal(await postForm.locator('[name=preview_video]').count(), 0);
  await go('community/new/question');
  await postForm.getByLabel('Your question').waitFor();
  assert.equal(await postForm.locator('[name=preview_video]').count(), 0);
  await go('community/new/course_preview');
  await postForm.getByLabel('Course title').waitFor();
  await postForm.locator('[name=title]').fill('Fixture lecturer preview');
  await postForm.locator('[name=course]').selectOption({ label: 'Fixture paid anatomy course · 250 SDG' });
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
  await main.locator('#feed-type').selectOption('course_preview');
  assert.equal(await main.locator('.feed-card h3').first().innerText(), 'Fixture lecturer preview');
  const card = main.locator('.feed-course_preview').filter({ hasText: 'Fixture lecturer preview' });
  await card.getByRole('link', { name: 'Payment & enrolment' }).waitFor();
  assert.match(await card.getByRole('button', { name: 'Like (0)', exact: true }).innerText(), /👍/);
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
  await card.getByRole('link', { name: 'Comments (0)' }).click();
  await loaded('post');
  await page.waitForFunction(() => document.activeElement.matches('[data-post-comments]'));
  await main.getByRole('img', { name: 'Positive reactions 0%' }).waitFor();
  assert.equal(await main.locator('form[data-form="post-rating"]').count(), 0);
  await main.locator('form[data-form=reply] textarea').fill('Will the preview slides be available?');
  await main.locator('form[data-form=reply] button').click();
  await visible('Will the preview slides be available?');
  await go('community/new/question');
  assert.equal(await postForm.getByRole('link', { name: 'Course preview', exact: true }).count(), 0);
  await postForm.getByLabel('Your question').fill('How should I prepare for the review?');
  await submit('post');
  await loaded('post');
  const pendingQuestion = await page.evaluate(() => location.hash.slice(1));
  await visible('You’ll receive a notification with the review decision.');
  await signIn('second');
  await go(pendingQuestion);
  await visible('Not found');
  await go('home');
  await main.locator('#feed-type').selectOption('question');
  await absent('How should I prepare for the review?');
  await signIn('owner');
  await go('control-questions');
  await visible('How should I prepare for the review?');
  await main.getByRole('button', { name: 'Approve and publish' }).click();
  await visible('No questions awaiting review');
  await signIn('reader');
  await go('home');
  await main.locator('#feed-type').selectOption('question');
  await visible('How should I prepare for the review?');
  await go('course/' + studioPath);
  await visible('Case reviews and interactive questions.');
  await visible('Seats available · 1');
  assert.equal(await main.locator('[data-live-course]').count(), 0);
  await main.getByRole('button', { name: 'Pay to enrol' }).click();
  const coursePayment = await pay();
  await signIn('second');
  await go('course/' + studioPath);
  await visible('Course is full');
  assert.equal(await main.locator('[data-live-course]').count(), 0);
  await signIn('owner');
  await go('control-pay');
  await main.getByRole('button', { name: 'Approve and open' }).click();
  await visible('Nothing here');
  await signIn('reader');
  await go(coursePayment);
  await visible('Approved');
  await go('course/' + studioPath);
  await main.getByRole('link', { name: 'Join the live session' }).waitFor();

  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  assert.deepEqual(errors, []);
  console.log('Course request journey OK at ' + width + 'px');
}

(async () => {
  const browser = await chromium.launch();
  try { await checkRequests(browser); } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
