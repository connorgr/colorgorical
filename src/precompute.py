"""Precompute various Colorgorical model data for improved performance."""
import os
import numpy as np

import model

def precomputeStartingColors():
    """Precomputes the starting color sub-space.

    Creates a list of all colors in a subspace of the default 8,325 CIE Lab
    colors (http://dx.doi.org/10.1145/2207676.2208547). These colors are
    separated every 15 units along the L, a, and b axis. This function also
    precomputes all pairwise color scores between the colors. It precomputes
    CIEDE2000 (perceptual distance), name difference (see above DOI), and
    pair preference (http://www.ncbi.nlm.nih.gov/pmc/articles/PMC3037488/).

    Returns:
        subspace (np.ndarray): the precomputed subspace
        subspaceScores (np.ndarray): color scores between all color pairs
    """
    intervals = model.CIE_LAB_STARTING_SUBSPACE_INTERVALS

    # Load the 8,325 color space into memory
    filePrefix = os.path.dirname(os.path.realpath(__file__))
    colorspacePath = os.path.join(public_root, '../data/allColors.csv')
    colorSpaces = np.loadtxt(open(colorPath, 'rb'), delimiter=',')

    isL = colorSpaces[np.any([colorSpaces[:,0] == l for l in intervals["L"]])]
    isa = colorSpaces[np.any([colorSpaces[:,1] == a for a in intervals["a"]])]
    isb = colorSpaces[np.any([colorSpaces[:,2] == b for b in intervals["b"]])]
    subspace = colorSpaces[np.all(isL, isa, isb),:]
