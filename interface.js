// pfinterface
/*
PathfinderPC interface.
Chris Roberts <chris@naxxfish.eu>

For information about PathfinderPC, go to www.pathfinderpc.com
*/
var fs = require('fs'),
	http = require('http'),
	https = require('https')
var restify = require('restify');
var pkginfo = require('pkginfo')(module);
var fs = require('fs');
var bunyan = require('bunyan')
var auth = require('http-auth')
var PFInterface = require('pfint')
var config = require('./config')
var restifyBunyanLogger = require('restify-bunyan-logger');

//console.log("PathfinderPC Interface");
//console.log("Chris Roberts (@naxxfish)");
//console.log("-----------------------------");

// create the logging directory if it does not already exist
var logsDir = './logs';

if (!fs.existsSync(logsDir)){
    fs.mkdirSync(logsDir);
}
var server = restify.createServer({
	log:  bunyan.createLogger({
		name: "http-interface",
		streams: [
			{
				level: 'error',
				stream: process.stdout
			},
			{
				level: 'debug',
				type: 'rotating-file',
				path: logsDir + '/requests.log',
				period: '1d', // daily rotation
				count: 7 // one week log
		}]
	})
});

server.on('after', restifyBunyanLogger());

var log = bunyan.createLogger({
	name: "pfinterface",
	streams: [{
			level: 'info',
			stream: process.stdout
		},
		{
			level: 'trace',
			type: 'rotating-file',
			path: logsDir + '/pfinterface.log',
			period: '1d', // daily rotation
			count: 7 // one week log
		}
	]
});
log.info({
	'module_version': module.exports.version,
	'module_name': module.exports.name,
	'author': module.exports.author
})
// create the database for pfint to use
var pfint = new PFInterface();

/* STOMP connection */
try {
	var stompit = require('stompit')
} catch (er) {
	stompit = null
}

function stompConnect() {
	var connectionManager = new stompit.ConnectFailover([{
		port: config.stomp['port'], //61613,
		host: config.stomp['host'],
		resetDisconnect: true,
		connectHeaders: {
			host: '/',
			login: config.stomp['login'],
			passcode: config.stomp['passcode'],
			'heart-beat': '1000,1000'
		}
	}], {
		maxReconnectDelay: 5 * 1000 // only ever wait up to 5 seconds between reconnection attempts
	});
	connectionManager.on('error', function(error) {
		log.error({
			'component': 'stomp',
			'event': 'error',
			'error': error.message,
			'connectArgs': error.connectArgs
		})
	});
	connectionManager.on('connecting', function(connector) {
		var address = connector.serverProperties.remoteAddress.transportPath;
		log.info({
			'component': 'stomp',
			'event': 'connecting',
			'address': address
		});
	});

	var channelPool = stompit.ChannelPool(connectionManager);

	channelPool.channel(function(error, channel) {
		if (error) {
			log.error({
				'component': 'stomp',
				'event': 'error',
				'error': error.message
			})
			return
		}
		log.info({
			'component': 'stomp',
			'event': 'connected'
		})
		pfint.on('memorySlot', function(slot) {
			log.info({
				'message': 'slot',
				'slot': slot
			})
			channel.send({
				'destination': config.stomp.queues['memoryslot'],
				'content-type': 'application/json'
			}, JSON.stringify(slot), function(error) {
				if (error) {
					log.error({
						'component': 'stomp',
						'event': 'error',
						'error': error.message
					})
				} else {
					log.debug({
						'component': 'stomp',
						'event': 'message_sent'
					})
				}
			})
		});
		pfint.on('route', function(route) {
			log.info({
				'message': 'route',
				'route': route
			})
			channel.send({
				'destination': config.stomp.queues['route'],
				'content-type': 'application/json'
			}, JSON.stringify(route), function(error) {
				log.error({
					'component': 'stomp',
					'event': 'error',
					'error': error.message
				})
			})
		});
		pfint.on('customCommand', function(customCommand) {
			log.info({
				'message': 'custom',
				'customCommand': customCommand
			})
			channel.send({
				'destination': config.stomp.queues['custom'],
				'content-type': 'application/json'
			}, JSON.stringify(customCommand), function(error) {
				log.error({
					'component': 'stomp',
					'event': 'error',
					'error': error.message
				})
			})
		});
	})
}


