#!/bin/bash
echo "$LITELLM_CONFIG_CONTENT" > /app/litellm-config.yaml
litellm --config /app/litellm-config.yaml --port 4000