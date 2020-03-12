/**
 * @file NoXerveAgent activity protocol activity_of_service_handler file. [activity_of_service_handler.js]
 * @author NOOXY <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 NOOXY. All Rights Reserved.
 */

 'use strict';

module.exports = (error, activity_of_service, tunnel)=> {

  if(error) tunnel.close();
  else {
    // Start communication with service.
    activity_of_service.on('', ()=> {
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
};
