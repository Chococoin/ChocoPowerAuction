#!/bin/bash

ganache-cli -h 0.0.0.0 &

cd client && npm start
