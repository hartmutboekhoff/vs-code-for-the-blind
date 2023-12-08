(function() {
  const vscode = acquireVsCodeApi();
  function post(type,message) {
    vscode.postMessage(Object.assign({},message,{type}));
  }

  window.addEventListener('load',()=>{
    document.querySelectorAll('.root input,.root textarea,.root select').forEach(e=>{
      e.addEventListener('change',ev=>{
        const viewElement = ev.target.closest('[view-path]');
        post('value-changed', {
          path: ev.target.name, 
          viewPath: viewElement?.getAttribute('view-path'),
          value:  ev.target.type == 'checkbox'
                  ? ev.target.checked
                  : ev.target.value
        });
      })
    });
    document.querySelectorAll('fieldset > legend > span.collapse-button').forEach(el=>{
      el.addEventListener('click',ev=>{
        const fs = ev.target.closest('fieldset').classList.toggle('collapsed');
      })
    });
    document.getElementById('global-filter')?.addEventListener('input',ev=>{
      const filter = ev.target.value.toLowerCase();
      document.querySelectorAll('.root fieldset').forEach(el=>{
        if( filter == '' )
          el.style.display = 'block';
        else
          el.style.display = el.children[0].innerText.toLowerCase().includes(filter)? 'block':'none';
      })
    })
  });
  window.addEventListener('message',ev=>{
    console.log('MESSAGE RECEIVED', ev);
  })
})();
