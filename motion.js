const official = 'https://www.mormoraia.it/en/';
const email = 'mailto:info@mormoraia.it';
// The first-view timeline is independent of scroll position and clipping.
const hero = node(986);
const film = document.getElementById('hero-film');
const desktopHeroPoster=film.poster;
function selectHeroPoster(){
  film.poster=compact.matches?'assets/hero-mobile-poster.jpg':desktopHeroPoster;
}
selectHeroPoster();
compact.addEventListener('change',()=>{selectHeroPoster();film.load()});
playWhenVisible(film);
document.querySelectorAll('.stay-media video').forEach(playWhenVisible);
const poster = new Image();
poster.src = film.poster;
const firstPaint = Promise.race([
  Promise.allSettled([poster.decode(), document.fonts.load('400 96px Boska'), document.fonts.load('400 24px "Satoshi UI"')]),
  new Promise(resolve => setTimeout(resolve, 1000))
]);
function startHero() {
  if (document.hidden) return;
  document.removeEventListener('visibilitychange', startHero);
  requestAnimationFrame(() => { hero.classList.add('entered'); document.documentElement.classList.add('page-entered'); });
}
firstPaint.then(() => {
  document.addEventListener('visibilitychange', startHero);
  startHero();
});

const photo=node(1336);
const photoSlot=document.createElement('div');
photoSlot.className='intro-photo-slot';
photo.before(photoSlot);
photoSlot.append(photo);
const photoInner = document.createElement('div');
photoInner.className = 'intro-photo-inner';
photoInner.append(...photo.children);
photo.append(photoInner);
const introImage = node(1508).querySelector('img');
let photoOpen = false;
photo.addEventListener('transitionend', event => {
  if(event.target===photo && event.propertyName==='transform'){
    photoOpen=true;
    schedule();
  }
});
reveal(photo, 0, 'mask-right', photoSlot);
sequence([1102,1103], .24, node(1100));
sequence([1135,1137,1138], .22, document.querySelector('.stay-intro-trigger'));
for (const details of [node(1148), document.getElementById('ds11-3180')]) {
  [...details.children].forEach((item, index) =>
    reveal(item, .12 + index * .18, 'stay-detail-fade', details));
}
sequence([1140,1158], .24);
for (const id of [1143,1161]) {
  const caption=node(id);
  [...caption.children].forEach((el,i)=>reveal(el,i*.2,i===1?'line':'reveal',caption));
}
reveal(node(1689));
[...node(1725).children].forEach((el,i)=>reveal(el,.15+i*.1,'reveal',node(1688)));
reveal(node(1745));
reveal(node(1124));[...node(1129).children].forEach(el=>reveal(el));
for (const id of [1225,1230]) {
  const panel = node(id);
  const anchor = document.createElement('div');
  anchor.className = 'panel-slot';
  panel.before(anchor);
  anchor.append(panel);
  animateEditorialPanel(panel, anchor);
}
reveal(node(1239),.12);sequence([1195,1205,1215],.16);
reveal(node(1677));reveal(node(1660));
for (const id of [1099,1133,1688,1122,1758,1759,1761,1762,1763]) {
  reveal(node(id),0,'section-enter');
}
const cursor=document.createElement('img');cursor.className='gallery-cursor';cursor.alt='';document.body.append(cursor);
const experiences=[
 ['Wine experiences','Taste the estate’s wines in the enoteca and get to know the vineyards behind each glass.','Book a tasting','Explore the wines'],
 ['Tuscan cooking class','Join our chef in the kitchen and prepare Tuscan recipes with ingredients from the region.','Book a class','Explore the kitchen'],
 ['Truffle hunting','Follow local hunters and their dogs through the estate woodland in search of truffles.','Enquire about a hunt','Explore the experience'],
 ['Aperitivo at sunset','Watch the light change over San Gimignano with a glass of Mormoraia wine and a selection of small bites.','Enquire about aperitivo','Explore the estate'],
 ['A dinner for two','Settle in for a private dinner with a tasting menu from our chef and wines from the estate.','Enquire about dinner','Discover Il Fienile'],
 ['An intimate wedding','Gather in the Tuscan countryside for a private ceremony followed by dinner on the estate.','Enquire about weddings','Explore the estate']
];
const experienceCurrent = document.querySelector('.experience-current');
document.querySelector('.experience-total').textContent = experiences.length;
function experienceCopy(index,animate) {
  const content=experiences[index];
  experienceCurrent.textContent = index + 1;
  node(1747).textContent=content[0];node(1748).textContent=content[1];
  const primary = document.getElementById('ds11-3182');
  const secondary = document.getElementById('ds11-3183');
  primary.firstElementChild.textContent = index ? content[2] : 'Book this experience';
  secondary.firstElementChild.textContent = index ? content[3] : 'Discover more';
  primary.href = index<2 ? 'https://visit.mormoraia.it/' : email;
  secondary.href = [official+'experiences/',official+'experiences/',official+'experiences/','#n1761','#n1758','#n1099'][index];
  if(animate&&!reduce.matches) node(1745).animate([{opacity:.05},{opacity:1}],{duration:450,easing:'ease-out'});
}
experiences[0][1]=node(1748).textContent.trim();node(1747).setAttribute('aria-live','polite');
// On smaller screens the page itself is the carousel timeline. Touch, wheel,
// keyboard and scroll restoration all share the same reversible position.
const tabletLayout = matchMedia('(max-width:1024px)');
const editorialTimelines = [];
function editorialGallery(section, track, slides) {
  const runway = document.createElement('div');
  runway.className = 'editorial-runway';
  section.before(runway);
  runway.append(section);
  // Freeze the visible height as each mobile sequence approaches. Browser chrome
  // can resize during a swipe, but the text and image panels must move as one.
  let measuredWidth=0;
  function sizeMobileStage(){
    if(compact.matches)runway.style.setProperty('--mobile-stage-height',innerHeight+'px');
    else runway.style.removeProperty('--mobile-stage-height');
    measuredWidth=innerWidth;
  }
  sizeMobileStage();
  new IntersectionObserver(([entry])=>{
    if(entry.isIntersecting)sizeMobileStage();
  },{rootMargin:'15% 0px'}).observe(runway);
  addEventListener('resize',()=>{if(measuredWidth!==innerWidth)sizeMobileStage()});
  const panel = section.querySelector('.panel-slot');
  const actions = panel.querySelector('.panel-mask').lastElementChild;
  const model = {active:false, position:0, start:0, distance:0};
  const easePanel = n => { const t=clamp(n);return t*t*(3-2*t); };
  let activeSlides = slides;
  function updatePosition() {
    if (!tabletLayout.matches) return;
    const stageHeight = section.offsetHeight;
    const top = Math.max(0, (innerHeight - stageHeight) / 2);
    // For a short landscape window, read the complete panel before pinning.
    const pinTop = compact.matches ? 0 : Math.min(top,innerHeight-stageHeight);
    section.style.top = pinTop + 'px';
    const width = section.clientWidth;
    const first = track.offsetLeft;
    const travel = first + track.offsetWidth - width;
    const distance = runway.offsetHeight - stageHeight;
    const bounds = runway.getBoundingClientRect();
    const start = scrollY + bounds.top - pinTop;
    const fraction = clamp((scrollY-start)/Math.max(1,distance));
    // Start when the entering section fills the bottom 30% of the viewport.
    const entrance = reduce.matches ? 1 : clamp((innerHeight * .7 - bounds.top) / (innerHeight * .7));
    panel.style.setProperty('--title-visibility',easePanel(entrance/.58));
    panel.style.setProperty('--copy-visibility',easePanel((entrance-.25)/.75));
    actions.inert = entrance <= .25;
    const offset = travel * fraction;
    model.position = offset;
    model.start = start;
    model.distance = distance;
    model.travel = travel;
    track.style.transform = 'translate3d('+(-offset)+'px,0,0)';
    panel.style.transform = 'translate3d('+(-offset)+'px,0,0)';
    const covered = offset >= panel.offsetWidth;
    if(panel.inert !== covered)panel.inert = covered;
  }
  function sync() {
    model.active = tabletLayout.matches;
    if(model.active && section.id==='n1758'){
      const ids = compact.matches ? [1563,1566,1564] : [1563,1565,1566];
      activeSlides = ids.map(id => slides.find(slide => slide.id === 'n'+id));
    }else activeSlides = slides;
    track.replaceChildren(...activeSlides);
    panel.querySelector('.panel-mask').lastElementChild.inert=false;
    track.style.transform = '';
    track.style.transition = '';
    panel.style.transform = '';
    panel.inert = false;
    section.style.top = '';
    if (model.active) {
      track.style.transition = 'none';
      runway.style.setProperty('--slides',activeSlides.length);
      updatePosition();
    }
  }
  function slideOffsets() {
    return [0, ...activeSlides.map(slide=>Math.min(model.travel,track.offsetLeft+slide.offsetLeft))];
  }
  function advance(dir) {
    updatePosition();
    const stops = slideOffsets();
    const target = dir>0 ? stops.find(x=>x>model.position+2) : stops.reverse().find(x=>x<model.position-2);
    if(target===undefined || !model.travel) return;
    scrollTo({top:model.start+(target/model.travel)*model.distance,behavior:reduce.matches?'instant':'smooth'});
  }
  tabletLayout.addEventListener('change',sync);
  compact.addEventListener('change',sync);
  new ResizeObserver(updatePosition).observe(section);
  sync();
  editorialTimelines.push(updatePosition);
  return {model,advance};
}

