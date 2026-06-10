#!/bin/bash
set -e

echo "=== 1. Installing Nginx ==="
sudo dnf install -y nginx || sudo yum install -y nginx

echo "=== 1.5. Preparing Web Root Directory ==="
sudo mkdir -p /var/www/html/pb_public
sudo chown -R ec2-user:ec2-user /var/www/html/pb_public

echo "=== 2. Creating Nginx Site Configuration ==="
sudo tee /etc/nginx/conf.d/pestyfi.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name pestyfi.com www.pestyfi.com pestyfi.in www.pestyfi.in;

    # Serve static frontend files directly
    root /var/www/html/pb_public;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
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
}

EOF

echo "=== 3. Updating PocketBase systemd service to use port 8090 ==="
sudo tee /etc/systemd/system/pocketbase.service > /dev/null << 'EOF'
[Unit]
Description=PocketBase Service
After=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/home/ec2-user/pocketbase
ExecStart=/home/ec2-user/pocketbase/pocketbase serve --http="127.0.0.1:8090"
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

echo "=== 4. Reloading systemd and restarting PocketBase ==="
sudo systemctl daemon-reload
sudo systemctl stop pocketbase || true
sudo systemctl restart pocketbase
sudo systemctl enable pocketbase

echo "=== 5. Starting Nginx ==="
sudo systemctl stop nginx || true
sudo systemctl start nginx
sudo systemctl enable nginx

echo "=== 6. Installing Certbot & configuring SSL ==="
if ! command -v certbot &> /dev/null; then
    sudo dnf install -y certbot python3-certbot-nginx || sudo yum install -y certbot python3-certbot-nginx || true
fi

if ! command -v certbot &> /dev/null; then
    sudo dnf install -y python3-pip || sudo yum install -y python3-pip || true
    sudo pip3 install certbot certbot-nginx
fi

echo "=== 7. Running Certbot for SSL Certificate ==="
# Try running with nginx plugin automatically
if command -v certbot &> /dev/null; then
    sudo certbot --nginx -d pestyfi.com -d www.pestyfi.com -d pestyfi.in -d www.pestyfi.in --non-interactive --agree-tos --register-unsafely-without-email || true
else
    echo "Warning: Certbot could not be installed automatically. Please install it manually."
fi

echo "=== 8. Reloading Nginx ==="
sudo systemctl reload nginx || true

echo "=== Nginx & SSL Setup Complete! ==="
