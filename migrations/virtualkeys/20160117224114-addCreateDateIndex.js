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

  return db.addIndex( 'listing', 'create_date', [ 'create_date'] )
  .then( function() {

    return db.addIndex( 'listing', 'create_date_state',
      [ 'create_date', 'start_date' ] );
  } )
  .then( function() {

    return db.addIndex( 'listing', 'update_date',
      [ 'update_date' ] );
  } )
  .then( function() {

    return db.addIndex( 'listing', 'update_date_state',
      [ 'status', 'update_date' ] );
  } );
};

exports.down = function(db) {

  return db.removeIndex( 'listing', 'update_date_state' )
  .then( function() {

    return db.removeIndex( 'listing', 'update_date' );
  } )
  .then( function() {

    return db.removeIndex( 'listing', 'create_date_state' );
  } )
  .then( function() {

    return db.removeIndex( 'listing', 'create_date' );
  } );
};
