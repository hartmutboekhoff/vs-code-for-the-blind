const importList = [
  "./dispose",
  //"./probieren",
  './MenuEditor/MenuEditorProvider',
  './views/HtmlFrame'
];

const modules: any[] = [];
const errors: string[] = [];
let loaded: boolean = false;

Promise.allSettled(importList.map(i=>import(i))).then(results=>{
  for( const r of results ){
    switch( r.status ) {
      case 'fulfilled':
        modules.push(r.value);
        break;
      case 'rejected':
        errors.push(r.reason);
    }
  }
  loaded = true;
});

 export default function probieren() {
  function printObject(o: any): string {
    let tbody: string = '';
    for( const k in o )
      tbody += `<tr><th>${k}</th><td>${o[k].toString()}</td></tr>`;
    return '<table>'+tbody+'</table>';
  }
  
  
  if( loaded )
    return errors.map(e=>`<p>${e}</p>`).join('\n')
           + '<h2>Module</h2>'
           + modules.map(m=>printObject(m)).join('\n');
           //+ '<h2>View-Directory</h2>'
           //+ automaticList.map(f=>`<p>${f}</p>`).join('\n');
  else
    return 'nothing has been loaded.'
}


