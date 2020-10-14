
// Locker
// create by a group peer
WorkerGroup.prototype.createLocker = function(locker_name, locker_parameter, callback) {
  // const locker = new Locker({
  //   locker_name: locker_name,
  //   locker_parameter: locker_parameter
  // });
}

// resume by all group peers, static_global_random_seed_4096bytes decides exact one peer to handle.
WorkerGroup.prototype.resumeLocker = function(callback) {

}

// pause, destroy
// managed by Locker object itself.


// SyncQueue
// create by a group peer
WorkerGroup.prototype.createSyncQueue = function(sync_queue_name, sync_queue_parameter, callback) {

}

// resume by all group peers, static_global_random_seed_4096bytes decides exact one peer to handle.
WorkerGroup.prototype.resumeSyncQueue = function(callback) {

}

// pause, destroy
// managed by SyncQueue object itself.


// AyncQueue
// create by a group peer
WorkerGroup.prototype.createAyncQueue = function(async_queue_name, async_queue_name_parameter, callback) {

}

// resume by all group peers, static_global_random_seed_4096bytes decides exact one peer to handle.
WorkerGroup.prototype.resumeAyncQueue = function(callback) {

}
