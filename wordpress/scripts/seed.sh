#!/usr/bin/env bash
# Wrapper for seed-portfolio-content.php
# Usage:
#   ./seed.sh local                                 — seed local Docker WP
#   DEV_SSH_HOST=bitnami@<ip>  ./seed.sh dev        — seed remote dev WP over SSH
#   PROD_SSH_HOST=admin@<ip>   ./seed.sh prod       — seed remote prod WP over SSH
#
# Env vars for remote modes (read at runtime, not committed):
#   <ENV>_SSH_HOST  required  e.g. "bitnami@1.2.3.4", "admin@5.6.7.8", or a ~/.ssh/config alias
#   <ENV>_SSH_KEY   optional  default: ~/.ssh/LightsailDefaultKey-us-east-1.pem
#   <ENV>_WP_PATH   optional  default depends on the blueprint (see below)
#   <ENV>_WP_USER   optional  OS user that owns WordPress; wp-cli runs as it
#
# Blueprint defaults:
#   dev  — Bitnami `wordpress` (deprecated): path /opt/bitnami/wordpress,
#          wp-cli via Bitnami's `sudo wp` wrapper (it switches user itself).
#   prod — Lightsail `wordpress_ls_1_0`: path /var/www/html, owner `admin`,
#          wp-cli via `sudo -u admin wp`.
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

# seed_remote <ENV_PREFIX> <default-wp-path> <default-wp-user|"">
# An empty wp-user means "use the image's own `sudo wp` wrapper" (Bitnami).
seed_remote() {
	local prefix="$1" default_path="$2" default_user="$3"
	local host_var="${prefix}_SSH_HOST" key_var="${prefix}_SSH_KEY"
	local path_var="${prefix}_WP_PATH" user_var="${prefix}_WP_USER"
	local host="${!host_var:-}"
	local key="${!key_var:-$HOME/.ssh/LightsailDefaultKey-us-east-1.pem}"
	local wp_path="${!path_var:-$default_path}"
	local wp_user="${!user_var:-$default_user}"

	if [[ -z "$host" ]]; then
		cat >&2 <<-EOF
			Error: $host_var is not set. Example:
			  $host_var=<user>@<lightsail-ip> $0 ${prefix,,}
			Optional overrides: $key_var, $path_var, $user_var
		EOF
		exit 1
	fi
	if [[ ! -f "$key" ]]; then
		echo "Error: SSH key not found at $key" >&2
		exit 1
	fi

	local wp_cmd
	if [[ -n "$wp_user" ]]; then
		wp_cmd="sudo -u $wp_user wp --path=$wp_path eval-file -"
	else
		wp_cmd="sudo wp --path=$wp_path eval-file -"
	fi

	echo "→ Seeding ${prefix,,} WordPress at $host ($wp_path)..."
	ssh -i "$key" "$host" "$wp_cmd" < "$SEED_FILE"
}

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
		seed_remote DEV /opt/bitnami/wordpress ""
		;;

	prod)
		seed_remote PROD /var/www/html admin
		;;

	*)
		echo "Usage: $0 [local|dev|prod]" >&2
		exit 1
		;;
esac

echo "✓ Done."
