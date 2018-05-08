#!/bin/bash
aws --profile samanage-sandbox s3api list-buckets | node -e "\
  const fs = require('fs');\
  const data = fs.readFileSync('/dev/stdin', 'utf-8');\
  console.log('user ID:', JSON.parse(data).Owner.ID);\
  /**/"