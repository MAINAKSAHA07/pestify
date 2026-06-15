#!/bin/bash
set -e

echo "=== 1. Creating remote directories ==="
ssh -i pestify.pem -o StrictHostKeyChecking=no ec2-user@54.241.138.36 "mkdir -p /home/ec2-user/pestify/server"

echo "=== 2. Copying backend files ==="
scp -i pestify.pem -o StrictHostKeyChecking=no package.json .env ec2-user@54.241.138.36:/home/ec2-user/pestify/
scp -i pestify.pem -o StrictHostKeyChecking=no server/* ec2-user@54.241.138.36:/home/ec2-user/pestify/server/
scp -i pestify.pem -o StrictHostKeyChecking=no scratch/setup_remote_api.sh ec2-user@54.241.138.36:/home/ec2-user/pestify/

echo "=== 3. Running setup on remote server ==="
ssh -i pestify.pem -o StrictHostKeyChecking=no ec2-user@54.241.138.36 "chmod +x /home/ec2-user/pestify/setup_remote_api.sh && /home/ec2-user/pestify/setup_remote_api.sh"

echo "=== Backend Deployment Completed! ==="
