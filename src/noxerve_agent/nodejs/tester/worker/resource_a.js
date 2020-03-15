Worker.handleResource('FileSystemGroupA', {
  1234: [{
    interface_name: 'websocket',
    interface_connect_settings: {
      host: '0.0.0.0',
      port: 123
    }
  }, {
    interface_name: 'websocket',
    interface_connect_settings: {
      host: '0.0.0.0',
      port: 1235
    }
  }]
}, () => {

});

Worker.requestResource('FileSystemGroupB', {}, () => {});

Worker.on('ready', (resources) => {
  resources.FileSystemGroupA.handleConcurrentTask('read', ()=> {

  });
  resources.FileSystemGroupA.handleConcurrentTask('write', ()=> {

  });
  resources.FileSystemGroupA.handleConcurrentTask('delete', ()=> {

  });

  Service.define('read', ()=> {
    resources.executeConcurrentTask('read');
  });

  Service.handleYielding('write', ()=> {
    resources.executeConcurrentTask();
  });
});
