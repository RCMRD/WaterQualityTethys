var gmap, gmap2;
var LIBRARY_OBJECT = (function () {
    // Global Variables
    var //map_id,
        //chart_id,
        //chart,
        map,
        map2,
        platform,
        map1Layer,
        map2Layer;
        //sensorObject,
        //optionDict,
        //chkSensor,
        //chkProduct,
        //chkCorrection,
        //return_obj;
    
    // Global Functions
    var init_vars,
        init_map,
        init_map2,
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
    init_vars = function () {

        $loading = $('#loader');
        $selectSensor = $('#sensorSelect');
        $selectCollc = $('#collectionSelect');
        $selectProd = $('#productSelect');
        platform = [{
            type: "modis",
            options: "<option value='aqua'>Aqua</option><option value='terra'>Terra</option><option value='others'>here</option>"
        },
        {
            type: "sentinel",
            options: "<option value='sentinel1'>1</option><option value='sentinel2'>2</option><option value='others'>here</option>"
        },
        {
            type: "landsat",
            options: "<option value='landsat7'>7</option><option value='landsat8'>8</option><option value='others'>here</option>"
        }
        ];
        return;
    };
    function movesync() {
        map2.off('move', movesync2);
        map2.setMaxBounds(map.getBounds());
    }
    function movesync2() {
        console.log("it ran this anyway");
        map.off('move', movesync);
        map.setMaxBounds(map2.getBounds());
    }
    // Define Map Attributes
    init_map = function () {
        // Based on choice,t he view should change automatically
        // This segment will be reworked
        var mapOptions = {
            centre: [-0.5, 35],
            zoom: 10,
            maxZoom: 16,
            maxBounds: [[-10, 10], [10, 45]]
        };
        map = L.map('map').setView([-0.7, 33.5], 8.4);
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        map.on('move', movesync);



        map2 = L.map('map2').setView([-0.7, 33.5], 8.4);
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map2);
        map2.on('move', movesync2);

        gmap = map;
        gmap2 = map2;
        var editableLayers = new L.FeatureGroup();
        map.addLayer(editableLayers);

        var drawPluginOptions = {
            draw: {
                polygon: {
                    allowIntersection: false,
                    drawError: {
                        color: '#e1e100',
                        message: '<strong>Oh Snap!<strong> you can\'t draw that !'
                    },
                    shapeOptions: {
                        color: '#97009c'
                    }
                },
                polyline: false,
                circle: false,
                circlemarker: false,
                rectangle: {
                    shapeOptions: {
                        color: '#97009c'
                    }
                },
                marker: true
            },
            edit: {
                featureGroup: editableLayers,
                edit: false,
                remove: false
            }
        };

        var drawControl = new L.Control.Draw(drawPluginOptions);
        map.addControl(drawControl);

        map.addLayer(new L.FeatureGroup());
    };

    init_events = function () {
        map_request = function (data_dict, layer, map) {
            $loading.css('display', "inline-block");
            var xhr = $.ajax({
                type: "POST",
                url: 'get_map/',
                dataType: "json",
                data: data_dict
            });
            xhr.done(function (data) {
                if ("success" in data) {
                    layer.setUrl(data.url);
                    layer.addTo(map);
                    $loading.css('display', 'none');
                } else {
                    $loading.css('display', 'none');
                    alert('Opps, there was a problem processing the request. Please see the following error: ' + data.error);
                }
            });
            return;
        };
        return null;
    };

    init_all = function () {
        init_vars();
        init_map();
        init_events();
    };
    /************************************************************************
     *                        DEFINE PUBLIC INTERFACE
     *************************************************************************/
    public_interface = {

    };

    function getWQMap(which, num) {
        var workingLayer;
        if (num === 1) {
            workingLayer = map1Layer;
        } else {
            workingLayer = map2Layer;
        }
        if (workingLayer) {
            wq_layer = workingLayer;
        } else {
            workingLayer = L.tileLayer('', {
                attribution:
                '<a href="https://earthengine.google.com" target="_">' +
                'Google Earth Engine</a>;'
            }).addTo(which);
        }
        if (num === 1) {
            map1Layer = workingLayer;
        } else {
            map2Layer = workingLayer;
        }
        
        map_request({
            platform: $("#platform").val(),
            sensor: $("#sensor").val(),
            correction: $("#correction").val(),
            product: $("#product").val(),
            start_time: $("#time_start").val(),
            end_time: $("#time_end").val()
        }, workingLayer, which);
    }

    function fillSensorOptions() {
        $('#sensor').empty().append(getSensorsByPlatform($("#platform").val())[0].options);
    }

    function getSensorsByPlatform(which) {
        return platform.filter(function (p) {
            return p.type == which;
        });
    }

    $(function () {
        init_all();
        $('[name="map-button"]').on("click", function () {
            getWQMap();
        });

        $("#lmapLoad").on("click", function () {
            getWQMap(map, 1);
        });
        $("#rmapLoad").on("click", function () {
            getWQMap(map2, 2);
        });

        $('[name="master"]').change(function () {
            fillSensorOptions();
        });
        if ($("#app-content").css('padding-right') === "0px") {
            $(".toggle-nav")[0].click();
        }
    });
    return public_interface;
}());
