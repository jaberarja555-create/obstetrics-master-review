/* The top bar behaves like Facebook's (owner, 21 Nov 2026: «when there are a lot of posts one must go back to the top to reach the
   buttons; the upper bar should act like in Facebook»): at the top of the page the full header shows as designed. Once it has scrolled
   out of view, scrolling down keeps it hidden and the first scroll up brings back a slim bar (small seal + every button) fixed at the top;
   scrolling down hides it again. The page keeps its place (the header's height is held by the page's top padding while it floats). */
(function () {
  'use strict';
  var lastY = 0, ticking = false, held = 0;
  function top() { return document.querySelector('#main .mrx .mh-top'); }
  function release(t, pg) { if (!t) return; t.classList.remove('mhs', 'mhs-on'); if (pg && held) { pg.style.paddingTop = ''; } held = 0; }
  function update() {
    ticking = false;
    var t = top(), y = window.scrollY || 0, dy = y - lastY; lastY = y;
    if (!t) return;
    var pg = t.parentElement;
    if (!t.classList.contains('mhs')) {
      var h = t.offsetHeight, r = t.getBoundingClientRect();
      if (r.bottom < -10 && y > h + 40) {            /* the header has left the screen: it becomes the floating slim bar (hidden first) */
        held = h; var pt = parseFloat(getComputedStyle(pg).paddingTop) || 0;
        pg.style.paddingTop = (pt + h) + 'px'; t.dataset.pt = pt; t.classList.add('mhs');
      }
      return;
    }
    if (y <= held + 20) { release(t, pg); return; }   /* back near the top: the full header in its place again */
    if (dy < -4) t.classList.add('mhs-on'); else if (dy > 6) t.classList.remove('mhs-on');
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  /* a new page draws a new header: start again from the top state */
  var prev = IS.onRoute;
  IS.onRoute = function (name, arg, main) { if (prev) try { prev(name, arg, main); } catch (e) {} held = 0; lastY = window.scrollY || 0; var pg = main && main.querySelector('.mh-page'); if (pg) pg.style.paddingTop = ''; };
})();
