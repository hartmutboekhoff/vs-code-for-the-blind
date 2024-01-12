

(function() {
  const ActionButtons = {
    addItem:  { label: 'Hinzufügen', click: addArrayItem, selector: '.array' },
    up:       { label: '↑', click:()=>void 0, }, 
    down:     { label: '↓', click:()=>void 0, }, 
    move:     { label: '↕', click:()=>void 0, }, 
    'delete': { label: '×', click:()=>void 0, selector: '.deletable>*:not(legend)'}, 
    json:     { label: '{}', click: debug_showInfo, selector: '.dev-mode .has-debug-info' }, 
  };

  function getActionButtonWrapper(container) {
    let wrapper = container.querySelector(':scope > span.action-buttons');
    if( !wrapper ) {
      wrapper = document.createElement('span');
      wrapper.className = 'action-buttons';
      container.appendChild(wrapper);
    }
    return wrapper;
  }
  
  function appendActionButton(container, name) {
    const buttonProps = ActionButtons[name];
    if( buttonProps == undefined ) return;
    const wrapper = getActionButtonWrapper(container);
    let btn = wrapper.querySelector(`button.${name}-button`);
    if( btn == undefined ) {
      btn = document.createElement('button');
      btn.innerHTML = buttonProps.label;
      btn.className = `${name}-button ${buttonProps.className??''}`;
      ['click'].forEach(evName=>{
        if( typeof buttonProps[evName] == 'function' )
          btn.addEventListener(evName,ev=>buttonProps[evName](ev));
      });
      /*
      [].forEach(attr=>{
        if( attr != undefined )
          btn.setAttribute(attr,buttonProps[attr]);
      });
      */
      wrapper.appendChild(btn);
    }
    return btn;
  }
  function autoCreateActionButtons() {
    Object.entries(ActionButtons)
      .forEach(([name,props])=>{
        if( props.selector )
          [...document.querySelectorAll(props.selector)]
            .filter(el=>!el.matches('span.action-buttons,span.action-buttons *'))
            .forEach(el=>appendActionButton(el,name));
      }) ;
  }

  function createActionButtons(...names) {
    const span = document.createElement('span');;
    span.className = 'action-buttons';
    names.forEach(n=>{
      const cfg = ActionButtons[n];
      if( cfg == undefined ) return undefined;
      
      const btn = document.createElement('button');
      btn.innerHTML = cfg.label;
      btn.className = n+'-button';
      btn.addEventListener('click',ev=>cfg.click(ev));
      span.appendChild(btn);
    });
    return span;
  }
  function debug_showInfo(ev) {
    const container = ev.target.closest('[data-json-data]');
    if( container == undefined ) return;
    const div = document.createElement('div');
    div.className = 'debug-info-overlay';
    ['schemaPath', 'schema', 'jsonPath', 'jsonData'].forEach(n=>{
      const pre = document.createElement('pre');
      pre.className = n;
      try {
        pre.innerText = JSON.stringify(JSON.parse(container.dataset[n]),undefined,2);
      } 
      catch(e) {
        pre.innerText = container.dataset[n];
      }
      div.appendChild(pre)
    });
    const closeBtn = document.createElement('button');
    closeBtn.innerText = '×';
    closeBtn.addEventListener('click',()=>div.remove());
    div.appendChild(closeBtn);
    container.appendChild(div);
    container.classList.remove('collapsed');
  }
  function addArrayItem(ev, jsonPath) {
    const container = ev.target.parentNode.parentNode;
    console.log(jsonPath, ev.target.parentNode.parentNode.dataset);
    post('addItem',{
      jsonPath: container.dataset.jsonPath,
      schemaPath: container.dataset.schemaPath,
      jsonKey: undefined,
      schemaKey: 'items',
    })
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
        if( ev.ctrlKey && ev.shiftKey ) {
          ev.target.closest('fieldset')
            .querySelectorAll('fieldset')
            .forEach(e=>e.classList.add('collapsed'));
        }
        else if( ev.ctrlKey ) {
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
/*
      el.addEventListener('dblclick',ev=>{
        if( ev.ctrlKey )
          ev.target.closest('fieldset')
            .querySelectorAll('fieldset')
            .forEach(e=>e.classList.add('collapsed'));
      }); 
*/
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
    /*
    [...document.querySelectorAll('.array.deletable>*,fieldset.has-debug-info')]
      .filter(e=>e.nodeName!='LEGEND')
      .forEach(d=>{
        if( d.classList.contains('has-debug-info') )
          d.appendChild(createActionButtons('delete','json'));
        else
          d.appendChild(createActionButtons('delete'));
      });
    */
    autoCreateActionButtons();
  });
  window.addEventListener('message',ev=>{
    console.log('MESSAGE RECEIVED', ev);
    if( typeof eval(ev.data.type) == 'function' )
      eval(ev.data.type)(ev.data);
  });
  
  function addItem(data) {
    console.log('newItem', data);
    const tmp = document.createElement('div');
    tmp.innerHTML = data.newElement;
    console.log(tmp.firstElementChild);
    const parent = document.querySelector('[data-json-path="'+data.jsonPath+'"]');
    parent.appendChild(tmp.firstElementChild);
  }
})();
