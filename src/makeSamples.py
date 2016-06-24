"""Output samples of various Colorgorical settings."""
import itertools as it
import json
import numpy as np
import os
from os import listdir
from os.path import isfile, join

import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib import gridspec
import matplotlib.tri as tri

from model import model
from model.util import convert

class MakeSamples():
    def __init__(self):
        self.colorgorical = model.Model()

        self.repeats = 10
        self.sizes = [3, 5, 8]
        weights = [0, 0.5, 1]

        weights = np.array(list(it.product(weights, weights, weights)))

        # Remove duplicate settings
        weights = weights[np.sum(weights, axis=1) != 0.5, :]
        def isOk(row):
            values, counts = [list(r) for r in np.unique(row, return_counts=True)]
            if values == [0.5]: # all 0.5
                return False
            if 0 in values and 0.5 in values and\
                    counts[values.index(0)] == 1 and counts[values.index(0.5)] == 2:
                return False
            else:
                return True

        self.weights = np.array([w for w in weights if isOk(w)])

        thisFilePath = os.path.dirname(os.path.realpath(__file__))
        projectDir = os.path.abspath(os.path.join(thisFilePath, os.pardir))
        outputPath = os.path.join(projectDir, 'examplePalettes')

        self.outputPath = outputPath
        self.paletteFile = os.path.join(outputPath, 'examplePalettes.json')

        self.samplePalettes = None


    def loadPalettes(self):
        try:
            with open(self.paletteFile, 'rb') as f:
                self.samplePalettes = json.load(f)
        except Exception as e:
            print "Could not open examplePalettes/examplePalettes.json"
            print e


    def make(self):
        def makeSwatch(weights):
            weights = {
                "ciede2000": weights[0], "nameDifference": weights[1],
                "nameUniqueness": 0.0, "pairPreference": weights[2]
            }
            palettes = [
                [
                    self.colorgorical.makePreferablePalette(s, 10, weights=weights).tolist()
                    for r in xrange(self.repeats)
                ]
                for s in self.sizes
            ]
            for p in palettes:
                print p, '====='
            print '\n\n'
            return {'weights': weights, 'palettes': palettes,
                    'repeats': self.repeats, 'sizes': self.sizes}

        self.samplePalettes = [makeSwatch(ws) for ws in self.weights]
        with open(self.paletteFile, 'w') as f:
            json.dump(self.samplePalettes, f)


    def savedResultsExist(self):
        return os.path.isfile(self.paletteFile)


    def savePlots(self):
        def saveWeight(weightSamples):
            ws = weightSamples["weights"]
            palettes = weightSamples["palettes"]
            repeats = weightSamples["repeats"]
            print ws, repeats, len(palettes[0])

            sortedWeights = [ str(int(10*ws[key])) for key in sorted(ws.keys())]
            shorthand = ["PD", "ND", "NU", "PP"]
            name = "__".join(['-'.join(d) for d in zip(sortedWeights, shorthand)])
            imgType = "eps"
            fname = os.path.join(self.outputPath, name+"."+imgType)

            rgbPalettes = [
                np.vstack([
                    np.array([
                        [ np.array(convert.convertLabToRGB(color))/255.0 for color in repeat ],
                        [ np.array([1,1,1]) for color in repeat ]
                    ])
                    for repeat in sizes
                ])
                for sizes in palettes
            ]

            def makeName(palette):
                return '; '.join(['[' + ','.join([str(int(i)) for i in c]) + ']' for c in palette])
            labNames = [[makeName(repeat)] for sizes in palettes for repeat in sizes]

            fig = plt.figure(figsize=(24, 10), dpi=300)

            sortedWeights = [ str(ws[key]) for key in sorted(ws.keys())]
            figName = " ".join([':'.join(d) for d in zip(shorthand, sortedWeights)])
            fig.suptitle("Slider settings:: "+figName, fontsize=30, x=0, fontweight="bold", color="#010101")

            # http://matplotlib.org/users/gridspec.html
            gs0 = gridspec.GridSpec(1, 2, width_ratios=[2,1.1])
            gs0.update(left=0)

            gs1 = gridspec.GridSpecFromSubplotSpec(1, 3, subplot_spec=gs0[0], width_ratios=[3,5,8])
            # gs1 = gridspec.GridSpec(1, 4, width_ratios=[5,3,5,8])
            # gs1.update(left=0.23, right=0.68, wspace=0)
            # gs = gridspec.GridSpec(2, 3, width_ratios=[3,5,8])

            ax1 = fig.add_subplot(gs1[0])
            ax2 = fig.add_subplot(gs1[1])
            ax3 = fig.add_subplot(gs1[2])

            gs2 = gridspec.GridSpecFromSubplotSpec(1, 1, subplot_spec=gs0[1])
            # gs2 = gridspec.GridSpec(1, 1)
            # gs2.update(left=0.7, right=1, hspace=0.05)
            ax4 = fig.add_subplot(gs2[:,:])

            allButLast = repeats*2-1
            ax1.imshow(rgbPalettes[0][:allButLast], interpolation="nearest")
            ax2.imshow(rgbPalettes[1][:allButLast], interpolation="nearest")
            ax3.imshow(rgbPalettes[2][:allButLast], interpolation="nearest")

            table = ax4.table(cellText=labNames,loc='center')
            table.auto_set_font_size(False)
            table.set_fontsize(10)

            for key, cell in table.get_celld().items():
                cell.set_linewidth(0)
                cell.set_height(0.03)
                cell._text.set_color('#333333')

            ax1.set_axis_off()
            ax2.set_axis_off()
            ax3.set_axis_off()
            ax4.axis('tight')
            ax4.set_axis_off()

            fig.savefig(fname, dpi=300, bbox_inches='tight')

        for weightSamples in self.samplePalettes:
            saveWeight(weightSamples)


    def writeTex(self):
        img = [f for f in listdir(self.outputPath) if isfile(join(self.outputPath, f)) and '.eps' in f]
        txt = []
        for i in img:
            txt.append("\\begin{figure*}")
            txt.append("  \includegraphics[width=\\textwidth]{"+i+"}")
            txt.append("\\end{figure*}")

        with open(join(self.outputPath, "img.tex"), 'w') as f:
            f.write('\n'.join(txt))
