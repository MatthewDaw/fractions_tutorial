# gstack

This project uses [gstack](https://github.com/garrytan/gstack). Install it locally with:

```
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack \
  && cd ~/.claude/skills/gstack && ./setup
```

(`./setup` requires [bun](https://bun.sh). It builds the browse browser binary and registers the skills.)

## Browsing policy

- Use the **`/browse`** skill from gstack for **all** web browsing.
- **Never** use `mcp__claude-in-chrome__*` tools.

## Available skills

`/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`,
`/design-consultation`, `/design-shotgun`, `/design-html`, `/review`, `/ship`,
`/land-and-deploy`, `/canary`, `/benchmark`, `/browse`, `/connect-chrome`, `/qa`,
`/qa-only`, `/design-review`, `/setup-browser-cookies`, `/setup-deploy`,
`/setup-gbrain`, `/retro`, `/investigate`, `/document-release`, `/document-generate`,
`/codex`, `/cso`, `/autoplan`, `/plan-devex-review`, `/devex-review`, `/careful`,
`/freeze`, `/guard`, `/unfreeze`, `/gstack-upgrade`, `/learn`
