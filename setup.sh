#!/bin/bash

# Creates a virtual environment and installs the required packages.
# This does not activate the virtual enviroment for you.


python3 -m venv iot-env
source iot-env/bin/activate
pip install -r requirements.txt
deactivate
