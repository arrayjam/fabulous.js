GENERATED_FILES = \
	jquery.fabulous.js \
	jquery.fabulous.min.js

all: $(GENERATED_FILES)

.PHONY: clean all test

src/start.js: package.json bin/start
	bin/start > $@

jquery.fabulous.js: $(shell node_modules/.bin/smash --ignore-missing --list src/index.js) package.json
	@rm -f $@
	node_modules/.bin/smash src/index.js | node_modules/.bin/uglifyjs - -b indent-level=2 -o $@
	@chmod a-w $@

jquery.fabulous.min.js: jquery.fabulous.js bin/uglify
	@rm -f $@
	bin/uglify $< > $@

clean:
	rm -f -- $(GENERATED_FILES)
