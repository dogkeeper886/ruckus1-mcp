.PHONY: install uninstall build

COMMANDS_DIR := $(HOME)/.claude/commands
COMMANDS := $(wildcard commands/*/*.md)

## Install slash commands to Claude Code
install:
	@echo "Installing commands to $(COMMANDS_DIR)..."
	@for cmd in $(COMMANDS); do \
		name=$$(basename $$cmd .md); \
		cp $$cmd $(COMMANDS_DIR)/$$name.md; \
		echo "  Installed /$$name"; \
	done
	@echo "Done. Restart Claude Code to load commands."

## Remove installed commands
uninstall:
	@echo "Removing commands from $(COMMANDS_DIR)..."
	@for cmd in $(COMMANDS); do \
		name=$$(basename $$cmd .md); \
		rm -f $(COMMANDS_DIR)/$$name.md; \
		echo "  Removed /$$name"; \
	done
	@echo "Done."

## Build the MCP server
build:
	npm run build
