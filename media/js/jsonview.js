(function() {
  function gotoJsonPath({path}) {
  const selector = path.trim(/[\.\/]/).split(/[\.\/]/).map(p=>`li[data-key="${p}"]`).join(' ');
    const target = document.querySelector(selector);
    if( target ) {
      for( let parent = target.parentElement.closest('li') ; parent ; parent = parent.parentElement.closest('li') ) {
        parent.classList.remove('collapsed');
      }
      target.scrollIntoView(true);
      target.classList.add('highlight') ;
      window.setTimeout(()=>target.classList.remove('highlight'), 3000);
    }
  }

  window.addEventListener('load', ()=>{
    document.querySelectorAll('li li:has(ol),li li:has(ul)')
      .forEach(e=>e.classList.add('collapsed'));
    
    const lis = document.querySelectorAll('li:has(ol),li:has(ul)');
    lis.forEach(e=>{
      if( lis.length > 15 )
        e.classList.add('collapsed');
      e.addEventListener('click',ev=>{
        if( ev.target.closest('ul,ol') != e.closest('ul,ol') ) return;

        if( !ev.ctrlKey ) {
          e.classList.toggle('collapsed');
        }
        else {
          const children = ev.target.closest('li').querySelectorAll('li:has(ol),li:has(ul)');
          if( children.length == 0 ) return;
          if( children[0].classList.contains('collapsed') )
            children.forEach(c=>c.classList.remove('collapsed'));
          else
            children.forEach(c=>c.classList.add('collapsed'));
        }
        ev.stopPropagation();
        ev.preventDefault();
      });
    });
    
    window.addEventListener('message',ev=>{
      console.log('MESSAGE RECEIVED', ev);
      if( typeof eval(ev.data.type) == 'function' )
        eval(ev.data.type)(ev.data);
    });

  });
})();
