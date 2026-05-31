#!/bin/bash

STEL_API="http://localhost:8090/api/stelproperty/set"
PROPERTY="StelSkyDrawer.lightPollutionLuminance"
DELAY=2

echo "Cycling $PROPERTY from 1e-5 to 1e+1..."

for val in 0.00001 0.0001 0.001 0.01 0.1 1.0 10.0; do
    echo "Setting $PROPERTY = $val"
    curl -s -d "id=$PROPERTY&value=$val" "$STEL_API"
    echo ""
    sleep $DELAY
done

echo "Done."
