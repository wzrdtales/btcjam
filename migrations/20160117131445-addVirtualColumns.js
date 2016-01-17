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
    ADD COLUMN `deleted` BIT(1) AS \
    (COLUMN_GET(data, \'deleted_listing\' AS unsigned integer)) \
    PERSISTENT AFTER `id`;' )
  .then( function() {

    return db.runSql( 'ALTER TABLE `listing` \
      ADD COLUMN `status` tinyint(3) unsigned AS \
      (COLUMN_GET(data, \'listing_status_id\' AS unsigned integer)) \
      PERSISTENT AFTER `deleted`;' );
  } )
  .then( function() {

    return db.runSql( 'ALTER TABLE `listing` \
      ADD COLUMN `expire_date` datetime AS \
      (DATE_ADD(COLUMN_GET(data, \'dtclose\' as datetime), \
        INTERVAL COLUMN_GET(data, \'term_days\' as int) DAY)) \
      PERSISTENT AFTER `status`;' );
  } );
};

exports.down = function(db) {

  return db.removeColumn( 'listing', 'expire_date' )
  .then( function() {

    return db.removeColumn( 'listing', 'status' );
  } )
  .then( function() {

    return db.removeColumn( 'listing', 'deleted' );
  } );
};
