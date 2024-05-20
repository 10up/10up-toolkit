# Add builds scripts here. This script will be run from the root of your project (same directory as .tenup.yml).

composer install --no-dev
nvm install
node -v
npm install
