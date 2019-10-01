var gmap, gmap2, gdata, gconvertData, gdrawnLayer, gCreatedPoly, gtoggleCompareMap, gbounds;
var LIBRARY_OBJECT = (function () {
    // Global Variables
    var map,
        map2,
        platform,
        map1Layer,
        map2Layer,
        modalChart,
        drawnlayer,
        createdPolyCoords,
        chart;
    
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
            options: "<option value='aqua'>Aqua</option><option value='terra'>Terra</option><option value='others'>here</option>",
            corrections: "<option value='rrs'>RRS</option><option value='toa'>TOA</option>",
            products: "<option value='chlor'>CHL_A</option><option value='sd'>Secchi Depth</option>"
        },
        {
            type: "sentinel",
            options: "<option value='1'>1</option><option value='2'>2</option><option value='others'>here</option>",
            corrections: "<option value='tbd'>TBD</option><option value='notsure'>Not Sure</option>",
            products: "<option value='tbd'>TBD</option>"
        },
        {
            type: "landsat",
            options: "<option value='7'>7</option><option value='8'>8</option><option value='others'>here</option>",
            corrections: null,
            products: "<option value='lst'>Land Surface Temperature</option><option value='chlor'>CHL_A</option><option value='sd'>Secchi Depth</option><option value='rrs'>RRS</option><option value='tsi'>tsi</option><option value='tsiR'>tsiR</option>"
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

        map2 = L.map('map2').setView([-0.7, 33.5], 8.4);
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map2);

        map.sync(map2);
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
                url: 'get_imageCollection/',
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
                $("#view-file-loading").show();
                $.getJSON("https://cdn.jsdelivr.net/gh/highcharts/highcharts@v7.0.0/samples/data/usdeur.json", function (data) {
                    plotData(data);
                });
            } else {
                if (chart) {
                    while (chart.series.length > 0) {
                        chart.series[0].remove(true);
                    }
                    chart.destroy();
                    chart = null;
                }
                $("#chart-modal").modal('show');
                $("#view-file-loading").toggleClass("hidden");
                var xhr = $.ajax({
                    type: "POST",
                    url: 'get_timeseries/',
                    dataType: "json",
                    data: data_dict
                });
                xhr.done(function (data) {
                    if ("success" in data) {
                        //$("#chart-modal").modal('show');
                        gdata = data;
                        console.log(convertData(data.timeseries));
                        plotData(convertData(data.timeseries));
                        $("#view-file-loading").toggleClass("hidden");
                    } else {
                        $("#view-file-loading").toggleClass("hidden");
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
                },
                connectNulls:true
            },
            series: [{
                type: 'area',
                name: 'The Values',
                data: data,
                connectNulls:true
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
        var workingLayer = num === 1 ? map1Layer : map2Layer;
        
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
            collection: getCollection(),
            reducer: "mosaic",
            visparams: getVisParams(),
            start_time: $("#time_start").val(),
            end_time: $("#time_end").val()
        }, workingLayer, which);
    }

    function toggleCompareMap() {
        if (document.getElementById("map").classList.contains("mapfull")) {
            //make split view
            var bounds = map.getBounds();
            gbounds = bounds;
            $("#map2").show();
            $("#map").removeClass("mapfull");
            map.invalidateSize();
            map2.invalidateSize();
            $("#rmapLoad").show();
            $("#lmapLoad").text("Left");
            $("#splitMap").text("Unsplit");
            map.fitBounds(bounds);
            map2.sync(map);
        } else {
            //make full view
            var bounds = map.getBounds();
            $("#map2").hide();
            $("#map").addClass("mapfull");
            map.invalidateSize();
            $("#rmapLoad").hide();
            $("#lmapLoad").text("Load");
            $("#splitMap").text("Split");
            map2.unsync(map);
            map.fitBounds(bounds);
        }
    }

    gtoggleCompareMap = toggleCompareMap;

    function getVisParams() {
        if ($("#product").val() === "chlor") {
            return JSON.stringify({
                "min": "0",
                "max": "500",
                "palette": "00FFFF,0000FF"
            });
        } else if ($("#product").val() === "sd") {
            return JSON.stringify({
                "min": "0",
                "max": "5",
                "palette": "00FFFF,0000FF"
            });
        } else if ($("#product").val() === "lst") {
            return JSON.stringify({
                "min": "0",
                "max": "50",
                "palette": "f00a0a,b20000,5d567c,194bff,0022c9"
            });
        } else if ($("#product").val() === "tsi" ) {
            return JSON.stringify({
                "min": "0",
                "max": "100",
                "palette": "f00a0a,b20000,5d567c,194bff,0022c9"
            });
        } else if ($("#product").val() === "tsiR") {
            return JSON.stringify({
                "min": "0",
                "max": "10",
                "palette": "f00a0a,b20000,5d567c,194bff,0022c9"
            });
        }else if ($("#product").val() === "rrs") {
            return JSON.stringify({
                "min": "0",
                "max": "50"
                //, this will need to request bands
                //"palette": "FF2026,FF5F26,FF9528,FFCC29,FBFF2C,C5FF5E,75FF93,00FFC7,00FEFD,00BFFD,007CFD,3539FD,3400FC"
            });
        }
    }

    function getCollection() {
        var platform = $("#platform").val() === "modis"
            ? "mod"
            : $("#platform").val() === "sentinel"
                ? "sen"
                : $("#platform").val() === "landsat"
                    ? "LS"
                    : "Error";
        var sensor = $("#sensor").val();
        var product = $("#product").val();
        var user = $("#product").val() === "lst" || $("#product").val() === "tsi" || $("#product").val() === "tsiR" ? "abt0020" : "kimlotte423";
        return "users/" + user + "/" + platform + sensor + "_VTM_" + product;
    }
    function getWQgraph() {
        if (createdPolyCoords) {
            var gString;
            if (createdPolyCoords.geometry.type === "Point") {
                gString = JSON.stringify(createdPolyCoords.geometry.coordinates);
            } else {
                gString = JSON.stringify(createdPolyCoords.geometry.coordinates[0]);
            }
            var platform = $("#platform").val() === "modis"
                ? "mod"
                : $("#platform").val() === "sentinel"
                    ? "sen"
                    : $("#platform").val() === "landsat"
                        ? "LS"
                        : "Error"; 
            var sensor = $("#sensor").val();
            var product = $("#product").val();
            var user = $("#product").val() === "lst" || $("#product").val() === "tsi" || $("#product").val() === "tsiR" ? "abt0020" : "kimlotte423";
            console.log(user);
            var jobj = {
                collection: getCollection(), //"users/" + user + "/" + platform + sensor + "_VTM_"+ product, //"users/kimlotte423/LS8_VTM_chlor", //"users/abt0020/LS8_VTM_lst", //"users/kimlotte423/LS8_LV_tsiR",
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
        var corrections = getSensorsByPlatform($("#platform").val())[0].corrections;
        if (corrections) {
            $("#correctionSelect").show();
            $('#correction').empty().append(getSensorsByPlatform($("#platform").val())[0].corrections);
        } else {
            $("#correctionSelect").hide();
        }
        $('#product').empty().append(getSensorsByPlatform($("#platform").val())[0].products);
    }

    function getSensorsByPlatform(which) {
        return platform.filter(function (p) {
            return p.type == which;
        });
    }

    function getCorrectionsByPlatform(which) {
        return platform.filter(function (p) {
            return p.corrections == which;
        });
    }

    function getProductsByPlatform(which) {
        return platform.filter(function (p) {
            return p.products == which;
        });
    }

    function goHome() {
        document.location = $("#apppath").val();
    }

    $(function () {
        init_all();
        $('[name="map-button"]').on("click", function () {
            getWQMap();
        });

        $("#lmapLoad").on("click", function () {
            getWQMap(map, 1);
        });

        $("#splitMap").on("click", function () {
            toggleCompareMap();
        });

        $("#rmapLoad").on("click", function () {
            if (document.getElementById("map").classList.contains("mapfull")) {
                toggleCompareMap();
            }
            getWQMap(map2, 2);            
        });

        $("#graphLoad").on("click", function () {
            getWQgraph();
        });

        $(".icon-wrapper").on("click", function () {
            // go home
            goHome();
        });

        $(".app-title-wrapper").on("click", function () {
            // go home
            goHome();
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
