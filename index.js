
var Apricot = require('apricot').Apricot,
    request = require('request'),
    Promise = require('bluebird'),
    MariaSQL = require('mariasql-promise').MariaSQL,
    dyncol = require('dyncol'),
    ProgressBar = require('progress');

if( process.argv.length < 3 ) {
  console.log( 'Please enter the amount to import!' );
  return;
}

var amount = Number( process.argv[3] );
var start = Number( process.argv[2] );

var db = new MariaSQL(),
    con = db.connect(require('./database.json').dev ),
    base = 'https://btcjam.com',
    bar = new ProgressBar(
      'parsing listings [:bar :current/:total] :percent :etas',
      {
        acomplete: '=',
        incomplete: ' ',
        total: amount,
        width: 40
      }
    ),
    completed = 0;

bar.tick( start );

function get( url ) {

  return new Promise( function( resolve, reject ) {

    request( url,  function( error, response ) {

      if( error )
        return reject( error );

      return resolve( response );
    } );
  } );
}

function parseUrl( url ) {

  return get( url )
  .then( function( response ) {

    return new Promise( function( resolve, reject ) {

      Apricot.parse( response.body, function( err, doc ) {

        if( err )
          return reject( err );

        return resolve( doc );
      } );
    } );
  } );
}

function worker( i ) {

  var listing = '/listings/' + i;
  return get( base + listing )
  .then( function( doc ) {

    var res = doc.body
      .indexOf('<div hidden preload-resource=\'' + listing + '\'');

    if( res === -1 )
        return Promise.reject( new TypeError( 'something' ) );

    res = doc.body.substring(res);
    res = res.substring(res.indexOf('\n') + 1, res.indexOf('</div>'));

    return JSON.parse( res );
  } )
  .then( function( resource ) {

    return db.query( 'INSERT INTO listing (`id`, `data`) \
    VALUES (?, ' + dyncol.createQuery( resource ) + ');', [ i ] );
  }, function( error ) {

    if( error instanceof TypeError )
      return db.query( 'INSERT INTO listing (`id`, `data`) \
        VALUES (?, ' + dyncol.createQuery( {
          deleted_listing: true
        } ) + ');', [ i ] );
  } )
  .then( function() {

    bar.tick( 1 );
    return Promise.resolve();
  }, function() {

    return Promise.resolve();
  } );
}

function work( i ) {

  var i = i || 1;

  if( i < amount + 1 ) {

    var promises = [];

    for( var o = 0; o < 50 && i < amount + 1; ++o, ++i ) {
        promises.push( worker( i ) );
    }

    return Promise.all( promises )
    .then( function() {
      return work( i );
    } );
  }

  return Promise.resolve();
}

return con
.then( function() {

  return work( start );
} )
.then( function() {
  process.exit( 0 );
});
