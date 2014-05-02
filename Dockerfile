# DOCKER-VERSION 0.10.0

FROM ubuntu:latest

RUN apt-get -y install nodejs

ADD . /src

EXPOSE 8888

CMD cd /src; nodejs hooks.js
