var config = {}

config.debug = true

config.pathfinder = {
	'user' : 'PFInterface',
	'password' : 'PFInterface',
	'host' : '127.0.0.1',
	'port' : 9500,
	'settableSlots' : [
		"hello",
		"test",
		"123"
	]
}
config.http = {
	'port' : 8080
}
config.stomp = {
	'enabled': true,
	'host' : "localhost",
	'port' :61613,
	'login' : "pfinterface",
	'passcode': "pfinterface",
	'queues' : {
		'memoryslot': "/exchange/pathfinder.memoryslots",
		'route': "/exchange/pathfinder.routes",
		'custom': "/exchange/pathfinder.events"
	}
}
module.exports = config;
