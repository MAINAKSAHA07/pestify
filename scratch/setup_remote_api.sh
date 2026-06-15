#!/bin/bash
set -e

echo "=== 1. Checking Node.js installation ==="
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing Node.js..."
    if command -v dnf &> /dev/null; then
        sudo dnf install -y nodejs npm
    else
        curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    fi
fi
NODE_PATH=$(which node)
echo "Node path: $NODE_PATH"
echo "Node version: $($NODE_PATH -v)"
echo "NPM version: $(npm -v)"

echo "=== 2. Installing Dependencies ==="
cd /home/ec2-user/pestify
npm install --omit=dev

echo "=== 3. Creating systemd service ==="
sudo tee /etc/systemd/system/pestyfi-api.service > /dev/null << EOF
[Unit]
Description=Pestyfi Express API Server
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/pestify
ExecStart=$NODE_PATH server/index.js
Restart=always
Environment=NODE_ENV=production
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

echo "=== 4. Enabling and starting pestyfi-api service ==="
sudo systemctl daemon-reload
sudo systemctl restart pestyfi-api
sudo systemctl enable pestyfi-api

echo "=== 5. Updating Nginx config ==="
NGINX_CONF="/etc/nginx/conf.d/pestyfi.conf"
if ! sudo grep -q "location /api/whatsapp/" "$NGINX_CONF"; then
    echo "Adding proxy locations to Nginx config..."
    sudo cp "$NGINX_CONF" "${NGINX_CONF}.bak"
    
    sudo tee "$NGINX_CONF" > /dev/null << 'EOL'
server {
    server_name pestyfi.com www.pestyfi.com pestyfi.in www.pestyfi.in;

    # Serve static frontend files directly
    root /var/www/html/pb_public;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy WhatsApp requests to Express API
    location /api/whatsapp/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy Facebook requests to Express API
    location /api/facebook/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy API and Admin requests to PocketBase
    location /api/ {
        proxy_pass http://127.0.0.1:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /_/ {
        proxy_pass http://127.0.0.1:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/pestyfi.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/pestyfi.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = www.pestyfi.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = pestyfi.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = www.pestyfi.in) {
        return 301 https://$host$request_uri;
    }

    if ($host = pestyfi.in) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    server_name pestyfi.com www.pestyfi.com pestyfi.in www.pestyfi.in;
    return 404; # managed by Certbot
}
EOL
    
    echo "Nginx config updated."
    sudo systemctl reload nginx
    echo "Nginx reloaded."
else
    echo "Proxy locations already present in Nginx config."
fi

echo "=== Setup completed successfully! ==="
