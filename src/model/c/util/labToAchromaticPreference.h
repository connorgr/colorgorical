#ifndef COLORGORICAL_LAB_TO_ACHROMATICPREF_H
#define COLORGORICAL_LAB_TO_ACHROMATICPREF_H

#include <math.h>
//hash: int(L1/5)*33516 + int(a/5 + 17)*882 + int(b/5 + 22)*21 + int(Lachroma/5)
extern double COLORGORICAL_LAB_TO_ACHROMATICPREF[703836];

extern double getAchromaticPreference(double L, double a, double b, double achromaL);
#endif
