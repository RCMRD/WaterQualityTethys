var LIBRARY_OBJECT = (function() {
		// Global Variables
		var map_id,
		chart_id,
		chart,
		map;

		// Global Functions
		var init_vars,
			init_map,
			init_events,
			init_all;
			
		// Private functions
		var map_request,
			download_request,
			timeseries_request;
		// Define IDs for the map and chart html tags
		init_vars = function(){
			$loading = $('#loader');
			return
		};
		
		// Define Map Attributes
		init_map = function(){
			// Based on choice,t he view should change automatically
			// This segment will be reworked
			var mapOptions = {
				centre:[-0.5,35],
                zoom:6, 
                maxZoom: 16,
                maxBounds:[[-10,10],[10, 45]]
			};
			var map = L.map('map_id').setView([-0.7,33.5], 8.4);
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


			wq_layer = L.tileLayer('',{
            	attribution:'<a href="https://earthengine.google.com" target="_">' 
            	+ 'Google Earth Engine</a>;'}).addTo(map);

			return 
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
		            	console.log(layer);
		            	console.log(data.url);
		              $loading.css('display','none');
		            }else{
		              $loading.css('display','none');
		              alert('Opps, there was a problem processing the request. Please see the following error: '+data.error);
		            }
		          });
		        return
		      };
			//timeseries_request();
			//download_request();
			//plot_data();
			return
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
			$('[name="map-button"]').on("click", function(){
			sensor = $("#sensor_selection").val();
			collection = $("#collection_selection").val();
        	product = $("#product_selection").val();
        	start_time = $("#time_start").val();
        	end_time = $("#time_end").val();

        	map_request({'sensor':sensor,'collection':collection,'product':product,'start_time':start_time,'end_time':end_time}, wq_layer);
			});
		});
		return
	}());