# DOCKER-VERSION 0.10.0

FROM ubuntu:14.04

RUN apt-get -y install node

ADD . /src

EXPOSE 8888

CMD node /src/hooks.js