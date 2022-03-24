# community-labeller

This is a basic action that will label issues and pull request with a given label if the contributor is not a member of a given list of organisations.

## Inputs

| name | required | description | default |
|------|----------|-------------|---------|
| label_name | false | The name of the label. | community |
| label_color | false | The color of the label. If the label already exists in the repository, this setting will have no effect. | 5319E7 |
| org_membership | false | Contributions from users that are not members of the specified organisations will be labeled with the configured label. The value can be a single organisation or a comma-separated list of organisations. | puppetlabs |
| logins_to_ignore | false | Contributions from the specified users will not be labeled by this action. The value can be a single login or a comma-separated list of logins. | `N/A` |
| token | true | A token with enough privilege to view org memberships and repo content. | `N/A` |

## Security

This action requires a token with `read:org`. The standard GITHUB_TOKEN will not work.

## Usage

``` yaml
name: community-labeller

on:
  issues:
    types:
      - opened
  pull_request:
    types:
      - opened

jobs:
  label:
    runs-on: ubuntu-latest
    steps:

      - uses: puppetlabs/community-labeller@v0
        name: Label issues or pull requests
        with:
          label_name: community
          label_color: '5319e7'
          org_membership: puppetlabs
          token: ${{ secrets.CUSTOM_TOKEN }}
```

## Contributing

This action has been developed with node `v16`.

``` bash
# Install the dependencies
npm install

# Run tslint
npm lint

## Run tests
npm test
```

## Releasing

To create a realease you can run the following commands ensuring that you are on main:

``` bash
npm version "v1.0.0"
git push --follow-tags
```

Once the release has been created you will need to publish it by following the instructions [provided by GitHub](https://docs.github.com/en/actions/creating-actions/publishing-actions-in-github-marketplace).
