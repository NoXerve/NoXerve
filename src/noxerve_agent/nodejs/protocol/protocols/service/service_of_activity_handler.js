/**
 * @file NoXerveAgent service protocol service_of_activity_handler file. [service_of_activity_handler.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

 'use strict';

const service_of_activity_handler = (error, service_of_activity, tunnel)=> {
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

module.exports = service_of_activity_handler;
