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