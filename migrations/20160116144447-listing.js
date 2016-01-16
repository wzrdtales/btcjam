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

  return db.createTable( 'listing', {
    id: {
      type: 'int',
      primaryKey: true,
      unsigned: true
    },
    data: {
      type: 'blob',
      length: 65536
    }
  } );
};

exports.down = function(db) {

  return db.dropTable( 'listing', {
    ifExists: true
  } );
};
