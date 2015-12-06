// pfinterface 
/*
PathfinderPC interface.  
Chris Roberts <chris@naxxfish.eu>

For information about PathfinderPC, go to www.pathfinderpc.com
*/

var express = require('express')
var PFInterface = require('pfint')
var stompdebug = require('debug')('stomp-pfinterface')
var wwwdebug = require('debug')('www-pfinterface')
var config = require('./config')

// create the database for pfint to use

var pfint = new PFInterface();

try {
	var stomp = require('stomp')
} catch (er)
{
	stomp = null
}

function stompConnect()
{
	var stomp_args = {
		port: config.stomp['port'], //61613,
		host: config.stomp['host'],
		debug: true,
		login: config.stomp['login'],
		passcode: config.stomp['passcode'],
		reconnectOpts: {retries:9999999, delay:100}
	}
	stompdebug(stomp_args)

	var stompClient = new stomp.Stomp(stomp_args);
	// Send message on to messagequeue
	try {
		stompClient.connect();
		stompClient.on('receipt', function(receipt) {
			stompdebug("RECEIPT: ", receipt);
		});
		stompClient.on('connected', function(){
			console.log("Connected to STOMP broker")
			pfint.on('memorySlot', function (slot)
			{
				stompClient.send(
				{
					'destination' : config.stomp.queues['memoryslot'],
					'body' : JSON.stringify(slot)
				}, true)
			});
			pfint.on('route', function (route) {
				stompdebug("route", route);
				stompClient.send(
				{
					'destination': config.stomp.queues['route'],
					'body': JSON.stringify(route)
				}, true)
			})
			pfint.on('customCommand', function (command)
			{
				stompdebug("Custom command: " + command)
				stompClient.send(
				{
					'destination' : config.stomp.queues['custom'],
					'body' : command
				}, true)
			});
		})
		stompClient.on('error', function (err){
			stompdebug("STOMP error ", err);
		});
		stompClient.on('disconnected', function(){
			stompdebug('disconnected from broker, trying to reconnect');
			setTimeout(	function() { stompClient.connect() } ,5000 )
		})
		stompClient.on('reconnected', function (){
			stompdebug("reconnected");
		});
		stompClient.on('reconnecting', function (){
			stompdebug("reconnecting");
		})
	} catch (err)
	{
		stompdebug("Couldn't connect to STOMP server! :(", err)
	} 
}
	

if (stomp && config.stomp.enabled)
{
	stompConnect()
}

pfint.on('error', function ()
{
	console.log("Could not connect to PathfinderPC (is the server running?)");
	process.exit(5);
	
});
pfint.sync({
		'user' : config.pathfinder.user,
		'password' : config.pathfinder.password,
		'host' : config.pathfinder.host,
		'port' : config.pathfinder.port
	})

// API methods coming right up
var app = express()
// what server are we running?
app.get('/server',function (request, response)
{
	wwwdebug(request);
	pfint.findOne({'itemType' : 'pathfinderserver'}, function(err, server)
	{
		response.end(JSON.stringify(server))		
	})
});
// What protocol translators are there/
app.get('/translators',function (request, response)
{
	wwwdebug(request);
	pfint.find({'itemType' : 'protocoltranslator'}, function(err, pt)
	{
		response.end(JSON.stringify(pt))		
	})
});

// get all memory slots
app.get('/memoryslots',function (request, response)
{
	wwwdebug(request);
	pfint.find({'itemType' : 'memoryslot'}, function(err, slot)
	{
		response.end(JSON.stringify(slot))		
	})
});


// what's at memory slot x?
app.get('/memoryslot/:msName',function (request, response)
{
	wwwdebug(request);
	pfint.findOne({'itemType' : 'memoryslot', 'name' : request.param("msName")}, function(err, slot)
	{
		response.end(JSON.stringify(slot))		
	})
});
// list of all routers
app.get('/routers',function (request, response)
{
	wwwdebug(request);
	pfint.find({'itemType' : 'router'}, function(err, data)
	{
		response.end(JSON.stringify(data))		
	})
});

// list of all sources
app.get('/sources', function (request, response)
{
	wwwdebug(request);
	pfint.find({'itemType' : 'source'}, function (err, data)
	{
		response.end(JSON.stringify(data))
	});
});

// what's source x?
app.get('/source/:sourceNum', function (request, response)
{
	wwwdebug(request);
	pfint.findOne({'itemType' : 'source', 'id' : request.param("sourceNum")}, function (err, data)
	{
		response.end(JSON.stringify(data))
	});
});

app.get('/destinations', function (request, response)
{
	wwwdebug(request);
	pfint.find({'itemType' : 'destination'}, function (err, data)
	{
		response.end(JSON.stringify(data))
	});
});

// What's destination x ?
app.get('/destination/:destinationNum', function (request, response)
{
	wwwdebug(request);
	pfint.findOne({'itemType' : 'destination', 'id' : request.param("destinationNum")}, function (err, data)
	{
		response.end(JSON.stringify(data))
	});
});

//list of all crosspoints
app.get('/routes', function (request, response)
{
	wwwdebug(request);
	pfint.find({'itemType' : 'route'}, function (err, data)
	{
		response.end(JSON.stringify(data))
	});
});

// is there a route between source x and destination y?

app.get('/route/source/:sourceNum/destination/:destinationNum', function (request, response)
{
	wwwdebug(request);
	pfint.findOne({
		'itemType' : 'route', 
		'sourceid' : request.param("sourceNum"), 
		'destinationid' : request.param("destinationNum")
		}, function (err, data)
		{
			response.end(JSON.stringify(data))
		});
});

// what's routed to destination x?

app.get('/route/destination/:destNum', function (request, response)
{
	wwwdebug(request);
	// you can only have one source routerd to a destination
	pfint.findOne({
		'itemType' : 'route', 
		'destinationid' : request.param("destNum")
		}, function (err, data)
		{
			response.end(JSON.stringify(data))
		});
});

// Where is source X routed? 

app.get('/route/source/:sourceNum', function (request, response)
{
	wwwdebug(request);
	pfint.find({
		'itemType' : 'route', 
		'sourceid' : request.param("sourceNum")
		}, function (err, data)
		{
			response.end(JSON.stringify(data))
		});
});

app.get('/gpio', function (request, response)
{
	wwwdebug(request);
	pfint.find({
		'itemType' : 'gpi'
		}, function (err, data)
		{
			response.end(JSON.stringify(data))
		});
});

app.listen(config.http.port)
console.log("Web Interface Started")
