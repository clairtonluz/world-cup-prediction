#!/bin/sh

# This script performs a remote deployment by connecting via SSH.
# It signs in to the remote server and runs ci/deploy-local.sh.

set -eu

REMOTE_HOST="oracle-luz"
REMOTE_DIR="/home/opc/world-cup-prediction"

printf 'Initiating remote deployment to %s...\n' "$REMOTE_HOST"

# We connect to the remote host, navigate to the project directory,
# and execute the local deployment script.
ssh "$REMOTE_HOST" "cd $REMOTE_DIR && ./ci/deploy-local.sh"
