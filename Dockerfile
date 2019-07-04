FROM ubuntu:18.04
RUN apt-get update
RUN apt-get install -y apt-utils
RUN apt-get install curl -y
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -y gcc g++ make
RUN apt-get install -y git 
RUN apt install -y nodejs
RUN npm install -g truffle
RUN npm install -g ganache-cli
RUN apt install sudo
USER root
RUN npm install -g truffle-hdwallet-provider 
WORKDIR /app
COPY . /app
