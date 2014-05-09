# DOCKER-VERSION 0.11.0

FROM ubuntu:14.04

RUN apt-get -y install nodejs

ADD . /src

EXPOSE 8888

CMD cd /src; nodejs bugger.js >> logfile 2>&1
