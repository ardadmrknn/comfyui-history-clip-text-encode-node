#
# __init__.py
# This file tells ComfyUI where to load the Python nodes
# and the JavaScript extensions from.
#

# Import our Python nodes
from .prompt_history_node import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS

# Specify the web directory for our JavaScript files
WEB_DIRECTORY = "./js"

# Expose all the necessary information to ComfyUI
__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS', 'WEB_DIRECTORY']
