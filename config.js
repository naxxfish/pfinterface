var config = {}

config.debug = true

config.pathfinder = {
	'user' : 'PFInterface',
	'password' : 'PFInterface',
	'host' : 'localhost',
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
		'memoryslot': "/queue/pathfinder.events",
		'route': "/queue/pathfinder.events",
		'custom': "/queue/pathfinder.events"
	}
}
module.exports = config;