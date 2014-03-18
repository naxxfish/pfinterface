// pfinterface 
/*
PathfinderPC interface.  
Chris Roberts <chris@naxxfish.eu>

For information about PathfinderPC, go to www.pathfinderpc.com
*/

var express = require('express')
var pfint = require('pfint')
var Datastore = require('nedb')
var config = require('./config')

// create the database for pfint to use
var state =  new Datastore();

// EDIT THESE BITS!
pfint.sync({
		'user' : config.pathfinder.user,
		'password' : config.pathfinder.password,
		'host' : config.pathfinder.host,
		'port' : config.pathfinder.port
	}, state)


// API methods coming right up
var app = express()
// what server are we running?
app.get('/server',function (request, response)
{
	console.log(request)
	state.findOne({'itemType' : 'pathfinderserver'}, function(err, server)
	{
		response.end(JSON.stringify(server))		
	})
});
// What protocol translators are there/
app.get('/translators',function (request, response)
{
	state.find({'itemType' : 'protocoltranslator'}, function(err, pt)
	{
		response.end(JSON.stringify(pt))		
	})
});

// get all memory slots
app.get('/memoryslots',function (request, response)
{
	state.find({'itemType' : 'memoryslot'}, function(err, slot)
	{
		//console.log(slot)
		response.end(JSON.stringify(slot))		
	})
});


// what's at memory slot x?
app.get('/memoryslot/:msName',function (request, response)
{
	state.findOne({'itemType' : 'memoryslot', 'name' : request.param("msName")}, function(err, slot)
	{
		//console.log(slot)
		response.end(JSON.stringify(slot))		
	})
});
// list of all routers
app.get('/routers',function (request, response)
{
	state.find({'itemType' : 'router'}, function(err, data)
	{
		response.end(JSON.stringify(data))		
	})
});

// list of all sources
app.get('/sources', function (request, response)
{
	state.find({'itemType' : 'source'}, function (err, data)
	{
		response.end(JSON.stringify(data))
	});
});

// what's source x?
app.get('/source/:sourceNum', function (request, response)
{
	state.findOne({'itemType' : 'source', 'id' : request.param("sourceNum")}, function (err, data)
	{
		response.end(JSON.stringify(data))
	});
});

app.get('/destinations', function (request, response)
{
	state.find({'itemType' : 'destination'}, function (err, data)
	{
		response.end(JSON.stringify(data))
	});
});

// What's destination x ?
app.get('/destination/:destinationNum', function (request, response)
{
	state.findOne({'itemType' : 'destination', 'id' : request.param("destinationNum")}, function (err, data)
	{
		response.end(JSON.stringify(data))
	});
});

//list of all crosspoints
app.get('/routes', function (request, response)
{
	state.find({'itemType' : 'route'}, function (err, data)
	{
		response.end(JSON.stringify(data))
	});
});

// is there a route between source x and destination y?

app.get('/route/source/:sourceNum/destination/:destinationNum', function (request, response)
{
	state.findOne({
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
	// you can only have one source routerd to a destination
	state.findOne({
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
	state.find({
		'itemType' : 'route', 
		'sourceid' : request.param("sourceNum")
		}, function (err, data)
		{
			response.end(JSON.stringify(data))
		});
});

app.get('/gpio', function (request, response)
{
	state.find({
		'itemType' : 'gpi'
		}, function (err, data)
		{
			response.end(JSON.stringify(data))
		});
});

app.listen(config.http.port)
console.log("Web Interface Started")
