(function() {
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
  });
})();
