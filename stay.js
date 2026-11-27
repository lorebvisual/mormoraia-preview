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
    const track = gallery.querySelector('.room-track');
    const slides = [...track.children];
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
    const offset = () => Math.abs(gallery.scrollLeft);
    let press = null, loop = null, destination = null, slideFrame = 0, lastTime = 0;
    function interrupt() {
      cancelAnimationFrame(slideFrame);
      slideFrame = 0;
      destination = null;
      gallery.classList.remove('room-advancing');
    }
    function syncLoop() {
      const width = slides[0].getBoundingClientRect().width;
      const enabled = desktop.matches && slides.length > 1;
      if (!width || (enabled ? loop?.width === width : !loop)) return;
      const index = Math.round(offset() / (loop?.width ?? width)) % slides.length;
      interrupt();
      if (enabled && !loop) {
        const copies = () => slides.map(slide => {
          const copy = slide.cloneNode(true);
          copy.setAttribute('aria-hidden', 'true');
          return copy;
        });
        track.replaceChildren(...copies(), ...slides, ...copies());
      } else if (!enabled) {
        track.replaceChildren(...slides);
      }
      loop = enabled ? {width, length:width * slides.length, sign:rtl() ? -1 : 1} : null;
      const target = (loop?.length ?? 0) + index * width;
      gallery.scrollLeft = (rtl() ? -1 : 1) * target;
      syncCounter();
    }
    function recenter() {
      if (!loop) return;
      const {length, sign} = loop;
      const current = offset();
      const shift = length - Math.floor((current + .5) / length) * length;
      if (!shift) return;
      gallery.scrollLeft = sign * (current + shift);
      if (destination !== null) destination += shift;
      if (press?.drag) press.left += sign * shift;
    }
    function animateSlide(time) {
      const current = offset();
      const delta = destination - current;
      const ease = 1 - Math.exp(-Math.min(48, time - lastTime) / 115);
      lastTime = time;
      const done = Math.abs(delta) < 1;
      gallery.scrollLeft = loop.sign * (done ? destination : current + Math.sign(delta) * Math.max(1, Math.abs(delta) * ease));
      recenter();
      if (done) interrupt();
      else slideFrame = requestAnimationFrame(animateSlide);
    }
    desktop.addEventListener('change', syncLoop);
    new ResizeObserver(syncLoop).observe(gallery);
    syncLoop();
    const physicalDirection = clientX => {
      const isDesktop = desktop.matches;
      if (!isDesktop) {
        const left = Math.abs(gallery.scrollLeft);
        if (left < 2) return rtl() ? -1 : 1;
        if (left >= gallery.scrollWidth - gallery.clientWidth - 2) return rtl() ? 1 : -1;
      }
      const box = gallery.getBoundingClientRect();
      const split = isDesktop ? .5 : .32;
      return clientX < box.left + box.width * split ? -1 : 1;
    };
    function advance(physical) {
      const advanceToEnd = (rtl() ? -physical : physical) > 0;
      if (loop) {
        const start = (destination ?? offset()) / loop.width;
        const step = advanceToEnd ? Math.floor(start + .002) + 1 : Math.ceil(start - .002) - 1;
        const target = step * loop.width;
        if (reduce.matches) {
          gallery.scrollLeft = loop.sign * target;
          recenter();
        } else {
          destination = target;
          if (!slideFrame) {
            lastTime = performance.now();
            gallery.classList.add('room-advancing');
            slideFrame = requestAnimationFrame(animateSlide);
          }
        }
        return;
      }
      const current = offset();
      const max = gallery.scrollWidth - gallery.clientWidth;
      const width = slides[0].getBoundingClientRect().width;
      const step = advanceToEnd ? Math.floor((current + 2) / width) + 1 : Math.ceil((current - 2) / width) - 1;
      const target = Math.min(max, Math.max(0, step * width));
      if (target === current) return;
      gallery.scrollTo({left:(rtl() ? -1 : 1) * target,behavior:reduce.matches ? 'instant' : 'smooth'});
    }

    gallery.addEventListener('scrollend', () => { if (!slideFrame && !press?.drag) recenter(); });
    gallery.addEventListener('wheel', event => {
      if (slideFrame && (event.deltaX || event.shiftKey)) interrupt();
    }, {passive:true});
    reduce.addEventListener('change', interrupt);
    gallery.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      advance(event.key === 'ArrowRight' ? 1 : -1);
    });
    gallery.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse') { if (slideFrame) interrupt(); return; }
      if (event.button !== 0) return;
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
        if (slideFrame) interrupt();
        press.left = gallery.scrollLeft;
        press.drag = true;
        gallery.classList.add('dragging');
        gallery.setPointerCapture(event.pointerId);
      }
      if (press.drag) {
        gallery.scrollLeft = press.left - delta;
        recenter();
      }
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