// Keep the browser in charge of touch and trackpad momentum. Recenter between
// identical filmstrips after scrolling stops, keeping the same fractional offset.
function nativeFilmstrip(container, track, slides, selection, select, clickDirection) {
  let offsets = [], cycle = 0, origin = 0, restingTimer = 0, mouse = null;
  let inset = 0, initialLeft = null, initialClip = 0;
  let frame = 0, destination = null, lastTime = 0;
  function interrupt() {
    cancelAnimationFrame(frame);
    frame = 0;
    destination = null;
  }
  function duplicate(slide) {
    const copy = slide.cloneNode(true);
    copy.removeAttribute('id');
    copy.querySelectorAll('[id]').forEach(child => child.removeAttribute('id'));
    copy.setAttribute('aria-hidden','true');
    return copy;
  }
  function measure() {
    interrupt();
    mouse = null;
    container.classList.remove('dragging');
    const x = track.getBoundingClientRect().left;
    origin = slides[0].getBoundingClientRect().left - x;
    offsets = slides.map(slide => slide.getBoundingClientRect().left - x - origin);
    cycle = slides.at(-1).nextElementSibling.getBoundingClientRect().left - x - origin;
    inset = parseFloat(getComputedStyle(container).getPropertyValue('--gallery-inset')) || 0;
    origin -= inset;
    container.scrollLeft = origin + offsets[selection()];
    if(initialLeft !== null)initialLeft = container.scrollLeft;
  }
  function sync() {
    clearTimeout(restingTimer);
    mouse = null;
    initialLeft = 0;
    initialClip = Infinity;
    container.style.removeProperty('--initial-clip');
    container.classList.add('native-gallery');
    container.classList.remove('edge-to-edge');
    const copies = () => slides.map(duplicate);
    track.replaceChildren(...copies(), ...copies(), ...slides, ...copies(), ...copies());
    measure();
  }
  function position(left = container.scrollLeft) {
    return ((left-origin) % cycle + cycle) % cycle;
  }
  function recenter() {
    if (!cycle) return;
    const next = origin + position();
    const shift = next-container.scrollLeft;
    if (Math.abs(shift) <= 1) return;
    container.scrollLeft = next;
    if (destination !== null) destination += shift;
    if (mouse) mouse.left += shift;
  }
  container.addEventListener('scroll',() => {
    if (!cycle) return;
    if(initialLeft !== null){
      const clip = Math.min(initialClip,Math.max(0,inset-Math.abs(container.scrollLeft-initialLeft)));
      if(clip !== initialClip)container.style.setProperty('--initial-clip',clip+'px');
      initialClip = clip;
      if(clip === 0)initialLeft = null;
    }
    const x = position();
    const nearest = [...offsets,cycle].reduce((best,stop) =>
      Math.abs(stop-x) < Math.abs(best-x) ? stop : best);
    select(nearest === cycle ? 0 : offsets.indexOf(nearest));
    // Leave enough content ahead even during an unusually long continuous swipe.
    if (container.scrollLeft < container.clientWidth/2 ||
        container.scrollWidth-container.clientWidth-container.scrollLeft < container.clientWidth/2) recenter();
    clearTimeout(restingTimer);
    restingTimer = setTimeout(recenter,220);
  },{passive:true});
  container.addEventListener('scrollend',recenter);
  function animate(time) {
    const delta = destination - container.scrollLeft;
    const ease = 1 - Math.exp(-Math.max(1,time-lastTime)/115);
    lastTime = time;
    if (Math.abs(delta) < 1) {
      container.scrollLeft = destination;
      interrupt();
      recenter();
      return;
    }
    container.scrollLeft += Math.sign(delta)*Math.max(1,Math.abs(delta)*ease);
    recenter();
    frame = requestAnimationFrame(animate);
  }
  function advance(dir) {
    if (!cycle) return;
    if (!tabletLayout.matches) container.classList.add('edge-to-edge');
    const start = destination ?? container.scrollLeft;
    const x = position(start);
    const stops = [-cycle+offsets.at(-1), ...offsets, cycle, cycle+offsets[1]];
    const next = dir > 0 ? stops.find(stop => stop > x+1) : stops.reverse().find(stop => stop < x-1);
    if (reduce.matches) {
      interrupt();
      container.scrollTo({left:start+next-x,behavior:'instant'});
      return;
    }
    destination = start + next - x;
    if (!frame) {
      lastTime = performance.now();
      frame = requestAnimationFrame(animate);
    }
  }
  container.addEventListener('wheel',interrupt,{passive:true});
  container.addEventListener('dragstart',event=>event.preventDefault());
  container.addEventListener('pointerdown',event => {
    if (event.pointerType !== 'mouse' || event.button !== 0) {interrupt();return}
    mouse = {id:event.pointerId,x:event.clientX,y:event.clientY,left:container.scrollLeft,drag:false};
    container.setPointerCapture(event.pointerId);
  });
  container.addEventListener('pointermove',event => {
    if (!mouse || mouse.id !== event.pointerId) return;
    const dx = event.clientX - mouse.x;
    if (!mouse.drag) {
      if (Math.abs(dx)<4) return;
      interrupt();
      mouse.left = container.scrollLeft;
      mouse.drag = true;
      container.classList.add('dragging');
      if (!tabletLayout.matches) container.classList.add('edge-to-edge');
    }
    container.scrollLeft = mouse.left - dx;
  });
  function release(event) {
    if (!mouse || mouse.id !== event.pointerId) return;
    const click = !mouse.drag && Math.abs(event.clientY-mouse.y)<6 && event.type==='pointerup';
    mouse = null;
    container.classList.remove('dragging');
    if (click && !tabletLayout.matches) advance(clickDirection(event.clientX));
    else if (!frame) recenter();
  }
  for (const type of ['pointerup','pointercancel','lostpointercapture']) container.addEventListener(type,release);
  new ResizeObserver(measure).observe(track);
  return {sync,advance};
}

