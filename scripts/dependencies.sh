#!/usr/bin/env bash
#
#
# main()
#
{
  BLUE="\e[34m"
  GREEN="\e[32m"
  RED="\e[31m"
  YELLOW="\e[33m"
  NOCOLOR="\e[39m"

  printf "${YELLOW}Reset existing build dependencies...${NOCOLOR}"
  rm -rf -- ./node_modules
  npm install

  printf $BLUE
  echo "Confirm and update build dependencies..."

  DEPS_UPDATE=$(ncu "$@");
  echo $DEPS_UPDATE

  DEPS_LOG=$(ncu);
  echo $DEPS_LOG

  printf $NOCOLOR
  printf "${YELLOW}Generate dependency log...${NOCOLOR}"
  echo "Curiosity dependency update log" > ./dependency-update-log.txt
  echo "$DEPS_UPDATE" >> ./dependency-update-log.txt
  echo "$DEPS_LOG" >> ./dependency-update-log.txt
  printf "${GREEN}COMPLETED${NOCOLOR}\n"
  printf "${YELLOW}Log generated at ./dependency-update-log.txt${NOCOLOR}\n"
}
