# The release was already built, audited and uploaded by publish.yml.
# Do not rebuild here: the container must contain the exact exported artifact.
FROM nginx
COPY ui-release/ /app/
COPY nginx.conf /etc/nginx/nginx.conf
