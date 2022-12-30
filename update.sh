git submodule foreach git pull
mkdir -p log
python3 src/main.py 

cp ./log/*.json ./webgui/src/assets/