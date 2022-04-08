import { Request } from 'express'
import { Request as ZeploRequest, RequestStep } from '@zeplo/types/request'
import { v4 as uuid } from 'uuid'
import { createError } from '@zeplo/errors'
import {
  map, forEach, mapValues, keys,
} from 'lodash'
import { parseRequest } from './parse'

export function createStepsJobs (workspaceId: string, req: Request) {
  const data = req.body
  const parentId = `${uuid()}-iow`
  const parentRequest = parseRequest(parentId, workspaceId, req, 'step')

  let allStepsHaveRequires = true

  const steps: Record<string, ZeploRequest> = {}
  const requiredStepNames: Record<string, 1> = {}

  const stepRequests = map(data, (requestFromBody): ZeploRequest => {
    const stepId = `${uuid()}-iow`
    const request = parseRequest(stepId, workspaceId, requestFromBody)

    request.source = 'STEP'
    request.trace = parentId

    // Ensure step name is set
    if (!request.step) {
      request.step = stepId
    }

    if (steps[request.step]) {
      throw createError('steps/duplicate-step-name')
    }
    steps[request.step] = request

    if (!request.requires) {
      allStepsHaveRequires = false
    }

    if (!parentRequest.steps) parentRequest.steps = {}
    const step: RequestStep = { id: stepId, delay: request.delay }
    parentRequest.steps[request.step] = step

    if (request.requires) {
      step.requires = {}
      forEach(request.requires, (_, stepName) => {
        if (step.requires) step.requires[stepName] = 1
        requiredStepNames[stepName] = 1
      })
    }

    return request
  })

  if (allStepsHaveRequires) {
    throw createError('steps/all-steps-have-requires')
  }

  forEach(requiredStepNames, (_, stepName) => {
    if (!steps[stepName]) throw createError('steps/missing-step')
  })

  forEach(steps, (step, stepName) => {
    if (step.requires && hasCyclicalDependency(steps, stepName, keys(step.requires))) {
      throw createError('steps/cyclical-dependencies')
    }
  })

  // Create jobs, only for requests with no pre-requisite requirements (i.e. request.requires)
  const jobs = map(stepRequests, (stepRequest): ZeploRequest => {
    if (stepRequest.requires) {
      // eslint-disable-next-line no-param-reassign
      stepRequest.requires = mapValues(stepRequest.requires, (_, key) => steps[key].id)
    }

    return stepRequest
  })

  return { id: parentId, request: parentRequest, jobs }
}

export function hasCyclicalDependency (
  steps: Record<string, ZeploRequest>,
  checkForStepName: string,
  requiredSteps: string[],
) {
  for (let i = 0; i < requiredSteps.length; i += 1) {
    const requiredStepName = requiredSteps[i]
    if (requiredStepName === checkForStepName) return true
    if (
      steps[requiredStepName].requires
      && hasCyclicalDependency(steps, checkForStepName, keys(steps[requiredStepName].requires))
    ) {
      return true
    }
  }
  return false
}
