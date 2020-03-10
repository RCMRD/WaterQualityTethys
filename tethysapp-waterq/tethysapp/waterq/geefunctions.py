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
        credentials = ee.ServiceAccountCredentials(geeAccount.service_account, geeAccount.privateKey)
        ee.Initialize(credentials)
    except EEException as e:
        print(str(e))
else:
    try:
         ee.Initialize()
    except EEException as e:
        from oauth2client.service_account import ServiceAccountCredentials 
        credentials = ServiceAccountCredentials.from_p12_keyfile(
        service_account_email='',
        filename='',
        private_key_password='notasecret',
        scopes=ee.oauth.SCOPE + ' https://www.googleapis.com/auth/drive ')
        ee.Initialize(credentials)

tablename = 'users/kimlotte423/LV_Basin'                        
table = ee.FeatureCollection(tablename)

#################################################################
## DEFINE GENERAL FUNCTIONS
#################################################################
SCALE = 100 # meters
# toms / omi
OZONE = ee.ImageCollection('TOMS/MERGED')
# dem data
DEM = ee.Image('JAXA/ALOS/AW3D30_V1_1').select('AVE')
# PI Image
PI = ee.Image(math.pi)
pi = PI

def extractBits(image, start, end, newName):
     # Compute the bits we need to extract.
     pattern = 0
     for i in range(start,end):
          pattern += int(math.pow(2, i))

     # Return a single band image of the extracted QA bits, giving the band
     # a new name.
     return image.select([0], [newName])\
                    .bitwiseAnd(pattern)\
                    .rightShift(start)
