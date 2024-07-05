#!/bin/bash

download() {
	if [ `which curl` ]; then
		curl -s "$1" > "$2";
	elif [ `which wget` ]; then
		wget -nv -O "$2" "$1"
	fi
}

rm -rf payload
mkdir payload
cd payload

echo "Downloading WordPress $WORDPRESS_VERSION..."
download https://wordpress.org/wordpress-${WORDPRESS_VERSION}.tar.gz wordpress.tar.gz
tar --strip-components=1 -zxmf wordpress.tar.gz -C .
rm wordpress.tar.gz

rsync -avz --exclude-from=$rsync_file_excludes_absolute $project_root/$deploy_from $deploy_to_subdir
