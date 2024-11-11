setup:
	./.devcontainer/setup.sh

app-build:
	npm isntall
	npm run build

start:
	npm start

test:
	npm test

ci-test:
	npm test -- --coverage --reporters=jest-junit

ci-eslint:
	npm run eslint -- --format junit --output-file ./reports/eslint/eslint.xml
