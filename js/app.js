(function() {

	var Coords = {},
			LPFM = {},
			Demog = {},
			FCCMap = {};
	
	FCCMap = {
			init: function () { 
				// Set default map to Washington DC
				Coords.lat = 38.903228;
				Coords.long = -77.046012;
				
				$('#zipcode').val('');
				$('#tbl-chanfreq').hide();
				$('#lat').text(Coords.lat.toFixed(4));
				$('#long').text(Coords.long.toFixed(4));
				
				FCCMap.update();
				LPFM.getData();
				Demog.getData();
			},
			update: function() {
				var mapContainer = $('#mapContainer')[0],
					zipcode = $('#zipcode').val();
				var boundArray = [];
				var mapBoxURL = 'http://api.tiles.mapbox.com/v3/fcc.map-rons6wgv/geocode/' + Coords.long + ',' + Coords.lat + '.jsonp';

				$.ajax({
					url: mapBoxURL,
					dataType: 'jsonp',
					jsonpCallback: 'grid',
					success: function(value) {					
							if (value.results.length == 0) {
								alert("We could not verify this is a valid zip code.");
							} else {
								result = value.results[0][0];
								lat = result.lat;
								lon = result.lon;
								resultType = result.type;
								boundArray.push(parseFloat(result.bounds[1]));
								boundArray.push(parseFloat(result.bounds[3]));
								boundArray.push(parseFloat(result.bounds[0]));
								boundArray.push(parseFloat(result.bounds[2]));
								zoom = 12;
								mapSrc = "<img src='http://api.tiles.mapbox.com/v3/computech.map-mgys0lxe/pin-m-x+48C(" + lon + "," + lat + ")/" + lon + "," + lat + "," + zoom + "/290x150.png'/>";
		
								$('#mapContainer').empty();
								$('#mapContainer').html(mapSrc);
							}
						 }
			  });

				$('#lat').text(Coords.lat.toFixed(4));
				$('#long').text(Coords.long.toFixed(4));

			}, 				
			geocode_zip: function(zip) {				
				var mapBoxURL = 'http://api.tiles.mapbox.com/v3/fcc.map-rons6wgv/geocode/' + zip + '.jsonp';
		
				$.ajax({
					url: mapBoxURL,
					dataType: 'jsonp',
					jsonpCallback: 'grid',
					success: function(data) {	
						if (data.results.length == 0) {
								alert("We could not verify this is a valid zip code.");
							} else {
								Coords.lat = data.results[0][0].lat;
								Coords.long = data.results[0][0].lon;
		
								FCCMap.update();
								LPFM.getData();
								Demog.getData();
							}
					}
				});
				
			} 
		} 

	Coords = {
			lat: null,
			long: null,
			getPos: function() {

				// Check if browser supports geolocation
				if (navigator.geolocation) {
					navigator.geolocation.getCurrentPosition(

					function(position) {
						Coords.lat = position.coords.latitude;
						Coords.long = position.coords.longitude;
						$('#lat').text(Coords.lat.toFixed(4));
						$('#long').text(Coords.long.toFixed(4));

						FCCMap.update();
						LPFM.getData();
						Demog.getData();
					}, function(error) {
						alert('Unable to get current position. Using default position instead.');
					});
				} else {
					alert('Your browser does not currently support geolocation.');
				}
			}, // End Coords.getPos
			getpos_Events: function () {
				$('#btn-getCoords').click(function(e) {
					var zip = $('#zipcode').val();					
					e.preventDefault();
					$('#msg-error').hide();
					FCCMap.geocode_zip(zip);
				});

				$('#zipcode').keyup(function(e) {
					var v = $(this).val();
					
					if (e.keyCode == 13) {
						$('#btn-getCoords').click();
					}				
					
					if (isNaN(v)) {	
						$(this).val('');
						e.preventDefault();
					}					
				}).focus(function(e) {
					$(this).select();	
				});

				$('#lnk-curLoc').click(function(e) {
					e.preventDefault();
					$('#zipcode').val('');
					Coords.getPos();
				});	
			} 
		} 

	LPFM = {
		getData: function () {
			var lpfmAPI = 'http://data.fcc.gov/lpfmapi/rest/v1/lat/' + Coords.lat + '/long/' + Coords.long + '?secondchannel=true&format=jsonp&callback=?';
			
			$('#api-lpfm').attr('href', lpfmAPI);
			
			// Get LPFM data
			$.getJSON(lpfmAPI, function(data) { 
					if (data.status == 'Bad Request') {
						$('#tbl-chanfreq').hide();
						$('#msg-error').empty().show().append('<span class="msg-error">' + data.message[0] + '.</span>');
					} else {
						LPFM.displayData(data);										
					}						
			});	
		},
		displayData: function (d) {
			var chanfreq = d.interferingAnalysis,
					chanfreqLen = chanfreq.length,
					TR = '';

			if (d.decision == 'FAIL.') {
				$('#tbl-chanfreq').hide();
				$('#msg-error').empty().show().append('There are no interfering channels and frequencies near the selected area.');
			} else {
				
				// Populate Chan./Freq. table
				if (chanfreqLen > 0) {
					for (var i = 0; i < chanfreqLen; i++) {
						TR += '<tr><td>' + chanfreq[i].channel + '</td><td>' + chanfreq[i].frequency + '</td></tr>';
					}
				} else {
					TR = '<tr><td>' + chanfreq.channel + '</td><td>' + chanfreq.frequency + '</td></tr>';
				}

				$('#msg-error').hide();
				$('#tbl-chanfreq').show().find('tbody').empty().append(TR);	
			}		
		}
	}

	Demog = {
			getData: function() {

				var url = 'http://www.broadbandmap.gov/broadbandmap/demographic/jun2011/coordinates?latitude=' + Coords.lat + '&longitude=' + Coords.long + '&format=jsonp&callback=?',
						urlXML = 'http://www.broadbandmap.gov/broadbandmap/demographic/jun2011/coordinates?latitude=' + Coords.lat + '&longitude=' + Coords.long + '&format=xml';

				$('#api-demo').attr('href', urlXML);				

				// Get demographics data
				$.getJSON(url, function(data) { 
					if ((data.status == "OK") && (data.message.length == 0)){						
						Demog.displayData(data);		
					} else { 					
						$('#lst-demog').hide();
						$('#msg-demog').empty().append(data.message[0]).show();				
					}
				});
			},
			displayData: function(d) {
				var dd = $('#lst-demog').find('dd');
				
				$('#msg-demog').hide();

				// Populate Demographics info
				resultsArr = $.map(d.Results, function(val, i) {
					return val;
				});

				dd.each(function(index) {
					if ((index == 1) || (index > 2)) {
						var val = (resultsArr[index] * 100).toFixed(2);

						$(this).text(val + '%');
					} else {
						$(this).text(resultsArr[index]);
					}
				});
				$('#lst-demog').show();
			}
		} 

	FCCMap.init();
	Coords.getPos();
	Coords.getpos_Events();
	
})();