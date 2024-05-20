maybe_init_nvm() {

  if [ $(find . -name .nvmrc | wc -l) -gt 0 ] && [ ! -f $NVM_DIR/nvm.sh ]; then
    echo "This project requires nvm. Please install nvm and try again"
    exit 1
  fi

  . $NVM_DIR/nvm.sh
}

maybe_init_nvm
