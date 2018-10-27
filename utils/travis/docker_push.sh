#!/bin/bash

VERSION_TAG=`cat build/version`

echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

IMAGE_NAME=`echo $TRAVIS_REPO_SLUG | awk '{print tolower($0)}'`

if [[ "$TRAVIS_BRANCH" = "master" ]]; then
    MASTER_TAG=latest
elif [[ "$TRAVIS_BRANCH" = "develop" ]]; then
    MASTER_TAG=testing
fi

if [[ "$TRAVIS_BRANCH" = "develop" ]]; then
    SUB_TAG="testing-`date +%Y%m%d`"
fi

echo "building docker container for ${IMAGE_NAME}:${VERSION_TAG},${MASTER_TAG},${SUB_TAG} ..."

BUILD_DATE=`date --iso-8601=seconds`
VCS_REF=${TRAVIS_PULL_REQUEST_SHA}

docker build -t $IMAGE_NAME:$VERSION_TAG --build-arg BUILD_DATE --build-arg VERSION_TAG --build-arg TRAVIS_JOB_NUMBER --build-arg TRAVIS_PULL_REQUEST.
docker tag "${IMAGE_NAME}:${VERSION_TAG}" "${IMAGE_NAME}:${MASTER_TAG}"
docker push "${IMAGE_NAME}:${MASTER_TAG}"
docker push "${IMAGE_NAME}:${VERSION_TAG}"

if [[ "$SUB_TAG" != "" ]]; then
    docker tag "${IMAGE_NAME}:${VERSION_TAG}" "${IMAGE_NAME}:${SUB_TAG}"
    docker push "${IMAGE_NAME}:${SUB_TAG}"
fi