'''Compiles the NumPy ufuncs in `c/`.

To use from the command line, run the following script:
`python setup.py build_ext --inplace` and make sure you are in the `model`
directory.
'''
import numpy
from numpy.distutils.core import setup
from numpy.distutils.misc_util import Configuration
from os.path import join as path_join
from os import walk

def configuration(parent_package='', top_path=None):
    config = Configuration('.', parent_package, top_path)

    # Add all .c files from the `c` directory
    np_srcs = []
    for (dirpath, dirnames, filenames) in walk('c'):
        np_srcs.extend([path_join(dirpath,fn) for fn in filenames if fn[-2:] == ".c"])

    config.add_extension('numpyColorgorical', np_srcs, extra_compile_args=['-std=c99'])

    return config

if __name__ == "__main__":
    setup(configuration=configuration)