def l8correction(img):
    imgDate_OLI = img.date()
    FOY_OLI = ee.Date.fromYMD(imgDate_OLI.get('year'), 1, 1)
    JD_OLI = imgDate_OLI.difference(FOY_OLI, 'day').int().add(1)

    # ozone
    DU_OLI = ee.Image(OZONE.filterDate(imgDate_OLI, imgDate_OLI.advance(7,'day')).mean())

    # Earth-Sun distance
    d_OLI = ee.Image.constant(img.get('EARTH_SUN_DISTANCE'))

    # Sun elevation
    SunEl_OLI = ee.Image.constant(img.get('SUN_ELEVATION'))

    # Sun azimuth
    SunAz_OLI = ee.Image.constant(img.get('SUN_AZIMUTH'))

    # Satellite zenith
    SatZe_OLI = ee.Image(0.0)
    cosdSatZe_OLI = (SatZe_OLI).multiply(PI.divide(ee.Image(180))).cos()
    sindSatZe_OLI = (SatZe_OLI).multiply(PI.divide(ee.Image(180))).sin()

    # Satellite azimuth
    SatAz_OLI = ee.Image(0.0)

    # Sun zenith
    SunZe_OLI = ee.Image(90).subtract(SunEl_OLI)
    cosdSunZe_OLI = SunZe_OLI.multiply(PI.divide(ee.Image.constant(180))).cos()  # in degrees
    sindSunZe_OLI = SunZe_OLI.multiply(PI.divide(ee.Image(180))).sin()  # in degrees

    # Relative azimuth
    RelAz_OLI = ee.Image(SunAz_OLI)
    cosdRelAz_OLI = RelAz_OLI.multiply(PI.divide(ee.Image(180))).cos()

    # Pressure calculation
    P_OLI = ee.Image(101325).multiply(ee.Image(1).subtract(ee.Image(0.0000225577).multiply(DEM)).pow(5.25588)).multiply(
        0.01)
    Po_OLI = ee.Image(1013.25)

    # Radiometric Calibration #
    # define bands to be converted to radiance
    bands_OLI = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7']

    # radiance_mult_bands
    rad_mult_OLI = ee.Image(ee.Array([ee.Image(img.get('RADIANCE_MULT_BAND_1')),
                                      ee.Image(img.get('RADIANCE_MULT_BAND_2')),
                                      ee.Image(img.get('RADIANCE_MULT_BAND_3')),
                                      ee.Image(img.get('RADIANCE_MULT_BAND_4')),
                                      ee.Image(img.get('RADIANCE_MULT_BAND_5')),
                                      ee.Image(img.get('RADIANCE_MULT_BAND_6')),
                                      ee.Image(img.get('RADIANCE_MULT_BAND_7'))]
                                     )).toArray(1)

    # radiance add band
    rad_add_OLI = ee.Image(ee.Array([ee.Image(img.get('RADIANCE_ADD_BAND_1')),
                                     ee.Image(img.get('RADIANCE_ADD_BAND_2')),
                                     ee.Image(img.get('RADIANCE_ADD_BAND_3')),
                                     ee.Image(img.get('RADIANCE_ADD_BAND_4')),
                                     ee.Image(img.get('RADIANCE_ADD_BAND_5')),
                                     ee.Image(img.get('RADIANCE_ADD_BAND_6')),
                                     ee.Image(img.get('RADIANCE_ADD_BAND_7'))]
                                    )).toArray(1)

    # create an empty image to save new radiance bands to
    imgArr_OLI = img.select(bands_OLI).toArray().toArray(1)
    Ltoa_OLI = imgArr_OLI.multiply(rad_mult_OLI).add(rad_add_OLI)

    # esun
    ESUN_OLI = ee.Image.constant(197.24790954589844)\
        .addBands(ee.Image.constant(201.98426818847656))\
        .addBands(ee.Image.constant(186.12677001953125))\
        .addBands(ee.Image.constant(156.95257568359375))\
        .addBands(ee.Image.constant(96.04714965820312))\
        .addBands(ee.Image.constant(23.8833221450863))\
        .addBands(ee.Image.constant(8.04995873449635)).toArray().toArray(1)
    ESUN_OLI = ESUN_OLI.multiply(ee.Image(1))

    ESUNImg_OLI = ESUN_OLI.arrayProject([0]).arrayFlatten([bands_OLI])

    # Ozone Correction #
    # Ozone coefficients
    koz_OLI = ee.Image.constant(0.0039).addBands(ee.Image.constant(0.0218))\
        .addBands(ee.Image.constant(0.1078))\
        .addBands(ee.Image.constant(0.0608))\
        .addBands(ee.Image.constant(0.0019))\
        .addBands(ee.Image.constant(0))\
        .addBands(ee.Image.constant(0))\
        .toArray().toArray(1)

    # Calculate ozone optical thickness
    Toz_OLI = koz_OLI.multiply(DU_OLI).divide(ee.Image.constant(1000))

    # Calculate TOA radiance in the absense of ozone
    Lt_OLI = Ltoa_OLI.multiply(((Toz_OLI)).multiply(
        (ee.Image.constant(1).divide(cosdSunZe_OLI)).add(ee.Image.constant(1).divide(cosdSatZe_OLI))).exp())

    # Rayleigh optical thickness
    bandCenter_OLI = ee.Image(443).divide(1000).addBands(ee.Image(483).divide(1000))\
        .addBands(ee.Image(561).divide(1000))\
        .addBands(ee.Image(655).divide(1000))\
        .addBands(ee.Image(865).divide(1000))\
        .addBands(ee.Image(1609).divide(1000))\
        .addBands(ee.Number(2201).divide(1000))\
        .toArray().toArray(1)

    # create an empty image to save new Tr values to
    Tr_OLI = (P_OLI.divide(Po_OLI)).multiply(ee.Image(0.008569).multiply(bandCenter_OLI.pow(-4))).multiply((ee.Image(1).add(
        ee.Image(0.0113).multiply(bandCenter_OLI.pow(-2))).add(ee.Image(0.00013).multiply(bandCenter_OLI.pow(-4)))))

    # Fresnel Reflection #
    # Specular reflection (s- and p- polarization states)
    theta_V_OLI = ee.Image(0.0000000001)
    sin_theta_j_OLI = sindSunZe_OLI.divide(ee.Image(1.333))

    theta_j_OLI = sin_theta_j_OLI.asin().multiply(ee.Image(180).divide(PI))

    theta_SZ_OLI = SunZe_OLI

    R_theta_SZ_s_OLI = (((theta_SZ_OLI.multiply(PI.divide(ee.Image(180)))).subtract(
        theta_j_OLI.multiply(PI.divide(ee.Image(180))))).sin().pow(2)).divide((((theta_SZ_OLI.multiply(
        PI.divide(ee.Image(180)))).add(theta_j_OLI.multiply(PI.divide(ee.Image(180))))).sin().pow(2)))

    R_theta_V_s_OLI = ee.Image(0.0000000001)

    R_theta_SZ_p_OLI = (
        ((theta_SZ_OLI.multiply(PI.divide(180))).subtract(theta_j_OLI.multiply(PI.divide(180)))).tan().pow(2)).divide(
        (((theta_SZ_OLI.multiply(PI.divide(180))).add(theta_j_OLI.multiply(PI.divide(180)))).tan().pow(2)))

    R_theta_V_p_OLI = ee.Image(0.0000000001)

    R_theta_SZ_OLI = ee.Image(0.5).multiply(R_theta_SZ_s_OLI.add(R_theta_SZ_p_OLI))

    R_theta_V_OLI = ee.Image(0.5).multiply(R_theta_V_s_OLI.add(R_theta_V_p_OLI))

    # Rayleigh scattering phase function #
    # Sun-sensor geometry
    theta_neg_OLI = ((cosdSunZe_OLI.multiply(ee.Image(-1))).multiply(cosdSatZe_OLI)).subtract(
        (sindSunZe_OLI).multiply(sindSatZe_OLI).multiply(cosdRelAz_OLI))

    theta_neg_inv_OLI = theta_neg_OLI.acos().multiply(ee.Image(180).divide(PI))

    theta_pos_OLI = (cosdSunZe_OLI.multiply(cosdSatZe_OLI)).subtract(
        sindSunZe_OLI.multiply(sindSatZe_OLI).multiply(cosdRelAz_OLI))

    theta_pos_inv_OLI = theta_pos_OLI.acos().multiply(ee.Image(180).divide(PI))

    cosd_tni_OLI = theta_neg_inv_OLI.multiply(PI.divide(180)).cos()  # in degrees

    cosd_tpi_OLI = theta_pos_inv_OLI.multiply(PI.divide(180)).cos()  # in degrees

    Pr_neg_OLI = ee.Image(0.75).multiply((ee.Image(1).add(cosd_tni_OLI.pow(2))))

    Pr_pos_OLI = ee.Image(0.75).multiply((ee.Image(1).add(cosd_tpi_OLI.pow(2))))

    # Rayleigh scattering phase function
    Pr_OLI = Pr_neg_OLI.add((R_theta_SZ_OLI.add(R_theta_V_OLI)).multiply(Pr_pos_OLI))

    # Calulate Lr,
    denom_OLI = ee.Image(4).multiply(PI).multiply(cosdSatZe_OLI)
    Lr_OLI = (ESUN_OLI.multiply(Tr_OLI)).multiply(Pr_OLI.divide(denom_OLI))

    # Rayleigh corrected radiance
    Lrc_OLI = (Lt_OLI.divide(ee.Image(10))).subtract(Lr_OLI)
    LrcImg_OLI = Lrc_OLI.arrayProject([0]).arrayFlatten([bands_OLI])

    # Rayleigh corrected reflectance
    prc_OLI = Lrc_OLI.multiply(PI).multiply(d_OLI.pow(2)).divide(ESUN_OLI.multiply(cosdSunZe_OLI))
    prcImg_OLI = prc_OLI.arrayProject([0]).arrayFlatten([bands_OLI])

    # Aerosol Correction #
    # Bands in nm
    bands_nm_OLI = ee.Image(443).addBands(ee.Image(483))\
        .addBands(ee.Image(561))\
        .addBands(ee.Image(655))\
        .addBands(ee.Image(865))\
        .addBands(ee.Image(0))\
        .addBands(ee.Image(0))\
        .toArray().toArray(1)

    # Lam in SWIR bands
    Lam_6_OLI = LrcImg_OLI.select('B6')
    Lam_7_OLI = LrcImg_OLI.select('B7')

    # Calculate aerosol type
    eps_OLI = (((((Lam_7_OLI).divide(ESUNImg_OLI.select('B7'))).log()).subtract(
        ((Lam_6_OLI).divide(ESUNImg_OLI.select('B6'))).log())).divide(ee.Image(2201).subtract(ee.Image(1609))))

    # Calculate multiple scattering of aerosols for each band
    Lam_OLI = (Lam_7_OLI).multiply(((ESUN_OLI).divide(ESUNImg_OLI.select('B7')))).multiply(
        (eps_OLI.multiply(ee.Image(-1))).multiply((bands_nm_OLI.divide(ee.Image(2201)))).exp())

    # diffuse transmittance
    trans_OLI = Tr_OLI.multiply(ee.Image(-1)).divide(ee.Image(2)).multiply(ee.Image(1).divide(cosdSatZe_OLI)).exp()

    # Compute water-leaving radiance
    Lw_OLI = Lrc_OLI.subtract(Lam_OLI).divide(trans_OLI)

    # water-leaving reflectance
    pw_OLI = (Lw_OLI.multiply(PI).multiply(d_OLI.pow(2)).divide(ESUN_OLI.multiply(cosdSunZe_OLI)))
    pwImg_OLI = pw_OLI.arrayProject([0]).arrayFlatten([bands_OLI])

    # Rrs
    Rrs_coll = (pw_OLI.divide(PI).arrayProject([0]).arrayFlatten([bands_OLI]).slice(0, 5))

    # final processing for masking to get clear water pixels
    # tile geometry
    footprint = img.geometry()
    # cloud mask
    scsmask = ee.Algorithms.Landsat.simpleCloudScore(ee.Algorithms.Landsat.TOA(img)).select('cloud').lt(5)
    qamask = extractBits(img.select('BQA'),4,4,'clouds').eq(0) # from qa band
    cloudmask = scsmask.And(qamask)
    # water mask
    watermask = Rrs_coll.normalizedDifference(['B3','B5']).gt(0)

    return ee.Image(Rrs_coll).clip(footprint).updateMask(cloudmask.And(watermask)).set('system:time_start', img.get('system:time_start'))

