"""The Colorgorical model class for both server and console variants."""
import os
import numpy as np
from sklearn.utils.extmath import cartesian

from itertools import combinations, chain
from scipy.misc import comb

import numpyColorgorical as npc

from util import jnd
from util import convert


# subspaceIntervals: Intervals along the each Lab axis to sample from when
#    constructing the starting color subspace to sample from.
CIE_LAB_STARTING_SUBSPACE_INTERVALS = dict(
    L=np.array([10.0,25.0,40.0,55.0,70.0,85.0,100.0]),
    a=np.array([-105.0, -90.0, -75.0, -60.0, -45.0, -30.0, -15.0, 0.0, 15.0,
            30.0, 45.0, 60.0, 75.0, 90.0]),
    b=np.array([-105.0, -90.0, -75.0, -60.0, -45.0, -30.0, -15.0, 0.0, 15.0,
            30.0, 45.0, 60.0, 75.0, 90.0])
)


class Model():
    """Colorgorical's model for creating color palettes.

    Using user-specified importance for different color discriminability and
    aesthetic preference functions, Colorgorical will iteratively sample
    categorical colors.

    Attributes:
        colorSpaces: A discretized 8,325-color CIE Lab D65 color space from Heer
            and Stone, 2012. Starting at the origin, colors are sampled every 5
            units along each axis. colorSpaces has 9 columns that correspond to
            colors in three spaces. The first three columns correspond to the
            Lab coordinates. The second three columns correspond to CIE HCL
            (i.e., LCH) equivalents. The remaining columns are RGB equivalents.
            The CSV was generated with D3 v3.4.11. The original CIE Lab space is
            defined in http://dx.doi.org/10.1145/2207676.2208547.
    """
    def __init__(self, **kwargs):
        """Colorgorical model initializer."""
        filePrefix = os.path.dirname(os.path.realpath(__file__))
        colorspacePath = os.path.join(filePrefix, '../data/allColors.csv')
        self.colorSpaces = np.loadtxt(open(colorspacePath, 'rb'), delimiter=',')

        self.nameUniquenesses = npc.score(np.hstack((self.colorSpaces[:,:3],self.colorSpaces[:,:3])))[:,3]


    def getStartingColors(self, hueFilters=[], lightnessRange=[25,85],
        onlyUseRGB=True):
        """Randomly select a starting color from a subset of CIE Lab space.

        This function returns a set of highly preferable colors within a
        subspace of the typical 8,325-color CIE Lab space that fall within the
        range of any hue filters. Rather than the normal every-5 interval, the
        subspace specifies an every-15 interval along L, a, and b axis starting
        at the origin.

        Args:
            hueFilters (np.array): an n by 2 nd.array specifying lower and upper
                hue filter bounds that fall within [0,360) degrees.
            lightnessRange (list): a two-element list that sets the lightness
                range for filtering for color space before sampling.
            onlyUseRGB (bool): whether color space should be restricted to RGB.

        Returns:
            startingColors (np.array): an n x 3 array of n highly preferable CIE
                Lab D65 starting colors.
        """
        hueFilters = np.array(hueFilters)

        lIntervals = CIE_LAB_STARTING_SUBSPACE_INTERVALS["L"]
        aIntervals = CIE_LAB_STARTING_SUBSPACE_INTERVALS["a"]
        bIntervals = CIE_LAB_STARTING_SUBSPACE_INTERVALS["b"]

        isInterval = np.zeros((self.colorSpaces.shape[0], 3))
        isInterval[:,0] = np.in1d(self.colorSpaces[:,0], lIntervals)
        isInterval[:,1] = np.in1d(self.colorSpaces[:,1], aIntervals)
        isInterval[:,2] = np.in1d(self.colorSpaces[:,2], bIntervals)
        isIntervalMask = np.all(isInterval, axis=1)

        startColors = self.colorSpaces[isIntervalMask]

        isRGB = np.logical_and(startColors[:,[6,7,8]] >= 0, startColors[:,[6,7,8]] <= 255)
        isRGB = np.all(isRGB, axis=1)

        if lightnessRange[0] <= 10:
            minLightness = 0
        else:
            minLightness = lightnessRange[0] + 0.01
        if lightnessRange[1] <= 15:
            maxLightness = 15
        else:
            maxLightness = lightnessRange[1]

        inLightness = np.logical_not(np.logical_or(startColors[:,0] <
            minLightness, startColors[:,0] > maxLightness))

        startColors = startColors[np.logical_and(isRGB, inLightness)]

        if hueFilters.size > 0:
            hueFilters = convert.convertHueRanges(hueFilters)
            okHue = [np.logical_and(startColors[:,3] >= low,
                    startColors[:,3] <= high) for low,high in hueFilters]
            okHue = np.any(np.array(okHue), axis=0)
            startColors = startColors[okHue]

        # With the remaining subspace, enumerate all unique color pairs.
        # For efficiency, unique pairs are calculated via one of the triangles
        # of the cartesian product of all remaining colors.
        labs = startColors[:,:3]
        color_col_products = [cartesian((labs[:,i],labs[:,i]))
                                for i in xrange(labs.shape[1])]
        productSize = (color_col_products[0].shape[0],2*len(color_col_products))
        color_product = np.zeros(productSize)
        for i, d in enumerate(color_col_products):
            color_product[:,i] = d[:,0]
            color_product[:,i+len(color_col_products)] = d[:,0]
        idxs = np.transpose(np.array(np.triu_indices(len(labs),1)))
        colorPairs = np.ascontiguousarray(labs[idxs,].reshape((-1, 6)))
        colorPairPreferenceScores = npc.score(colorPairs)[:,2]

        # Penalize preference scores for colors that are ``ugly''.
        labs1 = np.ascontiguousarray(colorPairs[:,:3])
        labs2 = np.ascontiguousarray(colorPairs[:,3:6])
        penalties = np.minimum(npc.scorePenalty(labs1)[:,0],
                                npc.scorePenalty(labs2)[:,0])
        colorPairPreferenceScores = colorPairPreferenceScores * penalties

        maxPref = np.max(colorPairPreferenceScores)
        stdPref = np.std(colorPairPreferenceScores)
        prefThreshold = maxPref - 0.75*stdPref

        colorPairs = colorPairs[colorPairPreferenceScores > prefThreshold,]

        # Extract the unique colors from color combination list
        # http://stackoverflow.com/questions/16970982
        def getUnique(a):
            a = colorPairs[:,:3]
            b = np.ascontiguousarray(a).view(np.dtype((np.void, a.dtype.itemsize * a.shape[1])))
            _, idx = np.unique(b, return_index=True)
            return a[idx]

        uniq1 = getUnique(colorPairs[:,:3])
        uniq2 = getUnique(colorPairs[:,3:])
        startingColors = getUnique( np.vstack(( uniq1, uniq2 )) )

        return startingColors


    def make(self, palSize, hueFilters=[], lightnessRange=[25,85],
        onlyUseRGB=True, noticeableDifferenceAngle=1.0/3.0, startPalette=[],
        weights={"ciede2000":1,"nameDifference":1,"nameUniqueness":0,
        "pairPreference":1}):
        """Make a palette with palSize colors by sampling using weights.

        Args:
            palSize (int): the number of colors to sample for the palette.
            hueFilters (list): a two-dimensional list, such that each element of
                hue filters is a two-element list that contains the lower and
                upper hue angle boundary for each hue angle region to include
                when sampling colors.
            lightnessRange (list): a two-element list that sets the lightness
                range for filtering for color space before sampling.
            onlyUseRGB (bool): whether color space should be restricted to RGB.
            noticeableDifferenceAngle (float): the visual angle that should be
                used when calculating CIE Lab noticeable difference intervals
                using Stone, Szafir, and Setlur's engineering color difference
                model http://www.danielleszafir.com/2014CIC_48_Stone_v3.pdf.
            startPalette (list): a two-dimensional list, such that each element
                of startPalette is a 3-element list that specifies a valid CIE
                Lab D65 color. Any dimension that are not a multiple of 5 will
                be rounded accordingly.
            weights (dict): user-defined weights ([0,1]) for the four palette
                scores such that the total weight always sums to 1. The weight
                names are `ciede2000`, `nameDifference`, `nameUniqueness`, and
                `pairPreference`.
        Returns:
            palette (np.ndarray): an array of CIE Lab D65 colors.
        """

        assert isinstance(palSize, ( int, long )) and palSize > 0
        assert "ciede2000" in weights and "nameDifference" in weights and\
            "nameUniqueness" in weights and "pairPreference" in weights
        assert np.sum([weights[w] >= 0.0 and weights[w] <= 1.0
            for w in weights]) == 4

        hueFilters = np.array(hueFilters)
        hueFilters = convert.convertHueRanges(hueFilters)

        startPalette = list(startPalette)

        ndL, ndA, ndB = [d*3 for d in jnd.cieLabJND(noticeableDifferenceAngle)]

        if len(startPalette) > 0:
            palette = startPalette
        else:
            possibleStartColors = self.getStartingColors(hueFilters=hueFilters,
                lightnessRange=lightnessRange, onlyUseRGB=onlyUseRGB)
            startColorIdx = np.random.choice(possibleStartColors.shape[0])
            palette = [possibleStartColors[startColorIdx]]

        if len(palette) >= palSize:
            return palette

        colorSpaces = self.colorSpaces
        nus = self.nameUniquenesses

        if hueFilters.size > 0:
            okHue = [np.logical_and(colorSpaces[:,3] >= low,
                    colorSpaces[:,3] <= high) for low,high in hueFilters]
            okHue = np.any(np.array(okHue), axis=0)
            colorSpaces = colorSpaces[okHue]
            nus = nus[okHue]

        isRGB = np.logical_and(colorSpaces[:,[6,7,8]] >= 0, colorSpaces[:,[6,7,8]] <= 255)
        isRGB = np.all(isRGB, axis=1)

        minLightness = lightnessRange[0] + 0.01
        maxLightness = lightnessRange[1]
        inLightness = np.logical_not(np.logical_or(colorSpaces[:,0] <
            minLightness, colorSpaces[:,0] > maxLightness))

        rgbAndLightnessMask = np.logical_and(isRGB, inLightness)
        colorSpaces = colorSpaces[rgbAndLightnessMask]
        nus = nus[rgbAndLightnessMask]

        # filter ``ugly'' colors
        # TODO push this to the scorePenalty C function as a 0 weighting
        isUgly = np.zeros((colorSpaces.shape[0], 4))
        isUgly[:,0] = colorSpaces[:,3] >= 85
        isUgly[:,1] = colorSpaces[:,3] <= 114
        isUgly[:,2] = colorSpaces[:,0] <= 75
        isUgly[:,3] = colorSpaces[:,0] >= 35
        isUglyMask = np.logical_not(np.all(isUgly, axis=1))

        colorSpaces = colorSpaces[isUglyMask]
        nus = nus[isUglyMask]

        # remove any colors that aren't noticeably different from start palette
        for color in palette:
            diffs = np.absolute(colorSpaces[:,0:3] - color)
            isND = np.logical_or(diffs[:,0] >= ndL,
                    np.logical_or(diffs[:,1] >= ndA, diffs[:,2] >= ndB))
            colorSpaces = colorSpaces[isND]
            nus = nus[isND]

        if colorSpaces.shape[0] == 0:
            print 'Ran out of candidates.'
            return np.array(palette)

        lab = colorSpaces[:,0:3]
        lch = colorSpaces[:,[0,4,3]]
        rgb = colorSpaces[:,6:]

        candidates = lab
        scorePenalty = npc.scorePenalty(np.ascontiguousarray(candidates))[:,0]

        # apply the name uniqueness weight to all NU values
        nus *= weights["nameUniqueness"]
        nus = nus.reshape( (nus.shape[0], 1) ) # reshape for join

        startPalSize = len(palette)
        # TODO memoize loop s.t. previous results don't need to be recomputed
        for pi in xrange(palSize - startPalSize):
            # create combinations of candidates + palette colors
            # Each tile stores a candidate color paired with a palette color
            tiled = np.tile(candidates, (pi+startPalSize, 1))
            tiled = np.hstack(( tiled,
                np.zeros(tiled.shape[0]*3).reshape(tiled.shape[0], 3) ))

            for i, p in enumerate(palette):
                tiled[:,3:] = p

            # stack the tiles to into the score ufunc format (2 Lab colors/row)
            scores = npc.score( np.ascontiguousarray(tiled) )[:,0:3]

            # reshape the 2 Lab colors/row so that each row is instead a
            # potential candidate and the columns are its scores to all of the
            # already-picked palette colors
            scores = np.hstack(np.split(scores,pi+startPalSize))

            # Take the minimum value for each candidate score
            des = scores[:,0::3].min(axis=1)
            nds = scores[:,1::3].min(axis=1)
            pps = scores[:,2::3].min(axis=1)

            # Normalize CIEDE2000 and Pair Preference to [0,1] to match the Name
            # Difference and Name Uniqueness scores
            # The following distance bounds are precomputed from the 8325 colors in the dataset
            maxDistance = 122.48163103
            minDistance = 1.02043527056
            des = (des - minDistance) / (maxDistance - minDistance)

            maxPreference = 107.909
            minPreference = -101.423
            pps = (pps - minPreference) / (maxPreference - minPreference)

            # apply weights to the palette scores
            des *= weights["ciede2000"]
            nds *= weights["nameDifference"]
            pps *= weights["pairPreference"]

            # reshape scores for stacking
            des = des.reshape( (des.shape[0], 1) )
            nds = nds.reshape( (nds.shape[0], 1) )
            pps = pps.reshape( (pps.shape[0], 1) )

            scores = np.hstack( (des, nds, pps, nus) )
            scores = np.sum(scores, axis=1)
            # apply the ugly-color penalty function
            scores *= scorePenalty

            # sample a color above the score threshold limit
            threshold = np.max(scores) - 0.75*np.std(scores)
            choices = candidates[ scores > threshold, :]

            # If the thresholding yielded no candidates, don't perform it
            # This typically happens with low (i.e., 1) color candidate sets
            if choices.shape[0] == 0:
                choices = candidates

            choice = choices[np.random.choice(choices.shape[0])]

            palette = palette + [choice]

            # Prune choice and not noticeably different colors from sample space
            diffs = np.absolute(candidates-choice)
            isND = np.logical_or(diffs[:,0] >= ndL, np.logical_or(diffs[:,1] >=
                ndA, diffs[:,2] >= ndB))

            candidates = candidates[isND]
            nus = nus[isND]
            scorePenalty = scorePenalty[isND]

            if candidates.shape[0] == 0:
                print 'Ran out when picking color #'+str(pi)
                break

        return np.array(palette)


    def makePreferablePalette(self, palSize, numPalettes, hueFilters=[],
        lightnessRange=[25,85], onlyUseRGB=True,
        noticeableDifferenceAngle=1.0/3.0, startPalette=[],
        weights={"ciede2000":1,"nameDifference":1,"nameUniqueness":0,
        "pairPreference":1}):
        """Make a preferable palette by making many to return most preferable.

        This function makes `numPalettes` palettes, calculates the lowest pair
        preference score in each, and then returns the palette with the highest
        low-preference score.

        Args:
            palSize (int): the number of colors to sample for the palette.
            numPalettes (int): the number of palettes to sample preference from.
            hueFilters (list): a two-dimensional list, such that each element of
                hue filters is a two-element list that contains the lower and
                upper hue angle boundary for each hue angle region to include
                when sampling colors.
            lightnessRange (list): a two-element list that sets the lightness
                range for filtering for color space before sampling.
            onlyUseRGB (bool): whether color space should be restricted to RGB.
            noticeableDifferenceAngle (float): the visual angle that should be
                used when calculating CIE Lab noticeable difference intervals
                using Stone, Szafir, and Setlur's engineering color difference
                model http://www.danielleszafir.com/2014CIC_48_Stone_v3.pdf.
            startPalette (list): a two-dimensional list, such that each element
                of startPalette is a 3-element list that specifies a valid CIE
                Lab D65 color. Any dimension that are not a multiple of 5 will
                be rounded accordingly.
            weights (dict): user-defined weights ([0,1]) for the four palette
                scores such that the total weight always sums to 1. The weight
                names are `ciede2000`, `nameDifference`, `nameUniqueness`, and
                `pairPreference`.
        Returns:
            palette (np.ndarray): an array of CIE Lab D65 colors.
        """
        def lowestPreference(palette):
            """Get the lowest pair preference given all palette color pairs."""
            idxs = np.transpose(np.array(np.triu_indices(len(palette),1)))
            pairs = np.array([(palette[i, :], palette[j,:]) for i,j in idxs])
            pairs = pairs.reshape((-1, 6))
            scores = npc.score(pairs)
            return np.amin(scores[:,2])


        palettes = [
            self.make(palSize, hueFilters=hueFilters, lightnessRange=lightnessRange,
                onlyUseRGB=onlyUseRGB,
                noticeableDifferenceAngle=noticeableDifferenceAngle,
                startPalette=startPalette, weights=weights)
            for i in xrange(numPalettes)
        ]

        # Return a random palette if there is only one color, given that the
        # first color is always from a highly preferable subset
        if palSize == 1:
            return palettes[np.random.randint(numPalettes)]

        # discard any palettes who are not equal to the desired palette size
        # this can happen when making very large palettes or when the user has
        # defined a very narrow color space to sample from.
        # If no palette matches the desired palette size, limit the palettes to
        # those of the largest size.
        bigEnoughPalettes = filter(lambda r: len(r) == palSize, palettes)
        if len(bigEnoughPalettes) > 0:
            palettes = np.array(bigEnoughPalettes)
        else:
            lens = np.array([len(p) for p in palettes])
            maxLen = np.amax(lens)
            maxLenMask = np.in1d(lens.ravel(), maxLen).reshape(lens.shape)
            palettes = [p for i,p in enumerate(palettes) if maxLenMask[i]]

        minPrefs = [lowestPreference(p) for p in palettes]
        palette = palettes[np.argmax(minPrefs)]

        return palette


    def scorePalette(self, palette, weights={"ciede2000":1,"nameDifference":1,\
            "nameUniqueness":0, "pairPreference":1}):
        if len(palette) == 0:
            return 0

        palette = np.array(palette)
        if palette.shape[0] == 1:
            return 0

        # get all pair combinations of the palette
        def comb_index(n, k):
            count = comb(n, k, exact=True)
            index = np.fromiter(chain.from_iterable(combinations(range(n), k)),
                                int, count=count*k)
            return index.reshape(-1, k)
        pairIndexes = comb_index(palette.shape[0], 2)
        labPairs = np.zeros(pairIndexes.shape[0]*6).reshape(pairIndexes.shape[0], 6)
        # populate the labPairs index
        for i, pair in enumerate(pairIndexes):
            labPairs[i, 0:3] = palette[pair[0]]
            labPairs[i, 3:] = palette[pair[1]]

        scores = npc.score(labPairs)
        de = np.min(scores[:,0]) * weights["ciede2000"]
        nd = np.min(scores[:,1]) * weights["nameDifference"]
        pp = np.min(scores[:,2]) * weights["pairPreference"]
        nu = np.min(scores[:,[3,4]]) * weights["nameUniqueness"]

        nuPair = np.hstack((palette.reshape((-1,3)), palette.reshape((-1,3))))
        nuScores = npc.score(nuPair)[:,3]

        return dict(
            pairIndexes=pairIndexes.tolist(),
            labPairs=labPairs.tolist(),
            scores=np.delete(scores, -1, 1).tolist(),
            minScores=dict(
                de=de,
                nd=nd,
                nu=nu,
                pp=pp
            ),
            nuScores = nuScores
        )
