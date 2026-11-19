const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const port = process.env.PORT || 8820;
const width = Number(process.argv[2] || 1440);
const sections = [
  ['basics', 'anatomy', 'Basics'],
  ['clinical', 'surgery', 'Clinical'],
  ['special', 'usmle', 'International Exams'],
  ['house', 'ho-skills', 'House Officer'],
];

async function checkSpaces(browser) {
  const page = await browser.newPage({
    viewport: { width, height: width <= 360 ? 640 : width < 600 ? 844 : 900 },
    hasTouch: width < 600,
    isMobile: width < 600,
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  const main = page.locator('#main');
  const onPage = async name => {
    await page.locator('body[data-page="' + name + '"] #main > .page').waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), name + ' overflows');
  };
  const go = async (hash, name = hash.split('/')[0]) => {
    await page.evaluate(hash => IS.go(hash), hash);
    await onPage(name);
  };
  const chooseSection = async section => {
    await main.locator('[data-act=setsection][data-v="' + section + '"]').click();
    await onPage('home');
  };
  const visible = async (text, expected) => {
    assert.equal((await main.innerText()).includes(text), expected, text);
  };

  await page.goto('http://localhost:' + port + '/');
  await onPage('pick');
  await go('courses', 'pick');
  await main.locator('[data-act=setspec][data-v=medicine]').click();
  await onPage('pick-section');
  assert.deepEqual(await main.locator('[data-act=setsection]').evaluateAll(
    cards => cards.map(card => card.dataset.v)), sections.map(([id]) => id));
  assert.equal(await page.locator('#top .tspec').innerText(), 'Medicine');
  assert.equal(await main.locator('h1').innerText(), 'اختر قسمك');
  assert.equal(await main.locator('a[href="#pick"]').count(), 0);
  const initialSize = page.viewportSize();
  for (const [w, h] of [[320, 568], [360, 640], [390, 740], [412, 915], [800, 480], [820, 1180], [1024, 600], [1440, 900]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForFunction(() => {
      const cards = Array.from(document.querySelectorAll('.section-choice'));
      const tabs = document.querySelector('#tabs');
      const bottom = tabs.getClientRects().length ? tabs.getBoundingClientRect().top : innerHeight;
      return cards.length === 4 && document.documentElement.scrollHeight <= innerHeight + 1 && cards.every(card => {
        const bounds = card.getBoundingClientRect();
        return bounds.top >= 0 && bounds.bottom <= bottom && card.querySelector('b').getBoundingClientRect().bottom <= bounds.bottom;
      });
    }, null, { timeout: 3000 }).catch(error => { throw new Error('Section picker does not fit at ' + w + '×' + h, { cause: error }); });
  }
  await page.setViewportSize(initialSize);
  await page.locator('#top .tspec[href="#pick"]').click();
  await onPage('pick');
  await main.locator('[data-act=setspec][data-v=medicine]').click();
  await onPage('pick-section');

  await page.evaluate(async sections => {
    if (DB.live) throw new Error('Run this journey with an empty preview config.');
    for (const [id, subject] of sections) {
      await DB.ins('lecturers', { id: 't-' + id, name: 'Fixture Lecturer ' + id, status: 'active' });
      await DB.ins('courses', { id: 'c-' + id, lecturer_id: 't-' + id, title: 'Fixture Course ' + id, spec: 'medicine',
        cat: id === 'basics' ? 'clinical' : id, subject, status: 'published', price: 0, n_lessons: 1 });
      await DB.ins('sections', { id: 'group-' + id, course_id: 'c-' + id, title: 'Lesson group' });
      await DB.ins('lessons', { id: 'lesson-' + id, section_id: 'group-' + id, course_id: 'c-' + id, title: 'Fixture Lesson ' + id, kind: 'text', free: true });
      await DB.ins('files', { id: 'f-' + id, title: 'Fixture File ' + id, spec: 'medicine', cat: id, subject, kind: 'book', status: 'published' });
      await DB.ins('posts', { id: 'post-' + id, title: 'Fixture Post ' + id, spec: 'medicine', room: id, status: 'open' });
      await DB.ins('paths', { id: 'path-' + id, title: 'Fixture Path ' + id, spec: 'medicine', cat: id, steps: ['c-' + id], status: 'published' });
    }
    await DB.ins('courses', { id: 'shared-clinical', lecturer_id: 't-basics', title: 'Fixture Shared Lecturer Clinical Course', cat: 'clinical', spec: 'medicine', status: 'published' });
    await DB.ins('courses', { id: 'dentistry', lecturer_id: 't-basics', title: 'Fixture Dentistry Course', cat: 'basics', spec: 'dentistry', status: 'published' });
    await DB.ins('courses', { id: 'draft-course', lecturer_id: 't-house', title: 'Fixture Draft Course', cat: 'basics', spec: 'medicine', status: 'draft' });
  }, sections);

  for (const [id, subject] of sections) {
    await go('pick-section');
    await chooseSection(id);
    assert.equal(await main.locator('h1').innerText(), await page.evaluate(id => IS.cat(id).ar, id));
    await visible('Fixture Course ' + id, true);
    await visible('Fixture Dentistry Course', false);

    for (const [route, label] of [
      ['courses', 'Course'], ['lecturers', 'Lecturer'], ['library/all', 'File'],
      ['paths', 'Path'], ['community', 'Post'], ['search/Fixture', 'Course'],
    ]) {
      await go(route);
      if (route === 'courses') {
        assert.equal(await main.locator('[data-f=sub][value="' + subject + '"]').count(), 1);
        if (id === 'basics') {
          assert.equal(await main.locator('span[lang=en]').filter({ hasText: /^Physiology$/ }).count(), 1);
          assert.equal(await main.locator('[data-f=sub][value="surgery"]').count(), 0);
        }
      }
      if (route === 'lecturers') assert.equal(await main.locator('h1').innerText(), 'المحاضرون');
      await visible('Fixture ' + label + ' ' + id, true);
      for (const [other] of sections) {
        if (other !== id && !(route === 'lecturers' && id === 'clinical' && other === 'basics')) {
          await visible('Fixture ' + label + ' ' + other, false);
        }
      }
      await visible('Fixture Draft Course', false);
      await visible('Fixture Dentistry Course', false);
    }
    await visible('Fixture Lecturer ' + id, true);
  }

  await go('pick-section');
  await chooseSection('basics');
  await page.evaluate(() => IS.ACT.lang());
  await go('lecturers');
  assert.equal(await main.locator('h1').innerText(), 'Lecturers');
  await page.evaluate(() => IS.ACT.lang());
  await go('home');
  await page.reload();
  await onPage('home');
  assert.equal(await page.evaluate(() => IS.mySection().id), 'basics');
  await go('lecturer/t-basics');
  await visible('Fixture Course basics', true);
  await visible('Fixture Shared Lecturer Clinical Course', false);
  for (const [route, hidden] of [
    ['course/c-clinical', 'Fixture Course clinical'],
    ['lesson/c-clinical/lesson-clinical', 'Fixture Lesson clinical'],
    ['lecturer/t-clinical', 'Fixture Lecturer clinical'],
    ['file/f-clinical', 'Fixture File clinical'],
    ['post/post-clinical', 'Fixture Post clinical'],
    ['path/path-clinical', 'Fixture Path clinical'],
  ]) {
    await go(route);
    await visible(hidden, false);
    await main.locator('[data-act=open-study-space][data-v=clinical]').waitFor();
  }
  await go('course/c-clinical');
  await main.locator('[data-act=open-study-space]').click();
  await main.locator('h1').filter({ hasText: 'Fixture Course clinical' }).waitFor();

  await go('pick');
  await main.locator('[data-act=setspec][data-v=dentistry]').click();
  await onPage('pick-section');
  await chooseSection('basics');
  await visible('Fixture Dentistry Course', true);
  await visible('Fixture Course basics', false);
  await go('pick');
  await main.locator('[data-act=setspec][data-v=medicine]').click();
  await onPage('pick-section');
  assert.equal(await main.locator('[aria-current=true]').getAttribute('data-v'), 'clinical');
  await chooseSection('basics');

  await page.evaluate(async () => {
    await DB.signUp({ name: 'Preview Owner', phone: '0910000000', pass: 'preview-pass' });
    await DB.signOut();
    await DB.signUp({ name: 'Preview Student', phone: '0910000001', pass: 'preview-pass' });
    const student = DB.uid();
    for (const id of ['basics', 'clinical']) {
      await DB.ins('enrollments', { course_id: 'c-' + id, user_id: student, status: 'active' });
    }
    IS.LS.set('fav-' + student, { 'c:c-basics': 1, 'c:c-clinical': 2, 't:t-basics': 3, 't:t-clinical': 4 });
    await IS.loadMe();
  });
  await go('learning');
  await visible('Fixture Course basics', true);
  await visible('Fixture Course clinical', false);
  await go('favorites');
  await visible('Fixture Course basics', true);
  await visible('Fixture Course clinical', false);
  await visible('Fixture Lecturer clinical', false);

  await page.evaluate(async () => {
    await DB.ins('lecturers', { id: DB.uid(), name: 'Preview Student', status: 'active' });
    await IS.loadMe();
  });
  await go('studio-course/new');
  const courseForm = main.locator('form[data-form=course]');
  const subjects = courseForm.locator('select[name=subject]');
  await courseForm.locator('select[name=cat]').selectOption('basics');
  assert.equal(await subjects.locator('option[value=anatomy]').count(), 1);
  assert.equal(await subjects.locator('option[value=surgery]').count(), 0);
  await subjects.selectOption('anatomy');
  await courseForm.locator('select[name=spec]').selectOption('dentistry');
  assert.equal(await subjects.locator('option[value=anatomy]').count(), 0);
  assert.equal(await subjects.inputValue(), '');

  await page.evaluate(async () => {
    await DB.ins('lecturers', { id: 'scope-lecturer', name: 'Fixture Selected Specialities', status: 'active', teaching_specs: ['medicine', 'nursing'], teaching_spaces: ['medicine/clinical', 'nursing/clinical'] });
    await DB.ins('lecturers', { id: 'old-lecturer', name: 'Fixture Existing Pharmacist', status: 'active', specialty: 'Clinical Pharmacy' });
    IS.setSpec('medicine'); IS.setSection('clinical');
  });
  await go('lecturers');
  await visible('Fixture Selected Specialities', true);
  await visible('Fixture Existing Pharmacist', false);
  await page.evaluate(() => { IS.setSection('basics'); });
  await go('lecturers');
  await visible('Fixture Selected Specialities', false);
  await page.evaluate(() => { IS.setSpec('nursing'); IS.setSection('clinical'); });
  await go('lecturers');
  await visible('Fixture Selected Specialities', true);
  await go('lecturer/scope-lecturer');
  await visible('Fixture Selected Specialities', true);
  await go('courses');
  assert.match(await main.locator('.ban').getAttribute('style'), /sub_nurs-medsurg/);
  await page.evaluate(() => { IS.setSpec('pharmacy'); IS.setSection('basics'); });
  await go('lecturers');
  await visible('Fixture Existing Pharmacist', true);
  await visible('Fixture Selected Specialities', false);
  await go('courses');
  assert.match(await main.locator('.ban').getAttribute('style'), /sub_pharmaceutics/);

  for (const [name, expected, direction] of [['د. Arja Adam', 'Dr. Arja', 'ltr'], ['Dr. أحمد محمد', 'د. أحمد', 'rtl']]) {
    await page.evaluate(async name => {
      await DB.upd('profiles', DB.uid(), { name });
      await IS.loadMe();
    }, name);
    await go('home');
    const greeting = main.locator('.lhh .lht > p bdi');
    assert.equal(await greeting.textContent(), expected);
    assert.equal(await greeting.getAttribute('dir'), direction);
  }

  assert.deepEqual(errors, []);
  console.log('Study sections OK at ' + width + 'px');
}

(async () => {
  const browser = await chromium.launch();
  try {
    await checkSpaces(browser);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
