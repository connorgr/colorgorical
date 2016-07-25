#include "scores.h"

double ciede2000(double Lstd, double astd, double bstd, double Lsample,
                 double asample, double bsample) {
  double kl = 1.0;
  double kc = 1.0;
  double kh = 1.0;

  double Cabstd = sqrt(astd*astd + bstd*bstd);
  double Cabsample = sqrt(asample*asample + bsample*bsample);
  double Cabarithmean = (Cabstd + Cabsample)/2.0;

  double G = 0.5 * (1 - sqrt(pow(Cabarithmean, 7.0) /
             (pow(Cabarithmean, 7.0) + pow(25.0, 7.0))));

  // calculate a'
  double apstd = (1+G)*astd;
  double apsample = (1+G)*asample;
  double Cpsample = sqrt(apsample*apsample + bsample*bsample);
  double Cpstd = sqrt(apstd*apstd + bstd*bstd);

  // Compute the product of chromas and locations at which it is 0
  double Cpprod = Cpsample*Cpstd;

  // Make sure that hue is between 0 and 2pi
  double hpstd = atan2(bstd, apstd);
  if(hpstd < 0) hpstd += 2 * M_PI;

  double hpsample = atan2(bsample, apsample);
  if(hpsample < 0) hpsample += 2 * M_PI;

  double dL = Lsample - Lstd;
  double dC = Cpsample - Cpstd;
  // Compute hue distance
  double dhp = hpsample - hpstd;
  if(dhp > M_PI) dhp -= 2*M_PI;
  if(dhp < -1*M_PI) dhp += 2*M_PI;
  // Set chroma difference to zero if product of chromas is zero
  if(Cpprod == 0.0) dhp = 0.0;

  // CIEDE2000 requires signed hue and chroma differences, differing from older
  //  color difference formulae
  double dH = 2*sqrt(Cpprod)*sin(dhp/2);

  // Weighting functions
  double Lp = (Lsample+Lstd)/2.0;
  double Cp = (Cpstd+Cpsample)/2.0;
  // Compute average hue
  // avg hue is computed in radians and converted to degrees only where needed
  double hp = (hpstd+hpsample)/2.0;
  // Identify positions for which abs hue diff > 180 degrees
  if(fabs(hpstd-hpsample) > M_PI) hp -= M_PI;
  // rollover those that are under
  if(hp < 0) hp += 2.0 * M_PI;
  // if one of the chroma values = 0, set mean hue to the sum of two chromas
  if(Cpprod == 0.0) hp = hpstd + hpsample;

  double Lpm502 = (Lp-50)*(Lp-50);
  double Sl = 1 + 0.015*Lpm502 / sqrt(20+Lpm502);
  double Sc = 1 + 0.045*Cp;
  double T = 1 - 0.17*cos(hp - M_PI/6.0)
               + 0.24*cos(2.0*hp)
               + 0.32*cos(3.0*hp + M_PI/30.0)
               - 0.20*cos(4.0*hp - 63.0*M_PI/180.0);
  double Sh = 1.0 + 0.015*Cp*T;
  double delthetarad = (30*M_PI/180) *
                       exp(-1* ( pow((180/M_PI*hp - 275.0)/25.0, 2) ));
  double Rc = 2.0*sqrt(pow(Cp, 7.0)/(pow(Cp, 7.0) + pow(25.0, 7.0)));
  double RT = -1.0 * sin(2.0*delthetarad)*Rc;

  double klSl = kl*Sl;
  double kcSc = kc*Sc;
  double khSh = kh*Sh;

  double de = sqrt( pow(dL/klSl, 2.0) + pow(dC/kcSc, 2.0) + pow(dH/khSh, 2.0) +
                    RT*(dC/kcSc)*(dH/khSh) );

  return de;
}
