import * as core from '@actions/core'
import * as github from '@actions/github'
import nock from 'nock'
import {GitHubClient} from '../src/github'
import os from 'os'

const apiUrl = 'https://api.github.com'

describe('With a new github client', () => {
  let inputs = {} as any
  let client: GitHubClient
  let inSpy: jest.SpyInstance

  beforeAll(() => {
    process.env['GITHUB_PATH'] = ''

    Object.defineProperty(github, 'context', {
      value: {
        eventName: 'issues',
        repo: {
          owner: 'puppetlabs',
          repo: 'iac'
        },
        issue: {
          number: 331
        },
        payload: {
          action: 'opened',
          sender: {
            login: 'dependabot[bot]'
          },
          issue: {
            labels: [
              {
                id: 1362934389,
                node_id: 'MDU6TGFiZWwxMzYyOTM0Mzg5',
                url: 'https://api.github.com/repos/Codertocat/Hello-World/labels/bug',
                name: 'community',
                color: 'd73a4a',
                default: true
              }
            ]
          }
        }
      }
    })

    client = new GitHubClient('1234')
    console.log('::stop-commands::stoptoken')
    process.stdout.write = jest.fn()
  })

  beforeEach(() => {
    inputs = {}
    inSpy = jest.spyOn(core, 'getInput')
    inSpy.mockImplementation((name) => inputs[name])
  })

  afterEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
  })

  afterAll(async () => {
    console.log('::stoptoken::') // Re-enable executing of runner commands when running tests in actions
  }, 100000)

  test('checkOrgMembership should return true when the user is a member of the org', async () => {
    nock(apiUrl).get('/orgs/test/members/dependabot%5Bbot%5D').reply(200, {})

    const result = await client.checkOrgMembership(['test'])
    expect(result).toBe(true)
  })

  test('checkOrgMembership should return false when the user is not a member of the org', async () => {
    nock(apiUrl)
      .get('/orgs/test/members/dependabot%5Bbot%5D')
      .reply(404, {message: 'User does not exist'})

    const result = await client.checkOrgMembership(['test'])
    expect(result).toBe(false)
  })

  test('checkOrgMembership should handle a list of orgs', async () => {
    const orgs = ['test', 'test2', 'test3']
    nock(apiUrl)
      .get(`/orgs/test/members/dependabot%5Bbot%5D`)
      .reply(200, {})
      .get(`/orgs/test2/members/dependabot%5Bbot%5D`)
      .reply(200, {})
      .get(`/orgs/test3/members/dependabot%5Bbot%5D`)
      .reply(200, {})

    const result = await client.checkOrgMembership(orgs)
    expect(result).toBe(true)
  })

  test('isExcludedLogin returns true if sender.login is in the ignore list', () => {
    const result = client.isExcludedLogin('')
    expect(result).toBe(true)
  })

  test('isExcludedLogin returns false if sender.login is not in the ignore list', () => {
    github.context.payload.sender!.login = 'mr-test'
    const result = client.isExcludedLogin('')
    expect(result).toBe(false)
  })

  test('isExcludedLogin can handle additional excluded users', () => {
    github.context.payload.sender!.login = 'mr-test'
    const result = client.isExcludedLogin('mr-test')
    expect(result).toBe(true)
  })

  test('createLabel should create a label', async () => {
    nock(apiUrl)
      .post('/repos/puppetlabs/iac/labels', {
        name: 'test',
        color: 'ffffff'
      })
      .reply(200, {})

    await client.createLabel('test', 'ffffff')
    assertInOutput(`Successfully created the 'test' label ✨${os.EOL}`, 1)
  })

  test('createlabel should not create a label if it already exists', async () => {
    nock(apiUrl)
      .post('/repos/puppetlabs/iac/labels', {
        name: 'test',
        color: 'ffffff'
      })
      .reply(422, {
        message: 'Validation Failed',
        errors: [
          {
            resource: 'Label',
            field: 'name',
            code: 'already_exists'
          }
        ]
      })

    await client.createLabel('test', 'ffffff')
    assertInOutput(
      `It looks like the label 'test' already exists in this repository so we don't need to create it! 🙌${os.EOL}`,
      1
    )
  })

  test('addLabel should add a label to an issue', async () => {
    nock(apiUrl)
      .post('/repos/puppetlabs/iac/issues/331/labels', {labels: ['test']})
      .reply(200, {})

    await client.addLabel('test')
    assertInOutput(
      `Successfully added the 'test' label to issue 331 ✨${os.EOL}`,
      1
    )
  })

  test('hasLabel returns true if the label already exists on the issue or pr', () => {
    const result = client.hasLabel('community')
    expect(result).toBe(true)
  })

  test('hasLabel returns false if the label does not exist on the issue or pr', () => {
    const result = client.hasLabel('test')
    expect(result).toBe(false)
  })
})

describe('With an invalid event in the payload', () => {
  beforeAll(() => {
    Object.defineProperty(github, 'context', {
      value: {
        eventName: 'test'
      }
    })
  })

  test('Creating a new client should throw', () => {
    expect(() => new GitHubClient('1234')).toThrow()
  })
})

function assertInOutput(text: string, position: number): void {
  expect(process.stdout.write).toHaveBeenNthCalledWith(position, text)
}
