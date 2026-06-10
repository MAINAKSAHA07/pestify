#!/bin/bash
set -e

echo "=== Building Production Frontend Site ==="
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
npm run build

echo "=== Creating pb_public directory on remote EC2 ==="
ssh -i pestify.pem -o StrictHostKeyChecking=no ec2-user@54.241.138.36 "mkdir -p /var/www/html/pb_public"

echo "=== Copying build files to remote EC2 pb_public ==="
scp -i pestify.pem -r -o StrictHostKeyChecking=no dist/* ec2-user@54.241.138.36:/var/www/html/pb_public/

echo "=== Deployment Completed! ==="
echo "The frontend is now hosted on your EC2 instance."
echo "Visit http://54.241.138.36 or https://pestyfi.com to view the live site."
