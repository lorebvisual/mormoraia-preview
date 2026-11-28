(() => {
  const rooms = new Map([
    ['classic', {
      name: 'Classic',
      description: 'Warm Tuscan furnishings and modern comforts make it easy to settle in.',
      photos: Array.from({length: 6}, () => ['palagio-rooms/classic.png', 'Bedroom']),
    }],
    ['superior', {
      name: 'Superior',
      description: 'Quiet interiors take their cues from the stone, light and landscape of the estate.',
      photos: [['120a4.jpg', 'Bedroom'], ['ff6a2.jpg', 'Interior'], ['ffe55.jpg', 'Bathroom'], ['9fc01.jpg', 'Vanity']],
    }],
    ['garden', {
      name: 'Garden',
      description: 'Traditional Tuscan furnishings bring a quiet warmth to an easy, unhurried stay.',
      photos: [['c9f18.jpg', 'Bedroom'], ['4d74d.jpg', 'Garden'], ['6a19b.jpg', 'Bathroom'], ['ff6a2.jpg', 'Interior']],
    }],
    ['deluxe', {
      name: 'Deluxe',
      description: 'Natural materials and softly lit interiors lend the room an understated warmth.',
      photos: [['795d1.jpg', 'Entrance'], ['70648.jpg', 'Bathroom'], ['93e9b.jpg', 'Bedroom'], ['24450.jpg', 'Vanity'], ['0102b.jpg', 'Interior']],
    }],
    ['suite', {
      name: 'Suite',
      description: 'The suite concept pairs warm timber and pale stone with soft, natural light.',
      photos: [['palagio-suite-render.jpg', 'Bedroom concept'], ['palagio-suite-bath-render.jpg', 'Bathroom concept']],
    }],
    ['suite-duplex', {
      name: 'Suite Duplex',
      description: 'The interiors draw on the material palette of Mormoraia, interpreted for a more secluded stay on the estate.',
      photos: [['93e9b.jpg', 'Bedroom'], ['795d1.jpg', 'Entrance'], ['2d464.jpg', 'Interior'], ['11e1a.jpg', 'Bathroom']],
    }],
    ['suite-executive', {
      name: 'Suite Executive',
      description: 'Generous, quiet spaces and a warm palette drawn from the surrounding countryside.',
      photos: [['3543a.jpg', 'Bedroom'], ['93e9b.jpg', 'Interior'], ['782a3.jpg', 'Sitting area'], ['24450.jpg', 'Vanity'], ['70648.jpg', 'Bathroom']],
    }],
  ]);

  const slug = new URLSearchParams(location.search).get('room');
  const room = rooms.get(slug);
  document.documentElement.classList.add('page-entered');
  if (!room) return;

  const stage = document.querySelector('.room-detail-stage');
  const gallery = document.getElementById('room-photos');
  const template = document.getElementById('room-photo-template');
  const description = stage.querySelector('.room-detail-description');
  const bookingSubject = encodeURIComponent(`Il Palagio early access – ${room.name}`);

  document.title = `${room.name} | Il Palagio | Mormoraia`;
  document.getElementById('room-detail-title').textContent = room.name;
  description.textContent = room.description;
  gallery.dataset.room = slug;
  gallery.setAttribute('aria-label', `${room.name} photos`);
  for (const booking of document.querySelectorAll('[data-room-book]')) {
    booking.href = `mailto:info@mormoraia.it?subject=${bookingSubject}`;
    booking.setAttribute('aria-label', `Book ${room.name}`);
  }

  const photoFrames = [];
  const figures = room.photos.map(([file, caption], index) => {
    const figure = template.content.firstElementChild.cloneNode(true);
    const imageFrame = figure.querySelector('.room-detail-photo-image');
    const image = imageFrame.firstElementChild;
    image.src = `assets/${file}`;
    image.loading = index === 0 ? 'eager' : 'lazy';
    figure.querySelector('.room-photo-caption').textContent = caption;
    figure.querySelector('.room-photo-number > :first-child').textContent = index + 1;
    figure.querySelector('.room-photo-total').textContent = `/${room.photos.length}`;
    photoFrames.push({frame: imageFrame, image});
    return figure;
  });
  gallery.append(...figures);

  for (const part of document.querySelectorAll('.room-detail-explore, .room-detail-specs, .room-detail-gallery, .room-detail-book')) {
    part.hidden = false;
  }
  stage.classList.add('ready');

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 720px)');
  let animationFrame = 0;
  const clamp = value => Math.min(1, Math.max(0, value));

  function paint() {
    animationFrame = 0;
    const viewportHeight = innerHeight;
    const progress = clamp((viewportHeight - gallery.getBoundingClientRect().top) / (viewportHeight * .92));
    stage.style.setProperty('--room-scroll-progress', progress.toFixed(3));
    if (reduceMotion.matches) return;

    const drift = compact.matches ? 7 : 12;
    for (const {frame, image} of photoFrames) {
      const box = frame.getBoundingClientRect();
      if (box.bottom < 0 || box.top > viewportHeight) continue;
      const position = clamp((viewportHeight - box.top) / (viewportHeight + box.height));
      const safeDrift = Math.min(drift, box.height * .02);
      image.style.setProperty('--room-parallax', `${((position * 2 - 1) * safeDrift).toFixed(1)}px`);
    }
  }

  function queuePaint() {
    if (!animationFrame) animationFrame = requestAnimationFrame(paint);
  }

  addEventListener('scroll', queuePaint, {passive: true});
  addEventListener('resize', queuePaint);
  addEventListener('pageshow', queuePaint);
  reduceMotion.addEventListener('change', queuePaint);
  queuePaint();
})();
