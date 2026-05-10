#!/usr/bin/env bash
# Wrapper for seed-portfolio-content.php
# Usage:
#   ./seed.sh local                                — seed local Docker WP
#   DEV_SSH_HOST=bitnami@<ip> ./seed.sh dev        — seed remote WP over SSH
#
# Env vars for dev mode (read at runtime, not committed):
#   DEV_SSH_HOST  required  e.g. "bitnami@1.2.3.4" or a ~/.ssh/config alias
#   DEV_SSH_KEY   optional  default: ~/.ssh/LightsailDefaultKey-us-east-1.pem
#   DEV_WP_PATH   optional  default: /opt/bitnami/wordpress (Bitnami stack)
#
# Idempotent — re-running upserts by slug, no duplicates.
# See documentation/portfolio_content_plan.md for content source.

set -euo pipefail

TARGET="${1:-local}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SEED_FILE="$SCRIPT_DIR/seed-portfolio-content.php"

if [[ ! -f "$SEED_FILE" ]]; then
	echo "Error: $SEED_FILE not found" >&2
	exit 1
fi

case "$TARGET" in
	local)
		echo "→ Seeding local Docker WordPress (rae-portfolio-wp)..."
		if ! docker ps --format '{{.Names}}' | grep -q '^rae-portfolio-wp$'; then
			echo "Error: container 'rae-portfolio-wp' not running. Start it with 'docker-compose up -d'." >&2
			exit 1
		fi
		docker exec -i rae-portfolio-wp wp eval-file - --allow-root < "$SEED_FILE"
		;;

	dev)
		# Bitnami's wp-cli wrapper manages user/permission switching
		# internally, so call via plain `sudo wp` (not `sudo -u <user>`).
		DEV_SSH_KEY="${DEV_SSH_KEY:-$HOME/.ssh/LightsailDefaultKey-us-east-1.pem}"
		DEV_WP_PATH="${DEV_WP_PATH:-/opt/bitnami/wordpress}"

		if [[ -z "${DEV_SSH_HOST:-}" ]]; then
			cat >&2 <<-EOF
				Error: DEV_SSH_HOST is not set. Example:
				  DEV_SSH_HOST=bitnami@<lightsail-ip> $0 dev
				Optional overrides: DEV_SSH_KEY, DEV_WP_PATH
			EOF
			exit 1
		fi
		if [[ ! -f "$DEV_SSH_KEY" ]]; then
			echo "Error: SSH key not found at $DEV_SSH_KEY" >&2
			exit 1
		fi

		echo "→ Seeding dev WordPress at $DEV_SSH_HOST ($DEV_WP_PATH)..."
		ssh -i "$DEV_SSH_KEY" "$DEV_SSH_HOST" \
			"sudo wp --path=$DEV_WP_PATH eval-file -" < "$SEED_FILE"
		;;

	*)
		echo "Usage: $0 [local|dev]" >&2
		exit 1
		;;
esac

echo "✓ Done."
