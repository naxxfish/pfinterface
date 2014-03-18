var config = {}

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
		'memoryslot': "/pathfinder/events",
		'route': "/pathfinder/events"
	}
}
module.exports = config;