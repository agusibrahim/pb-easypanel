LATEST_RELEASE=$(curl -s https://api.github.com/repos/pocketbase/pocketbase/releases/latest | grep -o '"tag_name": "*[^"]*"' | head -n 1 | sed 's/"tag_name": "//' | sed 's/"//')
VERSION="${LATEST_RELEASE#v}"
DATA_DIR=/app/data/pb_data

curl -L "https://github.com/pocketbase/pocketbase/releases/download/${LATEST_RELEASE}/pocketbase_${VERSION}_linux_amd64.zip" -o pocketbase.zip
unzip -o pocketbase.zip
rm pocketbase.zip
chmod +x pocketbase
./pocketbase serve --http=0.0.0.0:80 --dir=${DATA_DIR} &
