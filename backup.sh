#!/bin/bash

BACKUP_NAME="workspace_backup_$(date +%Y%m%d_%H%M%S).tar.gz"

tar --exclude=".git" --exclude="node_modules" --exclude="*.tar.gz" --exclude=".vscode/extensions" -czf "$BACKUP_NAME" .

echo "Backup created: $BACKUP_NAME"