var LIBRARY_OBJECT = (function() {
		// Global Variables
		var //map_id,
		chart_id,
		chart,
		map,
		sensorObject,
		optionDict,
		chkSensor,
		chkProduct,
		chkCorrection,
		return_obj;

		// Global Functions
		var init_vars,
			init_map,
			init_events,
			init_all;
			
		// Private functions
		var opOptions,
			createOpt,
			createSelect,
			createP,
			createCascade,
			map_request;
		// Define IDs for the map and chart html tags
		init_vars = function(){
			$loading = $('#loader');
			$selectSensor = $('#sensorSelect');
			$selectCollc = $('#collectionSelect');
			$selectProd = $('#productSelect');
			createOpt = function(optVal, optTxt){
				var options = document.createElement("option");
				var optval = document.createAttribute("value");
				optval.value = optVal;
				options.setAttributeNode(optval);
				var opttxt = document.createTextNode(optTxt);
				options.appendChild(opttxt);
				return options
			};
			createP = function (pidVal,bText){
				// Create the <p> HTML Tag
				var ptag = document.createElement("p");
				var patt = document.createAttribute("id");
				patt.value = pidVal;
				var btag = document.createElement("b");
				var btxt = document.createTextNode(bText);
				var space = document.createElement("br");
				ptag.setAttributeNode(patt);
				btag.appendChild(btxt);
				ptag.appendChild(btag);
				ptag.append(space);
				return ptag
			};
			createSelect = function (slctVal,idVal){
				// Create the Select HTML Tag
				var select = document.createElement("select");
				var nameAt = document.createAttribute("name");
				nameAt.value = slctVal;
				select.setAttributeNode(nameAt);
				var idAt = document.createAttribute("id");
				idAt.value = idVal;
				select.setAttributeNode(idAt);
				var clsAt = document.createAttribute("class");
				clsAt.value = "selectors";
				select.setAttributeNode(clsAt);
				return select
			};

			createCascade = function (ptagArray,slctArray, optArray) {
				var ptag = createP(ptagArray[0],ptagArray[1]);
				var slct = createSelect(slctArray[0], slctArray[1]);
				var i, len;
				for (i=0; i < optArray.length; i++) {
					var opt = createOpt(optArray[i][0], optArray[i][1]);
					slct.appendChild(opt);
				}
				ptag.appendChild(slct);
				return ptag
			};

			opOptions = function(txt){
				return_obj = {};
				var $formid = $('#options');
				chkSensor = document.getElementById('sensorSelect');
				chkCorrection = document.getElementById('correctionSelect');
				chkProduct = document.getElementById('productSelect');
				if (txt == "modis"){
					if (chkSensor == null) {
						var cs1tag = createCascade(
										["sensorSelect","Select MODIS Mission:"],
										["modis","modis"],
										[["aqua", "Aqua"],
										 ["terra", "Terra"],["others", "here"]]);
						$formid.append(cs1tag);
						return_obj.platform = txt;	
						$('[name="modis"]').on('click', function(){
							chkCorrection = document.getElementById('correctionSelect');
							chkProduct = document.getElementById('productSelect');
							var $sensors = $('#modis').val();
							if ($sensors == 'aqua'){
								if (chkCorrection == null) {
									console.log('chosen aqua');
									var cs2tag = createCascade(["correctionSelect", "Choose Aqua Correction Type:"],
												["correction", "correction"],
												[["rrs", "RRS"],["toa", "TOA"]]);
									$formid.append(cs2tag);
									return_obj.sensor = $sensors;
									$('[name="correction"]').on('click', function(){
										this.change = true;
										var $correction = $('#correction').val();
										return_obj.correction = $correction;
										chkProduct = document.getElementById('productSelect');
										if ($correction == 'rrs'){
											if (chkProduct == null) {
												var cs3tag = createCascade(["productSelect", "Choose a Product:"],
													["product", "product"],
													[["chla", "CHL_A"],["sd", "Secchi Depth"]]);
												$formid.append(cs3tag);
											}else {
												chkProduct.remove();
											}
										} else if ($correction == 'toa') {
											if (chkProduct == null){
												var cs3tag = createCascade(["productSelect", "Choose a Product:"],
													["product", "product"],
													[["chla", "CHL_A"],["sd", "Secchi Depth"]]);
												$formid.append(cs3tag);
											} else {
												chkProduct.remove();
											}
										} else {
											alert('choose a product');
										}
										$('[name="product"]').on('click', function(){
											return_obj.product = $('#product').val();
										});
									});
								} else {
									chkCorrection.remove();
									chkProduct.remove();
								}
							}else if ($sensors == 'terra') {
								if (chkCorrection == null) {
									console.log('chosen terra');
									var cs2tag = createCascade(["correctionSelect", "Choose Terra Correction Type:"],
												["correction", "correction"],
												[["rrs", "RRS"],["toa", "TOA"]]);
									$formid.append(cs2tag);
									return_obj.sensor = $sensors;
									$('[name="correction"]').on('click', function(){
										chkProduct = document.getElementById('productSelect');
										var $correction = $('#correction').val();
										return_obj.correction = $correction;
										if ($correction == 'rrs'){
											if (chkProduct == null) {
												var cs3tag = createCascade(["productSelect", "Choose a Product:"],
													["product", "product"],
													[["chla", "CHL_A"],["sd", "Secchi Depth"]]);
												$formid.append(cs3tag);
											} else {
												chkProduct.remove();
											}
										} else if ($correction == 'toa') {
											if (chkProduct == null) {
												var cs3tag = createCascade(["productSelect", "Choose a Product:"],
													["product", "product"],
													[["chla", "CHL_A"],["sd", "Secchi Depth"]]);
												$formid.append(cs3tag);
											} else {
												chkProduct.remove();
											}
										} else {
											alert('choose a product');
										}
										$('[name="product"]').on('click', function(){
											return_obj.product = $('#product').val();
										});
									});
								} else {
									chkCorrection.remove();
									chkProduct.remove();
								}
							} else {
								alert('Choose a Modis Sensor')
							}
						});
					} else {
						chkSensor.remove();
						chkCorrection.remove();
						chkProduct.remove();
					}
				} else if (txt == "sentinel"){
					if (chkSensor == null ){
						var cs1tag = createCascade(
										["sensorSelect","Select Sentinel Mission:"],
										["sentinel","sentinel"],
										[["1", "1"],
										 ["2", "2"],["others", "here"]]);
						$formid.append(cs1tag);
						$('[name="sentinel"]').on('click', function(){
							chkCorrection = document.getElementById('correctionSelect');
							if (chkCorrection == null) {
								var $mission = $('#sentinel').val();
								if ($mission == '1'){
									console.log('chosen sentinel 1');
									alert('Still working on sentinel 1 products');
								}else if ($mission == '2') {
									console.log('Chosen Sentinel 2');
									var cs2tag = createCascade(["correctionSelect", "Choose Sentinel 2 Correction Type:"],
												["correction", "correction"],
												[["rrs", "RRS"],["toa", "TOA"]]);
									$formid.append(cs2tag);
									return_obj.sensor = 'sentinel2';
									$('[name="correction"]').on('click', function(){
										chkProduct = document.getElementById('productSelect');
										if (chkProduct == null) {
											var $correction = $('#correction').val();
											return_obj.correction = $correction;
											if ($correction == 'rrs'){
												var cs3tag = createCascade(["productSelect", "Choose a Product:"],
													["product", "product"],
													[["chla", "CHL_A"],["sd", "Secchi Depth"]]);
												$formid.append(cs3tag);
											} else if ($correction == 'toa') {
												var cs3tag = createCascade(["productSelect", "Choose a Product:"],
													["product", "product"],
													[["chla", "CHL_A"],["sd", "Secchi Depth"]]);
												$formid.append(cs3tag);
											} else {
												alert('choose a product');
											}
											$('[name="product"]').on('click', function(){
												return_obj.product = $('#product').val();
											});
										} else {
											chkProduct.remove();
										}
									});
							} else {
								chkCorrection.remove();
							}
						} else {
							alert("Chose a mission");
						}
						}); 
					} else {
						chkSensor.remove();
					}
				} else if (txt == "landsat"){
					if (chkSensor == null) {
						var cs1tag = createCascade(
										["sensorSelect","Select Landsat Mission:"],
										["landsat","landsat"],
										[["8", "8"],
										 ["7", "7"],["others", "here"]]);
						$formid.append(cs1tag);
						$('[name="landsat"]').on('click', function(){
							chkCorrection = document.getElementById('correctionSelect');
							if (chkCorrection == null){
								var $mission = $('#landsat').val();
								if ($mission == '7'){
									console.log('chosen landsat 7');
									alert('Still working on LandSAT 7 products');
								}else if ($mission == '8') {
									console.log('chosen LandSAT 8');
									var cs2tag = createCascade(["correctionSelect", "Choose LandSAT 8 Correction Type:"],
												["correction", "correction"],
												[["rrs", "RRS"],["toa", "TOA"]]);
									$formid.append(cs2tag);
									return_obj.sensor = 'landsat8';
									$('[name="correction"]').on('click', function(){
										chkProduct = document.getElementById('productSelect');
										if (chkProduct == null) {
											var $correction = $('#correction').val();
											return_obj.correction = $correction;
											if ($correction == 'rrs'){
												var cs3tag = createCascade(["productSelect", "Choose a Product:"],
													["product", "product"],
													[["chla", "CHL_A"],["sd", "Secchi Depth"]]);
												$formid.append(cs3tag);
											} else if ($correction == 'toa') {
												var cs3tag = createCascade(["productSelect", "Choose a Product:"],
													["product", "product"],
													[["chla", "CHL_A"],["sd", "Secchi Depth"]]);
												$formid.append(cs3tag);
											} else {
												alert('choose a product');
											}
											$('[name="product"]').on('click', function(){
												return_obj.product = $('#product').val();
											});
										} else {
											chkProduct.remove();
										}
									});
								} else {
									alert("Chose a mission");
								}
							}else{
								chkCorrection.remove();
							}
							});
					} else {
						chkSensor.remove();
					} 
				}else {
					alert("Choose a Satellite Platform");
				}
				return return_obj
			};

			return  
		};
		
		// Define Map Attributes
		init_map = function(){
			// Based on choice,t he view should change automatically
			// This segment will be reworked
			var mapOptions = {
				centre:[-0.5,35],
                zoom:10, 
                maxZoom: 16,
                maxBounds:[[-10,10],[10, 45]]
			};
			map = L.map('map').setView([-0.7,33.5], 8.4);
				L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    				attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
			var editableLayers = new L.FeatureGroup();
            map.addLayer(editableLayers);

            var drawPluginOptions = {
                draw:{
                    polygon: {
                        allowIntersection: false,
                        drawError: {
                            color: '#e1e100',
                            message: '<strong>Oh Snap!<strong> you can\'t draw that !'
                        },
                        shapeOptions: {
                            color:'#97009c'
                        }
                    },
                    polyline: false,
                    circle:false,
                    circlemarker:false,
                    rectangle: {
                        shapeOptions: {
                            color: '#97009c',
                        }
                    },
                    marker: true,
                },
                edit: {
                    featureGroup: editableLayers,
                    edit:false,
                    remove: false
                }
            };

            var drawControl = new L.Control.Draw(drawPluginOptions);
            map.addControl(drawControl);

            var editableLayers = new L.FeatureGroup();
            map.addLayer(editableLayers);
		};
		
		// 
		init_events = function(){
			map_request= function(data_dict, layer){
		        $loading.css('display',"inline-block");
		        var xhr = $.ajax({
		            type: "POST",
		            url: 'get_map/',
		            dataType: "json",
		            data: data_dict
		        });
		          xhr.done(function(data) {
		            if("success" in data) {
		            	layer.setUrl(data.url);
		            	layer.addTo(map);
		              	$loading.css('display','none');
		            }else{
		              $loading.css('display','none');
		              alert('Opps, there was a problem processing the request. Please see the following error: '+data.error);
		            }
		          });
		        return
		      };
			return null
		};

		init_all = function(){
			init_vars();
			init_map();
			init_events();
		};
    /************************************************************************
     *                        DEFINE PUBLIC INTERFACE
     *************************************************************************/
     	public_interface = {

    	};

		$(function(){
			init_all();
			$('[name="master"]').on("click", function(){
				chkSensor = document.getElementById('sensorSelect');
				chkCorrection = document.getElementById('correctionSelect');
				chkProduct = document.getElementById('productSelect');
				$("#startDate").css("visibility", "hidden");
				if (chkSensor == null){
					console.log('working')
					platform = $('#platform').val();
					console.log(platform);
					optionDict = opOptions(platform);
					$('[name="map-button"]').on("click", function(){
						optionDict.start_time = $("#time_start").val();
						optionDict.end_time = $("#time_end").val();
						console.log(optionDict);
						wq_layer = L.tileLayer('',{attribution:
		          		'<a href="https://earthengine.google.com" target="_">' +
		          		'Google Earth Engine</a>;'}).addTo(map);
		          		map_request(optionDict, wq_layer);
					});
				} else {	
				// Disable all other click events
					chkSensor.remove();
					chkCorrection.remove();
					chkProduct.remove();
				}
			});
		});
		return public_interface;
	}());