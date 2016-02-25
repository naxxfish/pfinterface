## PFInterface

by Chris Roberts 

[PathfinderPC](http://www.pathfinderpc.com/) Server HTTP Interface

The purpose of this program is to provide a simple, read-only interface into Pathfinder Server - queryable from HTTP via REST. 

The program will start up and connect to the SAPort default translator (port 9500).  It will keep an internal database with the state of Pathfinder Server being kept in sync.  This database may be queried via a HTTP interface on port 8080

Make sure you do

    npm install

To run it, either run the batch file, or do

    node interface.js

### Debugging
You can enable debugging of various elements by setting the environment variable DEBUG to one of the following:
 * stomp-pfinterface - for stuff to do with the STOMP interface
 * www-pfinterface - for stuff to do with the web interface
 * pfint - for the mucky details about talking to PathfinderPC.
	
### Configuration
To configure, edit the config.js file.  

The settings concerned with connecting to the PathfinderPC Server are defined in the `config.pathfinder` section:

    config.pathfinder = {
    	'user' : 'PFInterface',  // the "user" in the PathfinderPC server to log in as
    	'password' : 'PFInterface',	// the password that user has in PathfinderPC server
    	'host' : '127.0.0.1', // the address of the PathfinderPC server
    	'port' : 9500 // the Protocol Translator port on the PathfinderPC Server (default is 9500)
    }

	
The settings around the HTTP server are in the below.  This section is required:
    config.http = {
    	'port' : 8080 // what port to listen on
    }
	
The authentications settings are available in the auth section.  Currently we support HTTP Digest only.  If you need to create the htdigest file and don't have a tool to do it, you can install gevorg's one here: [htdigest](https://github.com/gevorg/htdigest/).  

You will '''need''' to set up authentication to allow setting or reading of memory slots to work.

    config.auth = {
    	realm: 'PathfinderPC',	// the realm which you used in the htdigest file
    	file: 'testfile.htdigest', // the htdigest file to use
    	acl: 
    	{
    		'test': { // each user exists here, and restricts what memory slots they can read/write to
    			'read' : '*', // either enter * for any and all memory slots
    			'write': ['ONAIR'] // or specify a list of allowable slots. 
    		}
	    }
    }
	
If you'd like to connect this up to a message queue server via STOMP, you can do that.  

    config.stomp = {
    	'enabled': true,
    	'host' : "localhost",
    	'port' :61613,
    	'login' : "pfinterface",
    	'passcode': "pfinterface",
    	'queues' : {
			// you may want to change these depending on your message queue sever setup
    		'memoryslot': "/exchange/pathfinder.memoryslots",  // all memory slot changes
    		'route': "/exchange/pathfinder.routes", // any route changes
    		'custom': "/exchange/pathfinder.events" // any other events that are recieved and not covered by the two above
    	}
    }
	
Always keep the below at the end of the file:

    module.exports = config;

Yeah, I know - not the ideal way to do configuration, but it's convenient enough! 
	
### Methods
All methods are HTTP GET
#### /server
Provides a list of server information.

    {
        "itemType": "pathfinderserver",
        "connected": true,
        "loggedIn": true,
        "host": "localhost",
        "port": 9500,
        "_id": "3p58qubZRv7taZ7x",
        "logonMessage": "Login Successful",
        "logonUser": "PFInterface",
        "version": "PathfinderPC Server Pro Version 4.75"
    }

#### /routers
Gets a list of all the routers in the system

    [
        {
            "itemType": "router",
            "id": "1",
            "avail": "Available",
            "name": "Test Router",
            "description": " ",
            "type": "SAPort",
            "sourcecount": "18",
            "destinationcount": "17",
            "_id": "7ltisyUNmcwLI77Q"
        }
    ]
    
#### /translators
Gets a list of all the current protocol translators set up on the system

    [
        {
            "itemType": "protocoltranslator",
            "id": "1",
            "avail": "Available",
            "name": "PFInterface",
            "description": "",
            "type": "Software Authority",
            "connectionstyle": "TCP",
            "connectionport": "9004",
            "_id": "NmIdRa3rY1t4TM8H"
        },
        {
            "itemType": "protocoltranslator",
            "id": "0",
            "avail": "Available",
            "name": "MainSAPort",
            "description": "Main Software Authority Protocol Port",
            "type": "Software Authority",
            "connectionstyle": "TCP",
            "connectionport": "9500",
            "_id": "RSltrTJzGL2lnf6S"
        }
    ]
    
#### /gpio
Gets a list of all GPIO states ... probably? (Can't test this yet!)

#### /sources
Gives a list of available sources on all routers in Pathfinder

    [
        {
            "itemType": "source",
            "id": "13",
            "avail": "Available",
            "name": "DeviceOutput 13",
            "description": "",
            "sourceId": "13",
            "routerId": "1",
            "_id": "5MTeEn1vwUt7Onlq"
        },
        {
            "itemType": "source",
            "id": "2",
            "avail": "Available",
            "name": "Stream TX",
            "description": "Stream TX ON",
            "sourceId": "2",
            "routerId": "1",
            "_id": "BEImf5MatfLWkGgG"
        },
        ...
    ]
    
#### /source/:sourceId
Gets a source with the provided source ID

    {
        "itemType": "source",
        "id": "1",
        "avail": "Available",
        "name": "FM TX",
        "description": "FM TX ON",
        "sourceId": "1",
        "routerId": "1",
        "_id": "Klu1DydarqtHRLBm"
    }
    
#### /destinations
Gets a list of all available destinations across all routers on the system

    [
        {
            "itemType": "destination",
            "destinationid": "8",
            "avail": "Available",
            "id": "8",
            "name": "S2 AUD",
            "description": "S2 AUD ON",
            "destinationId": "8",
            "routerId": "1",
            "_id": "27weib15446eUEHb"
        },
        {
            "itemType": "destination",
            "destinationid": "9",
            "avail": "Available",
            "id": "9",
            "name": "S2 OS 1",
            "description": "S2 OS 1 ON",
            "destinationId": "9",
            "routerId": "1",
            "_id": "JDLjlwc2dh16aQBR"
        }
        ...
    ]
    
#### /destination/:destinationId
Gets a specific destination by ID

    {
        "itemType": "destination",
        "destinationid": "1",
        "avail": "Available",
        "id": "1",
        "name": "S1 PGM",
        "description": "S1 PGM ON",
        "destinationId": "1",
        "routerId": "1",
        "_id": "Soommlo9Tbkei3s7"
    }

#### /routes
Gets a list of all routes currently made on the system

    [
        {
            "itemType": "route",
            "destinationid": "10",
            "avail": "HostOffline",
            "sourceid": "1",
            "lock": "F",
            "routerId": "1",
            "_id": "5aJL06qxpaEYAFiQ"
        },
        {
            "itemType": "route",
            "destinationid": "15",
            "avail": "HostOffline",
            "sourceid": "1",
            "lock": "F",
            "routerId": "1",
            "_id": "7poY3leZQKr3JBVr"
        }
        ...
    ]
#### /route/source/:sourceId/destination/:destinationId
Gets details about a route between :sourceId and :destinationId

    {
        "itemType": "route",
        "destinationid": "1",
        "avail": "HostOffline",
        "sourceid": "1",
        "lock": "F",
        "routerId": "1",
        "_id": "KmVIV96jiA2Av3Fp"
    }
    
#### /route/source/:sourceId
Gets a list of all the routes originating from :sourceId

    [
        {
            "itemType": "route",
            "destinationid": "11",
            "avail": "HostOffline",
            "sourceid": "1",
            "lock": "F",
            "routerId": "1",
            "_id": "07bpoVJMpGM2CfaV"
        },
        {
            "itemType": "route",
            "destinationid": "8",
            "avail": "HostOffline",
            "sourceid": "1",
            "lock": "F",
            "routerId": "1",
            "_id": "0VHIjSTvOfA68ill"
        }
        ...
    ]
    
#### /route/destination/:destinationId
Gets the current route ending up at :destinationId

    {
        "itemType": "route",
        "destinationid": "1",
        "avail": "HostOffline",
        "sourceid": "1",
        "lock": "F",
        "routerId": "1",
        "_id": "9RG7APbKC1XSVdDO"
    }
    
#### /memoryslots
Gets a list of all the current (set) MemorySlots

    [
        {
            "itemType": "memoryslot",
            "number": "0",
            "name": "TestThingy",
            "value": "Doobery",
            "_id": "8gDDPnzgzSkbIK30"
        },
        {
            "itemType": "memoryslot",
            "number": "1",
            "name": "Doobery",
            "value": "wabble",
            "_id": "kI2DGgAw6Po9YD7T"
        }
    ]
    
#### /memoryslot/:slotName
Gets the information about memoryslot called :slotName

    {
        "itemType": "memoryslot",
        "number": "0",
        "name": "TestThingy",
        "value": "Doobery",
        "_id": "8gDDPnzgzSkbIK30"
    }
	
'''BETA'''
If you POST to this path, you can now SET a memory slot, for example:

    /memoryslot/hello

POST data:

    msValue=123

will set MemorySlot hello to be 123.

It will return the same format as you would with a GET, except obviously it will have set the value first :)

### Credits
So far, all done by me (Chris)

