FROM node:10.16

# @FIX Debian Jessie / Docker issue with apt.
# See: https://stackoverflow.com/questions/46406847/docker-how-to-add-backports-to-sources-list-via-dockerfile
RUN echo "deb http://archive.debian.org/debian/ jessie main\n" \
  "deb-src http://archive.debian.org/debian/ jessie main\n" \
  "deb http://security.debian.org jessie/updates main\n" \
  "deb-src http://security.debian.org jessie/updates main" > /etc/apt/sources.list

# Update the apt cache
RUN apt-get clean
RUN apt-get update

# Apt-utils needs to be in before installing the rest
RUN apt-get install -y \
  build-essential \
  python \
  curl \
  file \
  zip

# Add the repo
ADD . / le-bot/
WORKDIR /le-bot

# Install node_modules
RUN yarn

# Expose the HTTP port
EXPOSE 3000

# What's that? A new colony was created...
ENTRYPOINT yarn start
