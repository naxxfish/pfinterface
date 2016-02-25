## PFInterface

by Chris Roberts 

[PathfinderPC](http://www.pathfinderpc.com/) Server HTTP Interface

The purpose of this program is to provide a simple, interface into PathfinderPC Server - which is queryable via a HTTP request, or by a message through a STOMP broker. 

Once configured, this program can connect to the Main SAProtocol port configured in PathfinderPC Server.  You can configure this in PathfinderPC Server under File->Master TCP Port #.  If you prefer, you can create another Protocol Translator using the "Software Authority Protocol" set up as a TCP server, and specify the port number of that instead.  

Make sure you do

    npm install

To run it, either run the batch file, or do

    node interface.js

### Debugging
You can enable debugging of various elements by setting the environment variable DEBUG to one of the following:
 * __stomp-pfinterface__ - for stuff to do with the STOMP interface
 * __www-pfinterface__ - for stuff to do with the web interface
 * __pfint__ - for the mucky details about talking to PathfinderPC.
	
### Configuration
To configure, edit the config.js file.
  
Always keep the below at the end of the file:

    module.exports = config;

Yeah, I know - not the ideal way to do configuration, but it's convenient enough! 

#### PathfinderPC Connection

The settings concerned with connecting to the PathfinderPC Server are defined in the `config.pathfinder` section:

    config.pathfinder = {
    	'user' : 'PFInterface',  // the "user" in the PathfinderPC server to log in as
    	'password' : 'PFInterface',	// the password that user has in PathfinderPC server
    	'host' : '127.0.0.1', // the address of the PathfinderPC server
    	'port' : 9500 // the Protocol Translator port on the PathfinderPC Server (default is 9500)
    }

#### HTTP Server	
The settings around the HTTP server are in the below. You can't use a port number below 1024! This section is required:
    config.http = {
    	'port' : 8080 // what port to listen on
    }
	
Optionally, if you have a SSL certificate and keyfile, you can run a HTTPS server on a given port by defining the following section:
     config.https = {
     	port: 8081,
     	keyfile: 'server.key',
     	cert: 'server.crt'
     }
	
The authentications settings are available in the auth section.  Currently we support HTTP Digest authentication only.  If you need to create the htdigest file and don't have a tool to do it, you can use gevorg's one here: [htdigest](https://github.com/gevorg/htdigest/).  

You can also restrict the access to memoryslots for of a given user using the ACL.  In the example below, the user `test` may read any memory slot, but only write to `ONAIR` .  

**N.B.** it's a very very good idea to set this up!

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
	
#### STOMP Server
Whenever a Memory Slot is changed, or a route is made, an event is fired. When these events are fired we can send a message to a message broker topic using STOMP so that your client applications simply have to subscribe to the topic to recieve the events.  If you'd like to connect this up to a message queue server via STOMP, you can do that.  

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
	

	
### Methods
The below methods may be used to query the state of the PathfinderPC Server.  


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
##### GET
Gets the information about memoryslot called :slotName

    {
        "itemType": "memoryslot",
        "number": "0",
        "name": "TestThingy",
        "value": "Doobery",
        "_id": "8gDDPnzgzSkbIK30"
    }
	
##### POST
If you POST to this path, you can now SET a memory slot using the msValue paramter. 

For example with cURL:
      curl --data "msValue=hello" http://localhost:8080/memorySlot/ONAIR

It will return some JSON in the same format as you would with a GET, for confirmation. 


### License
Copyright (c) 2015 Chris Roberts

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.