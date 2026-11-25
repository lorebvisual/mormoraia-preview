// Each atlas contains 72 views of the corresponding Figma bottle photograph.
(() => {
  const count=72, columns=8, tileWidth=219, tileHeight=500;
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  const desktopControls=matchMedia('(min-width:1025px) and (hover:hover) and (pointer:fine)');
  const pin=document.querySelector('.wine-pin');
  const stage=pin.querySelector('.wine-stage');
  const intros=[];
  let tick=0;
  function entranceAngle(top,start,end){
    if(preference.matches)return 0;
    const t=Math.max(0,Math.min(1,(start-top)/Math.max(1,start-end)));
    return 9*(1-t*t*(3-2*t));
  }
  function updateEntrance(){
    tick=0;
    const top=pin.getBoundingClientRect().top;
    const preload=top<=innerHeight*2.2 && top>=-pin.offsetHeight;
    const start=innerHeight-Math.min(innerHeight*.35,document.getElementById('n1204').offsetTop);
    const end=(parseFloat(getComputedStyle(stage).top)||0)-innerHeight*.15;
    const angle=entranceAngle(top,start,end);
    for(const {holder,update} of intros){
      if(!tabletLayout.matches){update(angle,preload);continue}
      const box=holder.getBoundingClientRect();
      update(entranceAngle(box.top,innerHeight,Math.max(0,(innerHeight-box.height)/2)),
        box.top<innerHeight*1.6 && box.bottom>0);
    }
  }
  function scheduleEntrance(){if(!tick)tick=requestAnimationFrame(updateEntrance);}
  addEventListener('scroll',scheduleEntrance,{passive:true});
  addEventListener('resize',scheduleEntrance);
  preference.addEventListener('change',updateEntrance);
  for(const [slot,product] of [[1204,'agrios'],[1214,'antalis'],[1224,'ostrea']]){
    const holder=document.getElementById('n'+slot);
    const front=holder.querySelector('img');
    const originalFront=front.getAttribute('src');
    const angledPoster='assets/angle-'+product+'.png';
    const canvas=document.createElement('canvas');
    canvas.width=tileWidth;canvas.height=tileHeight;
    canvas.setAttribute('aria-hidden','true');
    holder.append(canvas);
    holder.classList.add('bottle-view');
    const ctx=canvas.getContext('2d');
    let atlas=null, ready=false, frame=preference.matches?0:9, drawn=-1, drag=null, paint=0, manual=false;
    function drawTile(index){
      ctx.drawImage(atlas,(index%columns)*tileWidth,Math.floor(index/columns)*tileHeight,
        tileWidth,tileHeight,0,0,tileWidth,tileHeight);
    }
    function render(){
      paint=0;
      const angle=Math.round(frame*5);
      if(desktopControls.matches){
        holder.setAttribute('aria-valuenow',String(angle));
        holder.setAttribute('aria-valuetext',angle+' degrees');
      }
      const show=frame!==0 && ready && ctx;
      canvas.hidden=!show;
      const fallback=frame===0 ? originalFront : angledPoster;
      if(!show && front.getAttribute('src')!==fallback)front.src=fallback;
      front.style.visibility=show?'hidden':'';
      if(show && drawn!==frame){
        ctx.clearRect(0,0,tileWidth,tileHeight);
        const lower=Math.floor(frame), blend=frame-lower;
        drawTile(lower);
        if(blend>.001){
          ctx.globalAlpha=blend;
          drawTile((lower+1)%count);
          ctx.globalAlpha=1;
        }
        drawn=frame;
      }
    }
    function requestAtlas(){
      if(atlas)return;
      atlas=new Image();
      atlas.onload=()=>{ready=true;render();};
      atlas.onerror=()=>{atlas=null;ready=false;render();};
      atlas.src='assets/spin-'+product+'.webp';
    }
    function turn(next){
      requestAtlas();
      frame=((Math.round(next)%count)+count)%count;
      if(!paint)paint=requestAnimationFrame(render);
    }
    intros.push({holder,update(next,preload){
      if(manual || drag)return;
      if(preload && next>0)requestAtlas();
      if(frame===next)return;
      frame=next;
      render();
    }});
    function pointerDown(e){
      if(!e.isPrimary || e.button!==0)return;
      requestAtlas();
      drag={id:e.pointerId,x:e.clientX,start:frame,width:Math.max(150,holder.clientWidth*1.75)};
      holder.setPointerCapture(e.pointerId);
      holder.classList.add('turning');
    }
    function pointerMove(e){
      if(drag?.id!==e.pointerId)return;
      const distance=e.clientX-drag.x;
      if(!manual && Math.abs(distance)<4)return;
      manual=true;
      turn(drag.start+distance*count/drag.width);
    }
    function clearDrag(){drag=null;holder.classList.remove('turning')}
    function keyDown(e){
      const next={ArrowRight:frame+1,ArrowUp:frame+1,ArrowLeft:frame-1,ArrowDown:frame-1,Home:0,End:count-1};
      if(Object.hasOwn(next,e.key)){e.preventDefault();manual=true;turn(next[e.key]);}
    }
    let listeners;
    function syncControls(){
      listeners?.abort();
      if(drag && holder.hasPointerCapture(drag.id))holder.releasePointerCapture(drag.id);
      clearDrag();
      manual=false;
      if(desktopControls.matches){
        listeners=new AbortController();
        holder.tabIndex=0;
        holder.setAttribute('role','slider');
        holder.setAttribute('aria-label','Rotate bottle to inspect the label');
        holder.setAttribute('aria-valuemin','0');
        holder.setAttribute('aria-valuemax','355');
        holder.title='Drag to rotate · Use the arrow keys to turn';
        for(const [event,listener] of Object.entries({
          pointerenter:requestAtlas,focus:requestAtlas,pointerdown:pointerDown,pointermove:pointerMove,
          lostpointercapture:clearDrag,keydown:keyDown
        }))holder.addEventListener(event,listener,{signal:listeners.signal});
      }else{
        for(const attr of ['tabindex','role','title','aria-label','aria-valuemin','aria-valuemax','aria-valuenow','aria-valuetext'])
          holder.removeAttribute(attr);
      }
      render();
      scheduleEntrance();
    }
    desktopControls.addEventListener('change',syncControls);
    syncControls();
  }
  updateEntrance();
})();
