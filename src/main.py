import os
import datetime
import json

DO_VERBOSE = 0

# Exclude some directories and files by their name
exclude_dirs =  set(['build', 'env', '.vscode', 'node_modules', 'ext', 'environments'])
exclude_files =  set(['projects', 'karma.conf.js', 'MainForm.Designer.cs'])

# File extensions to count
extensions = ('.c', '.h', '.cpp', '.ts', '.js', '.html', '.py', '.sh', '.rs', '.md', '.cs')

# Dictionary to save all stat
locs = {}

def make_data_information():
    info = {}
    
    lgd = "./log/"
    lf = lgd + "datainfo.json"
    if os.path.exists(lf):
        os.remove(lf)
        
    info['files'] = []
    for d in os.listdir(lgd):
        if os.path.isfile(os.path.join(lgd, d)):
            if get_file_extension(d) == '.json':
                info['files'].append(d)

    info['files'].sort()
    info['extensions'] = extensions
    
    with open(lf, "w") as f:
        f.write(json.dumps(info, indent = 4))

# Save data to json file
def do_log(data :dict):
    # Save file with yy-mm-dd.json
    now = datetime.datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    filename = f"./log/{date_str}.json"
    with open(filename, "w") as f:
        f.write(json.dumps(data, indent = 4))
        
# Get extension from file name
def get_file_extension(filename):
    return os.path.splitext(filename)[1]

# Set all key to zero
def init_extension_locs(extension_locs: dict):
    for e in extensions:
        extension_locs[e] = 0

# Remove key(extension) if count is zero
def prune_extension_locs(extension_locs: dict):
    for e in extensions:
        if (extension_locs[e] == 0):
            del extension_locs[e]

# Count loc of all repositories
def count_loc(path):
    loc_acc = 0
    directories = [d for d in os.listdir(path) if os.path.isdir(os.path.join(path, d))]
    for d in directories:
        loc_acc += count_loc_repo(path, d)
    return loc_acc

# Count loc in one repository
def count_loc_repo(path, reponame):  
    repo_loc = 0
    locs[reponame] = {}
    init_extension_locs(locs[reponame])
    for root, dirs, files in os.walk(os.path.join(path, reponame), topdown=True):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        files[:] = [f for f in files if f not in exclude_files]
        for file in files:
            if file.endswith(extensions):
                with open(os.path.join(root, file), 'r') as f:
                    ext = get_file_extension(f.name)
                    
                    floc = len(f.readlines())
                    locs['All'][ext] += floc
                    locs[reponame][ext] += floc
                    
                    repo_loc += floc
                    
                    if DO_VERBOSE:
                        print(f'file {file} loc {floc}')
    prune_extension_locs(locs[reponame])
    return repo_loc

# Main logic
locs['All'] = {}
init_extension_locs(locs['All'])

repo_path = './projects/'
loc = count_loc(repo_path)
print(f'Number of lines of code in the repositories: {loc}')

prune_extension_locs(locs['All'])
print(json.dumps(locs, indent = 4))
do_log(locs)
make_data_information()