def l8toa(img):
     footprint = img.geometry()
     mask = ee.Algorithms.Landsat.simpleCloudScore(img).select('cloud').lte(5)
     masked = img.updateMask(mask)

     return ee.Image(masked).clip(footprint)

#################################################################
## LANDSAT 8 FUNCTIONS
#################################################################
class landsat8(object):   
     def __init__(self, start_time, end_time):
          self.rrs = ee.ImageCollection('LANDSAT/LC08/C01/T1').filterDate(start_time,end_time).map(l8correction)
          self.toa = ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA').filterDate(start_time,end_time).map(l8toa)
          
          return
     
     def getMap(self, correction, product):
          if correction == 'toa':
               if product == 'Secchi Depth':
                    print('creating chlorophyll map')
               else:
                    raise ValueError('You need a product to view')
          elif correction == 'rrs':
               if product == 'sd':
                    def secchiDepth(img):
                         blueRed_coll = (img.select('B2').divide(img.select('B4'))).log()
                         lnMOSD_coll = (ee.Image(1.4856).multiply(blueRed_coll)).add(ee.Image(0.2734))  # R2 = 0.8748 with Anthony's in-situ data
                         MOSD_coll = ee.Image(10).pow(lnMOSD_coll)
                         sd_coll = (ee.Image(0.1777).multiply(MOSD_coll)).add(ee.Image(1.0813)).clip(table)
                         return sd_coll.rename('SecchiDepth').updateMask(sd_coll.lt(10)).set('system:time_start', img.get('system:time_start'))
                    map_id = self.rrs.map(secchiDepth).getMapId(vp.SD)
               
               elif product == 'tsi':
                    def trophicState(img):
                         log_BG = (img.select('B1').divide(img.select('B3'))).log10()
                         a0 = ee.Image(0.2412)
                         a1 = ee.Image(-2.0546)
                         a2 = ee.Image(1.1776)
                         a3 = ee.Image(-0.5538)
                         a4 = ee.Image(-0.4570)

                         a1a = a1.multiply(log_BG.pow(1))
                         a2a = a2.multiply(log_BG.pow(2))
                         a3a = a3.multiply(log_BG.pow(3))
                         a4a = a4.multiply(log_BG.pow(4))
                         sumtsi = a1a.add(a2a).add(a3a).add(a4a)
                         log10_chlor_a = a0.add(sumtsi)
                         chlor_a = ee.Image(10).pow(log10_chlor_a)
                         chlor_a_cal = ee.Image(4.0752).multiply(chlor_a).subtract(ee.Image(3.9617))

                         blueRed_coll = (img.select('B2').divide(img.select('B4'))).log()
                         lnMOSD_coll = (ee.Image(1.4856).multiply(blueRed_coll)).add(ee.Image(0.2734))  # R2 = 0.8748 with Anthony's in-situ data
                         MOSD_coll = ee.Image(10).pow(lnMOSD_coll)
                         sd_coll = (ee.Image(0.1777).multiply(MOSD_coll)).add(ee.Image(1.0813))

                         TSI_c = ee.Image(30.6).add(ee.Image(9.81)).multiply(chlor_a_cal.log())
                         TSI_s = ee.Image(60).subtract(ee.Image(14.41)).multiply(sd_coll.log())
                         tsi_coll = (TSI_c.add(TSI_s)).divide(ee.Image(2)).clip(table)
                         return (tsi_coll.rename('TrophicIndex').updateMask(tsi_coll.lt(80)).set('system:time_start', img.get('system:time_start')))

                    map_id = self.rrs.map(trophicState).getMapId(vp.TSI)
               elif product == 'chla':
                    def chlorA(img):
                         log_BG = (img.select('B1').divide(img.select('B3'))).log10()
                         a0 = ee.Image(0.2412)
                         a1 = ee.Image(-2.0546)
                         a2 = ee.Image(1.1776)
                         a3 = ee.Image(-0.5538)
                         a4 = ee.Image(-0.4570)

                         a1a = a1.multiply(log_BG.pow(1))
                         a2a = a2.multiply(log_BG.pow(2))
                         a3a = a3.multiply(log_BG.pow(3))
                         a4a = a4.multiply(log_BG.pow(4))
                         sumtsi = a1a.add(a2a).add(a3a).add(a4a)
                         log10_chlor_a = a0.add(sumtsi)
                         chlor_a = ee.Image(10).pow(log10_chlor_a).clip(table)
                         return (chlor_a.rename('Chlorophyll').updateMask(chlor_a.lt(30)).set('system:time_start', img.get('system:time_start')))
                    map_id = self.rrs.map(chlorA).getMapId(vp.chlor)
               else:
                    raise ValueError('You need a product to view')
          else:
               print('do stuff here')
          tile_url_template = "https://earthengine.googleapis.com/map/{mapid}/{{z}}/{{x}}/{{y}}?token={token}"

          return tile_url_template.format(**map_id)

