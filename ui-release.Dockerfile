# The release was already built, audited and uploaded by publish.yml.
# Do not rebuild here: the container must contain the exact exported artifact.
FROM nginx
COPY ui-release/ /app/
COPY nginx.conf /etc/nginx/nginx.conf

# Retain mounted voice configuration while supplying missing application routes.
COPY deploy/nginx/board-route.awk /usr/local/share/avalon/board-route.awk
COPY deploy/nginx/entrypoint.sh /usr/local/bin/avalon-nginx-entrypoint
RUN chmod +x /usr/local/bin/avalon-nginx-entrypoint
ENTRYPOINT ["/usr/local/bin/avalon-nginx-entrypoint"]
CMD ["nginx", "-g", "daemon off;"]
