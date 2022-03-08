import * as core from '@actions/core'
import {getOrgMembershipList} from '../src/main'

describe('Misc tests', () => {
  let inputs = {} as any
  let inSpy: jest.SpyInstance

  beforeAll(() => {
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

  test('getOrgMembershipList returns a clean list of strings', () => {

    inputs["org_membership"] = "test, test2, test3"
    const orgs = getOrgMembershipList()

    expect(orgs).toEqual(["test", "test2", "test3"])
    expect(orgs.length).toEqual(3)
    expect(orgs[1]).not.toBe(" test2")
  })
})