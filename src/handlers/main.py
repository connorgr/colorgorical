"""The main handler for the Colorgorical web server."""
import tornado.web as web


class MainHandler(web.RequestHandler):
    """The main Tornado request handler for Colorgorical.

    Any requests routed to the main handler automatically result in serving the
    index page of Colorgorical.

    Attributes:
        topoData: map data, which will be used in the client to demo palettes.
        valueData: values for each of the counties specified in ``topoData``.
    """
    def initialize(self, topoData, valueData):
        """Initializes the main handler.

        Args:
            topoData (JSON): map data to use in the client to demo palettes.
            valueData (JSON): values to use when showing colors in the topoData.
        """
        # map data for the visualization previews
        self.topoData = topoData
        self.valueData = valueData

    def get(self):
        """Serves the index template to the client with topo and value data."""
        templateOps = dict(
            topoData=self.topoData,
            valueData=self.valueData
        )
        self.render('index.html', **templateOps)
