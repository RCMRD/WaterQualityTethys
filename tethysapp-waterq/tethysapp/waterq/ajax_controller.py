from __future__ import absolute_import
import json
from django.http import JsonResponse
from . import geefunctions as wq

def get_map(request):
    return_obj = {}

    if request.method == "POST":
        try:
            info = request.POST
            time_start = info.get('start_time')
            time_end = info.get('end_time')
            sensor = info.get('sensor')
            correction = info.get('correction')
            product = info.get('product')

            if sensor == 'landsat8':
                lc8_object = wq.landsat8(time_start, time_end)
                img = lc8_object.getMap(correction, product)
                return_obj["url"] = img
                return_obj["success"] = "success"
            elif sensor == 'sentinel2':
                s2_object = wq.sentinel2(time_start, time_end)
                img = s2_object.getMap(correction, product)
                return_obj["url"] = img
                return_obj["success"] = "success"
            elif sensor == 'aqua' or sensor == 'terra':
                platform = info.get('platform')
                mod_object = wq.modis(time_start, time_end)
                img = mod_object.getMap(sensor,correction,product)
                print(img)
                return_obj["url"] = img
                return_obj["success"] = "success"
            else:
                raise ValueError("There is an error with the arguments")

        except Exception as e:
            return_obj["error"] = "Error Processing Request. Error: "+ str(e)

    return JsonResponse(return_obj)

#def get_timeseries(request):
#    return_obj = {}

#    if request.method == "POST":
#        try:
#            info = request.POST
#            time_start = info.get('start_time')
#            time_end = info.get('end_time')
#            sensor = info.get('sensor')
#            collection = info.get('collection')
#            product = info.get('product')

#            if sensor == 'lc8':
#                lc8rrs_object = wq.landsat8(time_start, time_end)
#                rrs_img = lc8rrs_object.getMap(collection, product)
#                return_obj["url"] = rrs_img
#                return_obj["success"] = "success"
#            else:
#                raise ValueError("There is an error")


#        except Exception as e:
#            return_obj["error"] = "Error Processing Request. Error: "+ str(e)

#    return JsonResponse(return_obj)

def get_chart(request):
    return_obj = {}

    if request.method == "POST":
        try:
            info = request.POST
            time_start = info.get('start_time')
            time_end = info.get('end_time')
            sensor = info.get('sensor')
            collection = info.get('collection')
            product = info.get('product')

            if sensor == 'lc8':
                lc8rrs_object = wq.landsat8(time_start, time_end)
                rrs_img = lc8rrs_object.getMap(collection, product)
                return_obj["url"] = rrs_img
                return_obj["success"] = "success"
            else:
                raise ValueError("There is an error")


        except Exception as e:
            return_obj["error"] = "Error Processing Request. Error: "+ str(e)

    return JsonResponse(return_obj)

def get_timeseries(request):
    return_obj = {}

    if request.method == "POST":
        try:
            info = request.POST
            collection = info.get('collection')
            indexName = info.get('indexname', None)
            scale = float(info.get('scale', 30))
            geometry = json.loads(info.get('geometry', None))
            time_start = info.get('start_time', None)
            time_end = info.get('end_time', None)
            reducer = info.get('reducer', None)

            timeseries = wq.getTimeSeriesByCollectionAndIndex(collection, indexName, scale, geometry, time_start, time_end, reducer)

            return_obj = {
                    'timeseries': timeseries,
                    'success': 'success'
                }

        except Exception as e:
            return_obj["error"] = "Error Processing Request. Error: "+ str(e)

    return JsonResponse(return_obj)

def get_imageCollection(request):
    return_obj = {}

    if request.method == "POST":
        try:
            info = request.POST
            collection = info.get('collection')
            visParams = json.loads(info.get('visparams', None))
            reducer = info.get('reducer', None)
            time_start = info.get('start_time', None)
            time_end = info.get('end_time', None)

            url = wq.getImageCollectionAsset(collection, visParams, reducer, time_start, time_end)

            return_obj = {
                    'url': url,
                    'success': 'success'
                }

        except Exception as e:
            return_obj["error"] = "Error Processing Request. Error: "+ str(e)

    return JsonResponse(return_obj)