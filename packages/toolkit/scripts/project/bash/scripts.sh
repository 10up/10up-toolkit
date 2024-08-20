#!/usr/bin/env bash -l

SHARE_DIR="$(dirname "$(realpath "$0")")"
# Various tasks to determine some things like what kind of project is this
# such as wpparent, wp-content rooted...something else?
function build:preflight {
  PROJECT_TYPE="wpparent"
  # Check for a parent layout that has a wordpress directory
  if [ -d wordpress ] && [ -d build ]; then # this is probably a wpparent setup
    echo "Detected wpparent WordPress repository layout"

    WORDPRESS_BUILD_ROOT="wordpress/wp-content"
    return
  fi

  # Check for a wp-content rooted style repository
  if [ -d plugins ] || [ -d themes ]; then # this is probably a wp-root repo
    echo "Detected wp-content rooted WordPress repository layout"
    PROJECT_TYPE="wpcontent"
    WORDPRESS_BUILD_ROOT="."
    return
  fi

}


# Routine to determine what version of WordPress to install
function build:version {

	# If the WORDPRESS_VERSION is not set, set to "latest"
	if [ -z ${WORDPRESS_VERSION} ]; then
		WORDPRESS_VERSION="latest"
	fi

  if [ "${WORDPRESS_VERSION}" == "latest" ]; then
    WORDPRESS_VERSION=$(curl -s https://api.wordpress.org/core/version-check/1.7/ | jq '.offers[0].current' | tr -d '"')
  fi

  echo ${WORDPRESS_VERSION}
}

function build:install {
  build:preflight

  # we use command in case wp-cli is installed as an alias
  if [[ -z $(command -v wp) ]]; then
    echo "wp-cli is not installed or in your path but it is required"
    exit 1
  fi

  local WORDPRESS_VERSION=$(build:version)
  echo "Installing WordPress version: ${WORDPRESS_VERSION}"

  if [ ${PROJECT_TYPE} = "wpparent" ]; then
    mkdir -p wordpress/wp-content
    pushd wordpress
  else
    mkdir -p payload/wp-content
    pushd payload
  fi
  wp core download --version=${WORDPRESS_VERSION} --skip-content --force
  popd

}

function build:main {
  set -eo pipefail

  build:preflight

  # don't call this script directly
  if [ $(shopt -q login_shell) ]; then
    echo "Do not call this script directly."
    exit 1
  fi

  # This is your "main" build file. By default, it builds a 10up/wp-scaffold style project
  # but you are free to modify it as required for your project. Remember, you can also
  # drop in any number of scripts and they will be run in alphabetical order AFTER main.sh

  # detect if this is a wpparent layout or not

  if [ ${PROJECT_TYPE} == "wpparent" ]; then
    pushd wordpress/wp-content
  elif [ -d plugins ]; then
    pushd . # go no where, we are already in the right spot
  fi
  if [ "${CI:-false}" = "true" ] && [ -f composer.json ]; then
    if [ ! -f composer.lock ] && [ -f composer.json ]; then
      echo "No composer.lock file detected. You should create/commit an up to date composer.lock file!"
      exit 1
    else
      composer install --no-dev
    fi
  elif [ -f composer.json ]; then
    composer install
  fi


  if [ -f package.json ]; then
    # Ensure we have the correct node version installed
    nvm install
    nvm use

    if [ "${CI:-false}" = "true" ] && [ -f package.json ]; then
      if [ -f package-lock.json ]; then
        npm ci
      else
        echo "No package-lock.json file detected. You should create/commit an up to date package-lock.json file!"
        exit 1
      fi
    else
      npm install
    fi

    npm run build
  fi

	if [ ${PROJECT_TYPE} == "wpparent" ]; then
  	popd
	fi
}

function build:local {
  set -eo pipefail
  # Create additional build scripts in the build directory with a .sh
  # extension. They should do their work inside the wordpress directory.

  # We always call main.sh first
  build:preflight
  build:main

  # Then call any other drop in scripts next
  for I in $(ls scripts/*sh)
  do
    . $I
  done
}

# Perform a CI like build
function build:full {
  set -eo pipefail

  build:preflight
  build:install
  build:local

  # This rsync will typically work but if you have integrated the CI Library
  # into a non project template based project you should adjust it

  # First determine if we are using a project rsync-exclude or the included one
  if [ -f scripts/rsync-excludes.txt ]; then
    RSYNC_EXCLUDES="scripts/rsync-excludes.txt"
  fi

  if [ ${PROJECT_TYPE} == "wpparent" ]; then
    rsync -a --exclude-from=${RSYNC_EXCLUDES} wordpress/ payload/
  else
    for I in themes mu-plugins plugins
    do
      if [ -d $I ]; then
        rsync -a --exclude-from=${RSYNC_EXCLUDES} $I/ payload/wp-content/$I
      fi
    done
  fi

}

function build:update-composer {

  build:preflight

  if [ ${PROJECT_TYPE} == "wpparent" ]; then
    pushd wordpress/wp-content
  else
    pushd .
  fi

  if [ ! composer.json ]; then
    echo "No composer.json file found. Run this from the root of a project and try again."
    exit 1
  fi

  for I in $(find . -maxdepth 1 -name composer.json)
  do
    composer update --no-install
  done

  pushd themes
  for I in $(find . -maxdepth 2 -name composer.json)
  do
    pushd $(dirname $I)
    composer update --no-install
    popd
  done

  popd
  popd
}

function build:initialize-git {
  git init .
  echo
  echo
  echo 'Git has been initialized. Please run "git remote add origin <project git url>" to set the remote repository location.'
}

function build:package {

  if [ -z $(which docker) ]; then
    echo "You don't seem to have Docker installed but it is required for this to work."
    exit 1
  fi

  if [ ! -d payload ]; then
    echo "No payload directory found. Please run 10up-toolkit project build --type=full first."
    exit 1
  fi

  # First determine if we are using a project Dockerfile or the included one
  if [ -f Dockerfile ]; then
    DOCKERFILE="Dockerfile"
  else
    DOCKERFILE="${SHARE_DIR:?}/Dockerfile"
  fi
   # FIXME: This should be updated to use variables from .tenup-ci.yml
  docker buildx build --load -f ${DOCKERFILE} . -t tenup-project:latest
}


# Converts a git branch to a gitlab compatible slug
function utilities:create-gitlab-slug {
  local VALUE=$(echo $1 | sed 's/[^a-zA-Z0-9]/-/g' | awk '{print tolower($0)}')

  echo ${VALUE}
}

eval build:$@
