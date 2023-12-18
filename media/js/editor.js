(function() {
  const ActionButtons = {
    up:       { label: '↑', onclick:()=>void 0, }, 
    down:     { label: '↓', onclick:()=>void 0, }, 
    move:     { label: '↕', onclick:()=>void 0, }, 
    'delete': { label: '×', onclick:()=>void 0, }, 
    json:     { label: '{}', onclick: debug_showInfo }, 
  };

  function createActionButtons(...names) {
    const span = document.createElement('span');;
    span.className = 'action-buttons';
    names.forEach(n=>{
      const cfg = ActionButtons[n];
      if( cfg == undefined ) return undefined;
      
      const btn = document.createElement('button');
      btn.innerHTML = cfg.label;
      btn.className = n+'-button';
      btn.addEventListener('click',ev=>cfg.onclick(ev));
      span.appendChild(btn);
    });
    return span;
  }

  function debug_showInfo(ev) {
    const fset = ev.target.closest('fieldset[data-json-data]');
    if( fset == undefined ) return;
    const div = document.createElement('div');
    div.className = 'debug-info-overlay';
    div.title = 'Double-Click to close json-view.';
    div.addEventListener('dblclick',ev=>div.remove());    
    ['schemaPath', 'schema', 'jsonPath', 'jsonData'].forEach(n=>{
      const pre = document.createElement('pre');
      pre.className = n;
      try {
        pre.innerText = JSON.stringify(JSON.parse(fset.dataset[n]),undefined,2);
      } 
      catch(e) {
        pre.innerText = fset.dataset[n];
      }
      div.appendChild(pre)
    });
    fset.classList.remove('collapsed');
    fset.appendChild(div);
  }
  
  
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
        const fs = ev.target.closest('fieldset');
        if( ev.ctrlKey ) {
          const childfs = [...fs.children].filter(c=>c.nodeName=='FIELDSET');
          if( childfs.length == 0 )
            return;
          if( childfs[0].classList.contains('collapsed') )
            childfs.forEach(e=>e.classList.remove('collapsed'))
          else
            childfs.forEach(e=>e.classList.add('collapsed'))
        }
        else {
          fs.classList.toggle('collapsed');
        }
      });
      el.addEventListener('dblclick',ev=>{
        if( ev.ctrlKey )
          ev.target.closest('fieldset')
            .querySelectorAll('fieldset')
            .forEach(e=>e.classList.add('collapsed'));
      });      
    });
    document.getElementById('global-filter')?.addEventListener('input',ev=>{
      const filter = ev.target.value.toLowerCase();
      document.querySelectorAll('.root fieldset').forEach(el=>{
        if( filter == '' )
          el.style.display = 'block';
        else
          el.style.display = el.children[0].innerText.toLowerCase().includes(filter)? 'block':'none';
      })
    });
    [...document.querySelectorAll('.array.deletable>*,fieldset.has-debug-info')]
      .filter(e=>e.nodeName!='LEGEND')
      .forEach(d=>{
        if( d.classList.contains('has-debug-info') )
          d.appendChild(createActionButtons('delete','json'));
        else
          d.appendChild(createActionButtons('delete'));
      })
  });
  window.addEventListener('message',ev=>{
    console.log('MESSAGE RECEIVED', ev);
  })
})();
