.PHONY: *

all:
	make start

install:
	npm install

pretty:
	npx prettier --write .

start:
	npm start

css-yad:
	npx tailwindcss -i yad/input.css -o yad/output.css --watch

css-gal:
	npx tailwindcss -i gallery/input.css -o gallery/output.css --watch

css-gal-ext:
	npx tailwindcss -i gallery-ext/popup.css -o gallery-ext/output.css --watch
