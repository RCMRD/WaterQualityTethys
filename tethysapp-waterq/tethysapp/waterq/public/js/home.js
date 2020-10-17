$(function () {

    $("#app-actions").append($("#servirlogo"));


    $(function () {
        fillChart();
    });


    var chart = null;
    var gdataOriginal;
    var data_dict = {
        collection: "users/billyz313/LS8_VTM_lst",
        scale: 250,
        geometry: JSON.stringify([[31.893311, -2.147324], [31.893311, 0.252685], [34.321289, 0.252685], [34.321289, -2.147324], [31.893311, -2.147324]]),
        start_time: "2019-01-01",
        end_time: "2019-09-30"
    };

    function fillChart() {
        if (chart) {
            while (chart.series.length > 0) {
                chart.series[0].remove(true);
            }
            chart.destroy();
            chart = null;
        }
        var xhr = $.ajax({
            type: "POST",
            url: 'maps/get_timeseries/',
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
            } else {
                alert('Opps, there was a problem processing the request. Please see the following error: ' + data.error);
            }
        });
    }

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

    function plotData(series) {
        chart = Highcharts.chart('plotter', {
            title: {
                text: " ",
                style: {
                    fontSize: '14px'
                }
            },
            tooltip: {
                pointFormat: '<span style="color:{series.color}">Land Surface Temp </span>: <b>{point.y:.6f} °C</b><br/>',
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
                    text: "Surface Temp"
                }
            },
            exporting: {
                enabled: false
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
});