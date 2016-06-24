#ifndef NUMPY_COLORGORICAL_SCORES_H
#define NUMPY_COLORGORICAL_SCORES_H

#include <stdlib.h>
#include "../util/getIndex.h"
#include "../util/labToAchromaticPreference.h"
#include "../util/labToCH.h"
#include "../util/labToCoolness.h"
#include "colorNames/colorNames.h"

// CIEDE2000 calculates the perceptual distance of two CIE Lab colors. This
// implementation draws on Sharma et al's Matlab implementation, which can be
// found at http://www.ece.rochester.edu/~gsharma/ciede2000.
extern double ciede2000(double L1, double a1, double b1,
                        double L2, double a2, double b2);


// Pair Preference calculated the average pair preference for two CIE Lab
// colors (Schloss and Palmer, 2011).
// NOTE In the current implementation, color pairs that have either one or
// two achromatic colors (i.e., a=b=0) are undefined. This stems from the fact
// that one of the terms in the pair preference equation is hue difference,
// which is undefined for achromatic colors because they do not possess hue.
// Further, Schloss and Palmer did not include achromatic colors in their
// experiment, which prevents hard coding achromatic preference. To circumvent
// this issue Colorgorical uses Barycentric interpolation based on three nearby
// defined colors to estimate preference.
extern double pairPreference(double L1, double a1, double b1,
                             double L2, double a2, double b2);


// Name Difference measures the similarity between color-name associations
// between two CIE Lab colors, which was originally developed by Heer and Stone
// using XKCD crowdsourced color-name mapping data. For more information,
// including the original Java/Javascript implementations see
// http://vis.stanford.edu/color-names/
extern double nameDifference(double L1, double a1, double b1,
                             double L2, double a2, double b2);


// Name Uniqueness uses the same Heer and Stone color-term data as Name
// Difference. Rather than using two colors, as the other three scoring
// functions, name uniqueness measures the entropy of name association
// frequencies for a single color.
extern double nameUniqueness(double L1, double a1, double b1);


#endif
