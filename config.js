var config = {}

config.debug = true

config.pathfinder = {
	'user' : 'PFInterface',
	'password' : 'PFInterface',
	'host' : '127.0.0.1',
	'port' : 9500
}
config.http = {
	'port' : 8080
}
config.stomp = {
	'enabled': false,
	'host' : "localhost",
	'port' :61613,
	'login' : "guest",
	'passcode': "guest",
	'queues' : {
		'memoryslot': "/exchange/pathfinder.memoryslots",
		'route': "/exchange/pathfinder.routes",
		'custom': "/exchange/pathfinder.events"
	}
}
module.exports = config;
