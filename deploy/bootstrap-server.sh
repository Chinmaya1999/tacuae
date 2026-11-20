#!/usr/bin/env bash
# One-time (idempotent) server preparation. Run as root:  sudo bash bootstrap-server.sh <deploy-user>
set -euo pipefail
DEPLOY_USER="${1:-${SUDO_USER:-ubuntu}}"
# shellcheck disable=SC1091
os_name=$(. /etc/os-release && echo "$PRETTY_NAME")
echo "arch: $(uname -m)   os: $os_name   user: $DEPLOY_USER"
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker
usermod -aG docker "$DEPLOY_USER"
docker compose version >/dev/null 2>&1 || { echo "docker compose plugin missing" >&2; exit 1; }
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" -m 750 /opt/tac
# small instances: add 1 GB swap so image pulls don't run out of memory
if [ "$(awk '/MemTotal/{print int($2/1024)}' /proc/meminfo)" -lt 1800 ] && ! swapon --show | grep -q .; then
  fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
echo "bootstrap complete. Open ports 80, 443, 8081, 8082 (and 22) in the AWS security group."
