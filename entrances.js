const node = id => document.getElementById('n' + id);
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const compact = matchMedia('(max-width:720px)');
const desktopBooking = matchMedia('(width > 1024px)');
const clamp = value => Math.min(1, Math.max(0, value));
// Observe the unmasked layout box. A closed clip-path can have no visible intersection.
const entrances = new Map();
const observer = new IntersectionObserver(entries => {
  for (const {target, isIntersecting} of entries) {
    if (!isIntersecting) continue;
    for (const element of entrances.get(target)) element.classList.add('seen');
    observer.unobserve(target);
    entrances.delete(target);
  }
}, {rootMargin: '0px 0px -9% 0px', threshold: 0});

function reveal(element, delay = 0, type = 'reveal', trigger = element) {
  element.classList.add(type);
  element.style.setProperty('--delay', delay + 's');
  if (!entrances.has(trigger)) {
    entrances.set(trigger, []);
    observer.observe(trigger);
  }
  entrances.get(trigger).push(element);
}
function sequence(ids, step, trigger) {
  ids.forEach((id, i) => reveal(node(id), i * step, 'reveal', trigger));
}
const smooth = t => t*t*(3-2*t);
const phase = (progress,start,end) => smooth(clamp((progress-start)/(end-start)));

function playWhenVisible(video) {
  let inView = false;
  function sync() {
    if (!inView || document.hidden || reduce.matches) video.pause();
    else if (video.paused) video.play().catch(() => {});
  }
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    sync();
  }).observe(video);
  video.addEventListener('loadeddata',sync);
  document.addEventListener('visibilitychange', sync);
  reduce.addEventListener('change', sync);
}
function animateEditorialPanel(panel, anchor) {
  reveal(panel, .04, 'panel-mask', anchor);
  [...panel.children].forEach((element, index) =>
    reveal(element, 1.04 + index * .25, 'reveal', anchor));
}

// Start the shared Home and Stay entrance after the first image and fonts settle.
function presentHero(hero, source) {
  const poster = new Image();
  poster.src = source;
  const firstPaint = Promise.race([
    Promise.allSettled([poster.decode(), document.fonts.load('400 96px Boska'), document.fonts.load('400 24px "Satoshi UI"')]),
    new Promise(resolve => setTimeout(resolve, 1000))
  ]);
  function startHero() {
    if (document.hidden) return;
    document.removeEventListener('visibilitychange', startHero);
    requestAnimationFrame(() => { hero.classList.add('entered'); document.documentElement.classList.add('page-entered'); });
  }
  firstPaint.then(() => {
    document.addEventListener('visibilitychange', startHero);
    startHero();
  });
}

function updateHeroBooking(distance, viewportHeight) {
  const fade = smooth(clamp(distance / Math.min(185, viewportHeight * .24)));
  const booking = node(1051);
  booking.style.setProperty('--booking-visibility', 1 - fade);
  booking.style.filter = !desktopBooking.matches && fade > 0 && fade < 1 && !reduce.matches ? 'blur(' + fade * 9 + 'px)' : 'none';
  node(1050).inert = fade >= .995;
}
