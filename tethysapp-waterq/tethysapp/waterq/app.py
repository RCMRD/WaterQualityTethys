from tethys_sdk.base import TethysAppBase, url_map_maker


class Waterq(TethysAppBase):
    """
    Tethys app class for Water Quality Viewer for Inland Lakes in Eastern and Southern Africa.
    """

    name = 'Water Quality Viewer for Inland Lakes in Eastern and Southern Africa'
    index = 'waterq:home'
    icon = 'waterq/images/icon.png'
    package = 'waterq'
    root_url = 'waterq'
    color = '#202020'
    description = 'Place a brief description of your app here.'
    tags = 'Timeseries, Water Quality, Chlorophyll, Temperature'
    enable_feedback = False
    feedback_emails = []

    def url_maps(self):
        """
        Add controllers
        """
        UrlMap = url_map_maker(self.root_url)

        url_maps = (
            UrlMap(
                name='home',
                url='waterq',
                controller='waterq.controllers.home'
            ),
            UrlMap(
                name='maps',
                url='waterq/maps',
                controller='waterq.controllers.maps'
            ),
            UrlMap(
                name='timeseries',
                url='waterq/timeseries',
                controller='waterq.controllers.timeseries'
            ),
            UrlMap(
                name='charts',
                url='waterq/charts',
                controller='waterq.controllers.charts'
            ),
            UrlMap(
                name='get_map',
                url='waterq/maps/get_map',
                controller='waterq.ajax_controller.get_map'
            ),
            UrlMap(
                name='get_timeseries',
                url='waterq/maps/get_timeseries',
                controller='waterq.ajax_controller.get_timeseries'
            ),
            UrlMap(
                name='get_chart',
                url='waterq/charts/get_chart',
                controller='waterq.ajax_controller.get_chart'
            ),
            UrlMap(
                name='get_imageCollection',
                url='waterq/maps/get_imageCollection',
                controller='waterq.ajax_controller.get_imageCollection'
            ),
        )

        return url_maps

