(() => {
  const stackedBooking = matchMedia('(max-width:1024px)');
  const bookingToggle = document.getElementById('booking-toggle');
  const bookingBar = node(1051);
  const bookingLink = bookingBar.querySelector('a.ds-button');
  const bookingLabel = bookingLink.firstElementChild;
  const bookingDestination = new URL(bookingLink.href);
  const emailBooking = bookingDestination.protocol === 'mailto:';
  const dateTrigger = bookingBar.querySelector('.date-trigger');
  const dates = document.getElementById('booking-dates');
  const arrival = dates.querySelector('[name=arrival]');
  const departure = dates.querySelector('[name=departure]');
  const counts = [...bookingBar.querySelectorAll('.booking-count')];
  function showDates(open){
    dates.hidden = !open;
    dateTrigger.setAttribute('aria-expanded',String(open));
  }
  function setBookingOpen(open,returnFocus=false){
    const oldHeight=bookingBar.getBoundingClientRect().height;
    showDates(false);
    bookingBar.classList.toggle('expanded',open);
    bookingToggle.setAttribute('aria-expanded',String(open));
    bookingLabel.textContent=open?(emailBooking?'Send an enquiry':'Check availability'):'Book now';
    if(stackedBooking.matches && !reduce.matches){
      const height=bookingBar.offsetHeight;
      if(oldHeight!==height)bookingBar.animate([{height:oldHeight+'px'},{height:height+'px'}],{duration:550,easing:'cubic-bezier(.35,0,.18,1)'});
    }
    if(open)dateTrigger.focus({preventScroll:true});
    else if(returnFocus)bookingToggle.focus({preventScroll:true});
  }
  bookingToggle.addEventListener('click',()=>setBookingOpen(true));
  dateTrigger.addEventListener('click',()=>showDates(dates.hidden));
  const localDate = date => new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,10);
  arrival.min=localDate(new Date());
  function syncDates(){
    if(arrival.value){
      const next=new Date(arrival.value+'T12:00:00');
      next.setDate(next.getDate()+1);
      departure.min=localDate(next);
      if(departure.value && departure.value<departure.min)departure.value='';
    }
    dateTrigger.textContent=arrival.value && departure.value ? arrival.value+' – '+departure.value : 'Check In & Check Out';
  }
  arrival.addEventListener('change',syncDates);
  departure.addEventListener('change',syncDates);
  dates.querySelector('button').addEventListener('click',()=>{showDates(false);dateTrigger.focus({preventScroll:true})});
  bookingLink.addEventListener('click',event=>{
    if(counts.some(input=>!input.reportValidity())){event.preventDefault();return}
    if(arrival.value || departure.value){
      showDates(true);
      if(!arrival.value || !departure.value || !arrival.checkValidity() || !departure.checkValidity()){
        event.preventDefault();
        (!arrival.value || !arrival.checkValidity()?arrival:departure).focus();return;
      }
      showDates(false);
    }
    if(emailBooking){
      const details = [];
      if(arrival.value) details.push('Check in: '+arrival.value, 'Check out: '+departure.value);
      for(const input of counts) if(input.value) details.push(input.getAttribute('aria-label')+': '+input.value);
      bookingLink.href = bookingDestination.href;
      if(details.length) {
        const separator = bookingDestination.search ? '&' : '?';
        bookingLink.href += separator + 'body=' + encodeURIComponent(details.join('\r\n'));
      }
      return;
    }
    const params=new URLSearchParams();
    if(arrival.value){params.set('in',arrival.value);params.set('out',departure.value)}
    const adults=counts[0].valueAsNumber;
    if(adults>0 && adults<=100 && !(counts[1].valueAsNumber>0) && !(counts[2].valueAsNumber>1))params.set('guests',Array(adults).fill('A').join(','));
    bookingLink.hash=params.size?'/q&'+params.toString():'';
  });
  document.addEventListener('pointerdown',event=>{
    if(!dates.contains(event.target) && event.target!==dateTrigger)showDates(false);
    if(bookingBar.classList.contains('expanded')&&!bookingBar.contains(event.target))setBookingOpen(false);
  });
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    if(!dates.hidden){showDates(false);dateTrigger.focus({preventScroll:true})}
    else if(bookingBar.classList.contains('expanded'))setBookingOpen(false,true);
  });
  stackedBooking.addEventListener('change',()=>setBookingOpen(false));
})();
