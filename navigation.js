(() => {
  const shell = document.querySelector('.navigation');
  const mast = shell.querySelector('.masthead');
  const toggle = shell.querySelector('.burger');
  const menu = document.getElementById('estate-menu');
  const page = document.getElementById('n1780');
  const quick = shell.querySelector('.quick-links');
  const stayToggle = shell.querySelector('.stay-toggle');
  const stayMenu = document.getElementById('stay-menu');
  const stayLinks = [...stayMenu.querySelectorAll('a')];
  const desktop = matchMedia('(width > 1024px)');
  new ResizeObserver(([entry]) => {
    mast.style.setProperty('--stay-layer-extension', entry.contentRect.height + 'px');
  }).observe(stayMenu);
  const hero = document.getElementById('n986');
  let stayOpen = false;

  function positionStayMenu() {
    stayMenu.style.setProperty('--stay-label-left',
      stayToggle.getBoundingClientRect().left - mast.getBoundingClientRect().left + 'px');
  }
  function showStay(next) {
    if (next === stayOpen || (next && (open || !desktop.matches || mast.inert))) return;
    stayOpen = next;
    if (next) positionStayMenu();
    else stayMenu.classList.remove('has-marker');
    mast.classList.toggle('stay-open', next);
    stayToggle.setAttribute('aria-expanded', String(next));
    stayMenu.inert = !next;
    stayMenu.setAttribute('aria-hidden', String(!next));
  }
  stayToggle.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') showStay(true);
  });
  stayToggle.addEventListener('click', () => showStay(true));
  stayToggle.addEventListener('keydown', event => {
    if (event.key !== 'ArrowDown') return;
    event.preventDefault();
    showStay(true);
    if (stayOpen) stayLinks[0].focus();
  });
  mast.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse') showStay(false);
  });
  for (const [index, link] of stayLinks.entries()) {
    const mark = () => {
      stayMenu.style.setProperty('--stay-marker-index', index);
      stayMenu.classList.add('has-marker');
    };
    link.addEventListener('pointerenter', mark);
    link.addEventListener('focus', mark);
  }
  stayMenu.addEventListener('pointerleave', () => stayMenu.classList.remove('has-marker'));
  document.addEventListener('focusin', event => {
    if (event.target !== stayToggle && !stayMenu.contains(event.target)) showStay(false);
  });
  document.addEventListener('pointerdown', event => {
    if (!mast.contains(event.target)) showStay(false);
  });
  addEventListener('resize', () => { if (stayOpen) positionStayMenu(); });
  desktop.addEventListener('change', () => showStay(false));

  const gentleHeader = matchMedia('(max-width:1024px) and (prefers-reduced-motion:no-preference)');
  let headerMotion = null;
  gentleHeader.addEventListener('change', () => headerMotion?.cancel());
  const languages = [...shell.querySelectorAll('.language')];
  let open = false;
  let lastScroll = 0;
  let frame = 0;

  function syncHeader() {
    frame = 0;
    if (open) return;
    mast.classList.toggle('over-hero', hero.getBoundingClientRect().bottom > mast.offsetHeight);
    // Clamp elastic overscroll so releasing at either edge is not a reversal.
    const y = Math.min(Math.max(0, scrollY), Math.max(0,document.scrollingElement.scrollHeight-innerHeight));
    const delta = y - lastScroll;
    if (y >= 6 && Math.abs(delta) <= 6) return;
    const wasAway = mast.classList.contains('away');
    const pastHeader = y > mast.offsetHeight;
    const away = y >= 6 && delta > 0 && (pastHeader || wasAway);
    const sticky = y >= 6 && (pastHeader || wasAway || mast.classList.contains('scrolled'));
    const animate = gentleHeader.matches && wasAway !== away;
    let from;
    if (animate) {
      const style = getComputedStyle(mast);
      from = {transform:style.transform, opacity:style.opacity};
      headerMotion?.cancel();
    }
    mast.classList.toggle('scrolled',sticky);
    mast.classList.toggle('away',away);
    mast.inert = away;
    if (away) showStay(false);
    else if (stayOpen) positionStayMenu();
    if (animate) {
      headerMotion = mast.animate([from, {
        transform:away?'translate3d(0,-102%,0)':'translate3d(0,0,0)',
        opacity:away?0:1
      }], {
        duration:away?640:1800,
        easing:away?'ease-in-out':'cubic-bezier(.42,.02,.32,1)'
      });
    }
    lastScroll = y;
  }
  addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(syncHeader); }, {passive:true});
  syncHeader();

  function showMenu(next, returnFocus = true) {
    if (next === open) return;
    open = next;
    if (open) showStay(false);
    headerMotion?.cancel();
    if (!open && returnFocus) toggle.focus({preventScroll:true});
    shell.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    toggle.setAttribute('aria-expanded', String(open));
    menu.inert = !open;
    menu.setAttribute('aria-hidden', String(!open));
    quick.inert = open;
    page.inert = open;
    if (!open) syncHeader();
  }
  toggle.addEventListener('click', () => showMenu(!open));
  shell.querySelector('#back-to-top').addEventListener('click', () => showMenu(false, false), {capture:true});
  shell.addEventListener('click', event => {
    const anchor = event.target.closest('a');
    if (!open || !anchor) return;
    showMenu(false);
    if (anchor.hash && anchor.origin === location.origin) {
      const target = document.getElementById(anchor.hash.slice(1));
      if (target) {
        target.tabIndex = -1;
        target.focus({preventScroll:true});
      }
    }
  });
  document.addEventListener('keydown', event => {
    if (stayOpen && event.key === 'Escape') {
      showStay(false);
      stayToggle.focus({preventScroll:true});
      return;
    }
    if (!open) return;
    if (event.key === 'Escape') { showMenu(false); return; }
    if (event.key !== 'Tab') return;
    const items = [...shell.querySelectorAll('a[href],button')].filter(el =>
      !el.closest('[inert]') && el.getClientRects().length && getComputedStyle(el).visibility === 'visible');
    if (event.shiftKey && document.activeElement === items[0]) {
      event.preventDefault(); items.at(-1).focus();
    } else if (!event.shiftKey && document.activeElement === items.at(-1)) {
      event.preventDefault(); items[0].focus();
    }
  });
  for (const language of languages) language.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    for (const selector of languages) {
      selector.classList.toggle('italian', button.textContent === 'IT');
      for (const item of selector.querySelectorAll('button')) item.setAttribute('aria-pressed', String(item.textContent === button.textContent));
    }
  });
})();
