#include "scores.h"

double nameDifference(double L1, double a1, double b1, double L2, double a2, double b2) {
  int ai = getColorIndex(L1, a1, b1);
  int bi = getColorIndex(L2, a2, b2);

  double z = sqrt(COLORGORICAL_NAMES_CCOUNT[ai]*COLORGORICAL_NAMES_CCOUNT[bi]);
  double bc = 0;

  int termCount = 153; // len(W) in Heer & Stone
  for(int i = 0; i < termCount; i++) {
      double pa = COLORGORICAL_NAMES_T[ai * termCount + i];
      double pb = COLORGORICAL_NAMES_T[bi * termCount + i];
      // if the number of counts is undefined, set the count to 0
      pa = pa == -1 ? 0 : pa;
      pb = pb == -1 ? 0 : pb;
      bc += sqrt(pa*pb);
  }

  double nd = sqrt(1 - bc / z);

  return nd;
}
