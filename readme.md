# Run

this application is runnable within a docker container on localhost

    docker build -t <tag>
    docker run -v <local_ssl_path>:/etc/ssl/certs -p 3000:443 <container_hash>


# Build

    npm install
    npm run dev