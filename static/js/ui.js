var previousSearches = [];
var minimum = 10;

function initializeUI() {
	initializeSlider();
	initializeFinder();
	
	hideHoverWindow();
	$(this).mousemove(onMouseMove);
}

function initializeSlider() {
	$("#slider").slider({
	  min: 0, max: 1800, value: minimum, slide: function(e, ui) {
		
		minimum = ui.value;
		
		// test performance
		// var t = (new Date()).getTime();
		
		// update the slider
		updateTime();
		
		// log ms to complete
		// console.log(((new Date()).getTime() - t) + 'ms to complete');
	  }
	});
	
	// this is the text label next to the slider
	$("#sliderTimeTextArea").change( function(e, ui) {
		minimum = $(this).val() * 60;
		
		updateTime();
	})
	
	updateTime();
}

function initializeFinder() {
	
	// turn the transport method radiobuttons into tab buttons
	$("#transportMethod").buttonset();
	
	// hide status text
	$("#status").hide();
	
	var defaultInput = "Address or Intersection";
	$("#locationInputArea")
		.blur(function() {
			if ($(this).val() == "") {
				$(this).val(defaultInput);
			}
		})
		.focus(function() {
			if ($(this).val() == defaultInput) {
				$(this).val("");
			}
		})
		.change(function() {
			geocode();
			// geocoderize($(this).val());
		})
		.autocomplete({
			source: function(req, add) {
				var suggestions = [];
				
				var query = $("#locationInputArea").val();
				var reg = new RegExp(query, "i");
				
				for (var i = 0; i < previousSearches.length; i++) {
					var search = previousSearches[i];

					if (search.search(reg) >= 0) {
						suggestions.push(search);
					}
				}
				
				if (suggestions.length == 0) {
			    	$("#status").show("fast").html("press enter to search");
				} 
				else {
					add(suggestions);
				}
			},
			select: function(e, ui) {
				$("#locationInputArea").val(ui.item.value);
				geocode();
			}
		});
}

function updateTime() {
	// update the map layer
	composite.threshold(minimum);
	
	blocks.updateThreshold();
	
	// update the slider
	$("#slider").slider({value: minimum});
	
	// update the slider label
	$("#sliderTimeTextArea").val(Math.floor(minimum / 60));
}

// aping what's on prettymaps
function geocode(){
    var q = $("#locationInputArea").val();
    var feedback = $("#status");

    q = q.replace(/^\s*/, "").replace(/\s*$/, "");

	// append city if you don't have it
	var city = new RegExp("San Francisco", "i");
	if (q.search(city) < 0) {
		q = q + ", San Francisco CA";
	}

    if (q == ''){
		feedback.show("fast").html("try typing something...");
		setTimeout(reset, 2500);
		return;
    }

    var failfailfail = function(rsp){
		feedback.html("failed: " + rsp.message);
		setTimeout(reset, 7500);
		return;
    };

    var args = {
		// using weeplaces cloudmade api key
 		'cloudmade_apikey' : 'af6cad3a3c93413aaa8c2edd19a6d688',
		'enable_logging' : true,
		'providers' : ['cloudmade']
    };

    var geo = new info.aaronland.geo.Geocoder(args);
    geo.geocode(q, geocodeSuccess, failfailfail);
	
	feedback.show("fast").html("searching...");
}

function reset() {	
	$("#status").hide("fast");
}

function geocodeSuccess(rsp) {
	var lat = parseFloat(rsp.lat);
	var lon = parseFloat(rsp.lon);

	var z = parseInt(rsp['zoom']);
	
	if (z < 10) { z = z + 3; }
	if (z > 13) { z = 13; }	// check whether can have zoom here

	map.center({'lat': lat, 'lon': lon});
	
	// change the user dot to here
	userLocation.features([{
		geometry: {
			coordinates:[lon, lat], 
			type:"Point"
		}
	}]).on("show", function(e) {
		e.features[0].element.setAttribute("r", 10);
	}).reshow();
	
	loadBlocks(lat, lon);
	
	if (z) {
		map.zoom(z);
	}

	$("#status").html("found!");
	previousSearches.push($("#locationInputArea").val());
	setTimeout(reset, 2500);
	return;
}

function loadBlocks(lat, lon) {
	
	var url = blocksURL.replace("{LAT}", lat).replace("{LON}", lon);
	$.ajax({
		url: url,
		contentType: 'text/javascript',

	    // on complete. will have to get used to all these inline functions
	    success: function(data){
  
	        // parse the shit out of this
	        var loaded = JSON.parse(data);
			blocks.features(loaded.features);
		}
	});
}

function updateHoverWindow(str, element) {
	$("#hoverLabel").show().html(str);
}

function hideHoverWindow() {
	$("#hoverLabel").hide();
}

function onMouseMove(e) {
	$("#hoverLabel").css('top',  e.pageY + 10);
	$("#hoverLabel").css('left', e.pageX + 10);
}

function tweetThis() {
}

function getTime(hr) {
	var suffix = hr > 11 ? ":00 PM" : ":00 AM";
	var displayHour = hr > 12 ? hr - 12 : (hr == 0 ? 12 : hr);
	return displayHour + suffix;
}