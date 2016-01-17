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
    ADD COLUMN `create_date` datetime AS \
    (COLUMN_GET(data, \'created_at\' as datetime)) \
    PERSISTENT AFTER `status`;' )
  .then( function() {

    return db.runSql( 'ALTER TABLE `listing` \
      ADD COLUMN `update_date` datetime AS \
      (COLUMN_GET(data, \'updated_at\' as datetime)) \
      PERSISTENT AFTER `status`;' );
  } );
};

exports.down = function(db) {

  return db.removeColumn( 'listing', 'create_date' )
  .then( function() {

    return db.removeColumn( 'listing', 'update_date' );
  } );
};
