# ESA_WaterQ_Tethys_App
# East and South Africa Tethys Application
# Hot to make changes to the code

# ================================================================
# GENERAL RULES
# ================================================================
GENERAL FILES
The following will be the global files for the App
created by the developer
1. README file to guide anyone developing for this app
2. visParams.py file containing visualization definitions
3. geefunctions.py containing GEE WQ processing functions
4. config.py containing "literal" definitions
5. ajax_controller.py containing ajax calls
6. library.js contains re-usable javascript library for any page
7. There is a home.html that will basically the app info
8. controller.py creates the pages as required

GENERAL SYNTAX GUIDELINES
There are five pages to be defined in the controller
1. Home Page
2. Lake Page - view maps of wq and other products
2. Time Series - a whole page for time series views
4. Charts - a whole page for charts
5. Upload page - allows user to upload csv and shapefile files only


# ================================================================
VISPARAMS FILE
# ================================================================
1. Provide visualization parameters for different wq products

# ================================================================
GEE FUNCTION FILE 
# ================================================================
1. Classes will be made based on Sensor Type and view function only
2. View Img map processing functions will take self, collectiontype,
and product arguments only and return a map tile url 
3. Time Series functions will take in a collection, collectiontype,
and product argument and return values, units, and time values 
(optional)

# ================================================================
CONFIG FILE
# ================================================================
1. Define paths to GEE resources e.g shapefiles
2. Define GEE collection names
3. Define Sensor Names
4. Define Band Names
5. Define button types
6. Define product types


# ================================================================
AJAX FILE
# ================================================================
CONSTRUCT CONVENTION FOR WQ ANALYSIS
1. Def your ajax construct. Name should be prefixed by
"get_" for fetching or "post_" for uploading
2. Def an empty return_obj var
3. Use an if construct to extract request info
4. Use the try, except construct
5. Return JsonResponse of the return_obj
6. Items to extract from the request include
	a. start date
	b. end date
	c. coordinate info
	d. User selected Info
	e. Collection type
	f. Polygon, points or location info
	g. Maps, timeseries, or upload user interfaces
