import * as core from '@actions/core'
import * as github from '@actions/github'
import {
  IssuesEvent,
  Label,
  PullRequestEvent
} from '@octokit/webhooks-types/schema'
import {GitHub} from '@actions/github/lib/utils'
import {RequestError} from '@octokit/request-error'

/* This exists to mock the context object that is passed to the action.
We need this when running locally. */
// Object.defineProperty(github, 'context', {
//   value: {
//     eventName: 'issues',
//     repo: {
//       owner: 'puppetlabs',
//       repo: 'iac'
//     },
//     issue: {
//       number: 331
//     },
//     payload: {
//       action: 'opened',
//       sender: {
//         login: 'petergmurphy'
//       },
//       pull_request: {
//         labels: []
//       },
//       issue: {
//         labels: []
//       }
//     }
//   }
// })
/* This class wraps the octokit client and provides convenience methods for
working with the GitHub API and the current context of the workflow where
this action is executed. */
export class GitHubClient {
  private readonly client: InstanceType<typeof GitHub>
  private readonly payload: PullRequestEvent | IssuesEvent
  //private readonly senderLogin: string

  constructor(token: string) {
    this.client = github.getOctokit(token)
    this.payload = this.getPayload() //github.context.payload
    //this.senderLogin = this.payload.sender!.login
  }

  // Gets the payload of the current event
  private getPayload(): PullRequestEvent | IssuesEvent {
    if (github.context.eventName === 'issues') {
      return github.context.payload as IssuesEvent
    } else if (
      github.context.eventName === 'pull_request' ||
      github.context.eventName === 'pull_request_target'
    ) {
      return github.context.payload as PullRequestEvent
    } else {
      throw new Error(
        'Invalid event. Please check your workflow configuration.'
      )
    }
  }

  // Create a label in the current repository
  async createLabel(name: string, color: string): Promise<void> {
    try {
      await this.client.rest.issues.createLabel({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        name,
        color
      })

      core.info(`Successfully created the '${name}' label ✨`)
    } catch (error) {
      const requestError = error as RequestError
      if (requestError.status === 422) {
        core.info(
          `It looks like the label '${name}' already exists in this repository so we don't need to create it! 🙌`
        )
        return
      }
      throw error
    }
  }

  // Checks if the issue already has the label
  hasLabel(name: string): boolean {
    let labels!: Label[]

    if (github.context.eventName === 'issues') {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      labels = (this.payload as IssuesEvent).issue.labels!
    } else if (
      github.context.eventName === 'pull_request' ||
      github.context.eventName === 'pull_request_target'
    ) {
      labels = (this.payload as PullRequestEvent).pull_request.labels
    } else {
      return false
    }

    return labels.some((l) => l.name === name)
  }

  /* Adds the label to the issue/pull request. It will attempt to create the label
  if it does not exist. */
  async addLabel(name: string): Promise<void> {
    const issueNumber = github.context.issue.number
    await this.client.rest.issues.addLabels({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: issueNumber,
      labels: [name]
    })
    core.info(
      `Successfully added the '${name}' label to issue ${issueNumber} ✨`
    )
  }

  // Checks if the event sender is a member of the specified org(s)
  async checkOrgMembership(orgs: string[]): Promise<boolean> {
    const username: string = this.payload.sender.login

    for (const org of orgs) {
      try {
        await this.client.rest.orgs.checkMembershipForUser({
          org,
          username
        })

        return true
      } catch (error) {
        const requestError = error as RequestError
        if (
          requestError.status === 404 &&
          requestError.message.includes('User does not exist')
        ) {
          core.debug(`User: ${username}, is not a member of the ${org} org`)
        } else {
          throw error
        }
      }
    }

    return false
  }

  // Checks if the user is one that should be ignored
  isExcludedLogin(logins: string): boolean {
    const defaultLogins = ['github-actions[bot]', 'dependabot[bot]']
    const providedLogins = logins.split(',')
    const allLogins = [...new Set([...defaultLogins, ...providedLogins])]
    if (allLogins.includes(this.payload.sender.login)) {
      core.debug(
        `Action will not continue for  user '${this.payload.sender.login}' because it is has been marked as ignored.`
      )
      return true
    }

    return false
  }
}
