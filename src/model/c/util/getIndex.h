#ifndef COLORGORICAL_GET_INDEX_H
#define COLORGORICAL_GET_INDEX_H

extern int COLORGORICAL_CIS[];

// Convenience function for indexing into a 3D Lab array arranged by CIE L, a, b
// L = [0,100]; a = [-85, 100]; b = [-110, 95]
// L = 21 unique; a = 38 unique; b = 42 unique
// Assumes L,a,b will be a multiple of 5
// Is dependent on data/allColors.csv positions
extern int getLabIndex(int L, int a, int b);
// Given L, a, b this retrieves the L,a,b location in a 8,325 array of L,a,b space
//   This is typically only used in functions like the name difference score
extern int getColorIndex(int L, int a, int b);

#endif
