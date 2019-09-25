var gmap, gmap2, gdata, gconvertData, gdrawnLayer, gCreatedPoly;
var LIBRARY_OBJECT = (function () {
    // Global Variables
    var map,
        map2,
        platform,
        map1Layer,
        map2Layer,
        modalChart,
        drawnlayer,
        createdPolyCoords;
    
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
        modalChart = $("#chart-modal");
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
        //map.on('move', movesync);


        map2 = L.map('map2').setView([-0.7, 33.5], 8.4);
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map2);
        //map2.on('move', movesync2);
        map.sync(map2);
        map2.sync(map);
        gmap = map;
        gmap2 = map2;
        var editableLayers = new L.FeatureGroup();
        map.addLayer(editableLayers);

        var drawPluginOptions = {
            draw: {
                polygon: true,
                polyline: false,
                circle: false,
                circlemarker: false,
                rectangle: true,
                marker: true
            },
            edit: {
                featureGroup: editableLayers,
                edit: false,
                remove: true
            }
        };

        var drawControl = new L.Control.Draw(drawPluginOptions);
        map.addControl(drawControl);

        map.on(L.Draw.Event.CREATED, function (e) {
            var type = e.layerType;
            drawnlayer = e.layer;
            gdrawnLayer = drawnlayer;
            createdPolyCoords = drawnlayer.toGeoJSON();
            gCreatedPoly = createdPolyCoords;
            editableLayers.addLayer(drawnlayer);
        });

        map.on('draw:drawstart', function (e) {
            if (drawnlayer) {
                drawnlayer.removeFrom(editableLayers);
            }
        });
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

        time_series_request = function (data_dict) {
            var debug = false;
            if (debug) {
                $("#chart-modal").modal('show');
                $.getJSON("https://cdn.jsdelivr.net/gh/highcharts/highcharts@v7.0.0/samples/data/usdeur.json", function (data) {
                    plotData(data);
                });
            } else {
                $loading.css('display', "inline-block");
                var xhr = $.ajax({
                    type: "POST",
                    url: 'get_timeseries/',
                    dataType: "json",
                    data: data_dict
                });
                xhr.done(function (data) {
                    if ("success" in data) {
                        $("#chart-modal").modal('show');
                        gdata = data;
                        console.log(convertData(data.timeseries));
                        plotData(convertData(data.timeseries));
                        $loading.css('display', 'none');
                    } else {
                        $loading.css('display', 'none');
                        alert('Opps, there was a problem processing the request. Please see the following error: ' + data.error);
                    }
                });
                return;
            }
            
        }
        return null;
    };

    function convertData(data) {
        return data.map(function (d) {
            return [d[0], d[1].constant];
        });
    }
    gconvertData = convertData;

    function plotData(data) {
        chart = Highcharts.stockChart('plotter', {
            chart: {
                // type:'spline',
                zoomType: 'x'
            },
            title: {
                text: " ",
                style: {
                    fontSize: '14px'
                }
            },
            tooltip: {
                pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>',
                valueDecimals: 20,
                split: true
            },
            xAxis: {
                type: 'datetime',
                dateTimeLabelFormats: { // don't display the dummy year
                    month: '%e. %b',
                    year: '%b'
                },
                title: {
                    text: 'Date'
                }
            },
            yAxis: {
                title: {
                    text: "Chart"
                }

            },
            exporting: {
                enabled: true
            },
            plotOptions: {
                area: {
                    fillColor: {
                        linearGradient: {
                            x1: 0,
                            y1: 0,
                            x2: 0,
                            y2: 1
                        },
                        stops: [
                            [0, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')],
                            [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                        ]
                    },
                    marker: {
                        radius: 2
                    },
                    lineWidth: 2,
                    states: {
                        hover: {
                            lineWidth: 1
                        }
                    },
                    threshold: null
                }
            },
            series: [{
                type: 'area',
                name: 'The Values',
                data: data
            }],
            credits: {
                enabled: false
            }
        });

    }

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
    
    function getWQgraph() {
        if (createdPolyCoords) {
            var gString;
            if (createdPolyCoords.geometry.type === "Point") {
                gString = JSON.stringify(createdPolyCoords.geometry.coordinates);
            } else {
                gString = JSON.stringify(createdPolyCoords.geometry.coordinates[0]);
            }
            var jobj = {
                collection: "users/kimlotte423/LS8_LV_tsiR",
                scale: 250,
                geometry: JSON.stringify(createdPolyCoords.geometry.coordinates[0]),
                start_time: $("#time_start").val(),
                end_time: $("#time_end").val()
            };
            console.log(jobj);
            time_series_request(jobj);
        } else {
            alert("Please draw an area of interest");
        }
        
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

        $("#graphLoad").on("click", function () {
            getWQgraph();
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