#################################################################
## MODIS FUNCTIONS
#################################################################
class modis(object):
     def __init__(self, start_time, end_time):
          self.aqua = ee.ImageCollection('NASA/OCEANDATA/MODIS-Aqua/L3SMI').filterDate(start_time,end_time)
          self.terra = ee.ImageCollection('NASA/OCEANDATA/MODIS-Terra/L3SMI').filterDate(start_time,end_time).map(l8toa)
          
          return
     def getMap(self,sensor,correction,product):
          if sensor == "aqua":
               if correction == "rrs":
                    print("still working on this")
               elif correction == "toa":
                    if product == "chla":
                         def chlorA(img):
                              return img.select('chlor_a').clip(table).set('system:time_start', img.get('system:time_start'))
                         map_id = self.aqua.map(chlorA).getMapId(vp.chlor)
                    else:
                         raise ValueError("select an Aqua product")
          elif sensor == "terra":
               if correction == "rrs":
                    print("still working on this")
               elif correction == "toa":
                    if product == "chla":
                         def chlorA(img):
                              return img.select('chlor_a').clip(table).set('system:time_start', img.get('system:time_start'))
                         map_id = self.aqua.map(chlorA).getMapId(vp.chlor)
                    else:
                         raise ValueError("Select a Terra Product")
          else:
               raise ValueError("Select a platform")
          tile_url_template = "https://earthengine.googleapis.com/map/{mapid}/{{z}}/{{x}}/{{y}}?token={token}"
          return tile_url_template.format(**map_id)

