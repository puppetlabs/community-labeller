# community-labeller

This is a basic action that will label issues and pull request with a given label if the contributor is not a member of a given list of organisations.

## Warning

This tool is in the process of being removed and it will be archived in the near future. As such we recommend you do not implement it in any current workflows and,
if you already have it, to remove as soon as possible. One it this repo is toy-chested, it is unlikely that any workflows containing it will work unless properly amended.

## Inputs

| name | required | description | default |
|------|----------|-------------|---------|
| label_name | false | The name of the label. | community |
| label_color | false | The color of the label. If the label already exists in the repository, this setting will have no effect. | 5319E7 |
| org_membership | false | Contributions from users that are not members of the specified organisations will be labeled with the configured label. The value can be a single organisation or a comma-separated list of organisations. | puppetlabs |
| logins_to_ignore | false | Contributions from the specified users will not be labeled by this action. The value can be a single login or a comma-separated list of logins. | `N/A` |
| fail_if_member | false | Pipeline will fail, if the user is member of specified organisations and no label has been added manually. | false |
| token | true | A token with enough privilege to view org memberships and repo content. | `N/A` |

## Security

### Scopes

This action requires a token with `read:org`. The standard GITHUB_TOKEN will not work.

### Workflow events

The labeller needs to access the secret associated with the repository. To enable this safely for both internal and external contributors, we reccoment using the `pull_request_target` event for labeling pull requests.
See the [security note on that event](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request_target) before using it for anything else, or combining the labeler action with any other steps.

## Usage

``` yaml
name: community-labeller

on:
  issues:
    types:
      - opened
  pull_request_target:
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
