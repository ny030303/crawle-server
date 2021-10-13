echo "wait db server"
dockerize -wait tcp://db:3306 -timeout 20s

ln -s /usr/lib/node_modules $HOME/node_modules

ls -al

echo "start node server"
nodemon ./bin/www 
