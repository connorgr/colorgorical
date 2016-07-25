"""Handler for serving rendered Tornado templates to the client."""
import tornado.web as web
import json
import os

class TemplateHandler(web.RequestHandler):
    """The Tornado template handler for Colorgorical.

    Attributes:
        topoData: map data, which will be used in the client to demo palettes.
        valueData: values for each of the counties specified in ``topoData``.
        paletteSets: a dictionary that contains names and RGB-color arrays for
            a number of industry-standard categorical color palettes.
    """
    def initialize(self, topoData, valueData):
        """Initializes the template handler.

        Args:
            topoData (JSON): map data to use in the client to demo palettes.
            valueData (JSON): values to use when showing colors in the topoData.
        """
        self.topoData = topoData
        self.valueData = valueData

        # Load industry-standard palette sets into memory
        thisFilePath = os.path.dirname(os.path.realpath(__file__))
        paletteSets = json.load(open(thisFilePath+'/../data/palette-sets.json'))
        self.paletteSets = paletteSets

    def get(self, pageName):
        """Serves rendered templates to the client."""
        templateOps = dict(
            paletteSets = self.paletteSets,
            topoData=self.topoData,
            valueData=self.valueData
        )

        self.render(pageName+'.html', **templateOps)
