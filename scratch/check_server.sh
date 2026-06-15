#!/bin/bash
echo "=== Checking Node and NPM versions on remote EC2 ==="
ssh -i pestify.pem -o StrictHostKeyChecking=no ec2-user@54.241.138.36 "node -v 2>/dev/null || echo 'Node not found'; npm -v 2>/dev/null || echo 'NPM not found'"
