Colorgorical
============
Colorgorical is a tool to make categorical color palettes for information
visualizations. Users are able to customize palette design by (1) specifying
the number of colors, (2) selecting the importance of discriminability and
aesthetic preference, (3) limiting the hues and lightnesses of palette colors,
and (4) providing a palette to build off of.

The tool itself runs as a web server. The server is implemented using Tornado
and  the backend palette construction is implemented using a mixture of NumPy
and C. The front-end is minimalistic and only relies on Bootstrap and D3.

For more information about Colorgorical, consult either the inlined docstrings
or the paper located in `src/public/static/pdf`.
