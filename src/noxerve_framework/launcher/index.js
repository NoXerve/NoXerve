/**
 * @file NoXerveFramework launcher file. [launcher.js]
 * @author nooxy <thenooxy@gmail.com>
 * @author noowyee <magneticchen@gmail.com>
 * @copyright 2019-2020 nooxy. All Rights Reserved.
 */

'use strict';

process.title = 'NoXerve Framework service launcher';

const message_codes = {
  start_noxframework_service: 0x01,
  start_noxframework_service_comfirm: 0x02,
  close_noxframework_service: 0x03,
  close_noxframework_service_comfirm: 0x04,
  terminate_noxframework_service: 0x05,
  request_preloader_close: 0xff,
  request_preloader_terminate: 0xfe,
  request_preloader_relaunch: 0xfd
}

const Fork = require('child_process').fork;

/**
 * @module Launcher
 */

function Launcher(settings) {
  /**
   * @memberof module:Launcher
   * @type {string}
   * @private
   */
  this._working_directory = settings.working_directory;

  /**
   * @memberof module:Launcher
   * @type {string}
   * @private
   */
  this._noxerve_agent_library_directory = settings.noxerve_agent_library_directory;

  /**
   * @memberof module:Launcher
   * @type {string}
   * @private
   */
  this._noxframework_service_preloader_subprocess;

  /**
   * @memberof module:Launcher
   * @type {string}
   * @private
   */
  this._settings = settings.settings;

  /**
   * @memberof module:Launcher
   * @type {string}
   * @private
   */
  this._launch_settings = settings.settings.launch_settings;
}

Launcher.prototype.launch = function() {
  let start_noxframework_service_subprocess_to_be_relaunched = true;
  let start_noxframework_service_subprocess_retried_counts = 0;

  const start_noxframework_service_subprocess = () => {
    // Close noxframework service.
    process.on('SIGTERM', () => {
      start_noxframework_service_subprocess_to_be_relaunched = false;
      subprocess.send({
        message_code: message_codes.terminate_noxframework_service
      });
      process.exit();
    });

    process.on('SIGINT', () => {
      start_noxframework_service_subprocess_to_be_relaunched = false;
      subprocess.send({
        message_code: message_codes.close_noxframework_service
      });
    });

    const subprocess = Fork(require.resolve('./noxframework_service_preloader'), {
      stdio: [process.stdin, process.stdout, process.stderr, 'ipc']
    });

    // Register.
    this._noxframework_service_preloader_subprocess = subprocess;

    subprocess.on('message', (message) => {
      const message_code = message.message_code;
      const data = message.data;
      if (message_code === message_codes.request_preloader_terminate) {
        start_noxframework_service_subprocess_to_be_relaunched = false;
        subprocess.send({
          message_code: message_codes.terminate_noxframework_service
        });
        process.exit();
      } else if (message_code === message_codes.request_preloader_relaunch) {
        start_noxframework_service_subprocess_to_be_relaunched = true;
        subprocess.send({
          message_code: message_codes.close_noxframework_service
        });
      } else if (message_code === message_codes.request_preloader_close) {
        start_noxframework_service_subprocess_to_be_relaunched = false;
        subprocess.send({
          message_code: message_codes.close_noxframework_service
        });

      } else if (message_code === message_codes.start_noxframework_service_comfirm) {
        start_noxframework_service_subprocess_to_be_relaunched = true;
        start_noxframework_service_subprocess_retried_counts = 0;

      } else if (message_code === message_codes.close_noxframework_service_comfirm) {
        subprocess.send({
          message_code: message_codes.terminate_noxframework_service
        });
      }
    });

    subprocess.on('exit', (code) => {
      if (start_noxframework_service_subprocess_to_be_relaunched === false) {
        console.log('Launcher has recieve close signal from core.');
        process.exit();
      } else if (start_noxframework_service_subprocess_retried_counts === parseInt(this._launch_settings.launch_fail_retry_counts)) {
        console.log('Launcher has retried launching ' + start_noxframework_service_subprocess_retried_counts + ' times. Aborted.');
        process.exit();
      } else if (start_noxframework_service_subprocess_to_be_relaunched) {
        console.log('Launcher is relauching NoXerve Framework service.');
        setTimeout(start_noxframework_service_subprocess, this._launch_settings.relaunch_interval_ms);
      } else {
        process.exit();
      }
      start_noxframework_service_subprocess_retried_counts++;
    });

    // Start noxframework service.
    subprocess.send({
      message_code: message_codes.start_noxframework_service,
      data: {
        working_directory: this._working_directory,
        noxerve_agent_library_directory: this._noxerve_agent_library_directory,
        settings: this._settings
      }
    });
  };
  start_noxframework_service_subprocess();
};

module.exports = Launcher;
