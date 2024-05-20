# Create dir if it does not exist
if [ ! -d "$init_path" ]; then
	mkdir -p "$init_path"
fi

# Check if init_path direcfory is not empty
if [ "$(ls -A $init_path)" ]; then
	echo "Directory $init_path is not empty. Please provide an empty directory to initialize the project."
	exit 1
fi


# If template is not empty, git clone template to init_path
if [ ! -z "$template" ]; then
	git clone "$template" "$init_path"
	rm -rf "$init_path/.git"
fi

# Fixes weird sed error
LANG=C

# Replace TenUpTheme in all files inside init_path with $name_camel_case recursively
find "$init_path" -type f -exec sed -i '' -e "s/TenUpTheme/${name_camel_case}Theme/g" {} \;
find "$init_path" -type f -exec sed -i '' -e "s/TenUpPlugin/${name_camel_case}Plugin/g" {} \;

# Replace TENUP_
find "$init_path" -type f -exec sed -i '' -e "s/TENUP_/${name_uppercase_underscore}_/g" {} \;

# Replace tenup_
find "$init_path" -type f -exec sed -i '' -e "s/tenup_/${name_lowercase_underscore}_/g" {} \;

rsync -rc $toolkit_path/project/local/ $init_path
