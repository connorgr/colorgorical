"""Handler for calculating palette scores of already-made color palettes."""
import tornado.web as web
import json
import os
import time

import numpy as np

from ..model.util import convert

class ScorePaletteHandler(web.RequestHandler):
    """The request handler for making palettes with Colorgorical.

    The handler makes Colorgorical palettes given the user-defined parameters
    passed through with the request (e.g., the number of colors).

    Attributes:
        model: an initialized Colorgorical model.
        paletteSets: the industry standards used in the TVCG Colorgorical paper.
        palettes: an alternative ordering of paletteSets.
        paletteScores: precalculated palette scores of the industry standards.
        orderedPaletteScores: sorted paletteScores.
        orderedAveragePaletteScores: averaged orderedPaletteScores.
    """
    def initialize(self, model):
        self.model = model
        thisFilePath = os.path.dirname(os.path.realpath(__file__))
        self.paletteSets = json.load(open(thisFilePath+'/../data/palette-sets.json'))
        self.palettes = {}
        threePalettes = dict(ColorBrewer={}, Microsoft={}, Tableau={})
        fivePalettes = dict(ColorBrewer={}, Microsoft={}, Tableau={})
        eightPalettes = dict(ColorBrewer={}, Microsoft={}, Tableau={})

        threePalettes["ColorBrewer"]["Pastel1"]=self.paletteSets["ColorBrewer"]["CbPastel1_3"]
        threePalettes["ColorBrewer"]["Dark2"]=self.paletteSets["ColorBrewer"]["CbDark2_3"]
        threePalettes["ColorBrewer"]["Set1"]=self.paletteSets["ColorBrewer"]["CbSet1_3"]
        threePalettes["ColorBrewer"]["Set2"]=self.paletteSets["ColorBrewer"]["CbSet2_3"]
        threePalettes["Microsoft"]["Microsoft-1"]=self.paletteSets["Microsoft"]["Microsoft-1"][:3]
        threePalettes["Microsoft"]["Microsoft-2"]=self.paletteSets["Microsoft"]["Microsoft-2"][:3]
        threePalettes["Microsoft"]["Microsoft-3"]=self.paletteSets["Microsoft"]["Microsoft-3"][:3]
        threePalettes["Microsoft"]["Microsoft-4"]=self.paletteSets["Microsoft"]["Microsoft-4"][:3]
        threePalettes["Tableau"]["Tableau 10"]=self.paletteSets["Tableau"]["Tableau 10"][:3]
        threePalettes["Tableau"]["Blue Red"]=self.paletteSets["Tableau"]["Blue Red 6"][:3]
        threePalettes["Tableau"]["Green Orange"]=self.paletteSets["Tableau"]["Green Orange 6"][:3]
        threePalettes["Tableau"]["Purple Gray"]=self.paletteSets["Tableau"]["Purple Gray 6"][:3]

        fivePalettes["ColorBrewer"]["Pastel1"]=self.paletteSets["ColorBrewer"]["CbPastel1_5"]
        fivePalettes["ColorBrewer"]["Dark2"]=self.paletteSets["ColorBrewer"]["CbDark2_5"]
        fivePalettes["ColorBrewer"]["Set1"]=self.paletteSets["ColorBrewer"]["CbSet1_5"]
        fivePalettes["ColorBrewer"]["Set2"]=self.paletteSets["ColorBrewer"]["CbSet2_5"]
        fivePalettes["Microsoft"]["Microsoft-1"]=self.paletteSets["Microsoft"]["Microsoft-1"][:5]
        fivePalettes["Microsoft"]["Microsoft-2"]=self.paletteSets["Microsoft"]["Microsoft-2"][:5]
        fivePalettes["Microsoft"]["Microsoft-3"]=self.paletteSets["Microsoft"]["Microsoft-3"][:5]
        fivePalettes["Microsoft"]["Microsoft-4"]=self.paletteSets["Microsoft"]["Microsoft-4"][:5]
        fivePalettes["Tableau"]["Tableau 10"]=self.paletteSets["Tableau"]["Tableau 10"][:5]
        fivePalettes["Tableau"]["Blue Red"]=self.paletteSets["Tableau"]["Blue Red 6"][:5]
        fivePalettes["Tableau"]["Green Orange"]=self.paletteSets["Tableau"]["Green Orange 6"][:5]
        fivePalettes["Tableau"]["Purple Gray"]=self.paletteSets["Tableau"]["Purple Gray 6"][:5]

        eightPalettes["ColorBrewer"]["Pastel1"]=self.paletteSets["ColorBrewer"]["CbPastel1_8"]
        eightPalettes["ColorBrewer"]["Dark2"]=self.paletteSets["ColorBrewer"]["CbDark2_8"]
        eightPalettes["ColorBrewer"]["Set1"]=self.paletteSets["ColorBrewer"]["CbSet1_8"]
        eightPalettes["ColorBrewer"]["Set2"]=self.paletteSets["ColorBrewer"]["CbSet2_8"]
        eightPalettes["Microsoft"]["Microsoft-1"]=self.paletteSets["Microsoft"]["Microsoft-1"][:8]
        eightPalettes["Microsoft"]["Microsoft-2"]=self.paletteSets["Microsoft"]["Microsoft-2"][:8]
        eightPalettes["Microsoft"]["Microsoft-3"]=self.paletteSets["Microsoft"]["Microsoft-3"][:8]
        eightPalettes["Microsoft"]["Microsoft-4"]=self.paletteSets["Microsoft"]["Microsoft-4"][:8]
        eightPalettes["Tableau"]["Tableau 10"]=self.paletteSets["Tableau"]["Tableau 10"][:8]
        eightPalettes["Tableau"]["Blue Red"]=self.paletteSets["Tableau"]["Blue Red 12"][:8]
        eightPalettes["Tableau"]["Green Orange"]=self.paletteSets["Tableau"]["Green Orange 12"][:8]
        eightPalettes["Tableau"]["Purple Gray"]=self.paletteSets["Tableau"]["Purple Gray 12"][:8]
        self.palettes["3"] = threePalettes
        self.palettes["5"] = fivePalettes
        self.palettes["8"] = eightPalettes

        self.paletteScores = { "3": { "ColorBrewer":{}, "Microsoft":{}, "Tableau":{} }, "5": { "ColorBrewer":{}, "Microsoft":{}, "Tableau":{} }, "8": { "ColorBrewer":{}, "Microsoft":{}, "Tableau":{} }}
        self.orderedPaletteScores = { "3": { "de": [], "nd": [], "pp": [], "nu": [] }, "5": { "de": [], "nd": [], "pp": [], "nu": [] }, "8": { "de": [], "nd": [], "pp": [], "nu": [] }}
        self.orderedAveragePaletteScores = { "3": { "de": [], "nd": [], "pp": [], "nu": [] }, "5": { "de": [], "nd": [], "pp": [], "nu": [] }, "8": { "de": [], "nd": [], "pp": [], "nu": [] }}
        for size, sizeGroups in self.palettes.iteritems():
            for company, companyPalettes in sizeGroups.iteritems():
                for paletteName, palette in companyPalettes.iteritems():
                    palette = [[int(i) for i in c.replace('rgb(','').replace(')','').split(',')] for c in palette]
                    labs = [[int(5 * round(float(i)/5)) for i in convert.convertRGBToLab(c)] for c in palette]
                    kwargs = {"seedPalette": labs, "paletteSize": len(labs)}
                    scores = self.model.scorePalette(labs)["minScores"]

                    def lowerSigFig(score,s):
                        if score == "de" or score == "pp":
                            s = round(s)
                        else:
                            s = round(s*100)/100.0
                        return s

                    self.paletteScores[size][company][paletteName] = {}
                    self.paletteScores[size][company][paletteName]["de"] = scores["de"]
                    self.paletteScores[size][company][paletteName]["nd"] = scores["nd"]
                    self.paletteScores[size][company][paletteName]["pp"] = scores["pp"]
                    self.paletteScores[size][company][paletteName]["nu"] = scores["nu"]

                    self.orderedPaletteScores[size]["de"].append({"name": paletteName, "score": lowerSigFig("de",scores["de"]), "collection":company})
                    self.orderedPaletteScores[size]["nd"].append({"name": paletteName, "score": lowerSigFig("nd",scores["nd"]), "collection":company})
                    self.orderedPaletteScores[size]["pp"].append({"name": paletteName, "score": lowerSigFig("pp",scores["pp"]), "collection":company})
                    self.orderedPaletteScores[size]["nu"].append({"name": paletteName, "score": lowerSigFig("nu",scores["nu"]), "collection":company})

        for size, sizeGroups in self.orderedPaletteScores.iteritems():
            for score, palettes in sizeGroups.iteritems():
                palettes.sort(key=lambda x: float(x["score"]), reverse=True)
                self.orderedPaletteScores[size][score] = palettes

                collections = ["ColorBrewer", "Microsoft", "Tableau"]
                def groupByCollection(c):
                    scores = [p["score"] for p in palettes if p["collection"] == c]
                    s = np.mean(scores)
                    sd = np.std(scores)
                    s = round(s*100)/100.0
                    se = sd/np.sqrt(len(scores))
                    return {"score": s, "collection": c, "size": size, "sd": sd, "se": se}

                avgpalettes = [groupByCollection(c) for c in collections]
                avgpalettes.sort(key=lambda x: float(x["score"]), reverse=True)
                self.orderedAveragePaletteScores[size][score] = avgpalettes

    def post(self):
        if len(self.request.body) == 0:
            body = dict()
        else:
            body = json.loads(self.request.body)
        print body.keys()

        if 'getComparison' not in body:
            originalPalette = body["palette"]
            palette = seeds = [ [int(5 * round(float(i)/5)) for i in c] for c in body["palette"]]

            scores=self.model.scorePalette(palette)

            deMtx = np.ones((len(palette), len(palette)))*-200
            ndMtx = np.ones((len(palette), len(palette)))*-200
            ppMtx = np.ones((len(palette), len(palette)))*-200
            for idxs, sRow in zip(scores["pairIndexes"], scores["scores"]):
                deMtx[idxs[1], idxs[0]] = sRow[0]
                ndMtx[idxs[1], idxs[0]] = sRow[1]
                ppMtx[idxs[1], idxs[0]] = sRow[2]
            deMtx = deMtx.tolist()
            ndMtx = ndMtx.tolist()
            ppMtx = ppMtx.tolist()

            deMtx = [['-' if d == -200 else int(round(d)) for d in row] for row in deMtx]
            ndMtx = [['-' if d == -200 else round(d,2) for d in row] for row in ndMtx]
            ppMtx = [['-' if d == -200 else int(round(d)) for d in row] for row in ppMtx]
            nuScores = [round(nu,2) for nu in scores["nuScores"]]

            if "name" in body:
                name = body["name"]
            else:
                name = "???"

            returnObj = dict(
                originalPalette=originalPalette,
                convertedPalette=palette,
                minScores=scores["minScores"],
                deMtx=deMtx,
                name=name,
                ndMtx=ndMtx,
                ppMtx=ppMtx,
                nuScores=nuScores,
                uniqId=str(int(round(time.time() * 1000)))
            )

            html = self.render_string("snippet/scoreResult.html", **returnObj)
            returnObj["html"] = html
            self.write(json.dumps(returnObj))
        else: # need to return a comparison display of all experiment palettes
            returnObj = {}
            returnObj["palettes"] = self.palettes
            returnObj["paletteScores"] = self.paletteScores
            returnObj["orderedPaletteScores"] = self.orderedPaletteScores
            returnObj["orderedAveragePaletteScores"] = self.orderedAveragePaletteScores
            print returnObj.keys()
            print self.palettes
            html = self.render_string("snippet/scoreSummary.html", **returnObj)
            returnObj["html"] = html
            self.write(json.dumps(returnObj))
