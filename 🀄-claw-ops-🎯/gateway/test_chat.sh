#!/bin/bash
curl -i -X POST \
  -H "Authorization: Bearer mobu_secret_token_2026_dev" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello MobU, execute initial project system validation!"}' \
  http://127.0.0.1:3000/v1/chat
