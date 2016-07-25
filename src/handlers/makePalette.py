"""The handler for palette making requests from the client."""
import tornado.web as web
import json
from ..model.util import convert

class MakePaletteHandler(web.RequestHandler):
    """The request handler for making palettes with Colorgorical.

    The handler makes Colorgorical palettes given the user-defined parameters
    passed through with the request (e.g., the number of colors).

    Attributes:
        model: an initialized Colorgorical model.
    """
    def initialize(self, model):
        """Initializes the main handler.

        Args:
            model (src.model.Model): an initialized Colorgorical model.
        """

        self.model = model

    def post(self):
        if len(self.request.body) == 0:
            body = dict()
        else:
            body = json.loads(self.request.body)

        print 'Making palette....'

        paletteSize = int(body["paletteSize"]) if "paletteSize" in body else 1
        hueFilters = body["hueFilters"] if "hueFilters" in body else []
        startPalette = body["startPalette"] if "startPalette" in body else []

        def clampLightness(l):
            return int(5 * round(float(l)/5))
        if "lightnessRange" in body:
            print body["lightnessRange"]
            lightnessRange = [int(d) for d in body["lightnessRange"]]
            if lightnessRange[0] < 0:
                lightnessRange[0] = 0
            if lightnessRange[1] > 100:
                lightnessRange[1] = 100
            if lightnessRange[0] == lightnessRange[1] or\
                    lightnessRange[0] > lightnessRange[1]:
                lightnessRange = [25, 85]
            else:
                lightnessRange = [clampLightness(l) for l in lightnessRange]
        else:
            lightnessRange = [25, 85]

        print lightnessRange

        if "weights" not in body:
            body["weights"] = {
                "ciede2000": 0.0, "nameDifference": 0.0,
                "nameUniqueness": 0.0, "pairPreference":1.0
            }
        weights = body["weights"]


        palette = [list([int(c) for c in color]) for color in
            self.model.makePreferablePalette(paletteSize, 10,weights=weights,
                lightnessRange=lightnessRange,
                hueFilters=hueFilters, startPalette=startPalette)
        ]
        paletteStr = [
            "lab("+",".join([str(c) for c in lab])+")"
            for lab in palette
        ]

        rgbPalette = [convert.convertLabToRGB(color) for color in palette]
        rgbPaletteStr = [
            "rgb("+",".join([str(c) for c in rgb])+")"
            for rgb in rgbPalette
        ]

        templateOps = {
            "rgbPalette": rgbPaletteStr,
            "palette": paletteStr,
            "paletteSize": paletteSize
        }
        output = {
            "html": self.render_string("results.html", **templateOps),
            "palette":palette,
            "paletteSize":paletteSize,
            "weights": weights
        }

        self.write(output)
