(() => {
  const hero = node(986);
  const media = hero.querySelector('.stay-hero-media');
  if (media instanceof HTMLVideoElement) playWhenVisible(media);
  presentHero(hero, media instanceof HTMLVideoElement ? media.poster : media.currentSrc || media.src);
  const desktop = matchMedia('(width > 1024px)');
  const narrow = matchMedia('(max-width:720px)');
  const roomsV2 = document.documentElement.classList.contains('rooms-v2');

  if (roomsV2) {
    for (const link of document.querySelectorAll('a[href="historic-residence.html"],a[href="il-palagio.html"]')) {
      link.search = '?rooms=v2';
    }
  }


  const introHeading = document.getElementById('stay-intro-title');
  const intro = introHeading.closest('.stay-intro');
  let introTarget = 0, introProgress = null, introFrame = 0, introTime = 0;
  intro.classList.add('stay-intro-motion');

  function followIntro(now) {
    const elapsed = introTime ? Math.min(64, now - introTime) : 16.7;
    const factor = reduce.matches ? 1 : 1 - Math.exp(-elapsed / 155);
    introProgress += (introTarget - introProgress) * factor;
    const settled = Math.abs(introTarget - introProgress) < .001;
    if (settled) introProgress = introTarget;
    intro.style.setProperty('--intro-first', phase(introProgress, 0, .82));
    intro.style.setProperty('--intro-second', phase(introProgress, .09, .91));
    intro.style.setProperty('--intro-copy', phase(introProgress, .58, 1));
    introTime = settled ? 0 : now;
    introFrame = settled ? 0 : requestAnimationFrame(followIntro);
  }

  const facilities = document.querySelector('.stay-facilities-content');
  [...facilities.children].forEach((element, index) =>
    reveal(element, index * .2, 'reveal', facilities));

  const scenes = [...document.querySelectorAll('.room-scene')];
  const shades = scenes.map(() => 0);
  const cursor = document.createElement('img');
  cursor.className = 'gallery-cursor';
  cursor.src = 'assets/187b4.svg';
  cursor.alt = '';
  document.body.append(cursor);

  let frame = 0;
  function drawStack() {
    frame = 0;
    const height = innerHeight;
    const stacked = !narrow.matches && !reduce.matches && (!desktop.matches || roomsV2);
    const boxes = stacked ? scenes.map(scene => scene.getBoundingClientRect()) : [];
    const progress = clamp((height * .98 - introHeading.getBoundingClientRect().top) / (height * .82));
    if (introProgress === null || progress !== introTarget) {
      introTarget = progress;
      introProgress ??= progress;
      if (!introFrame) introFrame = requestAnimationFrame(followIntro);
    }
    updateHeroBooking(desktop.matches ? scrollY : 0, height);
    if (stacked) {
      const fadeLength = height * (desktop.matches ? .54 : .34);
      for (let index = 0; index < boxes.length - 1; index++) {
        const overlap = boxes[index].bottom - boxes[index + 1].top;
        // The overlay fades in and back out with the same overlap curve.
        const shade = phase(overlap, 0, fadeLength);
        if (shade === shades[index]) continue;
        shades[index] = shade;
        scenes[index].style.setProperty('--room-shade', shade);
      }
    }
    cursor.classList.remove('on');
  }
  function scheduleStack() {
    if (!frame) frame = requestAnimationFrame(drawStack);
  }
  const measureRooms = new ResizeObserver(entries => {
    for (const {target} of entries) {
      target.style.setProperty('--room-measured-height', target.offsetHeight + 'px');
    }
    scheduleStack();
  });

  for (const scene of scenes) {
    const slot = scene.querySelector('.room-panel-slot');
    animateEditorialPanel(slot.firstElementChild, slot);
    reveal(slot, 0, 'room-info-entrance');
    const separator = scene.previousElementSibling;
    if (separator.previousElementSibling) reveal(separator, 0, 'room-separator');
    measureRooms.observe(scene);

    const carousel = scene.querySelector('.room-carousel');
    reveal(carousel, 0, 'room-photo-entrance');
    const gallery = scene.querySelector('.room-gallery');
    const slides = [...gallery.querySelectorAll('.room-slide')];
    const counter = document.createElement('div');
    counter.className = 'room-gallery-counter';
    counter.setAttribute('aria-hidden', 'true');
    const bars = slides.map(() => document.createElement('span'));
    let currentBar = bars[0];
    currentBar.classList.add('current');
    counter.append(...bars);
    carousel.append(counter);

    function syncCounter() {
      if (!narrow.matches || gallery.clientWidth === 0) return;
      const index = Math.round(gallery.scrollLeft / gallery.clientWidth);
      const next = bars[Math.max(0, Math.min(bars.length - 1, index))];
      if (next === currentBar) return;
      currentBar.classList.remove('current');
      next.classList.add('current');
      currentBar = next;
    }
    gallery.addEventListener('scroll', syncCounter, {passive:true});
    addEventListener('resize', syncCounter);
    syncCounter();

    const rtl = () => getComputedStyle(gallery).direction === 'rtl';
    let press = null;
    const physicalDirection = clientX => {
      const left = Math.abs(gallery.scrollLeft);
      if (left < 2) return rtl() ? -1 : 1;
      if (left >= gallery.scrollWidth - gallery.clientWidth - 2) return rtl() ? 1 : -1;
      const box = gallery.getBoundingClientRect();
      return clientX - box.left < box.width * .32 ? -1 : 1;
    };
    function advance(physical) {
      const offset = Math.abs(gallery.scrollLeft);
      const max = gallery.scrollWidth - gallery.clientWidth;
      const advanceToEnd = (rtl() ? -physical : physical) > 0;
      const width = slides[0].offsetWidth;
      const step = advanceToEnd ? Math.floor((offset + 2) / width) + 1 : Math.ceil((offset - 2) / width) - 1;
      const target = Math.min(max, Math.max(0, step * width));
      gallery.scrollTo({left:(rtl() ? -1 : 1) * target,behavior:reduce.matches ? 'instant' : 'smooth'});
    }

    gallery.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      advance(event.key === 'ArrowRight' ? 1 : -1);
    });
    gallery.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      press = {x:event.clientX,left:gallery.scrollLeft,id:event.pointerId,drag:false};
    });
    gallery.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse') return;
      const direction = physicalDirection(event.clientX);
      cursor.style.left = event.clientX + 'px';
      cursor.style.top = event.clientY + 'px';
      cursor.classList.toggle('prev', direction < 0);
      cursor.classList.add('on');
      if (!press || press.id !== event.pointerId) return;
      const delta = event.clientX - press.x;
      if (!press.drag && Math.abs(delta) >= 5) {
        press.drag = true;
        gallery.classList.add('dragging');
        gallery.setPointerCapture(event.pointerId);
      }
      if (press.drag) gallery.scrollLeft = press.left - delta;
    });
    function release(event) {
      if (!press || press.id !== event.pointerId) return;
      const {drag} = press;
      press = null;
      gallery.classList.remove('dragging');
      if (!drag && event.type === 'pointerup') advance(physicalDirection(event.clientX));
    }
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      gallery.addEventListener(event, release);
    }
    gallery.addEventListener('pointerleave', () => {
      cursor.classList.remove('on');
      if (!press?.drag) press = null;
    });
    scene.addEventListener('focusin', event => {
      if (narrow.matches || reduce.matches || !event.target.matches(':focus-visible')) return;
      const box = event.target.getBoundingClientRect();
      const following = scene.nextElementSibling?.nextElementSibling;
      if (following && following.getBoundingClientRect().top < box.bottom) {
        separator.scrollIntoView({block:'start',behavior:'smooth'});
      }
    });
  }
  addEventListener('scroll', scheduleStack, {passive:true});
  addEventListener('resize', scheduleStack);
  reduce.addEventListener('change', scheduleStack);
  drawStack();
})();
