#ifndef NUMPY_COLORGORICAL_H
#define NUMPY_COLORGORICAL_H

#include <assert.h>
#include "Python.h"
#include "numpy/ndarraytypes.h"
#include "numpy/ufuncobject.h"
#include "numpy/npy_3kcompat.h"

#include "scores/scores.h"
#include "util/getIndex.h"

// NOTE: for ufuncs it is EXTREMELY important that all input np.ndarrays are
// contiguous (i.e., passed through np.ascontiguousarray). Otherwise you will
// likely get segfaults from the ufunc trying to step into bad neighboring
// memory blocks.

// Retrieves the 1D indecies of Lab colors in an n x 3 numpy array. An example
// use of this function would be to create bit masks based on what colors are
// in a number of palettes.
extern void double_colorIndex_ufunc(char **args, npy_intp *dimensions,
    npy_intp* steps, void* data);

// Computes CIEDE2000 (perceptual distance), name difference, and pair
// preference scores for two CIE Lab colors, and the name uniqueness for each.
// The function expects a 6 column array, such that the first three columns
// correspond to the first color's Lab coordinates, and likewise for the last
// three columns to the second color. All of the scores are found in
// `scores/scores.h`
extern void double_score_ufunc(char **args, npy_intp *dimensions, npy_intp* steps,
    void* data);


// To minimize the likelihood of sampling from what is cross-culturally
// considered an ``ugly'' region of color space, this function accepts an array
// of CIE Lab colors that fall on intervals of 5 from the origin (i.e., are
// members of the Heer & Stone discretized space) and assigns a penalty
// multiplier to lower the scores of undesirable colors.
extern void double_scorePenalty_ufunc(char **args, npy_intp *dimensions,
    npy_intp* steps, void* data);

// Initializes Colorgorical C functions to NumPy as ufuncs.
extern PyMODINIT_FUNC initnumpyColorgorical(void);

#endif
