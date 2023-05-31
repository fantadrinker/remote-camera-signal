# Run

this application is runnable within a docker container on localhost

    docker build -t <tag>
    docker run -v <local_ssl_path>:/etc/ssl/certs <container_hash>


# Build

    npm install
    npm run dev