def imageToMapId(imageName, visParams={}):
    """  """
    try:
        eeImage = ee.Image(imageName)
        mapId = eeImage.getMapId(visParams)
        values = {
            'mapid': mapId['mapid'],
            'token': mapId['token']
        }
    except EEException as e:
        print(str(e))
        print("******imageToMapId error************", sys.exc_info()[0])
    return values

def getImageCollectionAsset(collectionName, visParams={}, reducer='mosaic', dateFrom=None, dateTo=None, sld=None, band=None):
    try:
        print("Starting to retrieve collection")
        values = None
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
                values = imageToMapId(eeCollection.min().sldStyle(sld), visParams)
            else:
                values = imageToMapId(eeCollection.min(), visParams)
        elif (reducer == 'max'):
            if(sld):
                values = imageToMapId(eeCollection.max().sldStyle(sld), visParams)
            else:
                values = imageToMapId(eeCollection.max(), visParams)
        elif (reducer == 'mosaic'):
            if(sld):
                values = imageToMapId(eeCollection.min().sldStyle(sld), visParams)
            else:
                values = imageToMapId(eeCollection.mion(), visParams)
        else:
            if(sld):
                values = imageToMapId(eeCollection.mean().sldStyle(sld), visParams)
            else:
                values = imageToMapId(eeCollection.mean(), visParams)
        
    except EEException as e:
        print(str(e))
        print(str(sys.exc_info()[0]))
        raise Exception(sys.exc_info()[0])
    tile_url_template = "https://earthengine.googleapis.com/map/{mapid}/{{z}}/{{x}}/{{y}}?token={token}"
    return tile_url_template.format(**values)

def getTimeSeriesByCollectionAndIndex(collectionName, indexName, scale, coords=[], dateFrom=None, dateTo=None, reducer=None):
    """  """
    try:
        print("getTimeSeriesByCollectionAndIndex requested")
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
                indexValue = image.reduceRegion(theReducer, geometry, scale).get(indexName)
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

# #################################################################
# ## SENTINEL 2 FUNCTIONS
# #################################################################
# ## sentinel-2
# MSI = ee.ImageCollection('COPERNICUS/S2')

# ## landsat-8 surface reflactance product (for masking purposes)
# SRP = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')

# ## toms / omi
# ozone = ee.ImageCollection('TOMS/MERGED')

# def s2correction(img):
#      imDate = img.date()
#      footprint = img.geometry()
#      startMonth = 5
#      endMonth = 9
#      startYear = 2013
#      endYear = 2017
#      forMask = SRP.filterBounds(footprint).select('B6').filterMetadata('CLOUD_COVER', "less_than", 10).filter(ee.Filter.calendarRange(startMonth, endMonth, 'month')).filter(ee.Filter.calendarRange(startYear, endYear, 'year'))
#      mask = ee.Image(forMask.select('B6').median().lt(300))
#      mask = mask.updateMask(mask).clip(footprint)

#      bands = ['B1','B2','B3','B4','B5','B6','B7', 'B8', 'B8A', 'B11', 'B12']

#      ## Rescale 
#      rescale = ee.Image(img.divide(10000).multiply(mask).copyProperties(img)).select(bands)

#      ## DEM
#      DEM = ee.Image('USGS/SRTMGL1_003').clip(footprint)

#      ## Ozone
#      DU = ee.Image(ozone.filterDate('2015-01-01','2019-06-30').filterBounds(footprint).mean())

#      ## Julian Day
#      imgDate = ee.Date(img.get('system:time_start'))
#      FOY = ee.Date.fromYMD(imgDate.get('year'),1,1)
#      JD = imgDate.difference(FOY,'day').int().add(1)

#      ## Earth-Sun distance
#      myCos = ((ee.Image(0.0172).multiply(ee.Image(JD).subtract(ee.Image(2)))).cos()).pow(2)
#      cosd = myCos.multiply(pi.divide(ee.Image(180))).cos()
#      d = ee.Image(1).subtract(ee.Image(0.01673)).multiply(cosd).clip(footprint)

