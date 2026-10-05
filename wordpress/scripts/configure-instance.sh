#!/usr/bin/env bash
# Post-boot configuration for a WordPress-by-Lightsail instance
# (`wordpress_ls_1_0`). Idempotent — safe to re-run.
#
# The same steps live in the CDK user-data setup script
# (infrastructure/lib/rae-portfolio-stack.ts) and run automatically on a
# fresh instance. This script exists to apply them to an instance that is
# already running (user-data only runs at first boot), and to be the
# reviewable record of what was applied by hand.
#
# Usage:
#   PROD_SSH_HOST=admin@<ip> ./configure-instance.sh prod
#   DEV_SSH_HOST=admin@<ip>  ./configure-instance.sh dev     (after dev's migration)
#
# Env vars: <ENV>_SSH_HOST (required), <ENV>_SSH_KEY (default
# ~/.ssh/LightsailDefaultKey-us-east-1.pem).
#
# What it does:
#   1. Enables mod_rewrite and AllowOverride for /var/www/html — the image
#      ships with neither, so pretty permalinks (and WPS Hide Login's custom
#      login slug) 404 at Apache. The REST API works regardless because it
#      uses ?rest_route=, which is why this went unnoticed.
#   2. Flushes WordPress rewrite rules so .htaccess is written.
#   3. Installs unattended-upgrades for daily Debian security updates.
#   4. Makes the uploads tree group-writable by Apache (seed-created month
#      folders otherwise block uploads to posts dated in that month).

set -euo pipefail

TARGET="${1:-}"
case "$TARGET" in
	prod|dev) ;;
	*) echo "Usage: $0 [prod|dev]" >&2; exit 1 ;;
esac

prefix="$(printf '%s' "$TARGET" | tr '[:lower:]' '[:upper:]')"
host_var="${prefix}_SSH_HOST"
key_var="${prefix}_SSH_KEY"
host="${!host_var:-}"
key="${!key_var:-$HOME/.ssh/LightsailDefaultKey-us-east-1.pem}"

if [[ -z "$host" ]]; then
	echo "Error: $host_var is not set. Example: $host_var=admin@<lightsail-ip> $0 $TARGET" >&2
	exit 1
fi
if [[ ! -f "$key" ]]; then
	echo "Error: SSH key not found at $key" >&2
	exit 1
fi

echo "→ Configuring $TARGET WordPress instance at $host..."
ssh -i "$key" "$host" 'sudo bash -s' <<'REMOTE'
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

WP_ROOT=/var/www/html
if [ ! -f "$WP_ROOT/wp-load.php" ]; then
  echo "ERROR: $WP_ROOT is not a WordPress install (is this the Lightsail image?)" >&2
  exit 1
fi

# 1. Pretty permalinks: mod_rewrite + AllowOverride for the document root.
a2enmod -q rewrite
cat > /etc/apache2/conf-available/rae-wordpress.conf <<'CONF'
# Managed by rae-dev-portfolio (wordpress/scripts/configure-instance.sh and
# the CDK setup script). Lets WordPress's .htaccess rewrite rules apply.
<Directory /var/www/html>
    AllowOverride All
</Directory>

# The image's memory-based tuning caps prefork at 5 workers on a 1 GB box.
# CloudFront holds keep-alive connections to this origin, and wp-admin fans
# out dozens of parallel requests, so 5 workers queue badly. 10 workers at
# ~50 MB each still fits; a short keep-alive frees workers sooner.
# (conf-enabled loads after mods-enabled, so these win over mpm_prefork.conf.)
MaxRequestWorkers 10
ServerLimit 10
KeepAliveTimeout 2
CONF
a2enconf -q rae-wordpress
apache2ctl -t
# restart, not reload: ServerLimit/MaxRequestWorkers are only read at startup.
systemctl restart apache2
echo "apache: mod_rewrite + AllowOverride + worker tuning applied"

# 2. WordPress's standard .htaccess. Written here rather than via
#    `wp rewrite flush --hard`: WP-CLI can't see Apache's loaded modules
#    from the command line, so WordPress silently skips writing the file.
if [ ! -f "$WP_ROOT/.htaccess" ]; then
  cat > "$WP_ROOT/.htaccess" <<'HTACCESS'
# BEGIN WordPress
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /
RewriteRule ^index\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]
</IfModule>
# END WordPress
HTACCESS
  chown admin:www-data "$WP_ROOT/.htaccess"
  chmod 664 "$WP_ROOT/.htaccess"
  echo "wordpress: .htaccess written"
else
  echo "wordpress: .htaccess already present"
fi
sudo -u admin wp --path="$WP_ROOT" rewrite flush --quiet
echo "wordpress: rewrite rules flushed"

# 3. Daily Debian security updates.
if ! dpkg -s unattended-upgrades >/dev/null 2>&1; then
  apt-get update -qq
  apt-get install -y -qq unattended-upgrades >/dev/null
fi
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'APT'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
APT
systemctl enable -q --now unattended-upgrades
echo "unattended-upgrades: enabled"

# 4. Uploads tree writable by Apache. WordPress files uploads under the
#    attached post's year/month, so a folder created by wp-cli as `admin`
#    (seeding) with the default umask is 755 and Apache (www-data) can't
#    write into it. Normalise: group www-data, dirs 2775 (setgid so new
#    subfolders inherit the group), files 664.
UPLOADS="$WP_ROOT/wp-content/uploads"
chown -R admin:www-data "$UPLOADS"
find "$UPLOADS" -type d -exec chmod 2775 {} +
find "$UPLOADS" -type f -exec chmod 664 {} +
echo "uploads: ownership and permissions normalised"

# Verify a pretty URL reaches WordPress (anything but an Apache 404).
code=$(curl -s -o /dev/null -w '%{http_code}' http://localhost/wp-login.php)
echo "http://localhost/wp-login.php -> $code"
REMOTE

echo "✓ Done."