if (stompit && config.stomp) {
	stompConnect()
}

pfint.on('error', function() {
	log.error({
		'component': 'pfint',
		'event': 'error',
		'error': 'An error connecting to Pathfinder occurred'
	})
	//process.exit(5);

});

pfint.sync({
	'user': config.pathfinder.user,
	'password': config.pathfinder.password,
	'host': config.pathfinder.host,
	'port': config.pathfinder.port
})

pfint.on('connected', function() {
	log.info({
		'component': 'pfint',
		'event': 'connected'
	})

})

/* HTTP API */

/*// add body parser so we can get POST parameters
var bodyParser = require('body-parser');
server.use(bodyParser.json()); // support json encoded bodies
server.use(bodyParser.urlencoded({
	extended: true
})); // support encoded bodies
*/

// start up the HTTP sever!

if (config.http) {
	if (config.http.port < 1024) {
		log.error({
			'component': 'http',
			'event': 'error',
			'error': "Can only run on unprivileged ports > 1024"
		});
		process.exit(5);
	}
	server.listen(config.http.port, function() {
		log.info({
			'component': 'http',
			'event': 'listening',
			'url': server.url
		});
	})

}

// HTTPS support deprecated (for now!)
/*if (config.https) {
	if (config.https.port < 1024) {
		log.error({
			'component': 'https',
			'event': 'error',
			'error': "Can only run on unprivileged ports > 1024"
		});
		process.exit(5);
	}
	if (config.https.port && config.https.keyfile && config.https.cert && config.https.port) {
		fs.exists(config.https.keyfile, function() {
			fs.exists(config.https.cert, function() {
				var options = {
					key: fs.readFileSync(config.https.keyfile),
					cert: fs.readFileSync(config.https.cert)
				}
				var httpsserver = https.createServer(options, app).listen(config.https.port, function() {
					log.info({
						'component': 'https',
						'event': 'listening',
						'port': config.https.port
					});
				})
			})
		})

	}
}*/

if (config.auth && config.auth.file && config.auth.realm) {
	fs.exists(config.auth.file, function() {
		log.info({
			'component': 'http',
			'event': 'configuration',
			'digest_auth_enabled': true,
			'file': config.auth.file
		});
		var digest = auth.digest({
			realm: config.auth.realm,
			file: config.auth.file
		});
		server.use(auth.connect(digest));
	});
}

// what server are we running?
server.get('/server', function(request, response) {
	pfint.findOne({
		'itemType': 'pathfinderserver'
	}, function(err, server) {
		response.end(JSON.stringify(server))
	})
});
// What protocol translators are there/
server.get('/translators', function(request, response) {
	pfint.find({
		'itemType': 'protocoltranslator'
	}, function(err, pt) {
		response.end(JSON.stringify(pt))
	})
});

// get all memory slots
server.get('/memoryslots', function(request, response) {
	pfint.find({
		'itemType': 'memoryslot'
	}, function(err, slot) {
		response.end(JSON.stringify(slot))
	})
});

// set a memory slot
server.post('/memoryslot/:msName', function(request, response) {
	if (config.pathfinder.settableSlots) {
		// there is a list of settable slots
		if (config.pathfinder.settableSlots.indexOf(request.param("msName")) == -1) { // and this memory slot is not in them
			response.status(401).end(JSON.stringify({
				'error': 'memory slot not settable'
			}))
			return
		}
	}
	// can we do this thing?
	if (config.auth) {
		if (!config.auth.acl) {
			response.status(500).end(JSON.stringify({
				'error': 'configuration file not set up properly, no acl'
			}))
			return
		}
		if (!config.auth.acl[request.user]) {
			response.status(401).end(JSON.stringify({
				'error': 'user not present in the ACL'
			}))
			return
		}
		if (config.auth.acl[request.user].write == "*" || config.auth.acl[request.user].write.indexOf(request.param("msName")) != -1) {
			response.status(401).end(JSON.stringify({
				'error': 'user not authorised to access that memory slot'
			}))
			return
		}
	}
	pfint.setMemorySlot(request.param("msName"), request.body.msValue, function(err, slot) {
		if (slot != null) {
			response.end(JSON.stringify(slot))
		} else {
			response.end(JSON.stringify({
				'error': 'no such memory slot'
			}));
		}
	})
});

