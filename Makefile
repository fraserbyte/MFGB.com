# ============================================================================
# Messerschmitt Foundation of Great Britain — Docker helper commands
# ============================================================================

.PHONY: build run stop restart logs ps clean

## Build the image
build:
	docker build -t mfgb-site:latest .

## Build and start the container (recommended)
run:
	docker compose up -d --build

## Stop and remove the container
stop:
	docker compose down

## Rebuild and restart after pulling new code
restart:
	git pull
	docker compose up -d --build

## Tail container logs
logs:
	docker compose logs -f

## Show container status
ps:
	docker compose ps

## Stop and remove containers + local image
clean:
	docker compose down --rmi local --volumes
