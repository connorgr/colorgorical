"""Conversion utility functions."""
import numpy as np

def convertHueRanges(hueRanges):
    """Convert a list of hue ranges to fall within [0,360).

    Args:
        hueRanges (np.ndarray): a 2-d array of size nx2, such that each row is a
            hue range specified in degrees

    Returns:
        hueRanges (np.ndarray): a converted 2-d array such that each row is a
            hue range that falls within [0,360).
    """
    hueRanges = np.array(hueRanges)

    if hueRanges.size == 0:
        return hueRanges

    hueRanges = hueRanges[:, [0,1]]

    degreeDiff = np.diff(hueRanges)
    degreeDiff = degreeDiff >= 360

    if np.sum(degreeDiff) > 0:
        return np.array([])

    # truncate every angle to [0,360)
    hueRanges = hueRanges % 360

    # take care of cases where first angle > second angle, e.g., [270, 10]
    firstGTsecond = hueRanges[:,0] > hueRanges[:, 1]
    fGTsHRs = hueRanges[firstGTsecond]

    additions = np.zeros(fGTsHRs.shape[0]*2).reshape(fGTsHRs.shape[0], 2)
    additions[:,1] = fGTsHRs[:,1]

    hueRanges[firstGTsecond, 1] = 360

    hueRanges = np.vstack( (hueRanges, additions) )

    # remove hue ranges where the two angles are equal
    notEqual = hueRanges[:,0] != hueRanges[:,1]
    hueRanges = hueRanges[notEqual]

    hueRanges = np.sort(hueRanges, axis=0)

    def reduceRange(ranges, r):
        if ranges.shape[0] == 0:
            return np.array([r])

        lowerInside = np.array([np.logical_and(r[0] >= low, r[0] <= high) for low,high in ranges])
        greaterInside = np.array([np.logical_and(r[1] >= low, r[1] <= high) for low,high in ranges])

        # if the range is contained inside an existing range, return
        if np.any(np.logical_and(lowerInside, greaterInside)):
            return ranges
        # if completely new, add the range to the list and return
        elif not np.any(np.logical_or(lowerInside, greaterInside)):
            return np.vstack( (ranges, r) )

        # Else, the hue range extends existing range(s) that need to be extended
        # Extend upper range bounds if the new range has a lower bound inside
        #   an existing range
        ranges[lowerInside, 1] = r[1]

        # Do the same, but for extending the lower bound
        ranges[greaterInside, 0] = r[0]

        # Filter ranges down to unique rows
        # h/t http://stackoverflow.com/questions/16970982
        b = np.ascontiguousarray(ranges).view(np.dtype((np.void, ranges.dtype.itemsize * ranges.shape[1])))
        _, idx = np.unique(b, return_index=True)
        ranges = ranges[idx]

        # Apply recursively until all merges have been completed
        ranges = reduce(reduceRange, ranges, np.array([]))

        return ranges

    hueRanges = reduce(reduceRange, hueRanges, np.array([]))

    degreeDiff = np.diff(hueRanges)
    degreeDiff = degreeDiff >= 360

    if np.sum(degreeDiff) > 0:
        return np.array([])

    return hueRanges

def convertLabToRGB(lab):
    """Conversion between D65 CIE Lab and sRGB in the [0,255 range].

    Converts D65 CIE Lab color into its sRGB equivalent. If the Lab color falls
    outside the sRGB gamut on any of the red, green, or blue channels, the value
    will be clammped to either 0 or 255 for the given channel(s). The following
    implementation is adapted from Heer and Stone's Java implementation for the
    C3 color-name project:
    github.com/uwdata/c3/blob/master/java/src/edu/stanford/vis/color/LAB.java
    We also borrow from D3 (v.3) Lab->RGB function:
    https://github.com/mbostock/d3/blob/master/src/color/xyz.js

    Args:
        lab (list): a 3-element list pertaining to a D65 CIE Lab color

    Returns:
        rgbs (list): a 3-element list pertaining to an sRGB colors
    """
    L = lab[0]
    a = lab[1]
    b = lab[2]

    # D65 whitepoint needed for transform
    D65_X = 0.950470
    D65_Y = 1.0
    D65_Z = 1.088830

    # CIE L*a*b* to CIE XYZ
    y = (L + 16) / 116.0
    x = y + a/500.0
    z = y - b/200.0

    x = D65_X * (x*x*x if x > 0.206893034 else (x - 4.0/29) / 7.787037)
    y = D65_Y * (y*y*y if y > 0.206893034 else (y - 4.0/29) / 7.787037)
    z = D65_Z * (z*z*z if z > 0.206893034 else (z - 4.0/29) / 7.787037)

    # map CIE XYZ to sRGB
    r =  3.2404542*x - 1.5371385*y - 0.4985314*z
    g = -0.9692660*x + 1.8760108*y + 0.0415560*z
    b =  0.0556434*x - 0.2040259*y + 1.0572252*z

    # threshold based on D3, not on Lindbloom's suggested threshold
    #    https://github.com/mbostock/d3/blob/master/src/color/xyz.js
    #    http://www.brucelindbloom.com/index.html?Eqn_RGB_to_XYZ.html
    r = 12.92*r if r <= 0.00304 else 1.055*pow(r,1/2.4) - 0.055
    g = 12.92*g if g <= 0.00304 else 1.055*pow(g,1/2.4) - 0.055
    b = 12.92*b if b <= 0.00304 else 1.055*pow(b,1/2.4) - 0.055

    # integer representation of RGB [0,1] values
    ir = int(round(255*r))
    ig = int(round(255*g))
    ib = int(round(255*b))

    ir = max(0, min(ir, 255))
    ig = max(0, min(ig, 255))
    ib = max(0, min(ib, 255))

    return (ir, ig, ib)


def convertRGBToLab(rgb):
    """Inverse function of `convertLabToRGB`, based on D3."""
    # D65 whitepoint needed for transform
    D65_X = 0.950470
    D65_Y = 1.0
    D65_Z = 1.088830

    def convert(v):
        return v/12.92 if v <= 0.00304 else pow((v + 0.055)/1.055, 2.4)
    r = convert(rgb[0]/255.0)
    g = convert(rgb[1]/255.0)
    b = convert(rgb[2]/255.0)

    x = (0.4124564*r + 0.3575761*g + 0.1804375*b) / D65_X
    y = (0.2126729*r + 0.7151522*g + 0.0721750*b) / D65_Y
    z = (0.0193339*r + 0.1191920*g + 0.9503041*b) / D65_Z

    # map CIE XYZ to CIE Lab
    x = pow(x, 1.0/3) if x > 0.008856 else 7.787037*x + 4.0/29
    y = pow(y, 1.0/3) if y > 0.008856 else 7.787037*y + 4.0/29
    z = pow(z, 1.0/3) if z > 0.008856 else 7.787037*z + 4.0/29

    # return Lab
    return (116*y - 16, 500*(x-y), 200*(y-z))
