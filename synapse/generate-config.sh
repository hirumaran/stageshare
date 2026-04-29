#!/bin/bash
# Run this ONCE to generate the Synapse homeserver.yaml
# Usage: bash synapse/generate-config.sh

docker run --rm \
  -v "$(pwd)/synapse/data:/data" \
  -e SYNAPSE_SERVER_NAME=matrix.skene.bsd405.org \
  -e SYNAPSE_REPORT_STATS=no \
  matrixdotorg/synapse:latest generate

echo ""
echo "Config generated at synapse/data/homeserver.yaml"
echo "Now edit it to add your database connection and shared secret."
