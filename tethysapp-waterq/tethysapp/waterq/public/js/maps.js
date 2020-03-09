var gmap, gmap2, gdata, gconvertData, gdrawnLayer, gCreatedPoly, gtoggleCompareMap, gbounds, gloadFile, gfileData, gdataOriginal, gCompiledData;
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
        platform = [
        //    {
        //    type: "modis",
        //    options: "<option value='aqua'>Aqua</option><option value='terra'>Terra</option><option value='others'>here</option>",
        //    corrections: "<option value='rrs'>RRS</option><option value='toa'>TOA</option>",
        //    products: "<option value='chlor'>CHL_A</option><option value='SD'>Secchi Depth</option>"
        //},
        //{
        //    type: "sentinel",
        //    options: "<option value='1'>1</option><option value='2'>2</option><option value='others'>here</option>",
        //    corrections: "<option value='tbd'>TBD</option><option value='notsure'>Not Sure</option>",
        //    products: "<option value='tbd'>TBD</option>"
        //},
        //{
        //    type: "landsat",
        //    options: "<option value='7'>7</option><option value='8'>8</option><option value='others'>here</option>",
        //    corrections: null,
        //    products: "<option value='lst'>Land Surface Temperature</option><option value='chlor'>CHL_A</option><option value='SD'>Secchi Depth</option><option value='rrs'>RRS</option><option value='TSI'>tsi</option><option value='TSI_R'>tsiR</option><option value='ndvi'>NDVI</option>"
        //}
            {
                type: "landsat",
                options: "<option value='8'>8</option>",
                corrections: null,
                products: "<option value='chlor'>CHL_A</option><option value='SD'>Secchi Depth</option><option value='TSI'>tsi</option><option value='TSI_R'>tsiR</option>"//<option value='ndvi'>NDVI</option>" <option value='lst'>Land Surface Temperature</option> <option value='rrs'>RRS</option>
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
        L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
            updateWhenIdle: false,
            updateWhenZooming: false,
            updateInterval: 500
        }).addTo(map);

        map2 = L.map('map2').setView([-0.7, 33.5], 8.4);
        L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
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
                        gdataOriginal = data;

                        var pData = [];
                        if (Object.keys(data.timeseries[0][1]).length === 1) {
                            pData.push({
                                type: 'area',
                                name: Object.keys(data.timeseries[0][1])[0],
                                data: sortData(convertData(data.timeseries)),
                                connectNulls: true
                            });
                        } else {
                            var theKeys = Object.keys(data.timeseries[0][1]);
                            var compiledData = [];
                            data.timeseries.forEach(function (d) {
                                for (var i = 0; i < theKeys.length; i++) {
                                    var tempData = [];
                                    var anObject = {}
                                    anObject[theKeys[i]] = d[1][theKeys[i]];
                                    tempData.push(d[0]);
                                    tempData.push(anObject);
                                    if (compiledData.length - 1 < i) {
                                        compiledData[i] = [];
                                    }
                                    compiledData[i].push(tempData);
                                }
                            });
                            gCompiledData = compiledData;
                            compiledData.forEach(function (d, index) {
                                pData.push({
                                    type: 'area',
                                    name: theKeys[index],
                                    data: sortData(convertData(d)),
                                    valueDecimals: 20,
                                    connectNulls: true
                                });
                            });
                        }
                        plotData(pData);
                        $("#view-file-loading").toggleClass("hidden");
                    } else {
                        $("#view-file-loading").toggleClass("hidden");
                        alert('Opps, there was a problem processing the request. Please select a smaller polygon');
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
        if (Object.keys(gdataOriginal.timeseries[0][1]).length === 1) {
            return data.map(function (d) {
                return [d[0], d[1][Object.keys(d[1])[0]]];
            });
        } else {
            return data.map(function (d) {

                return [d[0], d[1][Object.keys(d[1])[0]]];
            });
        }
    }
    gconvertData = convertData;

    function plotData(series) {
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
                pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y:.6f}</b><br/>',
                valueDecimals: 20,
                split: false,
                xDateFormat: '%Y-%m-%d'
            },
            xAxis: {
                type: 'datetime',
                dateTimeLabelFormats: { 
                    day: '%d %b %Y',
                    week: '%d %b %Y',
                    month: '%d %b %Y',
                    year: '%d %b %Y'
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
                connectNulls: true
            },
            series: series,
            credits: {
                enabled: false
            }
        });

    }

    init_all = function () {
        init_vars();
        init_map();
        init_events();
        fillSensorOptions();
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
            end_time: $("#time_end").val(),
            sld: getSld(),
            band: $("#product").val()
        }, workingLayer, which);
        loadLegend(num);
    }

    function loadLegend(which) {
        $("#m" + which + "legendTitle").text($("#product  option:selected").text());
        var sval = $("#product").val().toLowerCase() == "tsi_r" ? "tsir" : $("#product").val().toLowerCase();
        $("#m" + which + "Image").attr("src", "/static/waterq/images/" + sval + "_legend.png");
        $("#map" + which + "legend").show();
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
    function getSld() {

        if ($("#product").val() === "chlor") {
            return '<RasterSymbolizer>' +
                '<ColorMap type="ramp" extended="false" >' +
                '<ColorMapEntry color="#0000FF" quantity="0" label="0" />' +
                '<ColorMapEntry color="#00FFFF" quantity="16" label="16"/>' +
                '<ColorMapEntry color="#32CD32" quantity="32" label="32"/>' +
                '<ColorMapEntry color="#FFFF00" quantity="48" label="48" />' +
                '<ColorMapEntry color="#FFA500" quantity="64" label="64" />' +
                '<ColorMapEntry color="#8B0000" quantity="80" label="80" />' +
                '</ColorMap>' +
                '</RasterSymbolizer>';
        } else if ($("#product").val() === "SD") {
            return '<RasterSymbolizer>' +
                '<ColorMap type="intervals" extended="false" >' +
                '<ColorMapEntry color="#E92E11" quantity="0.5" label="0.5"/>' +
                '<ColorMapEntry color="#EB6016" quantity="2" label="2" />' +
                '<ColorMapEntry color="#F19420" quantity="3" label="3" />' +
                '<ColorMapEntry color="#F4CD2C" quantity="3.5" label="3.5" />' +
                '<ColorMapEntry color="#FBFF37" quantity="4" label="4" />' +
                '<ColorMapEntry color="#E6FC68" quantity="5" label="5" />' +
                '<ColorMapEntry color="#CAFC9E" quantity="6" label="6" />' +
                '<ColorMapEntry color="#A0F8C4" quantity="9" label="9" />' +
                '<ColorMapEntry color="#72FCFE" quantity="12" label="12" />' +
                '<ColorMapEntry color="#5BC0FD" quantity="14" label="14" />' +
                '<ColorMapEntry color="#4A81FC" quantity="16" label="16" />' +
                '<ColorMapEntry color="#2B47FB" quantity="18" label="18" />' +
                '<ColorMapEntry color="#0000F5" quantity="19" label="19" />' +
                '</ColorMap>' +
                '</RasterSymbolizer>';
        } else if ($("#product").val() === "lst") {
            return '<RasterSymbolizer>' +
                '<ColorMap type="ramp" extended="false" >' +
                '<ColorMapEntry color="#0000ff" quantity="0" label="0"/>' +
                '<ColorMapEntry color="#C525C5" quantity="10" label="10" />' +
                '<ColorMapEntry color="#0830DC" quantity="12" label="12" />' +
                '<ColorMapEntry color="#21FFFF" quantity="15" label="15" />' +
                '<ColorMapEntry color="#28F928" quantity="18" label="18" />' +
                '<ColorMapEntry color="#F7F720" quantity="20" label="20" />' +
                '<ColorMapEntry color="#FD2020" quantity="30" label="30" />' +
                '<ColorMapEntry color="#421919" quantity="45" label="45" />' +
                '</ColorMap>' +
                '</RasterSymbolizer>';
        } else if ($("#product").val() === "TSI") {
            return '<RasterSymbolizer>' +
                '<ColorMap type="intervals" extended="true" >' +
                '<ColorMapEntry color="#904D9D" quantity="0" label="0"/>' +
                '<ColorMapEntry color="#8251A2" quantity="10" label="10" />' +
                '<ColorMapEntry color="#3D4EA0" quantity="20" label="20" />' +
                '<ColorMapEntry color="#3D5AA9" quantity="30" label="30" />' +
                '<ColorMapEntry color="#3883C3" quantity="40" label="40" />' +
                '<ColorMapEntry color="#52C6DF" quantity="50" label="50" />' +
                '<ColorMapEntry color="#87C53E" quantity="60" label="60" />' +
                '<ColorMapEntry color="#E8E617" quantity="70" label="70" />' +
                '<ColorMapEntry color="#EDA822" quantity="80" label="80" />' +
                '<ColorMapEntry color="#DA6E26" quantity="90" label="90" />' +
                '<ColorMapEntry color="#DA3726" quantity="100" label="100" />' +
                '</ColorMap>' +
                '</RasterSymbolizer>';
        } else if ($("#product").val() === "TSI_R") {
            return '<RasterSymbolizer>' +
                '<ColorMap type="intervals" extended="true" >' +
                '<ColorMapEntry color="#904D9D" quantity="0" label="0"/>' +
                '<ColorMapEntry color="#8251A2" quantity="1" label="1" />' +
                '<ColorMapEntry color="#3D4EA0" quantity="2" label="2" />' +
                '<ColorMapEntry color="#3D5AA9" quantity="3" label="3" />' +
                '<ColorMapEntry color="#3883C3" quantity="4" label="4" />' +
                '<ColorMapEntry color="#52C6DF" quantity="5" label="5" />' +
                '<ColorMapEntry color="#87C53E" quantity="6" label="6" />' +
                '<ColorMapEntry color="#E8E617" quantity="7" label="7" />' +
                '<ColorMapEntry color="#EDA822" quantity="8" label="8" />' +
                '<ColorMapEntry color="#DA6E26" quantity="9" label="9" />' +
                '<ColorMapEntry color="#DA3726" quantity="10" label="10" />' +
                '</ColorMap>' +
                '</RasterSymbolizer>';
        } else if ($("#product").val() === "rrs") {
            return '';
        } else {
            return null;
        }
    }
    function getVisParams() {
        if ($("#product").val() === "chlor") {
            return JSON.stringify({
                //"min": "0",
                //"max": "500"
                //,
                //"palette": "00FFFF,0000FF"
            });
        } else if ($("#product").val() === "SD") {
            return JSON.stringify({
                //"min": "0",
                //"max": "19"//,
                //"palette": "E92E11,EB6016,F19420,F4CD2C,FBFF37,E6FC68,CAFC9E,A0F8C4,72FCFE,5BC0FD,4A81FC,2B47FB,0000F5"
            });
        } else if ($("#product").val() === "lst") {
            return JSON.stringify({
                "min": "-5",
                "max": "112"
                //,
                //"palette": "0022c9,194bff,5d567c,b20000,f00a0a"
            });
        } else if ($("#product").val() === "TSI") {
            return JSON.stringify({
                //"min": "0",
                //"max": "100"
                //,
                //"palette": "f00a0a,b20000,5d567c,194bff,0022c9"
            });
        } else if ($("#product").val() === "TSI_R") {
            return JSON.stringify({
                //"min": "0",
                //"max": "10"
                //,
                //"palette": "f00a0a,b20000,5d567c,194bff,0022c9"
            });
        } else if ($("#product").val() === "rrs") {
            return JSON.stringify({
                "min": ".006",
                "max": ".01",
                "bands":"B5,B4,B3"
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
        //var user = $("#product").val() === "ndvi" ? "billyz313" : $("#product").val() === "lst" || $("#product").val() === "TSI" || $("#product").val() === "TSI_R" ? "abt0020" : "kimlotte423";
        var user = "billyz313";
        if ($("#product").val() === "ndvi") {
            return "users/billyz313/tmvlakes";
        }
        //if ($("#product").val() === "lst") {
        //    return "users/billyz313/LS8_VTM_lst";
        //}
        return "projects/servir-e-sa/water_quality/ls8";
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
            var user = $("#product").val() === "lst" || $("#product").val() === "TSI" || $("#product").val() === "TSI_R" ? "abt0020" : "kimlotte423";
            
            var jobj = {
                collection: getCollection(), //"users/" + user + "/" + platform + sensor + "_VTM_"+ product, //"users/kimlotte423/LS8_VTM_chlor", //"users/abt0020/LS8_VTM_lst", //"users/kimlotte423/LS8_LV_tsiR",
                scale: calculateScale(),
                geometry: JSON.stringify(createdPolyCoords.geometry.coordinates[0]),
                start_time: $("#time_start").val(),
                end_time: $("#time_end").val(),
                indexname: $("#product").val()
            };
            
            time_series_request(jobj);
        } else {
            alert("Please draw an area of interest");
        }
    }

    function calculateScale() {
        var area = L.GeometryUtil.geodesicArea(gdrawnLayer.getLatLngs()[0]);
        if (area < 893752263) {
            return 30;
        } else if (area < 12796975540) {
            return 60;
        } else if (area < 36523747484) {
            return 100;
        } else if (area < 46442458798) {
            return 150;
        } else if (area < 96442458798) {
            return 250;
        } else {
            return 500
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
        var data = d3.csvParse(reader.result, function (d) {
            doesColumnExist = d.hasOwnProperty("Date");
            return d;
        });
        gfileData = data;
        data.forEach(addMarkers);
    }

    function addMarkers(data) {
        var popuptxt = "";
        var marker = L.marker([parseFloat(data.Lat), parseFloat(data.Lon)], { title: data.CAST }).addTo(map);
        var marker2 = L.marker([parseFloat(data.Lat), parseFloat(data.Lon)], { title: data.CAST }).addTo(map2);
        Object.keys(data).forEach(function (key) {
            if (key != "Lat" && key != "Lon") {
                popuptxt += key + ": " + data[key] + "</br>";
            }
        });
        marker.bindPopup(popuptxt);
        marker2.bindPopup(popuptxt);
    }

    $(function () {
        init_all();

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

        $("#uFile").change(function () {
            //submit the form here
            gloadFile();
        });

        $('#time_start').on('hide', function (ev) {
            setTimeout(function () {
                $("#app-content-wrapper").addClass("show-nav");
                setTimeout(function () {
                    $("#app-content-wrapper").addClass("show-nav");
                }, 500);
            }, 500);
        });

        $('#time_end').on('hide', function (ev) {
            setTimeout(function () {
                $("#app-content-wrapper").addClass("show-nav");
                setTimeout(function () {
                    $("#app-content-wrapper").addClass("show-nav");
                }, 500);
            }, 500);
        });
        // if ismobile add shownav class to app-content-wrapper
    });
    return public_interface;
}());
