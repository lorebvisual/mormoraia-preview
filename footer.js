(() => {
  const footer = node(1433);
  const footerStage = footer.firstElementChild;
  const flowFooter = matchMedia('(max-width:720px)');
  new ResizeObserver(() => {
    footer.style.setProperty('--footer-stage-height', footerStage.getBoundingClientRect().height + 'px');
    scheduleFooter();
  }).observe(footerStage);

  // Clip the original artwork along its inter-letter spaces. The diagonal
  // between the reflected R and A follows the actual gap between their strokes.
  const cuts = [[0,0],[229,229],[428,428],[569,569],[806,806],[1002,1002],
                [1142,1116],[1316,1316],[1409,1409],[1600,1600]];
  const percent = n => (n / 16)+'%';
  function createWordmark(mark) {
    const original = mark.querySelector('picture');
    const letters = cuts.slice(1).map(([rightTop,rightBottom],index) => {
      const [leftTop,leftBottom] = cuts[index];
      const layer = document.createElement('span');
      layer.className = 'wordmark-glyph';
      layer.setAttribute('aria-hidden','true');
      const art = original.cloneNode(true);
      art.querySelector('img').alt = '';
      art.style.clipPath = 'polygon('+percent(leftTop)+' 0,'+percent(rightTop)+' 0,'+
        percent(rightBottom)+' 100%,'+percent(leftBottom)+' 100%)';
      layer.append(art);
      mark.append(layer);
      return layer;
    });
    let lastProgress;
    return progress => {
      if (progress === lastProgress) return;
      lastProgress = progress;
      const opening = phase(progress,.015,.73);
      const leftShift = 234.18 * (1-opening);
      const rightShift = -208.67 * (1-opening);
      const inner = phase(progress,.16,.47), adjacent = phase(progress,.38,.65), outer = phase(progress,.53,.77);
      const opacity = [outer,adjacent,1,inner,inner,1,adjacent,outer,outer];
      const shifts = [leftShift,leftShift,leftShift,leftShift*.28,rightShift*.28,
                      rightShift,rightShift,rightShift,rightShift];
      const complete = progress >= .77;
      original.style.opacity = complete ? '1':'0';
      letters.forEach((letter,i)=>{
        letter.style.opacity = complete?'0':opacity[i];
        letter.style.transform = 'translate3d('+percent(shifts[i])+',0,0)';
      });
    };
  }
  const drawFooter = createWordmark(node(1481));
  const footerRows = [...footer.querySelectorAll('[data-footer-row]')];
  let footerProgress, footerTarget, footerFrame = 0, footerTime = 0;
  function paintFooter(progress) {
    footerProgress = progress;
    footer.style.setProperty('--footer-rise', 1 - phase(progress, .05, .96));
    footer.style.setProperty('--footer-emblem', phase(progress, 0, .22));
    footer.style.setProperty('--footer-lines', phase(progress, 0, .29));
    const wordmarkProgress = clamp((progress - .28) / .32);
    footer.style.setProperty('--footer-wordmark', phase(progress, .28, .34));
    drawFooter(wordmarkProgress);
    footer.style.setProperty('--footer-upper-rule', phase(progress, .58, .66));
    footer.style.setProperty('--footer-lower-rule', phase(progress, .93, 1));
    footerRows.forEach((row, index) => {
      const start = .63 + index * .026;
      row.style.setProperty('--footer-row', phase(progress, start, start + .13));
    });
  }

  // Keep the footer sequence legible after a fast flick, including in reverse.
  function easeFooter(now) {
    const elapsed = Math.min(64, now - footerTime);
    const gap = footerTarget - footerProgress;
    const advance = Math.min(Math.abs(gap) * (1 - Math.exp(-elapsed / 145)), elapsed / 900);
    const settled = Math.abs(gap) < .001;
    paintFooter(settled ? footerTarget : footerProgress + Math.sign(gap) * advance);
    footerTime = now;
    footerFrame = settled ? 0 : requestAnimationFrame(easeFooter);
  }
  function footerMotion(viewHeight) {
    const bounds = footer.getBoundingClientRect();
    const travel = footer.offsetHeight - footerStage.offsetHeight;
    const lead = viewHeight * .70;
    // On phones the full Home footer exceeds the viewport. Complete the
    // reveal as it enters so every row can scroll into view in normal flow.
    const finish = flowFooter.matches ? viewHeight * .18 : viewHeight - footer.offsetHeight + 1;
    footerTarget = reduce.matches ? 1 : clamp((lead - bounds.top) / Math.max(1, lead - finish));
    if (footerProgress === undefined || reduce.matches || travel <= 0) {
      cancelAnimationFrame(footerFrame);
      footerFrame = 0;
      if (footerProgress !== footerTarget) paintFooter(footerTarget);
    } else if (!footerFrame && footerProgress !== footerTarget) {
      footerTime = performance.now();
      footerFrame = requestAnimationFrame(easeFooter);
    }
  }

  let footerUpdate = 0;
  function scheduleFooter() {
    if (footerUpdate) return;
    footerUpdate = requestAnimationFrame(() => {
      footerUpdate = 0;
      footerMotion(innerHeight);
    });
  }
  addEventListener('scroll', scheduleFooter, {passive:true});
  addEventListener('resize', scheduleFooter);
  reduce.addEventListener('change', scheduleFooter);
  footerMotion(innerHeight);
})();
