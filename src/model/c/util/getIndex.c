#include "getIndex.h"

// Assumes L,a,b will be a multiple of 5
// dependent on data/allColors.csv positions
int getLabIndex(int L, int a, int b) {
  // L = [0,100]; a = [-85, 100]; b = [-110, 95]
  // L = 21 unique; a = 38 unique; b = 42 unique
  L = L / 5;
  a = (a + 85) / 5;
  b = (b + 110) / 5;
  int i = L * 38 * 42 + a * 42 + b;
  return i;
}

int getColorIndex(int L, int a, int b) {
  return COLORGORICAL_CIS[getLabIndex(L,a,b)];
}
