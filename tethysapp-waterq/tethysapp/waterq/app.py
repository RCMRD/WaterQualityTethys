from tethys_sdk.base import TethysAppBase, url_map_maker


class Waterq(TethysAppBase):
    """
    Tethys app class for Water Quality Viewer for Inland Lakes in Eastern and Southern Africa.
    """

    name = 'Water Quality Viewer for Inland Lakes in Eastern and Southern Africa'
    index = 'waterq:home'
    icon = 'waterq/images/icon.gif'
    package = 'waterq'
    root_url = 'waterq'
    color = '#EC56EA'
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
                name='victoria',
                url='waterq/victoria',
                controller='waterq.controllers.victoria'
            ),
            UrlMap(
                name='get_map',
                url='waterq/victoria/get_map',
                controller='waterq.ajax_controller.get_map'
            ),
        )

        return url_maps

