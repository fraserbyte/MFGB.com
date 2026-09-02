# syntax=docker/dockerfile:1

# ============================================================================
# Messerschmitt Foundation of Great Britain — static site image
#
# The site is pure HTML/CSS/JS with zero build step, so the final image is
# little more than nginx serving the repository root. The build stage exists
# so that any future build tooling can be added here without touching the
# runtime stage.
# ============================================================================

# ---- Build stage (no-op today, ready for future tooling) -------------------
FROM alpine:3.20 AS build
WORKDIR /app
COPY . .

# ---- Runtime stage ----------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

# Tuned static-asset nginx config (gzip, caching, security headers).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Serve the built site from nginx's web root.
COPY --from=build /app /usr/share/nginx/html

EXPOSE 80

# Container healthcheck (busybox wget ships with the nginx alpine image).
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://localhost/ || exit 1