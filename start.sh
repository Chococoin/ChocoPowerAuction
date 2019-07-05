#!/bin/bash

set -m

ganache-cli -h 0.0.0.0

cd client && npm start

fg %1