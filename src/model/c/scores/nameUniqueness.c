#include "scores.h"

double nameUniqueness(double L, double a, double b) {
  int ci = getColorIndex(L, a, b); // color index
  int count; // tally for a color's term count
  int termCount = 153; // len(W) in Heer & Stone
  int ti; // term index
  double H = 0; // color term entropy, i.e. name uniqueness
  double p;

  for(ti = 0; ti < termCount; ti++) {
    count = COLORGORICAL_NAMES_T[ci*termCount + ti];
    if(count == -1) {
      count = 0; // if count is none, set the count to zero
    }

    p = (double) count / COLORGORICAL_NAMES_CCOUNT[ci];
    if(p > 0) {
      H = H + (p * log(p) / log(2));
    }
  }

  // Hardcoded from the color terms in the XKCD data used in Heer & Stone 2012
  double minE = -4.5;
  double maxE = 0;

  H = (H - minE) / (maxE - minE); // normalize entropy to [0,1] with 1 = most
  // 1 - H makes the score trend toward 1 rather than 0
  return 1 - H;
}