#      ## Sun Azimuth
#      SunAz = ee.Image.constant(img.get('MEAN_SOLAR_AZIMUTH_ANGLE')).clip(footprint)

#      ## Sun Zenith
#      SunZe = ee.Image.constant(img.get('MEAN_SOLAR_ZENITH_ANGLE')).clip(footprint)
#      cosdSunZe = SunZe.multiply(pi.divide(ee.Image(180))).cos()
#      sindSunZe = SunZe.multiply(pi.divide(ee.Image(180))).sin()

#      ## Sat Zenith
#      SatZe = ee.Image.constant(img.get('MEAN_INCIDENCE_ZENITH_ANGLE_B5')).clip(footprint)
#      cosdSatZe = (SatZe).multiply(pi.divide(ee.Image(180))).cos()
#      sindSatZe = (SatZe).multiply(pi.divide(ee.Image(180))).sin()

#      ## Sat Azimuth
#      SatAz = ee.Image.constant(img.get('MEAN_INCIDENCE_AZIMUTH_ANGLE_B5')).clip(footprint)

#      ## Relative Azimuth
#      RelAz = SatAz.subtract(SunAz)
#      cosdRelAz = RelAz.multiply(pi.divide(ee.Image(180))).cos()

#      ## Pressure
#      P = (ee.Image(101325).multiply(ee.Image(1).subtract(ee.Image(0.0000225577).multiply(DEM)).pow(5.25588)).multiply(0.01)).multiply(mask)
#      Po = ee.Image(1013.25)

#      ## ESUN
#      ESUN = ee.Image(ee.Array([ee.Image(img.get('SOLAR_IRRADIANCE_B1')),
#                   ee.Image(img.get('SOLAR_IRRADIANCE_B2')),
#                   ee.Image(img.get('SOLAR_IRRADIANCE_B3')),
#                   ee.Image(img.get('SOLAR_IRRADIANCE_B4')),
#                   ee.Image(img.get('SOLAR_IRRADIANCE_B5')),
#                   ee.Image(img.get('SOLAR_IRRADIANCE_B6')),
#                   ee.Image(img.get('SOLAR_IRRADIANCE_B7')),
#                   ee.Image(img.get('SOLAR_IRRADIANCE_B8')),
#                   ee.Image(img.get('SOLAR_IRRADIANCE_B8A')),
#                   ee.Image(img.get('SOLAR_IRRADIANCE_B11')),
#                   ee.Image(img.get('SOLAR_IRRADIANCE_B2'))]
#                   )).toArray().toArray(1)
#      ESUNImg = ESUN.arrayProject([0]).arrayFlatten([bands])

#      ## Create an empty array for the images
#      imgArr = rescale.select(bands).toArray().toArray(1)

#      ## pTOA to Ltoa
#      Ltoa = imgArr.multiply(ESUN).multiply(cosdSunZe).divide(pi.multiply(d.pow(2)))

#      ## Band Centers
#      bandCenter = ee.Image(443).divide(1000).addBands(ee.Image(490).divide(1000)) \
#                     .addBands(ee.Image(560).divide(1000)) \
#                     .addBands(ee.Image(665).divide(1000)) \
#                     .addBands(ee.Image(705).divide(1000)) \
#                     .addBands(ee.Image(740).divide(1000)) \
#                     .addBands(ee.Number(783).divide(1000)) \
#                     .addBands(ee.Number(842).divide(1000)) \
#                     .addBands(ee.Number(865).divide(1000)) \
#                     .addBands(ee.Number(1610).divide(1000)) \
#                     .addBands(ee.Number(2190).divide(1000)) \
#                     .toArray().toArray(1)
     
#      ## Ozone Coefficients
#      koz = ee.Image(0.0039).addBands(ee.Image(0.0213)) \
#               .addBands(ee.Image(0.1052)) \
#               .addBands(ee.Image(0.0505)) \
#               .addBands(ee.Image(0.0205)) \
#               .addBands(ee.Image(0.0112)) \
#               .addBands(ee.Image(0.0075)) \
#               .addBands(ee.Image(0.0021)) \
#               .addBands(ee.Image(0.0019)) \
#               .addBands(ee.Image(0)) \
#               .addBands(ee.Image(0)) \
#               .toArray().toArray(1)

#      ## Calculate Ozone Optical Thickness
#      Toz = koz.multiply(DU).divide(ee.Image(1000))

#      ## Calculate TOA Radiance in the absense of Ozone
#      Lt = Ltoa.multiply(((Toz)).multiply((ee.Image(1).divide(cosdSunZe)).add(ee.Image(1).divide(cosdSatZe))).exp())

