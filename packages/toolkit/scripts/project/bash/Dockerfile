FROM alpine:latest

USER root
WORKDIR /var/www/html
COPY payload .
RUN mkdir wp-content/uploads && \
    chown 33:33 wp-content/uploads
