from django.shortcuts import render, reverse
from tethys_sdk.gizmos import Button
from django.contrib.auth.decorators import login_required
from .config import buttons as bt

#@login_required()

def home(request):
    map_button = Button(
        display_text='Water Quality Maps',
        name='map-button',
        href=reverse('waterq:maps')
        )

    timeseries_button = Button(
        display_text='Water Quality Timeseries',
        name='timeseries-button',
        #href=reverse('waterq:timeseries')
        )

    charts_button = Button(
        display_text='Water Quality Charts',
        name='charts-button',
        #href=reverse('waterq:charts')
        )

    context = {
    'map_button': map_button,
    'timeseries_button':timeseries_button,
    'charts_button':charts_button,
    }

    return render(request, 'waterq/home.html', context)

def maps(request):
    timeseries_button = bt["timeseries_button"]
    download_button = bt["download_button"]
    time_start = bt["start_time"]
    time_end = bt["end_time"]
    map_button = bt["map_button"]


    context = {
        'timeseries_button': timeseries_button,
        'time_start': time_start,
        'time_end': time_end,
        'download_button': download_button,
        'map_button': map_button
    }

    return render(request, 'waterq/maps.html', context)

def timeseries(request):
    context = {

    }
    return render(request, 'waterq/timeseries.html', context)

def charts(request):
    context = {

    }
    return render(request, 'waterq/charts.html', context)