function gallery(id,label,icon,onChange) {
  const track=node(id);
  const container=document.createElement('div');
  container.className='gallery-window';
  container.setAttribute('role','region');container.setAttribute('aria-label',label+' gallery. Use left and right arrow keys to browse.');container.tabIndex=0;
  track.before(container);container.append(track);
  if(id===1340||id===1118){
    Object.assign(container.style,{position:'absolute',top:'0',left:'30.8%',width:'69.2%'});
    Object.assign(track.style,{position:'relative',left:'0',top:'0'});
  }else container.classList.add('inset-gallery');
  track.classList.add('gallery-track');track.style.width='max-content';
  const slides=[...track.children];
  const surface = id === 1340 || id === 1118 ? container.closest('[id="n1758"],[id="n1762"]') : container;
  const editorial = surface === container ? null : editorialGallery(surface,track,slides);
  let index = 0, busy = false, press = null;
  const story = id === 1118;
  const gap = () => parseFloat(getComputedStyle(track).columnGap) || 0;
  const step = el => el.getBoundingClientRect().width + gap();
  const place = x => { track.style.transform = 'translate3d('+x+'px,0,0)'; };
  function rest(){
    track.style.transition = 'none';
    place(0);
    busy = false;
  }
  function direction(x){const b=container.getBoundingClientRect();return x<b.left+b.width*.32?-1:1}
  const hide=()=>cursor.classList.remove('on');
  container.addEventListener('pointermove',e=>{
    if(e.pointerType!=='mouse' || (tabletLayout.matches && !editorial)){hide();return;}
    if(cursor.dataset.icon!==icon){cursor.src='assets/'+icon;cursor.dataset.icon=icon}
    cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px';
    cursor.classList.toggle('prev',direction(e.clientX)<0);cursor.classList.add('on');
  });
  container.onpointerleave=hide;
  if (!editorial) {
    const strip = nativeFilmstrip(container,track,slides,()=>index,next=>{
      if (index===next) return;
      index=next;
      if (onChange) onChange(index,false);
    },direction);
    tabletLayout.addEventListener('change',strip.sync);
    strip.sync();
    for (const button of document.querySelectorAll('[data-slide-step][aria-controls="'+track.id+'"]')) {
      button.addEventListener('click',()=>strip.advance(Number(button.dataset.slideStep)));
    }
    container.onkeydown=e=>{
      if (!['ArrowRight','ArrowLeft','Enter'].includes(e.key)) return;
      e.preventDefault();
      strip.advance(e.key==='ArrowLeft'?-1:1);
    };
    return;
  }
  function settle(x, after){
    busy = true;
    track.getBoundingClientRect();
    track.style.transition = '';
    place(x);
    const animation = track.getAnimations().find(a=>a.transitionProperty==='transform');
    const finish = () => {
      if(editorial?.model.active){busy=false;return}
      if(story){place(-storyOffset());busy=false;return}
      after();
      rest();
    };
    if(animation && !reduce.matches) animation.finished.then(finish,finish);
    else finish();
  }
  function changed(dir){
    index = (index+dir+slides.length)%slides.length;
    if(onChange)onChange(index,true);
  }
  // The two Story slides are adjacent crops of the same panorama.
  const storyLimit = () => Math.max(0,track.getBoundingClientRect().width-container.clientWidth);
  const storyOffset = () => index * storyLimit();
  if (story) {
    new ResizeObserver(() => {
      if (!editorial.model.active && !busy && !press?.drag) place(-storyOffset());
    }).observe(container);
  }
  function move(dir){
    if(busy || press) return;
    if(editorial?.model.active){editorial.advance(dir);return}
    if(story){
      index = clamp(index + dir);
      settle(-storyOffset());
      return;
    }
    changed(dir);
    if(dir>0){
      settle(-step(track.firstElementChild),()=>track.append(track.firstElementChild));
    }else{
      const previous=track.lastElementChild;
      track.style.transition='none';
      track.prepend(previous);
      place(-step(previous));
      settle(0,()=>{});
    }
  }
  {
    let distance=0, consumed=false, lastWheel=-Infinity;
    surface.addEventListener('wheel', event => {
      if(event.ctrlKey || event.metaKey) return;
      const dx=event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX;
      if(!dx || (!event.shiftKey && Math.abs(dx)<=Math.abs(event.deltaY)))return;
      if(event.cancelable)event.preventDefault();
      const now=performance.now();
      if(now-lastWheel>170){distance=0;consumed=false;}
      lastWheel=now;
      if(consumed || busy || press)return;
      distance+=dx*(event.deltaMode===1?16:event.deltaMode===2?container.clientWidth:1);
      if(Math.abs(distance)>=18){consumed=true;move(Math.sign(distance));}
    },{passive:false});
  }
  surface.addEventListener('pointerdown',e=>{
    if(e.button!==0 || !e.isPrimary || busy || press || e.target.closest('a,button,input'))return;
    press={id:e.pointerId,x:e.clientX,y:e.clientY,photo:container.contains(e.target),drag:false,dx:0};
  });
  surface.addEventListener('pointermove',e=>{
    if(!press || press.id!==e.pointerId)return;
    const dx=e.clientX-press.x,dy=e.clientY-press.y;
    if(!press.drag){
      if(Math.abs(dy)>8 && Math.abs(dy)>Math.abs(dx)){press=null;return;}
      if(Math.abs(dx)<5)return;
      surface.setPointerCapture(e.pointerId);
      press.drag=true;
      if(editorial?.model.active){
        press.scrub=true;
        press.start=scrollY;
      } else if (story) {
        press.start=storyOffset();
        track.style.transition='none';
      } else {
        press.previous=track.lastElementChild;
        press.nextStep=step(track.firstElementChild);
        press.prevStep=step(press.previous);
        track.style.transition='none';
        track.prepend(press.previous);
      }
    }
    if(press.scrub){
      const {start,distance,travel}=editorial.model;
      scrollTo(0,Math.max(start,Math.min(start+distance,press.start-dx*distance/Math.max(1,travel))));
      return;
    }
    if(story){
      press.dx=dx;
      place(-Math.max(0,Math.min(storyLimit(),press.start-dx)));
      return;
    }
    press.dx=Math.max(-press.nextStep,Math.min(press.prevStep,dx));
    place(-press.prevStep+press.dx);
  });
  function release(e,cancelled=false){
    if(!press || e.pointerId!==press.id)return;
    const gesture=press;
    press=null;
    if(gesture.scrub)return;
    if(!gesture.drag){
      if(!tabletLayout.matches && !cancelled && gesture.photo && container.contains(e.target))move(direction(e.clientX));
      return;
    }
    const dir=cancelled || Math.abs(gesture.dx)<Math.min(42,container.clientWidth*.09)
      ? 0 : gesture.dx<0 ? 1 : -1;
    if(story){
      move(dir);
      return;
    }
    if(dir)changed(dir);
    const target=dir<0?0:-gesture.prevStep-(dir>0?gesture.nextStep:0);
    settle(target,()=>{
      if(dir>=0)track.append(gesture.previous);
      if(dir>0)track.append(track.firstElementChild);
    });
  }
  surface.addEventListener('pointerup',e=>release(e));
  surface.addEventListener('pointercancel',e=>release(e,true));
  surface.addEventListener('lostpointercapture',e=>release(e,true));
  surface.addEventListener('pointerleave',e=>{if(press && !press.drag && e.pointerType==='mouse')press=null;});
  container.onkeydown=e=>{if(['ArrowRight','ArrowLeft','Enter'].includes(e.key)){e.preventDefault();move(e.key==='ArrowLeft'?-1:1)}};
}
gallery(1725,'Experiences','88087.svg',experienceCopy);gallery(1340,'Dining','187b4.svg');gallery(1118,'Our story','187b4.svg');gallery(1652,'Instagram','187b4.svg');
const wine=document.createElement('div');wine.className='wine-pin';const stage=document.createElement('div');stage.className='wine-stage';wine.append(stage);node(1761).append(wine);stage.append(node(1195),node(1205),node(1215));
const closing=node(1011), closingSpace=document.createElement('div');closingSpace.className='pin-space closing-space';closing.before(closingSpace);closingSpace.append(closing,node(1763));
const inverse=node(1759);
const finale = document.querySelector('.photo-finale');
const photoStage = finale.querySelector('.photo-stage');
const photoSection = node(1122);
new ResizeObserver(([entry]) => {
  photoSection.style.setProperty('--photo-caption-height', entry.target.offsetHeight+'px');
  schedule();
}).observe(node(1123));
const photoWindow = finale.querySelector('.photo-window');
let previousPhotoState;
function photographyMotion() {
  const travel = finale.offsetHeight - photoStage.offsetHeight;
  const progress = travel <= 0 ? 0 : clamp(-finale.getBoundingClientRect().top / travel);
  const stacked = tabletLayout.matches;
  const animated = !reduce.matches;
  const state = [progress, stacked, animated].join('/');
  if (state === previousPhotoState) return;
  previousPhotoState = state;

  const center = phase(progress, 0, .19);
  const aperture = phase(progress, .19, .43);
  const fadeStart = stacked ? .22 : .46;
  const fadeEnd = stacked ? .66 : .79;
  const opacity = animated ? 1 - phase(progress, fadeStart, fadeEnd) : 1;
  const release = animated ? phase(progress, fadeEnd, .995) : 0;
  photoSection.style.setProperty('--caption-opacity', animated ? 1 - center : 1);
  photoSection.style.setProperty('--earlier-photos', stacked && animated && progress > fadeStart ? 'hidden' : 'visible');
  photoWindow.style.setProperty('--photo-shift', stacked || !animated ? '0%' : 25 * (1 - center) + '%');
  photoWindow.style.setProperty('--aperture', stacked || !animated ? '0%' : 25 * (1 - aperture) + '%');
  photoWindow.style.setProperty('--photo-image-opacity', opacity);
  photoWindow.style.setProperty('--photo-release', release);
  photoWindow.style.setProperty('--photo-mark-opacity', stacked || !animated || progress >= .43 ? 1 : 0);
  photoWindow.classList.toggle('photo-cleared', opacity < .48);
}

