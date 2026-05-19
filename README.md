# Fidelity [![CI](https://github.com/daggerok/fidelity/actions/workflows/ci.yaml/badge.svg)](https://github.com/daggerok/fidelity/actions/workflows/ci.yaml) [![GitHub Pages](https://github.com/daggerok/fidelity/actions/workflows/github-pages.yml/badge.svg)](https://github.com/daggerok/fidelity/actions/workflows/github-pages.yml)

[Fidelity investments analyzer](https://daggerok.github.io/fidelity/)

Bun build requirements:

```bash
nvm install --lts
nvm alias default 'lts/*'

echo '
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
' >> ~/.zshrc
source ~/.zshrc
```
