from django.shortcuts import render, reverse
from tethys_sdk.gizmos import Button
from django.contrib.auth.decorators import login_required
from .config import buttons as bt

@login_required()

def home(request):
    vic_button = Button(
        display_text='Lake Victoria',
        name='vic-button',
        href=reverse('waterq:victoria')
        )

    context = {
    'victoria_button':vic_button,
    }

    return render(request, 'waterq/home.html', context)

def victoria(request):
    sensor_selection = bt["select_sensor"]
    collection_select = bt["select_collection"]
    product_selection = bt["select_product"]
    timeseries_button = bt["timeseries_button"]
    download_button = bt["download_button"]
    time_start = bt["start_time"]
    time_end = bt["end_time"]
    map_button = bt["map_button"]


    context = {
        'sensor_selection':sensor_selection,
        'collection_selection': collection_select,
        'product_selection': product_selection,
        'timeseries_button': timeseries_button,
        'time_start': time_start,
        'time_end': time_end,
        'download_button': download_button,
        'get_map': map_button
    }

    return render(request, 'waterq/victoria.html', context)