// Ease only the foreground offsets. Native page scrolling remains immediate.
let wineTarget=64, wineOffset=64, photoTarget=0, photoOffset=0;
let followFrame=0, previousTime=0;
function followScroll(time) {
  const elapsed=previousTime ? Math.min(64,time-previousTime) : 16.7;
  const factor=reduce.matches ? 1 : 1-Math.exp(-elapsed/125);
  wineOffset+=(wineTarget-wineOffset)*factor;
  photoOffset+=(photoTarget-photoOffset)*factor;
  const settled=Math.abs(wineTarget-wineOffset)<.045 && Math.abs(photoTarget-photoOffset)<.045;
  if(settled){wineOffset=wineTarget;photoOffset=photoTarget}
  node(1173).style.transform='translate3d('+(-wineOffset)+'px,0,0)';
  node(1174).style.transform='translate3d('+wineOffset+'px,0,0)';
  introImage.style.transform='translate3d(0,'+photoOffset+'px,0)';
  previousTime=settled?0:time;
  followFrame=settled?0:requestAnimationFrame(followScroll);
}
let frame=0;
function update(){
 frame=0;const y=scrollY,h=innerHeight;
 const reduced=reduce.matches;
 const fade=smooth(clamp(y/Math.min(185,h*.24)));
 node(1051).style.setProperty('--booking-visibility',1-fade);
 node(1051).style.filter=fade>0 && fade<1 && !reduced?'blur('+(fade*9)+'px)':'none';
 node(1050).inert=fade>=.995;
 const pinned=(el,stage)=>clamp((parseFloat(getComputedStyle(stage).top)-el.getBoundingClientRect().top)/Math.max(1,el.offsetHeight-stage.offsetHeight));
 const staysBox=node(1139).getBoundingClientRect();
 const stagger=reduced||tabletLayout.matches?0:smooth(clamp((h*.72-staysBox.top)/(h*.55+staysBox.height*.45)));
 const distance=Math.min(90,innerWidth*.052);
 node(1140).style.transform='translate3d(0,'+(-distance*stagger)+'px,0)';
 node(1158).style.transform='translate3d(0,'+(distance*stagger)+'px,0)';

 for(const [id,selector,range] of [[1761,'#ds11-3672',.33],[1762,'.story-mark',.42]]){
   const section=node(id),bounds=section.getBoundingClientRect();
   if(bounds.bottom>=0 && bounds.top<=h){
     const progress=smooth(clamp((h-bounds.top)/(h+bounds.height)));
     section.querySelector(selector).style.transform='translate3d(0,'+(reduced?0:(progress-.5)*h*range*2)+'px,0)';
   }
 }
 const swap=reduced?1:smooth(pinned(inverse,node(1107)));
 const vertical=tabletLayout.matches;
 if(vertical) {
   const pan=Math.max(0,node(1108).offsetHeight*2-node(1107).offsetHeight);
   node(1107).style.setProperty('--tile-pan',(-pan*swap)+'px');
   const trim=Math.max(0,(node(1108).offsetHeight-node(1108).offsetWidth*405/438)/2);
   node(1108).style.clipPath='inset('+trim*swap+'px 0)';
   node(1341).style.clipPath='inset('+trim*(1-swap)+'px 0)';
 }else{
   node(1108).style.clipPath='';
   node(1341).style.clipPath='';
 }
 const small=vertical?(compact.matches?205/375:438/744):.506;
 node(1108).style.scale=1-(1-small)*swap;
 node(1341).style.scale=vertical?small+(1-small)*swap:1+.974*swap;
 for(const draw of editorialTimelines)draw();
 const wineBox=node(1761).getBoundingClientRect();
 const wineProgress=reduced?1:smooth(clamp((h*.98-wineBox.top)/(h*.82)));
 const photoBox=photoSlot.getBoundingClientRect();
 const photoProgress=smooth(clamp((h-photoBox.top)/(h+photoBox.height)));
 wineTarget=64*(1-wineProgress);
 photoTarget=reduced || !photoOpen ? 0 :(2*photoProgress-1)*photoBox.height*.052;
 if(!followFrame)followFrame=requestAnimationFrame(followScroll);
 node(1205).style.transform=tabletLayout.matches?'none':'translateY('+(-node(1205).offsetTop*(reduced?1:pinned(wine,stage)))+'px)';
 const zoom=reduced?1:clamp(-closingSpace.getBoundingClientRect().top/(closing.offsetHeight*.8));
 photographyMotion();
 const startWidth = tabletLayout.matches ? (compact.matches?148:331) : closing.clientWidth*563/1728;
 const startHeight = tabletLayout.matches ? (compact.matches?257:400) : closing.offsetHeight*293/900;
 const hidden = 1-smooth(zoom);
 const insetX = Math.max(0,closing.clientWidth-startWidth)*hidden/2;
 const insetY = Math.max(0,closing.offsetHeight-startHeight)*hidden/2;
 closing.style.clipPath='inset('+insetY+'px '+insetX+'px)';
 node(1018).style.opacity=phase(zoom,.53,.86);
 node(1019).style.opacity=phase(zoom,.61,.92);
 const actionFade=phase(zoom,.70,.97);
 node(1020).style.opacity=actionFade;
 node(1020).inert=actionFade===0;

}
function schedule(){if(!frame)frame=requestAnimationFrame(update)}
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);reduce.addEventListener('change',schedule);update();
