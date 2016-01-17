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

  return db.addIndex( 'listing', 'start_date', [ 'start_date'] )
  .then( function() {

    return db.addIndex( 'listing', 'state_start_date',
      [ 'status', 'start_date' ] );
  } );
};

exports.down = function(db) {

  return db.removeIndex( 'listing', 'state_start_date' )
  .then( function() {

    return db.removeIndex( 'listing', 'start_date' );
  } );
};
