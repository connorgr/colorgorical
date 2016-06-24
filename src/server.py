"""Colorgorical web application server implementation.

This file contains the implementation for the Tornado web server that processes
all Colorgorical server requests. The Colorgorical model is initialized as the
server is initialized.
"""

import codecs
import json
import os
import tornado.ioloop
import tornado.web as web

# from ..model.model.model import Model
import handlers.main, handlers.template, handlers.makePalette, handlers.scorePalette
from model import model

class ColorgoricalServer:
    """The tornado webserver for Colorgorical.

    Attributes:
        application: the initialized Tornado web server.
        model: an instantiation of the Colorgorical model.
    """
    def __init__(self):
        """Initializes the web server and pairs it with a Colorgorical model."""
        self.model = model.Model()

        thisFilePath = os.path.dirname(__file__)
        public_root = os.path.join(thisFilePath, 'public')
        template_root = os.path.join(thisFilePath, 'templates')
        data_root = os.path.join(public_root, 'data')

        # load the data used to generate the visualizations that preview palettes
        static_data = {}

        mapDataPath=os.path.join(thisFilePath,'data/map-us-counties.json')
        mapValuePath=os.path.join(thisFilePath,'data/map-us-unemployment.json')

        mainOps = dict(
            topoData=codecs.open(mapDataPath, 'r', 'utf-8').read(),
            valueData=codecs.open(mapValuePath, 'r', 'utf-8').read()
        )
        makePaletteOps = dict(
            model=self.model
        )

        handlerList = [
          (r'/', handlers.main.MainHandler, mainOps),
          (r'/(.*).html', handlers.template.TemplateHandler, mainOps),
          (r'/makePalette', handlers.makePalette.MakePaletteHandler, makePaletteOps),
        #   (r'/model', handler.ModelHandler, handlerOps),
          (r'/scorePalette', handlers.scorePalette.ScorePaletteHandler, makePaletteOps),
          (r'/data/(.*)',  web.StaticFileHandler, {'path': data_root}),
          (r'/(.*)', web.StaticFileHandler, {'path': public_root})
        ]

        settings = dict(
          debug=True,
          template_path=template_root
        )

        self.application = web.Application(handlerList, **settings)

    def start(self, **kwargs):
        """Starts the IO loop to host the web server on a port.
        Args:
            **kwargs: optional server configuration options (e.g., port number)
        """
        port = kwargs.pop('port', 8888)
        self.application.listen(8888)
        print "Colorgorical server started on port", port
        tornado.ioloop.IOLoop.instance().start()
