var dataTileURL = "http://movity.com/site_media/images/tiles/san-francisco-ca/safety/{Z}/{X}/{Y}.png";
var cloudmadeURL = "http://{S}tile.cloudmade.com/af6cad3a3c93413aaa8c2edd19a6d688/11950/256/{Z}/{X}/{Y}.png"; // 22677 is gray dawn
var safetyAPI = "http://www.movelabs.com/api/san-francisco-ca/crimes/?west={W}&south={S}&north={N}&east={E}";
var blocksURL = "static/data/sample.json"; // "http://localhost:5000/?lat={LAT}&lon={LON}";
var hoodURL = "static/data/neighborhoods.json";

var po = org.polymaps;
var map;

var geojson;

function createMap() {

	var svg = document.getElementById("map").appendChild(po.svg("svg"));

	map = po.map()
	    .container(svg)
	    .center({lat: 37.78429973752749, lon: -122.41436719894409})
		.zoom(13)
	    .zoomRange([10, 16])
	    .add(po.interact());

    // gray dawn base layer
	map.add(po.image()
	    .url(po.url(cloudmadeURL)
	    .hosts(["a.", "b.", "c.", ""])));

	// load the neighborhoods
	map.add(geojson = po.geoJson().on("show", onShow));

	map.add(po.compass()
	    .pan("none"));

    map.add(po.hash());
    
	map.container().setAttribute("class", "Blues");

	$("#submit").click(function(e){
	   var input = $("#jsonInput").val();

	   var json = JSON.parse(input);

	   displayMap(json);

     // save to server
     $.post('/new_short_url/', {json: JSON.stringify(json)}, function(data) {
         history.pushState({}, "omg omg omg", "/" + data);
       }
     );
	});

	// check initial
	var vars = getURLVars();
	if (vars["url"]) {
	    $.ajax({
	        url: vars["url"],
    		contentType: 'text/javascript',

    	    success: function(data){
    	        // parse the shit out of this
    	        var loaded = (data.features) ? data : JSON.parse(data);
    			displayMap(loaded);
    		}
	    })
	}


	$(this).mousemove(onMouseMove);
}

function onMouseMove(e) {
	$("#hoverLabel").css({left: e.pageX + 10, top:e.pageY + 10});
}

function onShow(e) {
    var features = e.features;
    for (var i = 0; i < features.length; i++) {
        var element = features[i].element;

		element.addEventListener("mouseout", function() {
		    $("#hoverLabel").hide();
		}, false);

		element.addEventListener("mouseover", (function() {
		    var data = features[i].data;

		    var summary = "";
		    for (var j in data.properties) {
		        summary = summary + j + ": " + data.properties[j] + "<br />";
		    }

		    return function(e) {
		        $("#hoverLabel").show().html(summary);
		    };
		})(), false);
    }
}

function displayMap(json) {
    if (json.length >= 1) {
    	   geojson.features(json);
    } else if (json.features.length >= 1) {
       geojson.features(json.features);
    }

    geojson.reshow();

    geojson.reshow();

   recenter();
}

function recenter() {
   var features = geojson.features();
   var center = { lat: 0, lon: 0 };
   var totalLat = 0;
   var totalLon = 0;
   var totalCount = 0;
   console.log(features.length + " features loaded.");

   var extent = map.extent();

   if (features.length && features[0].geometry) {
       var coordinate = findCoordinate(features[0].geometry.coordinates);
       extent = [ {lat: coordinate[1], lon: coordinate[0] }, {lat: coordinate[1], lon: coordinate[0]} ];
   }

   for (var i = 0; i < features.length; i++) {
       var f = features[i];

       if (!f.geometry) {
           continue;
       }

       // only looking for the first lat lon pair we can find
       // and assuming that is good enough for the extents
       var pt = findCoordinate(f.geometry.coordinates);

       encloseExtent(extent, pt[1], pt[0]);
   }

   var spread = Math.abs(extent[0].lat - extent[1].lat);

   extent[0].lat -= spread * .1;
   extent[1].lat += spread * .1;
   extent[0].lon -= spread * .1;
   extent[1].lon += spread * .1;

   map.extent(extent);
}

function encloseExtent(extent, lat, lon) {
   if (lat < extent[0].lat) {
       extent[0].lat = lat;
   }
   else if (lat > extent[1].lat) {
       extent[1].lat = lat;
   }

   if (lon < extent[0].lon) {
       extent[0].lon = lon;
   }
   else if (lon > extent[1].lon) {
       extent[1].lon = lon;
   }
}

function findCoordinate(array) {
    if (array.length == 2 && typeof array[0] == "number") {
        return array;
    } else {
        return findCoordinate(array[0]);
    }
}

// grab urlvariables
function getURLVars() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}