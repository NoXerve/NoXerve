(error, service_of_activity, tunnel)=> {
  if(error) tunnel.close();
  else {
    // Start communication with service.
    service_of_activity.on('', ()=> {
      tunnel.send();
    });

    tunnel.on('data', ()=> {
      activity_of_service.emit();
    });

    tunnel.on('error', (error)=> {
      activity_of_service.emit();
    });

    tunnel.on('close', ()=> {
      activity_of_service.emit();
    });
  }
}
