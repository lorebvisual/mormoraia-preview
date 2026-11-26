(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const page = document.scrollingElement;
  const roomSequence = document.querySelector('.room-sequence');
  const roomAnchors = [...document.querySelectorAll('.room-sequence > .room-position')];
  const desktopRooms = matchMedia('(min-width:1025px) and (hover:hover) and (pointer:fine)');
  const roomWheelThreshold = 32;
  const roomWheelQuiet = 180;
  let frame = 0, target = 0, lastPosition = 0, lastTime = 0;
  let roomMotion = null;
  let lastRoomWheel = -Infinity;
  let lastRoomUp = -Infinity;
  let roomWheelDistance = 0;
  let roomWheelCommitted = false;
  let pageDownCommitted = false;

  function nextRoom(distance) {
    if (!desktopRooms.matches || preference.matches || roomAnchors.length === 0) return null;
    const y = scrollY;
    const roomStops = roomAnchors.map(anchor => {
      const roomHeight = anchor.nextElementSibling.offsetHeight;
      return y + anchor.getBoundingClientRect().top + Math.max(0, (roomHeight - innerHeight) / 2);
    });
    const first = roomStops[0];
    const projected = Math.max(y, frame ? target : y) + distance;
    if (y < first - 3 && projected < first - 3) return null;
    return roomStops.find(stop => stop > y + 3) ?? null;
  }

  function moveTo(destination) {
    target = Math.max(0, Math.min(page.scrollHeight - innerHeight, destination));
    if (frame || target === scrollY) return;
    lastTime = performance.now();
    lastPosition = scrollY;
    frame = requestAnimationFrame(animate);
  }

  function moveToRoom(destination) {
    stop();
    const from = scrollY;
    const to = Math.min(page.scrollHeight - innerHeight, destination);
    const distance = to - from;
    if (distance <= 0) return;
    roomMotion = {from, to, start: null, duration: Math.min(1380, 1010 + distance * .24)};
    lastPosition = from;
    frame = requestAnimationFrame(animateRoom);
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    roomMotion = null;
  }

  function resetRoomWheel() {
    lastRoomWheel = -Infinity;
    roomWheelDistance = 0;
    roomWheelCommitted = false;
  }

  function animateRoom(now) {
    if (Math.abs(scrollY - lastPosition) > 2) { stop(); return; }
    roomMotion.start ??= now;
    const {from, to, start, duration} = roomMotion;
    const progress = Math.max(0, Math.min(1, (now - start) / duration));
    // Quintic easing keeps both the acceleration and braking smooth at the stops.
    const ease = progress ** 3 * (progress * (6 * progress - 15) + 10);
    window.scrollTo({top: from + (to - from) * ease, behavior:'instant'});
    lastPosition = scrollY;
    if (progress === 1) stop();
    else frame = requestAnimationFrame(animateRoom);
  }

  function animate(now) {
    if (Math.abs(scrollY - lastPosition) > 2) { stop(); return; }
    const elapsed = Math.max(1, now - lastTime);
    const remaining = target - scrollY;
    const move = remaining * (1 - Math.exp(-elapsed / 90));
    const done = Math.abs(remaining) <= 1;
    window.scrollTo({top: done ? target : scrollY + Math.sign(move) * Math.max(1, Math.abs(move)), behavior:'instant'});
    lastPosition = scrollY;
    lastTime = now;
    frame = done ? 0 : requestAnimationFrame(animate);
  }

  // Wheel distance is continuous. Touch uses the device's own drag and coast.
  window.addEventListener('wheel', event => {
    const dy = event.deltaY;
    const horizontal = Math.abs(event.deltaX) >= Math.abs(dy);
    if (roomMotion && horizontal && !event.ctrlKey && !event.metaKey) return;
    if (event.defaultPrevented || event.ctrlKey || event.metaKey ||
        event.shiftKey || horizontal || preference.matches ||
        document.documentElement.classList.contains('menu-open') || (window.visualViewport?.scale || 1) > 1 ||
        event.target.closest?.('input,textarea,select,[contenteditable="true"],#n1051.expanded,[role="slider"]')) {
      stop();
      return;
    }
    const panel = event.target.closest?.('.panel-slot:not(.room-panel-slot)');
    if (panel && (dy > 0 ? panel.scrollTop + panel.clientHeight < panel.scrollHeight - 1 : panel.scrollTop > 0)) {
      stop();
      return;
    }
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
    const gain = event.deltaMode === 2 ? 1 : 1.4;
    const distance = dy * unit * gain;
    const now = performance.now();
    const canSnapRooms = roomSequence && desktopRooms.matches;
    if (dy < 0) {
      resetRoomWheel();
      // Hand the whole upward gesture back to the browser, even mid-snap.
      if (canSnapRooms) {
        const {top, bottom} = roomSequence.getBoundingClientRect();
        if (roomMotion || (top < innerHeight && bottom > 0) || now - lastRoomUp < roomWheelQuiet) {
          lastRoomUp = now;
          stop();
          return;
        }
      }
    }
    if (!event.cancelable) {
      if (!roomMotion) stop();
      return;
    }
    if (dy > 0 && canSnapRooms) {
      if (now - lastRoomUp < roomWheelQuiet && dy * unit < roomWheelThreshold) {
        event.preventDefault();
        return;
      }
      if (now - lastRoomWheel >= roomWheelQuiet) resetRoomWheel();
      if (roomMotion || roomWheelCommitted) {
        lastRoomWheel = now;
        roomWheelCommitted = true;
        event.preventDefault();
        return;
      }
      const room = nextRoom(distance);
      if (room !== null) {
        lastRoomWheel = now;
        roomWheelDistance += dy * unit;
        event.preventDefault();
        if (event.deltaMode !== 0 || roomWheelDistance >= roomWheelThreshold) {
          roomWheelCommitted = true;
          moveToRoom(room);
        }
        return;
      }
    }
    if (!frame || Math.abs(scrollY - lastPosition) > 2 || Math.sign(target - scrollY) !== Math.sign(dy)) target = scrollY;
    event.preventDefault();
    moveTo(target + distance);
  }, {passive:false});
  for (const event of ['pointerdown','pagehide','hashchange','blur']) window.addEventListener(event, stop);
  preference.addEventListener('change', stop);
  desktopRooms.addEventListener('change', resetRoomWheel);
  window.addEventListener('resize', () => { if (roomMotion) stop(); });
  window.addEventListener('keydown', event => {
    if (event.key !== 'PageDown' || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey ||
        event.defaultPrevented || document.documentElement.classList.contains('menu-open') ||
        event.target.closest?.('button,a,input,textarea,select,[contenteditable="true"],.room-gallery')) {
      stop();
      return;
    }
    if (!event.repeat) pageDownCommitted = false;
    if (roomMotion || pageDownCommitted) {
      pageDownCommitted = true;
      event.preventDefault();
      return;
    }
    const room = nextRoom(innerHeight * .9);
    if (room !== null) {
      pageDownCommitted = true;
      event.preventDefault();
      moveToRoom(room);
    } else {
      stop();
    }
  });

  const backToTop = document.getElementById('back-to-top');
  const ring = backToTop.querySelector('.back-to-top-ring');
  let rotation = null;
  function syncRotation(visible) {
    if (visible && !preference.matches && !document.hidden) {
      if (!rotation || rotation.playState === 'idle') {
        rotation = ring.animate([{transform:'rotate(0deg)'},{transform:'rotate(360deg)'}],
          {duration:16000,iterations:Infinity,easing:'linear'});
      } else if (rotation.playState === 'paused') rotation.play();
    } else if (rotation) {
      rotation.cancel();
      rotation = null;
    }
  }
  // Hit-test the painted layers beneath the centre of the control. A photo
  // keeps the white variant even where the photograph itself is very bright.
  const photoSurfaces='.stay-media,#n1141,#n1159,.photo-window:not(.photo-cleared),.room-gallery,.stay-facilities,#n1129 > div,.gallery-track > div,#n1108,#n1341,#n1336,#n1011,#n986';
  function useWhiteVariant(){
    const box=backToTop.getBoundingClientRect();
    for(const el of document.elementsFromPoint(box.left+box.width/2,box.top+box.height/2)){
      if(backToTop.contains(el))continue;
      if(el.closest('.panel-slot'))return false;
      if(el.closest(photoSurfaces))return true;
      const style=getComputedStyle(el);
      if(style.backgroundImage.includes('url('))return true;
      const rgba=style.backgroundColor.match(/[\d.]+/g)?.map(Number);
      if(rgba && (rgba[3]??1)>.9){
        return .2126*rgba[0]+.7152*rgba[1]+.0722*rgba[2]<150;
      }
    }
    return false;
  }
  function updateBackToTop() {
    const visible = scrollY >= innerHeight;
    backToTop.classList.toggle('visible',visible);
    backToTop.inert = !visible;
    syncRotation(visible);
    if(visible)backToTop.classList.toggle('on-dark',useWhiteVariant());
  }
  let contrastFrame=0;
  function scheduleButton(){
    if(!contrastFrame)contrastFrame=requestAnimationFrame(()=>{
      contrastFrame=0;
      updateBackToTop();
    });
  }
  window.addEventListener('scroll',scheduleButton,{passive:true});
  document.addEventListener('transitionend',scheduleButton);
  window.addEventListener('resize',updateBackToTop);
  window.addEventListener('pageshow',updateBackToTop);
  document.addEventListener('visibilitychange',updateBackToTop);
  preference.addEventListener('change',updateBackToTop);
  new ResizeObserver(updateBackToTop).observe(document.body);
  backToTop.addEventListener('click',()=>{
    stop();
    const heading = document.getElementById('n993');
    heading.focus({preventScroll:true});
    window.scrollTo({top:0,behavior:preference.matches?'instant':'smooth'});
  });
  updateBackToTop();
})();