// what's at memory slot x?
server.get('/memoryslot/:msName', function(request, response) {
	// can we do this thing?
	if (config.auth) {
		if (!config.auth.acl) {
			response.status(500).end(JSON.stringify({
				'error': 'configuration file not set up properly, no acl'
			}))
			return
		}
		if (!config.auth.acl[request.user]) {
			response.status(401).end(JSON.stringify({
				'error': 'user not present in the ACL'
			}))
			return
		}
		if (config.auth.acl[request.user].write == "*" || config.auth.acl[request.user].write.indexOf(request.param("msName")) != -1) {
			response.status(401).end(JSON.stringify({
				'error': 'user not authorised to access that memory slot'
			}))
			return
		}
	}
	pfint.findOne({
		'itemType': 'memoryslot',
		'name': request.param("msName")
	}, function(err, slot) {
		if (slot != null) {
			response.end(JSON.stringify(slot))
		} else {
			response.end(JSON.stringify({
				'error': 'no such memory slot'
			}));
		}
	})
});
// list of all routers
server.get('/routers', function(request, response) {
	pfint.find({
		'itemType': 'router'
	}, function(err, data) {
		response.end(JSON.stringify(data))
	})
});

// list of all sources
server.get('/sources', function(request, response) {
	pfint.find({
		'itemType': 'source'
	}, function(err, data) {
		response.end(JSON.stringify(data))
	});
});

// what's source x?
server.get('/source/:sourceNum', function(request, response) {
	pfint.findOne({
		'itemType': 'source',
		'id': request.param("sourceNum")
	}, function(err, data) {
		if (data != null) {
			response.end(JSON.stringify(data))
		} else {
			response.end(JSON.stringify({
				'error': 'no such source'
			}));
		}
	});
});

server.get('/destinations', function(request, response) {
	pfint.find({
		'itemType': 'destination'
	}, function(err, data) {
		response.end(JSON.stringify(data))
	});
});

// What's destination x ?
server.get('/destination/:destinationNum', function(request, response) {
	pfint.findOne({
		'itemType': 'destination',
		'id': request.param("destinationNum")
	}, function(err, data) {
		if (data != null) {
			response.end(JSON.stringify(data))
		} else {
			response.end(JSON.stringify({
				'error': 'no such destination'
			}));
		}
	});
});

//list of all crosspoints
server.get('/routes', function(request, response) {
	pfint.find({
		'itemType': 'route'
	}, function(err, data) {
		response.end(JSON.stringify(data))
	});
});

// is there a route between source x and destination y?

server.get('/route/source/:sourceNum/destination/:destinationNum', function(request, response) {
	pfint.findOne({
		'itemType': 'route',
		'sourceid': request.param("sourceNum"),
		'destinationid': request.param("destinationNum")
	}, function(err, data) {
		response.end(JSON.stringify(data))
	});
});

// what's routed to destination x?

server.get('/route/destination/:destNum', function(request, response) {
	// you can only have one source routerd to a destination
	pfint.findOne({
		'itemType': 'route',
		'destinationid': request.param("destNum")
	}, function(err, data) {
		response.end(JSON.stringify(data))
	});
});

// Where is source X routed?

server.get('/route/source/:sourceNum', function(request, response) {
	pfint.find({
		'itemType': 'route',
		'sourceid': request.param("sourceNum")
	}, function(err, data) {
		response.end(JSON.stringify(data))
	});
});

server.get('/gpio', function(request, response) {
	pfint.find({
		'itemType': 'gpi'
	}, function(err, data) {
		response.end(JSON.stringify(data))
	});
});
