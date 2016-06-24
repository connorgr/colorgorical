#include "numpyColorgorical.h"

void double_score_ufunc(char **args, npy_intp *dimensions, npy_intp* steps,
    void* data) {
  npy_intp i;
  npy_intp n = dimensions[0];

  assert(dimensions[1] == 6);
  int nrow = 6;

  char *in = args[0], *out = args[1];
  npy_intp in_step = steps[0];
  npy_intp out_step = steps[1];

  double l1,a1,b1,l2,a2,b2;

  // Iterate over each row and compute scores for the row's pair of colors
  for(i = 0; i < n/nrow; i++) {
    l1 = *(double *) in;
    in+=in_step;
    a1 = *(double *) in;
    in+=in_step;
    b1 = *(double *) in;
    in+=in_step;

    l2 = *(double *) in;
    in+=in_step;
    a2 = *(double *) in;
    in+=in_step;
    b2 = *(double *) in;
    in+=in_step;

    *((double *) out) = ciede2000(l1,a1,b1,l2,a2,b2);
    out +=out_step;
    *((double *) out) = nameDifference(l1,a1,b1,l2,a2,b2);
    out +=out_step;
    *((double *) out) = pairPreference(l1,a1,b1,l2,a2,b2);
    out +=out_step;
    *((double *) out) = nameUniqueness(l1, a1, b1);
    out +=out_step;
    *((double *) out) = nameUniqueness(l2, a2, b2);
    out +=out_step;
    *((double *) out) = NAN;
    out +=out_step;
  }
}


void double_scorePenalty_ufunc(char **args, npy_intp *dimensions,
    npy_intp* steps, void* data) {
  npy_intp i;
  npy_intp n = dimensions[0];
  assert(dimensions[1] == 3);

  char *in = args[0], *out = args[1];
  npy_intp in_step = steps[0];
  npy_intp out_step = steps[1];

  double l,a,b, hue, penalty;
  int colorIdx;

  for(i = 0; i < n; i+=3) {
    l = *(double *) in;
    in+=in_step;
    a = *(double *) in;
    in+=in_step;
    b = *(double *) in;
    in+=in_step;

    colorIdx = getLabIndex(l, a, b) * 2;
    hue = COLORGORICAL_LAB_TO_CH[colorIdx+1];

    if(hue >= 70.0 && hue <= 115.0) { // ``puke''-like colors
      if(l <= 75) penalty = 0.8; // penalize darker colors more
      else penalty = 0.85;
    } else if (hue >= 115.0 && hue < 138.0 && l <= 45.0) { // bad greens
      penalty = 0.75; // greater penalty to balance increased green preference.
    } else {
      penalty = 1.0;
    }

    *((double *) out) = penalty;
    out +=out_step;
    *((double *) out) = NAN;
    out +=out_step;
    *((double *) out) = NAN;
    out +=out_step;
  }
}


////////////////////////////////////////////////////////////////////////////////
// INITIALIZE NUMPY UFUNC OBJECT CODE

PyUFuncGenericFunction double_score_func[1] = {&double_score_ufunc};
static char double_score_types[2] = {NPY_DOUBLE, NPY_DOUBLE}; // input + output
static void *double_score_data[1] = {NULL};

PyUFuncGenericFunction double_scorePenalty_func[1] =
    {&double_scorePenalty_ufunc};
static char double_scorePenalty_types[2] = {NPY_DOUBLE, NPY_DOUBLE};
static void *double_scorePenalty_data[1] = {NULL};

// TODO improve documentation on what this object does
static PyMethodDef ScoreMethods[] = {
        {NULL, NULL, 0, NULL}
};

PyMODINIT_FUNC initnumpyColorgorical(void) {
  PyObject *dict, *module, *score, *scorePenalty;

  module = Py_InitModule("numpyColorgorical", ScoreMethods);
  if (module == NULL) return;

  import_array();
  import_umath();

  score = PyUFunc_FromFuncAndData(double_score_func, double_score_data,
                                  double_score_types, 1, 1, 1, PyUFunc_None,
                                  "score", "score_docstring", 0);

  scorePenalty = PyUFunc_FromFuncAndData(double_scorePenalty_func,
                                  double_scorePenalty_data,
                                  double_scorePenalty_types, 1, 1, 1,
                                  PyUFunc_None, "scorePenalty",
                                  "scorePenalty_docstring", 0);

  dict = PyModule_GetDict(module);

  PyDict_SetItemString(dict, "score", score);
  Py_DECREF(score);

  PyDict_SetItemString(dict, "scorePenalty", scorePenalty);
  Py_DECREF(scorePenalty);
}
