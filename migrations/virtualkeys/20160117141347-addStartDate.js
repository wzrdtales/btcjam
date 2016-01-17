'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {

  return db.runSql( 'ALTER TABLE `listing` \
    ADD COLUMN `start_date` datetime AS \
    (COLUMN_GET(data, \'dtclose\' as datetime)) \
    PERSISTENT AFTER `status`;' );
};

exports.down = function(db) {

  return db.removeColumn( 'listing', 'start_date' );
};
