(function() {
  const vscode = acquireVsCodeApi();
  function post(type,message) {
    vscode.postMessage(Object.assign({},message,{type}));
  }

  window.addEventListener('load',()=>{
    document.querySelectorAll('input,select').forEach(e=>{
      if( !('customChangeHandler' in e.dataset) )
        e.addEventListener('change',ev=>{
          post('value-changed', {
            path: ev.target.name, 
            value: ev.target.type == 'checkbox'
                    ? ev.target.checked
                    : ev.target.value
        });
      })
    });
    document.querySelectorAll('.unspecified-map input,.unspecified-map textarea').forEach(e=>{
      e.addEventListener('change', ev=>{
        const tbl = ev.target.closest('.unspecified-map>table');
        if( tbl != undefined ) {
          const keys = tbl.querySelectorAll(`input[name="${tbl.id}--name"]`);
          const values = tbl.querySelectorAll(`textarea[name="${tbl.id}--value"]`);
          if( keys.length != values.length )
            console.warn('Number of keys does not match the number of values for "unspecified-map".', tbl.id);
          const map = {};
          for( let i = 0 ; i < keys.length ; i++ ) 
            map[keys[i].value] = values[i].value;
          
          post('value-changed', {
            path: tbl.id,
            value: map,
          });
        }
      });
    });
    document.querySelectorAll('fieldset > legend > span.collapse-button').forEach(el=>{
      el.addEventListener('click',ev=>{
        const fs = ev.target.closest('fieldset').classList.toggle('collapsed');
      })
    });
  });
})();
