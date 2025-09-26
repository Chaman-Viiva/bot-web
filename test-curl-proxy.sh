#!/bin/bash

# Test DataImpulse proxy with different zip codes
echo "🧪 Testing DataImpulse Proxy with curl"
echo "======================================"

# Test with zip code 90001 (Los Angeles)
echo "🌍 Testing with zip code 90001 (Los Angeles)..."
curl -x "http://a982b9ce637b7411812a__cr.us;zip.90001:552bb8df5019ce0b@gw.dataimpulse.com:823" https://api.ipify.org?format=json

echo -e "\n"

# Test with zip code 10001 (New York)
echo "🌍 Testing with zip code 10001 (New York)..."
curl -x "http://a982b9ce637b7411812a__cr.us;zip.10001:552bb8df5019ce0b@gw.dataimpulse.com:823" https://api.ipify.org?format=json

echo -e "\n"

# Test with zip code 60601 (Chicago)
echo "🌍 Testing with zip code 60601 (Chicago)..."
curl -x "http://a982b9ce637b7411812a__cr.us;zip.60601:552bb8df5019ce0b@gw.dataimpulse.com:823" https://api.ipify.org?format=json

echo -e "\n"

# Test location info
echo "🌍 Testing location info with zip code 90001..."
curl -x "http://a982b9ce637b7411812a__cr.us;zip.90001:552bb8df5019ce0b@gw.dataimpulse.com:823" https://ipapi.co/json/

echo -e "\n"
echo "✅ Curl tests completed!"
