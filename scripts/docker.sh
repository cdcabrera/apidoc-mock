#!/usr/bin/env bash
#
#
# main()
#
{
  CONTAINER="apidoc-mock"
  NAME="mock-api"
  PORT=8000

  echo "Setting up Docker demo container"
  docker build -t $CONTAINER .

  # docker run -i --rm -p $PORT:8000 --name $NAME -t $CONTAINER
  exit 0
}
