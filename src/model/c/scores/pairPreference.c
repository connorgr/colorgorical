#include "scores.h"

// Normalize d, such that it falls inside [0,1], defined by high and low.
static inline double norm(double d, double high, double low) {
  return (d - low) / (high - low);
}


// Calculate the scalar needed to convert an XYZ color to Lab
static inline double XYZtoLab_f(double t) {
  if(t > pow(6.0/29.0, 3)) {
    return pow(t, 1.0/3.0);
  } else {
    return (1.0/3.0) * (29.0/6.0)*(29.0/6.0) * t + 4.0/29.0;
  }
}


// Calculate the scalar needed to convert an Lab color to XYZ.
static inline double LabToXYZ_f(double t) {
  return t > 6.0/29.0 ? t*t*t : 3.0 * (6.0/29)*(6.0/29) * (t - 4.0/29.0);
}


// Calculate the LCH cyllindrical color representation of an Lab color
static double* LabToLCH(double L, double a, double b) {
  double C = sqrt(a*a + b*b);
  double H = atan2(b,a) * 180.0 / M_PI;
  if(H < 0.0) H = H + 360.0;
  if(H > 360.0) H = 360.0 - H;

  double* LCH = malloc(3*sizeof(double));
  LCH[0] = L;
  LCH[1] = C;
  LCH[2] = H;
  return LCH;
}


// Convert CIE Lab coordinates characterized with Illuminant D65 to CIE Lab
// characterized with Illuminant C. This conversion is required since our model
// relies on a D65 characterization, but Schloss and Palmer's pair preference
// function was defined in Illuminant C characterized CIE Lab space.
static double* IlluminantD65Lab_to_IlluminantCLab(double L_old, double a_old,
    double b_old) {
  double ILLUMINANT_C_X = 98.074;
  double ILLUMINANT_C_Y = 100.0;
  double ILLUMINANT_C_Z = 118.232;

  double ILLUMINANT_D65_X = 95.0470;
  double ILLUMINANT_D65_Y = 100.0;
  double ILLUMINANT_D65_Z = 108.8830;

  // Derive X,Y,Z from Lab by inversing the transformation
  double LabToXYZ_f_x_input = (1.0/116.0)*(L_old + 16) + (1.0/500.0)*a_old;
  double LabToXYZ_f_y_input = (1.0/116.0)*(L_old + 16);
  double LabToXYZ_f_z_input = (1./116)*(L_old + 16) - (1./200)*b_old;

  double X = ILLUMINANT_D65_X * LabToXYZ_f(LabToXYZ_f_x_input);
  double Y = ILLUMINANT_D65_Y * LabToXYZ_f(LabToXYZ_f_y_input);
  double Z = ILLUMINANT_D65_Z * LabToXYZ_f(LabToXYZ_f_z_input);

  double deconstructY = XYZtoLab_f(Y / ILLUMINANT_C_Y);
  double L = 116 * deconstructY - 16;
  double a = 500 * ( XYZtoLab_f(X / ILLUMINANT_C_X) - deconstructY );
  double b = 200 * ( deconstructY - XYZtoLab_f(Z/ILLUMINANT_C_Z) );

  double* Lab = malloc(3*sizeof(double));
  Lab[0] = L;
  Lab[1] = a;
  Lab[2] = b;
  return Lab;
}


double pairPreference(double L1, double a1, double b1,
                      double L2, double a2, double b2) {

  // See util/labToAchromaticPreference.h
  if(a1 == 0 && b1 == 0 && a2 == 0 && b2 == 0) {
    return getAchromaticPreference(L1, a1, b1, L2);
  }
  if(a1 == 0 && b1 == 0) {
    return getAchromaticPreference(L2, a2, b2, L1);
  } else if (a2 == 0 && b2 == 0) {
    return getAchromaticPreference(L1, a1, b1, L2);
  }

  int labIdx1 = getLabIndex(L1, a1, b1);
  int labIdx2 = getLabIndex(L2, a2, b2);

  double coolness1 = COLORGORICAL_LAB_TO_COOLNESS[labIdx1];
  double coolness2 = COLORGORICAL_LAB_TO_COOLNESS[labIdx2];

  // Convert from D65 to Illuminant C Lab
  double* Lab1 = IlluminantD65Lab_to_IlluminantCLab(L1, a1, b1);
  double* Lab2 = IlluminantD65Lab_to_IlluminantCLab(L2, a2, b2);

  // Convert Lab Illuminant C to LCH
  double* LCH1 = LabToLCH(Lab1[0], Lab1[1], Lab1[2]);
  double* LCH2 = LabToLCH(Lab2[0], Lab2[1], Lab2[2]);

  double L1_IllC = LCH1[0];
  double L2_IllC = LCH2[0];
  double H1_IllC = LCH1[2];
  double H2_IllC = LCH2[2];

  // hue, lightness, and coolness weights taken from regression in Schloss &
  //  Palmer 2011 to estimate pairwise preference
  double wh = -46.4222; // hueAngleDiff weight
  double wl = 47.6133; // lightnessDiff weight
  double wc = 75.1481; // coolness weight
  // We can drop the constant k = -39.3888

  // These min and max values are taken from the regression normalization
  // Need to normalize based on these to verify the variables are on same range
  double cMax = 36.0;
  double cMin = 4.0;
  double hMax = 179.266981384;
  double hMin = 0.033547949;
  double lMax = 63.3673; // difference in L_max = 112 (IllC), NOT D65 white
  double lMin = 0.0;

  double diffL = fabs(L1_IllC - L2_IllC);
  double diffH = fabs(H1_IllC - H2_IllC);
  double sumC = coolness1 + coolness2;

  double pp = wl*norm(diffL, lMax, lMin)
              + wh*norm(diffH, hMax, hMin) + wc*norm(sumC, cMax, cMin);

  free(Lab1);
  free(Lab2);
  free(LCH1);
  free(LCH2);

  return pp;
}
