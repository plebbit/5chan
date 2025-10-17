#!/usr/bin/env bash

# deploy html to a server and then add html to ipfs

# go to current folder
cd "$(dirname "$0")"

# add env vars
if [ -f ../.deploy-env ]; then
  export $(echo $(cat ../.deploy-env | sed 's/#.*//g'| xargs) | envsubst)
fi

# check creds
if [ -z "${DEPLOY_HOST+xxx}" ]; then echo "DEPLOY_HOST not set" && exit; fi
if [ -z "${DEPLOY_USER+xxx}" ]; then echo "DEPLOY_USER not set" && exit; fi
if [ -z "${DEPLOY_PASSWORD+xxx}" ]; then echo "DEPLOY_PASSWORD not set" && exit; fi

# save version
5chan_VERSION=$(node -e "console.log(require('../package.json').version)")
5chan_HTML_NAME="5chan-html-$5chan_VERSION"

SCRIPT="
# download html
cd ~
rm $5chan_HTML_NAME.zip
rm -fr $5chan_HTML_NAME
wget https://github.com/plebbit/5chan/releases/download/v$5chan_VERSION/$5chan_HTML_NAME.zip || exit

# extract html
unzip $5chan_HTML_NAME.zip || exit
rm $5chan_HTML_NAME.zip || exit

# add to ipfs
CID=\`ipfs add --recursive --pin --quieter $5chan_HTML_NAME | tail -n 1\`
ipfs pin add --recursive \"\$CID\"

# start ipfs daemon if not started
ipfs init
nohup ipfs daemon &

# the CID of 5chan html, add this CID to ENS
sleep 3
echo \"\"
CID=\`ipfs cid base32 \$CID\`
echo $5chan_HTML_NAME \"CID: \$CID\"
echo \"\"
"

# execute script over ssh
echo "$SCRIPT" | sshpass -p "$DEPLOY_PASSWORD" ssh "$DEPLOY_USER"@"$DEPLOY_HOST"
