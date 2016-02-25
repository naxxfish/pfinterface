var config = {}

config.debug = false

config.pathfinder = {
	user : 'PFInterface',
	password : 'PFInterface',
	host : '127.0.0.1',
	port : 9500,
	settableSlots : [ // DEPRECATED if you use the ACL functionality below you can remove this field
		"hello",
		"test",
		"123"
	]
}

config.http = {
	port : 8080
}

/*
config.https = {
	port: 8081,
	keyfile: 'server.key',
	cert: 'server.crt'
}
*/

/*
config.auth = {
	realm: 'PathfinderPC',
	file: 'testfile.htdigest',
	acl: 
	{
		'test': { // each user exists here
			'read' : ['ONAIR'],
			'write': ['ONAIR']
		}
	}
}
*/

config.stomp = {
	host : "localhost",
	port :61613,
	login : "pfinterface",
	passcode: "pfinterface",
	queues : {
		memoryslot: "/exchange/pathfinder.memoryslots",
		route: "/exchange/pathfinder.routes",
		custom: "/exchange/pathfinder.events"
	}
}
module.exports = config;
