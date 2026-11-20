#!/usr/bin/env bash
# One-time (idempotent) server preparation. Run as root:  sudo bash bootstrap-server.sh <deploy-user>
# Supports Amazon Linux 2023 and Debian/Ubuntu.
set -euo pipefail
DEPLOY_USER="${1:-${SUDO_USER:-ec2-user}}"
# shellcheck disable=SC1091
. /etc/os-release
echo "arch: $(uname -m)   os: $PRETTY_NAME   user: $DEPLOY_USER"

if ! command -v docker >/dev/null; then
  case "${ID}" in
    amzn) dnf install -y docker ;;
    *)    curl -fsSL https://get.docker.com | sh ;;
  esac
fi
systemctl enable --now docker
usermod -aG docker "$DEPLOY_USER"

if ! docker compose version >/dev/null 2>&1; then   # compose v2 plugin (not shipped with Amazon Linux's docker package)
  ver=$(curl -fsSL https://api.github.com/repos/docker/compose/releases/latest | grep -m1 '"tag_name"' | cut -d'"' -f4 || true)
  ver="${ver:-v2.29.7}"
  install -d /usr/local/lib/docker/cli-plugins
  curl -fsSL "https://github.com/docker/compose/releases/download/${ver}/docker-compose-linux-$(uname -m)" -o /usr/local/lib/docker/cli-plugins/docker-compose
  chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
fi
docker compose version

install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" -m 750 /opt/tac
# small instances: add 1 GB swap so image pulls / three Node apps don't run out of memory
if [ "$(awk '/MemTotal/{print int($2/1024)}' /proc/meminfo)" -lt 1800 ] && ! swapon --show | grep -q .; then
  fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
echo "bootstrap complete. Open ports 80, 443, 8081, 8082 (and 22) in the AWS security group."
