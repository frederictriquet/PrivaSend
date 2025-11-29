#!/bin/bash

# Script de test pour l'API d'upload de PrivaSend
# Usage: ./test-upload.sh [file_path]

set -e

# Configuration
API_URL="${API_URL:-http://localhost:5173/api/upload}"
FILE_PATH="${1:-}"

# Couleurs pour l'output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "  PrivaSend Upload Test Script"
echo "========================================="
echo ""

# Vérifier si un fichier est fourni
if [ -z "$FILE_PATH" ]; then
    echo -e "${YELLOW}No file specified. Creating test file...${NC}"
    TEST_FILE="test-file-$(date +%s).txt"
    echo "This is a test file created at $(date)" > "$TEST_FILE"
    echo "Lorem ipsum dolor sit amet, consectetur adipiscing elit." >> "$TEST_FILE"
    FILE_PATH="$TEST_FILE"
    echo -e "${GREEN}Created test file: $FILE_PATH${NC}"
    echo ""
fi

# Vérifier que le fichier existe
if [ ! -f "$FILE_PATH" ]; then
    echo -e "${RED}Error: File '$FILE_PATH' not found${NC}"
    exit 1
fi

# Obtenir les informations du fichier
FILE_SIZE=$(stat -f%z "$FILE_PATH" 2>/dev/null || stat -c%s "$FILE_PATH" 2>/dev/null)
FILE_NAME=$(basename "$FILE_PATH")

echo "File: $FILE_NAME"
echo "Size: $FILE_SIZE bytes ($(numfmt --to=iec-i --suffix=B $FILE_SIZE 2>/dev/null || echo "$FILE_SIZE bytes"))"
echo "API URL: $API_URL"
echo ""

# Uploader le fichier
echo -e "${YELLOW}Uploading...${NC}"
echo ""

RESPONSE=$(curl -X POST "$API_URL" \
    -F "file=@$FILE_PATH" \
    -w "\n%{http_code}" \
    -s)

# Séparer le corps de la réponse et le code HTTP
HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

echo ""
echo "HTTP Status: $HTTP_CODE"
echo ""

# Vérifier le code de statut
if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Upload successful!${NC}"
    echo ""
    echo "Response:"
    echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"

    # Extraire le fileId
    FILE_ID=$(echo "$HTTP_BODY" | jq -r '.fileId' 2>/dev/null || echo "")
    if [ -n "$FILE_ID" ] && [ "$FILE_ID" != "null" ]; then
        echo ""
        echo -e "${GREEN}File ID: $FILE_ID${NC}"
        echo "Keep this ID for future reference (download link generation in Phase 1.2)"
    fi
else
    echo -e "${RED}✗ Upload failed${NC}"
    echo ""
    echo "Response:"
    echo "$HTTP_BODY"
fi

echo ""
echo "========================================="

# Nettoyer le fichier de test si créé
if [ -n "$TEST_FILE" ] && [ -f "$TEST_FILE" ]; then
    rm "$TEST_FILE"
    echo "Cleaned up test file"
fi
