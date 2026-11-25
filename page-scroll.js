(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const page = document.scrollingElement;
  let frame = 0, target = 0, lastPosition = 0, lastTime = 0;

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
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
    if (!event.cancelable || event.defaultPrevented || event.ctrlKey || event.metaKey ||
        event.shiftKey || Math.abs(event.deltaX) >= Math.abs(dy) || preference.matches ||
        document.documentElement.classList.contains('menu-open') || (window.visualViewport?.scale || 1) > 1 ||
        event.target.closest?.('input,textarea,select,[contenteditable="true"],#n1051.expanded,[role="slider"]')) {
      stop();
      return;
    }
    const panel = event.target.closest?.('.panel-slot');
    if (panel && (dy > 0 ? panel.scrollTop + panel.clientHeight < panel.scrollHeight - 1 : panel.scrollTop > 0)) {
      stop();
      return;
    }
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
    const gain = event.deltaMode === 2 ? 1 : 1.4;
    if (!frame || Math.abs(scrollY - lastPosition) > 2 || Math.sign(target - scrollY) !== Math.sign(dy)) target = scrollY;
    target = Math.max(0, Math.min(page.scrollHeight - innerHeight, target + dy * unit * gain));
    event.preventDefault();
    if (!frame && target !== scrollY) {
      lastTime = performance.now();
      lastPosition = scrollY;
      frame = requestAnimationFrame(animate);
    }
  }, {passive:false});
  for (const event of ['pointerdown','keydown','pagehide','hashchange','blur']) window.addEventListener(event, stop);
  preference.addEventListener('change', stop);

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
  const photoSurfaces='.stay-media,#n1141,#n1159,.photo-window,#n1129 > div,.gallery-track > div,#n1108,#n1341,#n1336,#n1011,#n986';
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
