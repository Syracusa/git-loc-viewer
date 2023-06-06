repository_domain="https://github.com/Syracusa/"
projects=()
projects+=("bbb-dd-examples")
projects+=("sy-technotes")
projects+=("sy-misc")
projects+=("sy_cpp_boilerplate")
projects+=("pywebsock-boilerplate")
projects+=("sy-angular-boilerplate")
projects+=("linux-c-boilerplate")
projects+=("VolatileTextEditor")
projects+=("source-graph")
projects+=("sy-msg-window")
projects+=("sy-rust-boilerplate")
projects+=("my-openssl-examples")
projects+=("time-wheel")
projects+=("CodingTest")
projects+=("git-loc-viewer")
projects+=("sy-visual-logger")
projects+=("sy-gstreamer-example")
projects+=("ng-d3-examples")
projects+=("sy-3d-simulator")
projects+=("sy-netsim")

cd projects
for prj in ${projects[@]}; do
    git clone ${repository_domain}${prj}
done