#      ## Calculate Rayleigh Optical Thickness
#      Tr = (P.divide(Po)).multiply(ee.Image(0.008569).multiply(bandCenter.pow(-4))).multiply((ee.Image(1)\
#           .add(ee.Image(0.0113).multiply(bandCenter.pow(-2))).add(ee.Image(0.00013).multiply(bandCenter.pow(-4)))))

#      ## Specular reflection (s- and p- polarization states)
#      theta_V = ee.Image(0.0000000001)
#      sin_theta_j = sindSunZe.divide(ee.Image(1.333))

#      theta_j = sin_theta_j.asin().multiply(ee.Image(180).divide(pi))

#      theta_SZ = SunZe

#      R_theta_SZ_s = (((theta_SZ.multiply(pi.divide(ee.Image(180)))).subtract(theta_j.multiply(pi.divide(ee.Image(180))))).sin().pow(2)).divide((((theta_SZ.multiply(pi.divide(ee.Image(180)))).add(theta_j.multiply(pi.divide(ee.Image(180))))).sin().pow(2)))

#      R_theta_V_s = ee.Image(0.0000000001)

#      R_theta_SZ_p = (((theta_SZ.multiply(pi.divide(180))).subtract(theta_j.multiply(pi.divide(180)))).tan().pow(2)).divide((((theta_SZ.multiply(pi.divide(180))).add(theta_j.multiply(pi.divide(180)))).tan().pow(2)))

#      R_theta_V_p = ee.Image(0.0000000001)

#      R_theta_SZ = ee.Image(0.5).multiply(R_theta_SZ_s.add(R_theta_SZ_p))

#      R_theta_V = ee.Image(0.5).multiply(R_theta_V_s.add(R_theta_V_p))
  
#      ## Sun-sensor geometry
#      theta_neg = ((cosdSunZe.multiply(ee.Image(-1))).multiply(cosdSatZe)).subtract((sindSunZe).multiply(sindSatZe).multiply(cosdRelAz))

#      theta_neg_inv = theta_neg.acos().multiply(ee.Image(180).divide(pi))

#      theta_pos = (cosdSunZe.multiply(cosdSatZe)).subtract(sindSunZe.multiply(sindSatZe).multiply(cosdRelAz))

#      theta_pos_inv = theta_pos.acos().multiply(ee.Image(180).divide(pi))

#      cosd_tni = theta_neg_inv.multiply(pi.divide(180)).cos() ## in degrees

#      cosd_tpi = theta_pos_inv.multiply(pi.divide(180)).cos() ## in degrees

#      Pr_neg = ee.Image(0.75).multiply((ee.Image(1).add(cosd_tni.pow(2))))

#      Pr_pos = ee.Image(0.75).multiply((ee.Image(1).add(cosd_tpi.pow(2))))
  
#      ## Rayleigh scattering phase function
#      Pr = Pr_neg.add((R_theta_SZ.add(R_theta_V)).multiply(Pr_pos))

#      ## rayleigh radiance contribution
#      denom = ee.Image(4).multiply(pi).multiply(cosdSatZe)
#      Lr = (ESUN.multiply(Tr)).multiply(Pr.divide(denom))

#      ## rayleigh corrected radiance
#      Lrc = Lt.subtract(Lr)
#      LrcImg = Lrc.arrayProject([0]).arrayFlatten([bands])

#      ## Aerosol Correction ##

#      ## Bands in nm
#      bands_nm = ee.Image(443).addBands(ee.Image(490)) \
#                             .addBands(ee.Image(560)) \
#                             .addBands(ee.Image(665)) \
#                             .addBands(ee.Image(705)) \
#                             .addBands(ee.Image(740)) \
#                             .addBands(ee.Image(783)) \
#                             .addBands(ee.Image(842)) \
#                             .addBands(ee.Image(865)) \
#                             .addBands(ee.Image(0)) \
#                             .addBands(ee.Image(0)) \
#                             .toArray().toArray(1)

#      ## Lam in SWIR bands
#      Lam_10 = LrcImg.select('B11')
#      Lam_11 = LrcImg.select('B12')

#      ## Calculate aerosol type
#      eps = ((((Lam_11).divide(ESUNImg.select('B12'))).log()).subtract(((Lam_10).divide(ESUNImg.select('B11'))).log())).divide(ee.Image(2190).subtract(ee.Image(1610)))

#      ## Calculate multiple scattering of aerosols for each band
#      Lam = (Lam_11).multiply(((ESUN).divide(ESUNImg.select('B12')))).multiply((eps.multiply(ee.Image(-1))).multiply((bands_nm.divide(ee.Image(2190)))).exp())

#      ## diffuse transmittance
#      trans = Tr.multiply(ee.Image(-1)).divide(ee.Image(2)).multiply(ee.Image(1).divide(cosdSatZe)).exp()

#      ## Compute water-leaving radiance
#      Lw = Lrc.subtract(Lam).divide(trans)

#      ## water-leaving reflectance
#      pw = (Lw.multiply(pi).multiply(d.pow(2)).divide(ESUN.multiply(cosdSunZe)))
#      pwImg = pw.arrayProject([0]).arrayFlatten([bands])

