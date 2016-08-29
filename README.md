Colorgorical
============
Colorgorical is a tool to make categorical color palettes for information
visualizations. Users are able to customize palette design by (1) specifying
the number of colors, (2) selecting the importance of discriminability and
aesthetic preference, (3) limiting the CIE LCh hues and lightnesses of
palette colors, and (4) providing a palette to build off of.

The tool itself runs as a web server. The server is implemented using
Tornado and the backend palette construction is implemented using a mixture of
NumPy and C. The front-end is minimalistic and only relies on Bootstrap and D3.

For more information about Colorgorical, consult either the inlined docstrings
or the paper located in `src/public/static/pdf`.

Running Colorgorical
--------------------
After cloning the repo, you first have to compile the C code so that it is
usable by Colorgorical. To do so, run the ``setup.sh'' script. Alternatively,
you can navigate to `/src/model` and run `python setup.py build_ext --inplace`.

Once you have compiled the C code, navigate back to the project's root. The
webserver can be called using `python run.py --server`. If you want to change
the port just use `--port ####`.

**Dependencies:** Colorgorical was designed to run with Python 2.7 and was
implemented using NumPy v.1.10, Tornado 4.3, and setuptools 20.7; however,
Colorgorical should be compatible with most versions of these libraries.
The C code is ANSI C valid and was verified to be compilable with the Apple
Developer Tools C compiler (Apple LLVM version 7.0.2, clang-700.1.81) and with
gcc v.4.9.2. All client-side dependencies are pre-included and are listed within
`bower.json`.

About Colorgorical's development
--------------------------------
Colorgorical was developed as a research tool to test the relation between color
preference and discriminability when creating categorical color palettes, given
that there is an implicit trade off between the two. For this reason we did not
reduce the number of sliders in the interface, given the original aim of
development.

Contributing
------------
Contributions are more than welcome; however, we ask that contributors adhere to
80-column line breaks, use spaces, are consistent with current indentation, and
follow the other style conventions that already exist in the code base.
We follow [Google's style guidelines for
Python](https://google.github.io/styleguide/pyguide.html), and a loose-fitting
take on
[JPL's C style
guidelines](http://lars-lab.jpl.nasa.gov/JPL_Coding_Standard_C.pdf).
We request that C code remains ANSI C valid.
