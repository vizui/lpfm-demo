(function() {

	var Coords = {},
		Demog = {},
		FCCMap = {};
	
	// Enable Skiplinks to work in WebKit browsers (e.g. Safari and Chrome) 
	var is_webkit = navigator.userAgent.toLowerCase().indexOf('webkit') > -1;
	var is_opera = navigator.userAgent.toLowerCase().indexOf('opera') > -1;

	if (is_webkit || is_opera) {
	  $('.skipLink').click(function(e) {
		  var target = $(this).attr('href').split('#')[1];					
		  
		  document.getElementById(target).focus();
	  });	
	}	
	
	FCCMap = {
			init: function () {
				Coords.lat = 38.903228;
				Coords.long = -77.046012;
				
				$('#zipcode').val('');
				$('#tbl-chanfreq').hide();
				$('#lat').text(Coords.lat.toFixed(6));
				$('#long').text(Coords.long.toFixed(6));
				
				FCCMap.update();
				Demog.getData();
			},
			update: function() {
				var mapContainer = $("#mapContainer")[0],
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

				$('#lat').text(Coords.lat.toFixed(6));
				$('#long').text(Coords.long.toFixed(6));

			}, // End FCCMap.update						
			geocode_zip: function(zip) {
				// Reverse geocode lat, long to get address
				geocoder = new google.maps.Geocoder();
				geocoder.geocode({
					'address': zip
				}, function(results, status) {
					if (status == google.maps.GeocoderStatus.OK) {

						Coords.lat = results[0].geometry.location.lat();
						Coords.long = results[0].geometry.location.lng();

						FCCMap.update();
						Demog.getData();
					}
				});
			} // End FCCMap.geocode_zip
		} // End FCCMap

	Coords = {
			lat: null,
			long: null,
			getPos: function() {

				// If Zip Code box is empty, then get location automatically
				if ($('#zipcode').val() == '') {
					// Check if browser supports geolocation
					if (navigator.geolocation) {
						navigator.geolocation.getCurrentPosition(

						function(position) {
							Coords.lat = position.coords.latitude;
							Coords.long = position.coords.longitude;
							$('#lat').text(Coords.lat.toFixed(6));
							$('#long').text(Coords.long.toFixed(6));

							FCCMap.update();
							Demog.getData();
						}, function(error) {
							alert('Unable to get current position. Using default position instead.');
						});
					} else {
						alert('Your browser does not currently support geolocation.');
						FCCMap.init();
					}
				} else {
					var zip = $('#zipcode').val();
					FCCMap.geocode_zip(zip);
				}

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
				}).blur(function(e) {
                    $('#btn-getCoords').click();
                });

				$('#lnk-curLoc').click(function(e) {
					e.preventDefault();
					$('#zipcode').val('');
					Coords.getPos();
				});
			} // End Coords.getPos
		} // End Coords

	Demog = {
			getData: function() {

				var url = 'http://www.broadbandmap.gov/broadbandmap/demographic/jun2011/coordinates?latitude=' + Coords.lat + '&longitude=' + Coords.long + '&format=jsonp&callback=?',
					urlXML = 'http://www.broadbandmap.gov/broadbandmap/demographic/jun2011/coordinates?latitude=' + Coords.lat + '&longitude=' + Coords.long + '&format=xml',
					lpfmAPI = 'http://data.fcc.gov/lpfmapi/rest/v1/lat/' + Coords.lat + '/long/' + Coords.long + '?secondchannel=true&ifchannel=true&format=jsonp&callback=?';

				$('#api-demo').attr('href', urlXML);
				$('#api-lpfm').attr('href', lpfmAPI);

				// AJAX call to grab LPFM data
				$.getJSON(lpfmAPI, function(data) { 
						if (data.status == 'Bad Request') {
							$('#tbl-chanfreq').hide();
							$('#msg-error').empty().show().append('<span class="msg-error">' + data.message[0] + '.</span>');
						} else {
							var chanfreq = data.interferingAnalysis,
								chanfreqLen = chanfreq.length,
								TR = '';

							if (data.decision == 'FAIL.') {
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
				});

				// AJAX call to grab demographics data
				$.getJSON(url, function(data) { 
					if ((data.status == "OK") && (data.message.length == 0)){						
						Demog.displayData(data);		
					} else { 					
						$('#lst-demog').hide();
						$('#msg-demog').empty().append(data.message[0]).show();				
					}
				});
			},
			// End Demog.getData
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
		} // End Demog

	FCCMap.init();
	Coords.getPos();

})();