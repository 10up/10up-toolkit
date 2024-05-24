# Create dir if it does not exist
if [ ! -d "$init_path" ]; then
	mkdir -p "$init_path"
fi

# Check if init_path direcfory is not empty
if [ $(ls -A "$init_path" | wc -l) -gt 0 ]; then
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

if [ "$(uname)" = "Darwin" ]; then
	sediopt=( -i '')
else
	sediopt=( -i )
fi

set -o xtrace

# Replace TenUpTheme in all files inside init_path with $name_camel_case recursively
find "$init_path" -type f -exec sed "${sediopt[@]}" -e "s/TenUpTheme/${project_name_camel_case}Theme/g" {} \;
find "$init_path" -type f -exec sed "${sediopt[@]}" -e "s/TenupTheme/${project_name_camel_case}Theme/g" {} \;
find "$init_path" -type f -exec sed "${sediopt[@]}" -e "s/TenUpPlugin/${project_name_camel_case}Plugin/g" {} \;
find "$init_path" -type f -exec sed "${sediopt[@]}" -e "s/TenupPlugin/${project_name_camel_case}Plugin/g" {} \;

# Replace TENUP_
find "$init_path" -type f -exec sed "${sediopt[@]}" -e "s/TENUP_/${project_name_uppercase_underscore}_/g" {} \;

# Replace tenup_
find "$init_path" -type f -exec sed "${sediopt[@]}" -e "s/tenup_/${project_name_lowercase_underscore}_/g" {} \;

theme_path="$init_path/themes/${project_name_lowercase_hypen}-theme"
plugin_path="$init_path/plugins/${project_name_lowercase_hypen}-plugin"
mu_plugin_path="$init_path/mu-plugins/${project_name_lowercase_hypen}-plugin"

# Rename directory themes/tenup-theme to themes/$project_name_lowercase_hypen-theme
if [ -d "$init_path/themes/tenup-theme" ]; then
	mv "$init_path/themes/tenup-theme" "$theme_path"
fi

# Rename directory plugins/tenup-plugin to plugins/$project_name_lowercase_hypen-plugin
if [ -d "$init_path/plugins/tenup-plugin" ]; then
	mv "$init_path/plugins/tenup-plugin" "$plugin_path"
fi

# Rename directory themes/tenup-theme to themes/$project_name_lowercase_hypen-theme
if [ -d "$init_path/themes/10up-theme" ]; then
	mv "$init_path/themes/10up-theme" "$theme_path"
fi

# Rename directory plugins/tenup-plugin to plugins/$project_name_lowercase_hypen-plugin
if [ -d "$init_path/plugins/10up-plugin" ]; then
	mv "$init_path/plugins/10up-plugin" "$plugin_path"
fi

if [ -d "$init_path/mu-plugins/10up-plugin" ]; then
	mv "$init_path/mu-plugins/10up-plugin" "$mu_plugin_path"
fi

find "$init_path" -type f -exec sed "${sediopt[@]}" -e "s/tenup-theme/${project_name_lowercase_hypen}-theme/g" {} \;

find "$init_path" -type f -exec sed "${sediopt[@]}" -e "s/tenup-plugin/${project_name_lowercase_hypen}-plugin/g" {} \;

find "$init_path" -type f -exec sed "${sediopt[@]}" -e "s/10up-plugin/${project_name_lowercase_hypen}-plugin/g" {} \;

find "$init_path" -type f -exec sed "${sediopt[@]}" -e "s/tenup-wp-scaffold/${project_name_lowercase_hypen}/g" {} \;

find "$init_path" -type f -exec sed "${sediopt[@]}" -e "s/10up\/wp-theme/10up\/${project_name_lowercase_hypen}-theme/g" {} \;

find "$init_path" -type f -exec sed "${sediopt[@]}" -e "s/10up\/wp-plugin/10up\/${project_name_lowercase_hypen}-plugin/g" {} \;

find "$init_path" -type f -exec sed "${sediopt[@]}" -e "s/10up Plugin/${project_name} Plugin/g" {} \;
find "$init_path" -type f -exec sed "${sediopt[@]}" -e "s/Tenup Plugin/Project Plugin/g" {} \;
find "$init_path" -type f -exec sed "${sediopt[@]}" -e "s/10up Theme/${project_name} Theme/g" {} \;
find "$init_path" -type f -exec sed "${sediopt[@]}" -e "s/Tenup Theme/${project_name} Theme/g" {} \;

rsync -rc "$toolkit_path/project/local/" "$init_path"

composer update --no-interaction --working-dir="$init_path"

if [ -d "$theme_path" ]; then
	composer update --no-interaction --working-dir="$theme_path"
fi

if [ -d "$plugin_path" ]; then
	composer update --no-interaction --working-dir="$plugin_path"
fi

if [ -d "$mu_plugin_path" ]; then
	composer update --no-interaction --working-dir="$mu_plugin_path"
fi
