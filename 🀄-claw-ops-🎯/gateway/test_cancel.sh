#!/bin/bash
curl -i -X POST \
  -H "Authorization: Bearer mobu_secret_token_2026_dev" \
  http://127.0.0.1:3000/v1/jobs/job_da9f4bceb3483ac9f1fa84b0/cancel
