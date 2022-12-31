# pull all repositories
find ./projects -maxdepth 1 -type d \( ! -name . \) -exec bash -c "cd '{}'; pwd; git pull;" \;

mkdir -p log
python3 src/main.py 

cp ./log/*.json ./webgui/src/assets/

