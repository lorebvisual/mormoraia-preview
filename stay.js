(() => {
  const hero = node(986);
  const media = hero.querySelector('.stay-hero-media');
  if (media instanceof HTMLVideoElement) playWhenVisible(media);
  presentHero(hero, media instanceof HTMLVideoElement ? media.poster : media.currentSrc || media.src);
  const desktop = matchMedia('(width > 1024px)');
  const narrow = matchMedia('(max-width:720px)');

  const introHeading = document.getElementById('stay-intro-title');
  [...introHeading.children].forEach((line, index) =>
    reveal(line, index * .14, 'stay-intro-line', introHeading));
  reveal(document.querySelector('.stay-intro-copy'), 1.12, 'stay-intro-fade', introHeading);

  const facilities = document.querySelector('.stay-facilities-content');
  [...facilities.children].forEach((element, index) =>
    reveal(element, index * .2, 'reveal', facilities));

  const scenes = [...document.querySelectorAll('.room-scene')];
  const cursor = document.createElement('img');
  cursor.className = 'gallery-cursor';
  cursor.src = 'assets/187b4.svg';
  cursor.alt = '';
  document.body.append(cursor);

  let frame = 0;
  function drawStack() {
    frame = 0;
    updateHeroBooking(desktop.matches ? scrollY : 0, innerHeight);
    if (narrow.matches || reduce.matches) return;
    const boxes = scenes.map(scene => scene.getBoundingClientRect());
    for (const [index, scene] of scenes.entries()) {
      const next = boxes[index + 1];
      const box = boxes[index];
      const overlap = next ? box.bottom - next.top : 0;
      const covered = next && next.top <= box.top && next.bottom >= box.bottom;
      const shade = covered ? 0 : phase(overlap, 0, Math.min(box.height * .32, innerHeight * .34));
      scene.style.setProperty('--room-shade', shade);
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
    measureRooms.observe(scene);

    const gallery = scene.querySelector('.room-gallery');
    reveal(gallery, 0, 'section-enter', scene);
    const slide = gallery.querySelector('.room-slide');
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
      const width = slide.offsetWidth;
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
      if (narrow.matches || reduce.matches) return;
      const box = event.target.getBoundingClientRect();
      const following = scene.nextElementSibling?.nextElementSibling;
      if (following && following.getBoundingClientRect().top < box.bottom) {
        scrollBy({top:scene.previousElementSibling.getBoundingClientRect().top,behavior:'instant'});
      }
    });
  }
  addEventListener('scroll', scheduleStack, {passive:true});
  addEventListener('resize', scheduleStack);
  reduce.addEventListener('change', scheduleStack);
  drawStack();
})();
