# LOC-Counter
Count line of code in your git repositories.

# How to use
1. See src/main.py and modify exclude_dirs and exclude_files as you want
2. Add your repositories to init.sh
3. ./init.sh
4. ./update.sh
5. LOC log will be generated at ./log/ as json style

***

+ Output sample
```
{
    "All": {
        ".c": 3766,
        ".h": 1053,
        ".cpp": 702,
        ".ts": 456,
        ".js": 722,
        ".html": 145,
        ".py": 1618,
        ".sh": 461,
        ".rs": 139,
        ".md": 985,
        ".cs": 186
    },
    "CodingTest": {
        ".py": 518
    },
    "sy-msg-window": {
        ".c": 1379,
        ".h": 162,
        ".py": 701,
        ".rs": 3,
        ".md": 6
    },
    "sy-rust-boilerplate": {
        ".rs": 136,
        ".md": 1
    },
    "source-graph": {
        ".js": 722,
        ".html": 82,
        ".py": 218,
        ".sh": 197
    },
    "sy-technotes": {
        ".md": 789
    },
    "bbb-dd-examples": {
        ".c": 544,
        ".h": 23,
        ".sh": 12,
        ".md": 27
    },
    "linux-c-boilerplate": {
        ".c": 558,
        ".h": 482,
        ".sh": 9,
        ".md": 45
    },
    "my-openssl-examples": {
        ".c": 1057,
        ".h": 60,
        ".sh": 242,
        ".md": 24
    },
    "sy-misc": {
        ".c": 7,
        ".sh": 1
    },
    "VolatileTextEditor": {
        ".md": 3,
        ".cs": 186
    },
    "time-wheel": {
        ".c": 221,
        ".h": 129,
        ".md": 34
    },
    "sy_cpp_boilerplate": {
        ".h": 197,
        ".cpp": 702,
        ".md": 29
    },
    "pywebsock-boilerplate": {
        ".py": 181
    },
    "sy-angular-boilerplate": {
        ".ts": 456,
        ".html": 63,
        ".md": 27
    }
}
```
