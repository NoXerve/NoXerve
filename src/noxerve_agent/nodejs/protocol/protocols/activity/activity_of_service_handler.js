/**
 * @file NoXerveAgent activity protocol activity_of_service_handler file. [activity_of_service_handler.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

 'use strict';

const activity_of_service_handler = (error, activity_of_service, tunnel)=> {
  if(error) tunnel.close();
  else {
    // Start communication with service.
    activity_of_service.on('call-service-function', (function_name, nsdt_function_argument, callback)=> {
      tunnel.send();
    });

    tunnel.on('data', (blob)=> {
      //
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
module.exports = activity_of_service_handler;
