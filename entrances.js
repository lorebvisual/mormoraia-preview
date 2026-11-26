const node = id => document.getElementById('n' + id);
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const compact = matchMedia('(max-width:720px)');
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
