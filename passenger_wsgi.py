"""
Passenger WSGI Entrypoint for Smart Nivas (by Niravayak Global)
This file is executed by Hostinger Python Passenger WSGI environment.
Exposes the root WSGI 'application' callable.
"""

import sys
import os

# Ensure the root project directory is on sys.path for Hostinger Passenger WSGI
root_project_directory: str = os.path.dirname(os.path.abspath(__file__))
if root_project_directory not in sys.path:
    sys.path.insert(0, root_project_directory)

from backend_api.application_factory import create_smart_nivas_flask_application

# Hostinger WSGI callable
application = create_smart_nivas_flask_application()

if __name__ == "__main__":
    application.run(host="0.0.0.0", port=5000, debug=True)
