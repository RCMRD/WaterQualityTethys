var gmap, gmap2, gdata, gconvertData, gdrawnLayer, gCreatedPoly, gtoggleCompareMap, gbounds, gloadFile, gfileData;
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
        map_request,
        loadMap;
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
            products: "<option value='lst'>Land Surface Temperature</option><option value='chlor'>CHL_A</option><option value='sd'>Secchi Depth</option><option value='rrs'>RRS</option><option value='tsi'>tsi</option><option value='tsir'>tsiR</option><option value='ndvi'>NDVI</option>"
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
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
            updateWhenIdle: false,
            updateWhenZooming: false,
            updateInterval: 500
        }).addTo(map);

        map2 = L.map('map2').setView([-0.7, 33.5], 8.4);
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
            updateWhenIdle: false,
            updateWhenZooming: false,
            updateInterval: 500
        }).addTo(map2);

        map.sync(map2);
        gmap = map;
        gmap2 = map2;
        var editableLayers = new L.FeatureGroup();
        map.addLayer(editableLayers);

        var drawPluginOptions = {
            draw: {
                polygon: {
                    shapeOptions: {
                        color: 'rgb(6, 126, 245)'
                    }
                },
                polyline: false,
                circle: false,
                circlemarker: false,
                rectangle: {
                    shapeOptions: {
                        color: 'rgb(6, 126, 245)'
                    }
                },
                marker: true /* {
                    icon: L.icon({
                            iconUrl: 'leaf-green.png',
                            shadowUrl: 'leaf-shadow.png',

                            iconSize: [38, 95], // size of the icon
                            shadowSize: [50, 64], // size of the shadow
                            iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
                            shadowAnchor: [4, 62],  // the same for the shadow
                            popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
                        })
                    
                } */
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
            if ($("#ismobile").is(":visible")) {
                $(".toggle-nav")[0].click();
            }
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
            var mapInfo = isCached(data_dict);
            if (mapInfo) {
                loadMap(JSON.parse(mapInfo), layer, map);
            } else {
                var xhr = $.ajax({
                    type: "POST",
                    url: 'get_imageCollection/',
                    dataType: "json",
                    data: data_dict,
                    cache: data_dict
                });
                xhr.done(function (data) {
                    if ("success" in data) {
                        if (typeof (Storage) !== "undefined") {
                            data.lastGatewayUpdate = new Date();
                            localStorage.setItem(JSON.stringify(this.cache), JSON.stringify(data));
                        }
                        loadMap(data, layer, map);
                    } else {
                        $loading.css('display', 'none');
                        alert('Opps, there was a problem processing the request. Please see the following error: ' + data.error);
                    }
                });
            }
            return;
            
        };

        loadMap = function (data, layer, map) {
            layer.setUrl(data.url);
            layer.addTo(map);
            $loading.css('display', 'none');
        }

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
                        gdata = sortData(convertData(data.timeseries));
                        console.log(convertData(data.timeseries));
                        /*
                        Highcharts is erroring saying it expects data to be sorted, check to see if it is or not
                        */
                       // sortData(
                        plotData(gdata);
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
    function Comparator(a, b) {
        if (a[0] < b[0]) return -1;
        if (a[0] > b[0]) return 1;
        return 0;
    }
    function sortData(data) {
        return data.sort(Comparator);
    }

    function convertData(data) {
        return data.map(function (d) {
            return [d[0], d[1][Object.keys(d[1])[0]]];
        });
    }
    gconvertData = convertData;

    function plotData(data) {
        chart = Highcharts.stockChart('plotter', {
            chart: {
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
            reducer: "mean",
            visparams: getVisParams(),
            start_time: $("#time_start").val(),
            end_time: $("#time_end").val()
        }, workingLayer, which);
    }

    function isCached(data_dict) {
        if (typeof (Storage) !== "undefined") {
            if (localStorage.getItem(JSON.stringify(data_dict))) {
                var currentDate = new Date();
                currentDate.setDate(currentDate.getDate() - 1);
                var ls_item = JSON.parse(localStorage.getItem(JSON.stringify(data_dict)));
                if (new Date(ls_item.lastGatewayUpdate) > currentDate) {
                    return localStorage.getItem(JSON.stringify(data_dict));
                } else {
                    return false;
                }
            }
        } else {
            return false;
        }
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
                "min": "-5",
                "max": "112",
                "palette": "0022c9,194bff,5d567c,b20000,f00a0a"
            });
        } else if ($("#product").val() === "tsi" ) {
            return JSON.stringify({
                "min": "0",
                "max": "100",
                "palette": "f00a0a,b20000,5d567c,194bff,0022c9"
            });
        } else if ($("#product").val() === "tsir") {
            return JSON.stringify({
                "min": "0",
                "max": "10",
                "palette": "f00a0a,b20000,5d567c,194bff,0022c9"
            });
        } else if ($("#product").val() === "rrs") {
            return JSON.stringify({
                "min": "0",
                "max": "50"
                //, this will need to request bands
                //"palette": "FF2026,FF5F26,FF9528,FFCC29,FBFF2C,C5FF5E,75FF93,00FFC7,00FEFD,00BFFD,007CFD,3539FD,3400FC"
            });
        } else if ($("#product").val() === "ndvi") {
        return JSON.stringify({
            "min": "-1",
            "max": "1",
            "palette": "0006bf,0313ac,062099,092d86,0d3a73,104760,13544d,17613a,1a6e27,1d7b14,218802"
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
        //var user = $("#product").val() === "ndvi" ? "billyz313" : $("#product").val() === "lst" || $("#product").val() === "tsi" || $("#product").val() === "tsiR" ? "abt0020" : "kimlotte423";
        var user = "billyz313";
        if ($("#product").val() === "ndvi") {
            return "users/billyz313/tmvlakes";
        }
        //if ($("#product").val() === "lst") {
        //    return "users/billyz313/LS8_VTM_lst";
        //}
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

    var reader = new FileReader();

    function loadFile() {
        var file = document.querySelector('input[type=file]').files[0];
        reader.addEventListener("load", parseFile, false);
        if (file) {
            reader.readAsText(file);
        }
    }

    gloadFile = loadFile;

    function parseFile() {
        var doesColumnExist = false;
        console.log(reader.result);
        var data = d3.csvParse(reader.result, function (d) {
            doesColumnExist = d.hasOwnProperty("Date");
            return d;
        });
        console.log(doesColumnExist);
        gfileData = data;
        data.forEach(addMarkers);
    }

    function addMarkers(data) {


        var popuptxt = "";
        var marker = L.marker([parseFloat(data.Lat), parseFloat(data.Lon)], { title: data.CAST }).addTo(map);
        var marker2 = L.marker([parseFloat(data.Lat), parseFloat(data.Lon)], { title: data.CAST }).addTo(map2);
        Object.keys(data).forEach(function (key) {
            console.log(key);
            if (key != "Lat" && key != "Lon") {
                popuptxt += key + ": " + data[key] + "</br>";
            }
        });
        marker.bindPopup(popuptxt);
        marker2.bindPopup(popuptxt);
    }

    $(function () {
        init_all();
        //$('[name="map-button"]').on("click", function () {
        //    getWQMap();
        //});
        
        $("#splitMap").on("click", function () {
            toggleCompareMap();
        });

        $(".icon-wrapper").on("click", function () {
            // go home
            goHome();
        });

        $(".app-title-wrapper").on("click", function () {
            // go home
            goHome();
        });

        $("#app-content-wrapper").addClass("show-nav-custom");

        $(".toggle-nav").click(function () {
            if ($("#app-content-wrapper").hasClass("show-nav")) {
                $("#app-content-wrapper").addClass("show-nav-custom");
            } else {
                $("#app-content-wrapper").removeClass("show-nav-custom");
            }
            window.setTimeout(function () {
                map.invalidateSize();
                map2.invalidateSize();
            }, 500);
        });

        $('[name="master"]').change(function () {
            fillSensorOptions();
        });
        if ($("#app-content").css('padding-right') === "0px") {
            $(".toggle-nav")[0].click();
        }
        if ($("#ismobile").is(":visible")) {
            $("#app-content-wrapper").addClass("show-nav");
            map.invalidateSize();
            //attach show map to buttons 
            $("#lmapLoad").on("click", function () {
                getWQMap(map, 1);
                $(".toggle-nav")[0].click();
            });

            $("#rmapLoad").on("click", function () {
                if (document.getElementById("map").classList.contains("mapfull")) {
                    toggleCompareMap();
                }
                getWQMap(map2, 2);
                $(".toggle-nav")[0].click();
            });

            $("#graphLoad").on("click", function () {
                getWQgraph();
                if (createdPolyCoords) {
                    $(".toggle-nav")[0].click();
                }
            });

            // attach show panel to draw end event
        } else {
            $("#lmapLoad").on("click", function () {
                getWQMap(map, 1);
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
        }

        $('#time_start').on('hide', function (ev) {
            console.log("hid");
            setTimeout(function ()
            {
                console.log("added");
                $("#app-content-wrapper").addClass("show-nav");
                setTimeout(function () {
                    console.log("added");
                    $("#app-content-wrapper").addClass("show-nav");
                }, 500);
            }, 500);
        });

        $('#time_end').on('hide', function (ev) {
            console.log("hid");
            setTimeout(function () {
                console.log("added");
                $("#app-content-wrapper").addClass("show-nav");
                setTimeout(function () {
                    console.log("added");
                    $("#app-content-wrapper").addClass("show-nav");
                }, 500);
            }, 500);
        });
        // if ismobile add shownav class to app-content-wrapper
    });
    return public_interface;
}());
