(function() {
  window.addEventListener('load', ()=>{
    document.querySelectorAll('li:has(ol),li:has(ul)')
      .forEach(e=>{
        e.addEventListener('click',ev=>{
          if( !ev.ctrlKey ) return;
          if( ev.target.closest('ul,ol') != e.closest('ul,ol') ) return;
          e.classList.toggle('collapsed');
          ev.stopPropagation();
          ev.preventDefault();
        })
      })
  });
})();
