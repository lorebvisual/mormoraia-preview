(() => {
  const shell = document.querySelector('.navigation');
  const mast = shell.querySelector('.masthead');
  const toggle = shell.querySelector('.burger');
  const menu = document.getElementById('estate-menu');
  const page = document.getElementById('n1780');
  const quick = shell.querySelector('.quick-links');
  const dropdown = shell.querySelector('.mast-dropdown');
  const dropdownClip = dropdown.firstElementChild;
  const desktop = matchMedia('(width > 1024px)');
  const compact = matchMedia('(max-width:720px)');
  const desktopTopZone = 200;
  const menuContent = menu.querySelector('.menu-content');
  const menuLayout = menuContent.querySelector('.menu-layout');
  const menuItems = menu.querySelector('.menu-items');
  const menuGroups = new Map([...menu.querySelectorAll('[data-menu-group]')].map(group => [
    group.dataset.menuGroup, {button:group.querySelector('button'), panel:group.querySelector('.menu-panel')}
  ]));
  const sections = new Map();
  let currentGroup = null;
  let currentSection = null;

  function setExpanded(button, panel, expanded) {
    button.setAttribute('aria-expanded', String(expanded));
    panel.inert = !expanded;
    panel.setAttribute('aria-hidden', String(!expanded));
  }

  function positionMenuIndicator() {
    if (!currentGroup) return;
    const gap = parseFloat(getComputedStyle(menuItems).rowGap);
    let center = currentGroup.button.getBoundingClientRect().height / 2;
    // The destination is the title's position after the other rows collapse.
    for (const group of menuGroups.values()) {
      if (group === currentGroup) break;
      center += group.button.getBoundingClientRect().height + gap;
    }
    menuItems.style.setProperty('--menu-indicator-y', center + 'px');
  }

  function showGroup(group) {
    const previous = currentGroup;
    if (previous) setExpanded(previous.button, previous.panel, false);
    currentGroup = group;
    if (group) setExpanded(group.button, group.panel, true);
    menuLayout.toggleAttribute('data-menu-active', Boolean(group));
    menuItems.dataset.indicator = group ? (previous ? 'move' : 'show') : 'hide';
    positionMenuIndicator();
  }
  addEventListener('resize', positionMenuIndicator);
  document.fonts.ready.then(positionMenuIndicator);
  for (const group of menuGroups.values()) {
    group.button.addEventListener('click', () => showGroup(currentGroup === group ? null : group));
  }

  function showDropdown(section) {
    if (section === currentSection || (section && (open || !desktop.matches || mast.inert))) return;
    if (currentSection) setExpanded(currentSection.button, currentSection.panel, false);
    currentSection = section;
    if (section) setExpanded(section.button, section.panel, true);
    mast.classList.toggle('dropdown-open', Boolean(section));
  }
  for (const button of quick.querySelectorAll('[data-nav-section]')) {
    const key = button.dataset.navSection;
    const title = document.createElement('p');
    title.className = 'mast-dropdown-title';
    title.textContent = button.textContent;
    title.setAttribute('aria-hidden', 'true');
    const list = menuGroups.get(key).panel.querySelector('.menu-choices').cloneNode(true);
    list.className = 'mast-dropdown-links';
    if (key === 'restaurant') {
      const reservation = list.querySelector('a');
      reservation.textContent = 'Book';
      reservation.href = 'mailto:info@mormoraia.it?subject=Restaurant%20reservation';
    }
    const panel = document.createElement('div');
    panel.className = 'mast-dropdown-panel';
    panel.id = button.getAttribute('aria-controls');
    panel.append(title, list);
    dropdownClip.append(panel);
    setExpanded(button, panel, false);
    const section = {button,panel};
    sections.set(button, section);
    button.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse') showDropdown(section);
    });
    button.addEventListener('click', event => {
      showDropdown(currentSection === section && event.detail === 0 ? null : section);
    });
    button.addEventListener('keydown', event => {
      if (event.key !== 'ArrowDown') return;
      event.preventDefault();
      showDropdown(section);
      if (currentSection === section) panel.querySelector('a').focus();
    });
  }
  // The backdrop follows the revealed height, including when a list wraps.
  new ResizeObserver(([entry]) => {
    mast.style.setProperty('--mast-dropdown-height', entry.contentRect.height + 'px');
  }).observe(dropdown);

  mast.addEventListener('pointerleave', event => {
    if (event.pointerType !== 'mouse') return;
    if (currentSection?.panel.contains(document.activeElement)) return;
    showDropdown(null);
  });
  document.addEventListener('focusin', event => {
    if (sections.has(event.target) || dropdown.contains(event.target)) return;
    showDropdown(null);
  });
  document.addEventListener('pointerdown', event => {
    if (!mast.contains(event.target)) showDropdown(null);
  });
  desktop.addEventListener('change', () => showDropdown(null));

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
    const isDesktop = desktop.matches;
    // Clamp elastic overscroll so releasing at either edge is not a reversal.
    const y = Math.min(Math.max(0, scrollY), Math.max(0,document.scrollingElement.scrollHeight-innerHeight));
    const delta = y - lastScroll;
    const moved = Math.abs(delta) > 6;
    if (!isDesktop && y >= 6 && !moved) return;
    const wasAway = mast.classList.contains('away');
    const pastHeader = y > (isDesktop ? desktopTopZone : mast.offsetHeight);
    const away = isDesktop ? pastHeader && (moved ? delta > 0 : wasAway)
      : y >= 6 && delta > 0 && (pastHeader || wasAway);
    const wasSticky = mast.classList.contains('scrolled');
    // Desktop stays white until the top. On touch layouts, the hero header
    // keeps its current styling as it retracts and switches on the return.
    const sticky = isDesktop ? y > 0 && (wasSticky || pastHeader || delta < 0)
      : y >= 6 && (wasSticky || (!away && (pastHeader || wasAway)));
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
    if (away) showDropdown(null);
    if (animate) {
      headerMotion = mast.animate([from, {
        transform:away?'translate3d(0,-102%,0)':'translate3d(0,0,0)',
        opacity:away?0:1
      }], {
        duration:away ? 640 : compact.matches ? 720 : 1800,
        easing:away?'ease-in-out':'cubic-bezier(.42,.02,.32,1)'
      });
    }
    if (!isDesktop || !pastHeader || moved) lastScroll = y;
  }
  function scheduleHeader() {
    if (!frame) frame = requestAnimationFrame(syncHeader);
  }
  addEventListener('scroll', scheduleHeader, {passive:true});
  addEventListener('resize', scheduleHeader);
  syncHeader();

  function showMenu(next, returnFocus = true) {
    if (next === open) return;
    open = next;
    if (open) showDropdown(null);
    else showGroup(null);
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
    if (open) menuContent.scrollTop = 0;
    else syncHeader();
  }
  toggle.addEventListener('click', () => showMenu(!open));
  shell.querySelector('#back-to-top').addEventListener('click', () => showMenu(false, false), {capture:true});
  shell.addEventListener('click', event => {
    const anchor = event.target.closest('a');
    if (!anchor || (!open && !dropdown.contains(anchor))) return;
    if (open) showMenu(false);
    else {
      currentSection?.button.focus({preventScroll:true});
      showDropdown(null);
    }
    if (anchor.hash && anchor.origin === location.origin && anchor.pathname === location.pathname) {
      if (anchor.hash === location.hash && anchor.hash.startsWith('#experience-')) window.dispatchEvent(new Event('experience-select'));
      const destination = document.getElementById(anchor.hash.slice(1));
      const target = destination?.closest('.experience-anchors')?.parentElement || destination;
      if (target) {
        target.tabIndex = -1;
        target.focus({preventScroll:true});
      }
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (currentSection) {
        currentSection.button.focus({preventScroll:true});
        showDropdown(null);
      } else if (currentGroup) {
        currentGroup.button.focus({preventScroll:true});
        showGroup(null);
      } else if (open) showMenu(false);
      return;
    }
    if (event.key !== 'Tab') return;
    // The dropdown is laid out beside the mast row but follows its trigger by keyboard.
    if (currentSection) {
      const {button, panel} = currentSection;
      const links = panel.querySelectorAll('a');
      const focused = document.activeElement;
      if (!event.shiftKey && focused === button) {
        event.preventDefault();
        links[0].focus();
      } else if (event.shiftKey && focused === links[0]) {
        event.preventDefault();
        button.focus();
      } else if (!event.shiftKey && focused === links[links.length - 1]) {
        event.preventDefault();
        (button.nextElementSibling || shell.querySelector('.mast-logo')).focus();
        showDropdown(null);
      }
      return;
    }
    if (!open) return;
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
