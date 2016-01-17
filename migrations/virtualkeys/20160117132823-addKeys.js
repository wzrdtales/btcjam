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

  return db.addIndex( 'listing', 'status', [ 'status' ] )
  .then( function() {

    return db.addIndex( 'listing', 'status_expired',
      [ 'status', 'expire_date'] );
  } )
  .then( function() {

    return db.addIndex( 'listing', 'isDeleted', [ 'deleted' ] );
  } );
};

exports.down = function(db) {

  return db.removeIndex( 'listing', 'isDeleted' )
  .then( function() {

    return db.removeIndex( 'listing', 'status_expired' );
  } )
  .then( function() {

    return db.removeIndex( 'listing', 'status' );
  } );
};
