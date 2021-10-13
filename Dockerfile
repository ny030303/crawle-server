FROM ubuntu:18.04

RUN apt update && apt upgrade -y
RUN apt install -y curl 
RUN apt install -y wget
RUN apt install -y unzip

RUN apt-get install -y default-jre
RUN apt-get -f install

ENV CHROME_VERSION "94.0.4606.61"

COPY google-chrome-stable_94.0.4606.71-1_amd64.deb .
COPY dockerize-linux-amd64-v0.6.1.tar.gz .

RUN apt-get install -y ./google-chrome-stable_94.0.4606.71-1_amd64.deb
RUN tar -C /usr/local/bin -xzvf dockerize-linux-amd64-v0.6.1.tar.gz

RUN wget https://chromedriver.storage.googleapis.com/$CHROME_VERSION/chromedriver_linux64.zip \
    && unzip chromedriver_linux64.zip \
    && mv chromedriver /usr/bin/chromedriver \
    && chown root:root /usr/bin/chromedriver \
    && chmod +x /usr/bin/chromedriver

RUN apt-get install -y xvfb

RUN curl -sL https://deb.nodesource.com/setup_14.x | bash \
    && apt-get install -y nodejs \
    && curl -L https://www.npmjs.com/install.sh | sh

RUN npm install -g nodemon
RUN npm install -g yarn

RUN mkdir -p /usr/lib
WORKDIR /usr/lib
COPY package.json .
RUN yarn install

WORKDIR /usr/src/app
COPY . .

RUN chmod +x ./docker-entrypoint.sh 
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]

EXPOSE 8080
