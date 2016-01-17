
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

var ids = [],
    amount = 0,
    start = 0,
    db = new MariaSQL(),
    con = db.connect(require('./database.json').dev ),
    mode = 0;

if( Number.isInteger( parseInt( process.argv[2] ) ) ) {

  if( process.argv.length < 4 ) {
    amount = Number( process.argv[2] );
    start = 0;

    for( var i = 1; i <= amount; ++i ) {
      ids.push( i );
    }
  }
  else {

    amount = Number( process.argv[3] );
    start = Number( process.argv[2] );

    for( var i = start; i <= amount; ++i ) {
      ids.push( i );
    }
  }
}
else if( process.argv[2] === 'rescan:deleted') {

  mode = 1;
}

var base = 'https://btcjam.com',
    bar,
    completed = 0;


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

    if( res === -1 ) {

      if( doc.body.indexOf('404 - BTCjam - BTCJAM') === -1 ) {

        ids.push( i );
      }

      return Promise.reject( new TypeError( 'something' ) );
    }

    res = doc.body.substring(res);
    res = res.substring(res.indexOf('\n') + 1, res.indexOf('</div>'));

    return JSON.parse( res );
  } )
  .then( function( resource ) {

    var dynCol = dyncol.createQuery( resource );
    return db.query( 'INSERT INTO listing (`id`, `data`) \
    VALUES (?, ' + dynCol + ') ON DUPLICATE KEY UPDATE data = ' + dynCol + ';',
    [ i ] );
  }, function( error ) {

    if( error instanceof TypeError ) {

      var dynCol = dyncol.createQuery( {
        deleted_listing: true
      } );

      return db.query( 'INSERT INTO listing (`id`, `data`) \
        VALUES (?, ' + dynCol + ') ON DUPLICATE KEY UPDATE data = ' +
        dynCol + ';', [ i ] );
    }
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

    for( var o = 0; o < 50 && ids.length > 0; ++o ) {
        promises.push( worker( ids.pop() ) );
    }

    return Promise.all( promises )
    .then( function() {
      return work( i );
    } );
  }

  return Promise.resolve();
}

function getDeleted() {

  return db.query( 'SELECT id FROM listing WHERE deleted = 1 ORDER BY id desc' )
  .then( function( rows ) {

    return Promise.each( rows , function( row ) {

      ids.push( row.id );
    } );
  } );
}

function modeSelector() {

  switch( mode ) {

    case 1:
      return getDeleted();

    default:
      return;
  }
}

return con
.then( function() {

  return modeSelector();
} )
.then( function() {

  amount = ids.length;
  bar = new ProgressBar(
   'parsing listings [:bar :current/:total] :percent :etas',
   {
     acomplete: '=',
     incomplete: ' ',
     total: amount,
     width: 40
   }
  );
  bar.tick( start );
  return work( start );
} )
.then( function() {
  process.exit( 0 );
});
