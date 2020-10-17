from __future__ import print_function, division
import ee
import math
from ee.ee_exception import EEException
import datetime
import pandas as pd
import random
import string
import sys
from . import visParams as vp
from . import geeparams as geeAccount

if geeAccount.service_account:
    try:
        print("water quality")
        credentials = ee.ServiceAccountCredentials(geeAccount.service_account, geeAccount.privateKey)
        ee.Initialize(credentials)
    except EEException as e:
        print(str(e))
else:
    try:
         ee.Initialize()
    except EEException as e:
        print(str(e))

def imageToMapId(imageName, visParams={}):
    """  """
    try:
        eeImage = ee.Image(imageName)
        mapId = eeImage.getMapId(visParams)
    except EEException as e:
        print(str(e))
        print("******imageToMapId error************", sys.exc_info()[0])
    return mapId

def getImageCollectionAsset(collectionName, visParams={}, reducer='mosaic', dateFrom=None, dateTo=None, sld=None, band=None):
    try:
        print("Starting to retrieve collection")
        map_id = None
        eeCollection = None
        if band:
            print("using band: " + band)
            eeCollection = ee.ImageCollection(collectionName).select(band)
        else:
            print('band not selected')
            eeCollection = ee.ImageCollection(collectionName)
        if (dateFrom and dateTo):
            eeFilterDate = ee.Filter.date(dateFrom, dateTo)
            eeCollection = eeCollection.filter(eeFilterDate)
        if(reducer == 'min'):
            if(sld):
                map_id = imageToMapId(eeCollection.min().sldStyle(sld), visParams)
            else:
                map_id = imageToMapId(eeCollection.min(), visParams)
        elif (reducer == 'max'):
            if(sld):
                map_id = imageToMapId(eeCollection.max().sldStyle(sld), visParams)
            else:
                map_id = imageToMapId(eeCollection.max(), visParams)
        elif (reducer == 'mosaic'):
            if(sld):
                map_id = imageToMapId(eeCollection.min().sldStyle(sld), visParams)
            else:
                map_id = imageToMapId(eeCollection.min(), visParams)
        else:
            if(sld):
                map_id = imageToMapId(eeCollection.mean().sldStyle(sld), visParams)
            else:
                map_id = imageToMapId(eeCollection.mean(), visParams)
        
    except EEException as e:
        print(str(e))
        print(str(sys.exc_info()[0]))
        raise Exception(sys.exc_info()[0])
    #tile_url_template = "https://earthengine.googleapis.com/map/{mapid}/{{z}}/{{x}}/{{y}}?token={token}"
    return map_id['tile_fetcher'].url_format

def getTimeSeriesByCollectionAndIndex(collectionName, indexName, scale, coords=[], dateFrom=None, dateTo=None, reducer=None):
    """  """
    try:
        print("getTimeSeriesByCollectionAndIndex requested")
        print(str(coords))
        geometry = None
        indexCollection = None
        if isinstance(coords[0], list):
            print("1st")
            geometry = ee.Geometry.Polygon(coords)
        else:
            print("2nd")
            geometry = ee.Geometry.Point(coords)
        if(dateFrom != None):
            if indexName != None:
                print("index name: " + indexName)
                indexCollection = ee.ImageCollection(collectionName).filterDate(dateFrom, dateTo).select(indexName)
            else:
                indexCollection = ee.ImageCollection(collectionName).filterDate(dateFrom, dateTo)
                print("no name found")
        else:
            print("no date found")
            indexCollection = ee.ImageCollection(collectionName)
        def getIndex(image):
            """  """
            theReducer = None
            indexValue = None
            if(reducer == 'min'):
                theReducer = ee.Reducer.min()
                print("reducer was min")
            elif (reducer == 'max'):
                theReducer = ee.Reducer.max()
                print("reducer was max")
            elif (reducer == 'mosaic'):
                theReducer = ee.Reducer.mosaic()
                print("reducer was mosaic")
            else:
                print("reducer was mean")
                theReducer = ee.Reducer.mean()
            if indexName != None:
                print("indexName in getImage:b4")
                indexValue = image.reduceRegion(theReducer, geometry, scale)
                print("indexName in getImage:after")
            else:
                print("no name in getImage")
                indexValue = image.reduceRegion(theReducer, geometry, scale)
            date = image.get('system:time_start')
            indexImage = ee.Image().set('indexValue', [ee.Number(date), indexValue])
            print("returning image")
            return indexImage
        indexCollection1 = indexCollection.map(getIndex)
        indexCollection2 = indexCollection1.aggregate_array('indexValue')
        values = indexCollection2.getInfo()
        print(values)
    except Exception as e:
        print(str(e))
        raise Exception(sys.exc_info()[0])
    return values