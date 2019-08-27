from tethys_sdk.gizmos import SelectInput, Button, DatePicker
from django.shortcuts import reverse
from .app import Waterq as waterq
# =======================================================
# Controller options
# =======================================================
# selct_prod_options = {
# 	"landsat8":[('Rrs', 'rrs'), ('Secchi Depth', 'sd'),
#                 ('Trophic State Index', 'tsi'),('Chlorophyll-a', 'chla')],
# 	"modis":[('Chlorophyll-a', 'chlor_a')],
# 	}

selct_prod_options = [
                 ('Secchi Depth', 'sd'),
                 ('Trophic State Index', 'tsi'),
                 ('Chlorophyll-a', 'chla')]
selct_sens_options = [('Landsat 8', 'lc8'),
                 ('Sentinel-2', 's2')]
date_format = 'yyyy-mm-dd'
time_start_name = 'time_start'
time_end_name = 'time_end'

# =======================================================
# Buttons
# =======================================================
buttons = {
	"select_sensor": SelectInput(
			    name='sensor_selection',
			    multiple=False,
			    options=selct_sens_options,
			    initial=['Landsat 8'],
			    select2_options={'placeholder': 'select a sensor','allowClear': False}),
	"select_product":SelectInput(
        name='product_selection',
        multiple=False,
        options=selct_prod_options,
        initial=['Secchi Depth'],
        select2_options={'placeholder': 'Select a product',
                         'allowClear': False}
    ),
    "select_collection":SelectInput(
        name='collection_selection',
        multiple=False,
        options=[('RRS', 'RRS'), ('TOA', 'TOA')],
        initial=['RRS'],
        select2_options={'placeholder': 'Select a collection',
                         'allowClear': False}
    ),
    "timeseries_button":Button(
        display_text='Get Time Series',
        name='timeseries-button',
        icon='glyphicon glyphicon-signal',
        style='success',
    ),
    "map_button":Button(
        display_text='Get WQ Map',
        name='map-button',
        icon='glyphicon glyphicon-signal',
        style='info',
    ),
    "start_time":DatePicker(
        name='time_start',
        autoclose=True,
        format='yyyy-mm-dd',
        start_view='decade',
        today_button=True,
        initial='2015-08-01'
    ),
    "end_time":DatePicker(
        name='time_end',
        autoclose=True,
        format='yyyy-mm-dd',
        start_view='decade',
        today_button=True,
        initial='2015-09-01'
    ),
    "download_button": Button(
        display_text='Download Region',
        name='download-button',
        icon='glyphicon glyphicon-cloud-download',
        style='primary',
    ),
}

# =======================================================
# Shapefiles
# =======================================================
