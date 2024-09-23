#!/usr/bin/env bash -l
# NOTE: you should keep the above line, at line 1. Only modify if you know what you are doing.

# You should use npx 10up-toolkit build to build your project. When you do, there are a number of things
# you get "for free" including nvm handling and the basics of building are handled automatically. You
# only need to provide additional build routines if the default build system doesn't quite get things
# right. Adding build scripts is easy. Create as many .sh files as you need in this scripts directory.

# Here is an example script you can use to get you started It assumes you are using a "modern" layout.

# change directories to your theme or plugin
pushd .

# run your build commands
echo "Hello World!"

# return to where we were so the next build script starts off from the same place
popd