#      ## remote sensing reflectance
#      Rrs = (pw.divide(pi).arrayProject([0]).arrayFlatten([bands]).slice(0,9))

#      return Rrs
# class sentinel2(object):   
#      def __init__(self, start_time, end_time):
#           self.rrs = ee.ImageCollection('COPERNICUS/S2').filterDate(start_time,end_time).map(s2correction)
#           # print(self.rrs.size().getInfo())
          
#           return
     
#      def getMap(self, correction, product):
#           if correction == 'TOA':
#                if product == 'Secchi Depth':
#                     print('creating chlorophyll map')
#                else:
#                     raise ValueError('You need a product to view')
#           elif correction == 'RRS':
#                if product == 'sd':
#                     def secchiDepth(img):
#                          blueRed_coll = (img.select('B2').divide(img.select('B4'))).log()
#                          lnMOSD_coll = (ee.Image(1.4856).multiply(blueRed_coll)).add(ee.Image(0.2734))  # R2 = 0.8748 with Anthony's in-situ data
#                          MOSD_coll = ee.Image(10).pow(lnMOSD_coll)
#                          sd_coll = (ee.Image(0.1777).multiply(MOSD_coll)).add(ee.Image(1.0813)).clip(table)
#                          return sd_coll.rename('SecchiDepth').updateMask(sd_coll.lt(10)).set('system:time_start', img.get('system:time_start'))
#                     map_id = self.rrs.map(secchiDepth).getMapId(vp.SD)
               
#                elif product == 'tsi':
#                     def trophicState(img):
#                          log_BG = (img.select('B1').divide(img.select('B3'))).log10()
#                          a0 = ee.Image(0.2412)
#                          a1 = ee.Image(-2.0546)
#                          a2 = ee.Image(1.1776)
#                          a3 = ee.Image(-0.5538)
#                          a4 = ee.Image(-0.4570)

#                          a1a = a1.multiply(log_BG.pow(1))
#                          a2a = a2.multiply(log_BG.pow(2))
#                          a3a = a3.multiply(log_BG.pow(3))
#                          a4a = a4.multiply(log_BG.pow(4))
#                          sumtsi = a1a.add(a2a).add(a3a).add(a4a)
#                          log10_chlor_a = a0.add(sumtsi)
#                          chlor_a = ee.Image(10).pow(log10_chlor_a)
#                          chlor_a_cal = ee.Image(4.0752).multiply(chlor_a).subtract(ee.Image(3.9617))

#                          blueRed_coll = (img.select('B2').divide(img.select('B4'))).log()
#                          lnMOSD_coll = (ee.Image(1.4856).multiply(blueRed_coll)).add(ee.Image(0.2734))  # R2 = 0.8748 with Anthony's in-situ data
#                          MOSD_coll = ee.Image(10).pow(lnMOSD_coll)
#                          sd_coll = (ee.Image(0.1777).multiply(MOSD_coll)).add(ee.Image(1.0813))

#                          TSI_c = ee.Image(30.6).add(ee.Image(9.81)).multiply(chlor_a_cal.log())
#                          TSI_s = ee.Image(60).subtract(ee.Image(14.41)).multiply(sd_coll.log())
#                          tsi_coll = (TSI_c.add(TSI_s)).divide(ee.Image(2)).clip(table)
#                          return (tsi_coll.rename('TrophicIndex').updateMask(tsi_coll.lt(80)).set('system:time_start', img.get('system:time_start')))

#                     map_id = self.rrs.map(trophicState).getMapId(vp.TSI)
#                elif product == 'chla':
#                     def chlorA(img):
#                          log_BG = (img.select('B1').divide(img.select('B3'))).log10()
#                          a0 = ee.Image(0.2412)
#                          a1 = ee.Image(-2.0546)
#                          a2 = ee.Image(1.1776)
#                          a3 = ee.Image(-0.5538)
#                          a4 = ee.Image(-0.4570)

#                          a1a = a1.multiply(log_BG.pow(1))
#                          a2a = a2.multiply(log_BG.pow(2))
#                          a3a = a3.multiply(log_BG.pow(3))
#                          a4a = a4.multiply(log_BG.pow(4))
#                          sumtsi = a1a.add(a2a).add(a3a).add(a4a)
#                          log10_chlor_a = a0.add(sumtsi)
#                          chlor_a = ee.Image(10).pow(log10_chlor_a).clip(table)
#                          return (chlor_a.rename('Chlorophyll').updateMask(chlor_a.lt(40)).set('system:time_start', img.get('system:time_start')))
#                     map_id = self.rrs.map(chlorA).getMapId(vp.chlor)
#                else:
#                     raise ValueError('You need a product to view')
#           else:
#                print('do stuff here')
#           tile_url_template = "https://earthengine.googleapis.com/map/{mapid}/{{z}}/{{x}}/{{y}}?token={token}"

#           return tile_url_template.format(**map_id)